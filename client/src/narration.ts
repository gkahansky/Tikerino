import type { Lesson } from '@tikerino/content';

import { LESSON_SPRITES } from './narration-audio';

/**
 * Narrated animated walkthrough - the pilot.
 *
 * One lesson gets it for now (the pilot list below). The plan is derived from
 * the lesson content, not duplicated: the intro is the principle card read
 * aloud while the guided chart draws in candle by candle, then each guided
 * step is a segment that spotlights its candle. The quiz loop is untouched.
 *
 * Audio ships as ONE sprite per lesson (walkthrough.mp3, all segments back
 * to back) served from /audio/lessons/<lessonId>/: iOS Safari blocks play()
 * after a src swap outside a user gesture, which killed every segment after
 * the intro when each had its own file (Guy, 13 Sep 15:56 IDT). Seeking one
 * element is safe everywhere. Until audio exists the player falls back to
 * silent estimated timing, so the animation and the sync machinery are
 * fully exercisable without it.
 */

export const NARRATED_PILOT_LESSON_IDS: readonly string[] = ['lesson-0-meet-the-chart'];

export interface NarrationSegment {
  id: string;
  /** What the narrator says; also the caption while the segment plays. */
  text: string;
  /** Candle to spotlight while the segment plays; null = no spotlight. */
  candleIndex: number | null;
  /** Start of this segment inside the sprite, milliseconds. */
  offsetMs: number;
  /** Length of this segment inside the sprite, milliseconds. */
  durationMs: number;
}

export interface NarrationPlan {
  lessonId: string;
  /** Sprite file name under /audio/lessons/<lessonId>/. */
  spriteFile: string;
  /** The principle, read over the candle-by-candle draw. */
  intro: NarrationSegment;
  /** One segment per guided step, in order. */
  steps: NarrationSegment[];
}

/** The pilot plan for a lesson, or null when the lesson is not in the pilot. */
export function pilotNarrationPlan(lesson: Lesson): NarrationPlan | null {
  if (!NARRATED_PILOT_LESSON_IDS.includes(lesson.lessonId)) return null;
  const sprite = LESSON_SPRITES[lesson.lessonId];
  if (!sprite) return null;
  const timing = (id: string) => sprite.segments[id]!;
  return {
    lessonId: lesson.lessonId,
    spriteFile: sprite.spriteFile,
    intro: {
      id: 'intro',
      text: lesson.principleCard.body,
      candleIndex: null,
      ...timing('intro'),
    },
    steps: lesson.guidedExample.steps.map((step, index) => ({
      id: `step-${index + 1}`,
      text: step.text,
      candleIndex: step.annotateCandleIndex,
      ...timing(`step-${index + 1}`),
    })),
  };
}

/**
 * Silent fallback duration for a segment, about 170 words a minute plus a
 * beat to breathe, with a floor so very short lines do not flash past. Used
 * only when the sprite cannot play; real playback syncs to sprite offsets.
 */
export function estimateDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1800, Math.round(words * 360) + 700);
}

export interface DrawTiming {
  /** Pause before the first candle appears, so the caption lands first. */
  startMs: number;
  /** Gap between consecutive candles. */
  staggerMs: number;
}

/**
 * Spread the candle-by-candle draw across the intro narration: slow enough to
 * watch, fast enough that the last candle is on screen before the intro ends.
 */
export function drawTiming(candleCount: number, introDurationMs: number): DrawTiming {
  const startMs = 500;
  const budget = Math.max(introDurationMs - startMs - 400, candleCount * 140);
  const staggerMs = Math.min(420, Math.max(140, Math.floor(budget / candleCount)));
  return { startMs, staggerMs };
}

/** Candles on screen at `elapsedMs` into the intro, clamped to the full set. */
export function drawnCountAt(
  elapsedMs: number,
  candleCount: number,
  timing: DrawTiming,
): number {
  if (elapsedMs < timing.startMs) return 0;
  const drawn = Math.floor((elapsedMs - timing.startMs) / timing.staggerMs) + 1;
  return Math.min(drawn, candleCount);
}

/** Clamp a draw count to [0, total]; null means "no animation, show all". */
export function clampDrawCount(drawCount: number | null | undefined, total: number): number | null {
  if (drawCount === null || drawCount === undefined) return null;
  return Math.max(0, Math.min(Math.floor(drawCount), total));
}

/**
 * Mid-lesson mode switching: the manual walkthrough and the narration cover
 * the same content in the same order. Manual step -1 is the principle card,
 * which the narration reads as its intro (segment 0); manual step k is
 * segment k+1.
 */
export function stepToSegmentIndex(step: number): number {
  return step + 1;
}

export function segmentIndexToStep(segmentIndex: number): number {
  return segmentIndex - 1;
}
