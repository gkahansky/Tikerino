/**
 * The narration plan for a lesson.
 *
 * A narrated lesson is the same lesson, delivered differently: the principle is
 * read over a chart that draws itself candle by candle, then each guided step is
 * spoken while its candle is spotlighted. The exercises are untouched - the
 * graded call is the product, and this is only a different way in.
 *
 * This module is pure. It turns a lesson (plus, when the audio exists, a sprite
 * manifest) into a timeline: what is said, which candle it points at, and when.
 * The player and the mode switch both read it, and it is fully testable without
 * a browser, an audio element, or a single byte of mp3.
 */
import type { ChartRef, Lesson } from '@tikerino/content';

/** Where a segment's timing came from. Measured beats estimated; both are honest. */
export type NarrationTimingSource = 'measured' | 'estimated';

export interface NarrationSegment {
  /** Stable within a lesson: 'intro', then 'step-0', 'step-1', ... */
  id: string;
  kind: 'intro' | 'step';
  /** Index into the lesson's guided steps, or null for the intro. */
  stepIndex: number | null;
  /** What is spoken. Also the caption, so a muted learner reads the same words. */
  text: string;
  /** The candle this segment points at, or null while the chart is still drawing. */
  spotlightCandleIndex: number | null;
  startMs: number;
  durationMs: number;
  timing: NarrationTimingSource;
}

/**
 * One merged audio file per lesson, with an offset per segment.
 *
 * Deliberately not one file per segment: iOS Safari treats assigning a new `src`
 * outside a user gesture as a fresh media load and refuses to play it, so a
 * per-segment swap goes silent after the first. One file, seeked between
 * offsets, keeps every segment on the element the opening tap already blessed.
 */
export interface NarrationSpriteManifest {
  lessonId: string;
  /** Relative to the client's base URL. */
  src: string;
  segments: { id: string; startMs: number; durationMs: number }[];
}

export interface NarrationPlan {
  lessonId: string;
  /** The chart the narration runs over: the guided example's. */
  chart: ChartRef;
  segments: NarrationSegment[];
  totalMs: number;
  /** Null when there is no audio: the walkthrough still runs, silently. */
  audioSrc: string | null;
  /** 'measured' only when every segment came from the manifest. */
  timing: NarrationTimingSource;
}

/**
 * Spoken pace for the silent fallback, in words per minute.
 *
 * 150 wpm is unremarkable narration pace. It is an engineering default for the
 * no-audio path, not a claim about any recorded voice: whenever real audio
 * exists its measured offsets win, and `timing` says which you got.
 */
export const ESTIMATED_WORDS_PER_MINUTE = 150;

/** A segment never flashes past, however short its text. */
export const MINIMUM_SEGMENT_MS = 1_500;

/** How long this text takes to say, when nothing has measured it. */
export function estimateSpokenMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ms = Math.round((words / ESTIMATED_WORDS_PER_MINUTE) * 60_000);
  return Math.max(MINIMUM_SEGMENT_MS, ms);
}

/** The id a segment carries, derived from its position rather than authored. */
export function segmentId(kind: 'intro' | 'step', stepIndex: number | null): string {
  return kind === 'intro' ? 'intro' : `step-${stepIndex}`;
}

export class NarrationManifestMismatch extends Error {}

/**
 * Build the timeline.
 *
 * With a manifest, every segment is placed at its measured offset. Without one,
 * segments are laid end to end at estimated durations and the walkthrough plays
 * silently - which is the fallback the design calls for, not a degraded mode
 * nobody planned.
 *
 * A manifest that does not describe this lesson is refused rather than
 * tolerated: mis-synced narration would point confidently at the wrong candle,
 * which is worse than no narration at all.
 */
export function buildNarrationPlan(
  lesson: Lesson,
  manifest?: NarrationSpriteManifest | null,
): NarrationPlan {
  const steps = lesson.guidedExample.steps;

  const shape: { kind: 'intro' | 'step'; stepIndex: number | null; text: string; spotlight: number | null }[] = [
    // The intro reads the principle while the chart draws in, so it points at no
    // single candle: the whole window is still arriving.
    { kind: 'intro', stepIndex: null, text: lesson.principleCard.body, spotlight: null },
    ...steps.map((step, index) => ({
      kind: 'step' as const,
      stepIndex: index,
      text: step.text,
      spotlight: step.annotateCandleIndex,
    })),
  ];

  if (manifest) assertManifestMatches(manifest, lesson, shape.map((s) => segmentId(s.kind, s.stepIndex)));

  let cursor = 0;
  const segments: NarrationSegment[] = shape.map((s) => {
    const id = segmentId(s.kind, s.stepIndex);
    const measured = manifest?.segments.find((m) => m.id === id);
    const startMs = measured ? measured.startMs : cursor;
    const durationMs = measured ? measured.durationMs : estimateSpokenMs(s.text);
    cursor = startMs + durationMs;
    return {
      id,
      kind: s.kind,
      stepIndex: s.stepIndex,
      text: s.text,
      spotlightCandleIndex: s.spotlight,
      startMs,
      durationMs,
      timing: measured ? 'measured' : 'estimated',
    };
  });

  return {
    lessonId: lesson.lessonId,
    chart: lesson.guidedExample.chart,
    segments,
    totalMs: segments.reduce((end, s) => Math.max(end, s.startMs + s.durationMs), 0),
    audioSrc: manifest?.src ?? null,
    timing: manifest ? 'measured' : 'estimated',
  };
}

function assertManifestMatches(
  manifest: NarrationSpriteManifest,
  lesson: Lesson,
  expectedIds: string[],
): void {
  if (manifest.lessonId !== lesson.lessonId) {
    throw new NarrationManifestMismatch(
      `Sprite manifest is for ${manifest.lessonId}, not ${lesson.lessonId}.`,
    );
  }

  const got = manifest.segments.map((s) => s.id);
  const missing = expectedIds.filter((id) => !got.includes(id));
  const extra = got.filter((id) => !expectedIds.includes(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new NarrationManifestMismatch(
      `Sprite manifest for ${lesson.lessonId} does not match its segments` +
        `${missing.length ? `; missing ${missing.join(', ')}` : ''}` +
        `${extra.length ? `; unexpected ${extra.join(', ')}` : ''}.`,
    );
  }

  for (const segment of manifest.segments) {
    if (!Number.isFinite(segment.startMs) || segment.startMs < 0) {
      throw new NarrationManifestMismatch(`Segment ${segment.id} has no usable start offset.`);
    }
    if (!Number.isFinite(segment.durationMs) || segment.durationMs <= 0) {
      throw new NarrationManifestMismatch(`Segment ${segment.id} has no usable duration.`);
    }
  }

  // Overlapping offsets would let one segment's audio run into the next, which
  // is the sync bug this manifest exists to prevent.
  const ordered = [...manifest.segments].sort((a, b) => a.startMs - b.startMs);
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1]!;
    const current = ordered[i]!;
    if (current.startMs < previous.startMs + previous.durationMs) {
      throw new NarrationManifestMismatch(
        `Segments ${previous.id} and ${current.id} overlap in the sprite.`,
      );
    }
  }
}

/**
 * When each candle appears during the intro draw-in.
 *
 * Derived from the intro's own duration so the draw finishes as the principle
 * finishes, and computed from the plan rather than from audio metadata - a
 * stalled audio pipeline must never be able to freeze the chart.
 */
export function candleDrawSchedule(plan: NarrationPlan): number[] {
  const intro = plan.segments[0]!;
  const count = plan.chart.windowSize;
  const step = intro.durationMs / count;
  return Array.from({ length: count }, (_, i) => Math.round(intro.startMs + step * (i + 1)));
}

/** How many candles are drawn by a given moment in the walkthrough. */
export function drawnCandlesAt(plan: NarrationPlan, atMs: number): number {
  return candleDrawSchedule(plan).filter((t) => t <= atMs).length;
}

/* -------------------------------------------------------------------------- */
/* Switching between deliveries                                               */
/* -------------------------------------------------------------------------- */

/**
 * Where a learner is in the text delivery: the principle card, or a guided step.
 * Mode switching maps between this and a narration segment so the learner lands
 * where they were rather than back at the beginning.
 */
export type TextPosition = { kind: 'card' } | { kind: 'step'; index: number };

/** The segment that matches a place in the text lesson. */
export function segmentIndexForTextPosition(plan: NarrationPlan, position: TextPosition): number {
  if (position.kind === 'card') return 0;
  const wanted = segmentId('step', position.index);
  const found = plan.segments.findIndex((s) => s.id === wanted);
  // A step with no segment can only mean a plan built from a different lesson;
  // landing on the intro is the safe read, never a crash mid-lesson.
  return found === -1 ? 0 : found;
}

/** The place in the text lesson that matches a segment. */
export function textPositionForSegmentIndex(plan: NarrationPlan, index: number): TextPosition {
  const segment = plan.segments[index];
  if (!segment || segment.kind === 'intro' || segment.stepIndex === null) return { kind: 'card' };
  return { kind: 'step', index: segment.stepIndex };
}
