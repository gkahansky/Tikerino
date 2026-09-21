import { useCallback, useEffect, useRef, useState } from 'react';

import {
  drawnCountAt,
  drawTiming,
  estimateDurationMs,
  type NarrationPlan,
} from './narration';

export type NarrationStatus = 'idle' | 'playing' | 'paused' | 'done';

export interface NarrationState {
  status: NarrationStatus;
  /** -1 while the intro plays, 0..n-1 for the guided steps. */
  segmentIndex: number;
  /** Candles on screen during the intro draw; null once the chart is full. */
  drawCount: number | null;
  /** Spotlighted candle, or null. */
  highlightIndex: number | null;
  /** The line on screen while a segment plays. */
  caption: string;
  /** Begin playback, optionally mid-plan (a mid-lesson switch lands here). */
  start: (fromSegmentIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const TICK_MS = 90;
/** Advance this far before a segment's end - masks mp3 frame granularity. */
const END_EPSILON_MS = 140;
/** No audio progress this long while playing means the pipeline is stuck. */
const STALL_MS = 2500;

/**
 * Drive the narrated walkthrough: ONE audio element, ONE sprite, segment by
 * segment, advancing when playback crosses each segment's offset+duration.
 * The src never changes after the first user-gesture play: iOS Safari blocks
 * play() after a src swap outside a gesture (that is what silenced every
 * segment after the intro - Guy, 13 Sep 15:56 IDT), while seeking a blessed
 * element works everywhere. If the sprite cannot load or stalls, a silent
 * estimated timer stands in per segment so the lesson always completes.
 */
export function useNarration(plan: NarrationPlan | null, candleCount: number): NarrationState {
  const [status, setStatus] = useState<NarrationStatus>('idle');
  const [segmentIndex, setSegmentIndex] = useState(-1);
  const [drawCount, setDrawCount] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [caption, setCaption] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const drawTimerRef = useRef<number | null>(null);
  const fallbackRemainingRef = useRef(0);
  const fallbackStartedRef = useRef(0);
  /** Segment the tick is watching, plus progress for stall detection. */
  const watchRef = useRef<{ index: number; lastTime: number; lastProgressAt: number } | null>(
    null,
  );
  /** Set by pause(): which timing mode to re-arm on resume. */
  const pausedInFallbackRef = useRef(false);
  const advanceRef = useRef<() => void>(() => {});

  const segments = plan ? [plan.intro, ...plan.steps] : [];

  const clearTimers = (): void => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (drawTimerRef.current !== null) {
      window.clearInterval(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    watchRef.current = null;
  };

  const startDraw = (introDurationMs: number): void => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || candleCount === 0) {
      setDrawCount(candleCount);
      return;
    }
    const timing = drawTiming(candleCount, introDurationMs);
    const startedAt = performance.now();
    setDrawCount(0);
    drawTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const count = drawnCountAt(elapsed, candleCount, timing);
      setDrawCount(count);
      if (count >= candleCount && drawTimerRef.current !== null) {
        window.clearInterval(drawTimerRef.current);
        drawTimerRef.current = null;
      }
    }, TICK_MS);
  };

  /** Estimated silent timing for the current segment (sprite unusable). */
  const armFallback = (index: number): void => {
    if (!plan) return;
    const segment = segments[index]!;
    const estimate = estimateDurationMs(segment.text);
    fallbackRemainingRef.current = estimate;
    fallbackStartedRef.current = performance.now();
    fallbackTimerRef.current = window.setTimeout(() => advanceRef.current(), estimate);
  };

  const playSegment = (index: number, restart = true): void => {
    if (!plan) return;
    const segment = segments[index]!;
    clearTimers();
    pausedInFallbackRef.current = false;
    fallbackRemainingRef.current = 0;
    setSegmentIndex(index);
    setCaption(segment.text);
    setHighlightIndex(segment.candleIndex);

    // The intro draw is timed to the REAL segment length, known from the
    // measured sprite offsets - no waiting on audio metadata (a stalled
    // media pipeline must never freeze the chart). restart=false (resume)
    // keeps the chart the pause left behind.
    if (restart && index === 0) {
      setDrawCount(0); // no full-chart flash before the draw
      startDraw(segment.durationMs);
    }

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    const src = `/audio/lessons/${plan.lessonId}/${plan.spriteFile}`;
    if (!audio.src.endsWith(plan.spriteFile)) audio.src = src;
    audio.onerror = () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      armFallback(index);
    };

    const endAt = (segment.offsetMs + segment.durationMs - END_EPSILON_MS) / 1000;
    const watch = {
      index,
      lastTime: restart ? segment.offsetMs / 1000 : audio.currentTime,
      lastProgressAt: performance.now(),
    };
    watchRef.current = watch;

    const attempt = () => {
      const p = audio.play();
      if (p) {
        p.catch(() => {
          // Gesture lost / blocked: complete the lesson silently instead.
          if (tickRef.current !== null) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
          }
          if (fallbackTimerRef.current === null) armFallback(index);
        });
      }
    };

    const seekAndPlay = (): void => {
      if (restart) {
        try {
          audio.currentTime = segment.offsetMs / 1000;
        } catch {
          // Not seekable yet (metadata pending); the tick seeks when ready.
        }
      }
      attempt();
    };

    tickRef.current = window.setInterval(() => {
      if (watchRef.current !== watch) return;
      if (audio.error) return; // onerror handles it
      const t = audio.currentTime;
      // Ready but still before this segment (metadata arrived late): seek.
      if (restart && audio.readyState > 0 && t < segment.offsetMs / 1000) {
        try {
          audio.currentTime = segment.offsetMs / 1000;
        } catch {
          /* keep waiting */
        }
      }
      if (t > watch.lastTime + 0.001) {
        watch.lastTime = t;
        watch.lastProgressAt = performance.now();
      }
      if (t >= endAt || audio.ended) {
        advanceRef.current();
        return;
      }
      // Stalled pipeline: fall back to estimated timing for this segment.
      if (performance.now() - watch.lastProgressAt > STALL_MS && audio.paused) {
        window.clearInterval(tickRef.current!);
        tickRef.current = null;
        armFallback(index);
      }
    }, TICK_MS);

    if (audio.readyState > 0) {
      seekAndPlay();
    } else {
      audio.onloadedmetadata = seekAndPlay;
      // Metadata can hang in a broken pipeline; start anyway and let the
      // tick's stall guard take over.
      attempt();
    }
  };

  const advance = (): void => {
    if (!plan) return;
    const next = segmentIndex + 1;
    if (next >= segments.length) {
      clearTimers();
      audioRef.current?.pause();
      setStatus('done');
      setDrawCount(null);
      setHighlightIndex(null);
      setCaption('');
      return;
    }
    setDrawCount(null); // from the first step on, the chart is complete
    playSegment(next);
  };
  advanceRef.current = advance;

  const start = useCallback(
    (fromSegmentIndex = 0): void => {
      if (!plan) return;
      const from = Math.max(0, Math.min(fromSegmentIndex, segments.length - 1));
      setStatus('playing');
      // Starting past the intro skips the candle-by-candle draw.
      if (from > 0) setDrawCount(null);
      playSegment(from);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan],
  );

  const pause = (): void => {
    if (status !== 'playing') return;
    audioRef.current?.pause();
    pausedInFallbackRef.current = fallbackTimerRef.current !== null;
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
      fallbackRemainingRef.current -= performance.now() - fallbackStartedRef.current;
    }
    if (drawTimerRef.current !== null) {
      window.clearInterval(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    setStatus('paused');
  };

  const resume = (): void => {
    if (status !== 'paused') return;
    setStatus('playing');
    // A paused mid-draw chart completes rather than resuming the stagger.
    setDrawCount((count) => (count === null ? count : candleCount));
    const index = segmentIndex;
    if (index < 0) return;
    if (pausedInFallbackRef.current) {
      // Fallback mode was running: re-arm what was left of it.
      pausedInFallbackRef.current = false;
      fallbackStartedRef.current = performance.now();
      fallbackTimerRef.current = window.setTimeout(
        () => advanceRef.current(),
        Math.max(300, fallbackRemainingRef.current),
      );
      return;
    }
    // Real playback: re-arm the tick at the paused position (no re-seek,
    // no draw restart).
    playSegment(index, false);
  };

  const stop = useCallback((): void => {
    clearTimers();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
    fallbackRemainingRef.current = 0;
    setStatus('idle');
    setSegmentIndex(-1);
    setDrawCount(null);
    setHighlightIndex(null);
    setCaption('');
  }, []);

  // Leaving the lesson (or the app) stops playback.
  useEffect(() => stop, [stop]);

  return { status, segmentIndex, drawCount, highlightIndex, caption, start, pause, resume, stop };
}
