import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { GENERATOR_VERSION, SCENARIO_SPEC_VERSION } from '@tikerino/engine';
import { loadContentPack } from '@tikerino/content';
import type { ContentDeviation, ContentPack, Lesson } from '@tikerino/content';

import {
  buildNarrationPlan,
  candleDrawSchedule,
  drawnCandlesAt,
  estimateSpokenMs,
  MINIMUM_SEGMENT_MS,
  NarrationManifestMismatch,
  segmentId,
  segmentIndexForTextPosition,
  textPositionForSegmentIndex,
  type NarrationSpriteManifest,
} from '../client/src/narration.js';


/**
 * The narrated delivery runs on the same lessons the text delivery does, so the
 * shape tests use the real pack rather than a hand-built double. The edge cases
 * use a fixture, because a broken manifest is not something the pack can carry.
 */
const ROOT = resolve(__dirname, '..');
const pack = JSON.parse(
  readFileSync(resolve(ROOT, 'specs/tikerino-content-pack-v0.2.json'), 'utf8'),
) as ContentPack;
const deviations = (
  JSON.parse(readFileSync(resolve(ROOT, 'content-deviations.json'), 'utf8')) as {
    deviations: ContentDeviation[];
  }
).deviations;

const lessons = loadContentPack(pack, {
  engineGeneratorVersion: GENERATOR_VERSION,
  engineScenarioSpecVersion: SCENARIO_SPEC_VERSION,
  knownDeviations: deviations,
}).lessons;
const lesson = lessons[0]!;

function fixtureLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    ...lesson,
    lessonId: 'fixture-lesson',
    principleCard: { ...lesson.principleCard, body: 'One two three four five six.' },
    guidedExample: {
      chart: { ...lesson.guidedExample.chart, windowSize: 4 },
      steps: [
        { text: 'First step.', annotateCandleIndex: 0 },
        { text: 'Second step.', annotateCandleIndex: 3 },
      ],
    },
    ...overrides,
  };
}

function manifestFor(l: Lesson, segments: NarrationSpriteManifest['segments']): NarrationSpriteManifest {
  return { lessonId: l.lessonId, src: `audio/lessons/${l.lessonId}/walkthrough.mp3`, segments };
}

describe('the narration plan', () => {
  it('is the principle followed by one segment per guided step', () => {
    const plan = buildNarrationPlan(lesson);
    expect(plan.segments).toHaveLength(1 + lesson.guidedExample.steps.length);
    expect(plan.segments.map((s) => s.id)).toEqual([
      'intro',
      ...lesson.guidedExample.steps.map((_, i) => `step-${i}`),
    ]);
  });

  it('speaks the principle in the intro, pointing at no single candle', () => {
    const [intro] = buildNarrationPlan(lesson).segments;
    expect(intro!.kind).toBe('intro');
    expect(intro!.text).toBe(lesson.principleCard.body);
    expect(intro!.spotlightCandleIndex).toBeNull();
    expect(intro!.stepIndex).toBeNull();
  });

  it('points each step at the candle the pack annotates', () => {
    const plan = buildNarrationPlan(lesson);
    lesson.guidedExample.steps.forEach((step, index) => {
      const segment = plan.segments[index + 1]!;
      expect(segment.text).toBe(step.text);
      expect(segment.spotlightCandleIndex).toBe(step.annotateCandleIndex);
      expect(segment.stepIndex).toBe(index);
    });
  });

  it('runs over the guided example chart', () => {
    expect(buildNarrationPlan(lesson).chart).toEqual(lesson.guidedExample.chart);
  });

  it('builds a plan for every lesson in the pack', () => {
    for (const l of lessons) {
      const plan = buildNarrationPlan(l);
      expect(plan.segments.length).toBe(1 + l.guidedExample.steps.length);
      expect(plan.totalMs).toBeGreaterThan(0);
    }
  });
});

describe('timing without audio', () => {
  it('estimates from the word count', () => {
    // 150 words in a minute: 30 words is twelve seconds.
    expect(estimateSpokenMs(Array.from({ length: 30 }, () => 'word').join(' '))).toBe(12_000);
  });

  it('never lets a short segment flash past', () => {
    expect(estimateSpokenMs('Look.')).toBe(MINIMUM_SEGMENT_MS);
    expect(estimateSpokenMs('')).toBe(MINIMUM_SEGMENT_MS);
  });

  it('lays segments end to end, in order, without gaps or overlaps', () => {
    const plan = buildNarrationPlan(fixtureLesson());
    expect(plan.timing).toBe('estimated');
    expect(plan.audioSrc).toBeNull();

    let expectedStart = 0;
    for (const segment of plan.segments) {
      expect(segment.timing).toBe('estimated');
      expect(segment.startMs).toBe(expectedStart);
      expect(segment.durationMs).toBeGreaterThan(0);
      expectedStart = segment.startMs + segment.durationMs;
    }
    expect(plan.totalMs).toBe(expectedStart);
  });
});

describe('timing from a sprite manifest', () => {
  const l = fixtureLesson();
  const good = manifestFor(l, [
    { id: 'intro', startMs: 0, durationMs: 14_400 },
    { id: 'step-0', startMs: 14_400, durationMs: 6_100 },
    { id: 'step-1', startMs: 20_500, durationMs: 5_400 },
  ]);

  it('places every segment at its measured offset', () => {
    const plan = buildNarrationPlan(l, good);
    expect(plan.timing).toBe('measured');
    expect(plan.audioSrc).toBe('audio/lessons/fixture-lesson/walkthrough.mp3');
    expect(plan.segments.map((s) => [s.startMs, s.durationMs])).toEqual([
      [0, 14_400],
      [14_400, 6_100],
      [20_500, 5_400],
    ]);
    expect(plan.segments.every((s) => s.timing === 'measured')).toBe(true);
    expect(plan.totalMs).toBe(25_900);
  });

  it('refuses a manifest for a different lesson', () => {
    const wrong = { ...good, lessonId: 'some-other-lesson' };
    expect(() => buildNarrationPlan(l, wrong)).toThrow(NarrationManifestMismatch);
  });

  it('refuses a manifest missing a segment', () => {
    const short = manifestFor(l, good.segments.slice(0, 2));
    expect(() => buildNarrationPlan(l, short)).toThrow(/missing step-1/);
  });

  it('refuses a manifest carrying a segment the lesson does not have', () => {
    const extra = manifestFor(l, [...good.segments, { id: 'step-2', startMs: 30_000, durationMs: 1_000 }]);
    expect(() => buildNarrationPlan(l, extra)).toThrow(/unexpected step-2/);
  });

  it('refuses overlapping offsets, which would run one segment into the next', () => {
    const overlapping = manifestFor(l, [
      { id: 'intro', startMs: 0, durationMs: 14_400 },
      { id: 'step-0', startMs: 14_000, durationMs: 6_100 },
      { id: 'step-1', startMs: 20_500, durationMs: 5_400 },
    ]);
    expect(() => buildNarrationPlan(l, overlapping)).toThrow(/overlap/);
  });

  it.each([
    ['a negative start', { id: 'step-0', startMs: -1, durationMs: 6_100 }],
    ['a zero duration', { id: 'step-0', startMs: 14_400, durationMs: 0 }],
    ['a non-finite duration', { id: 'step-0', startMs: 14_400, durationMs: Number.NaN }],
  ])('refuses %s', (_label, broken) => {
    const bad = manifestFor(l, [
      { id: 'intro', startMs: 0, durationMs: 14_400 },
      broken as NarrationSpriteManifest['segments'][number],
      { id: 'step-1', startMs: 20_500, durationMs: 5_400 },
    ]);
    expect(() => buildNarrationPlan(l, bad)).toThrow(NarrationManifestMismatch);
  });
});

describe('the chart draw-in', () => {
  it('finishes exactly as the principle finishes', () => {
    const plan = buildNarrationPlan(fixtureLesson());
    const schedule = candleDrawSchedule(plan);
    const intro = plan.segments[0]!;
    expect(schedule).toHaveLength(plan.chart.windowSize);
    expect(schedule[schedule.length - 1]).toBe(intro.startMs + intro.durationMs);
  });

  it('adds candles one at a time, never going backwards', () => {
    const schedule = candleDrawSchedule(buildNarrationPlan(fixtureLesson()));
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i]!).toBeGreaterThan(schedule[i - 1]!);
    }
  });

  it('reports how much is drawn at a moment, from the plan rather than from audio', () => {
    const plan = buildNarrationPlan(fixtureLesson());
    const intro = plan.segments[0]!;
    expect(drawnCandlesAt(plan, 0)).toBe(0);
    expect(drawnCandlesAt(plan, intro.durationMs)).toBe(plan.chart.windowSize);
    // Still fully drawn while the steps play.
    expect(drawnCandlesAt(plan, plan.totalMs)).toBe(plan.chart.windowSize);
  });
});

describe('landing in the same place when the delivery changes', () => {
  const plan = buildNarrationPlan(fixtureLesson());

  it('maps the principle card to the intro segment', () => {
    expect(segmentIndexForTextPosition(plan, { kind: 'card' })).toBe(0);
    expect(textPositionForSegmentIndex(plan, 0)).toEqual({ kind: 'card' });
  });

  it('maps manual step k to segment k+1', () => {
    expect(segmentIndexForTextPosition(plan, { kind: 'step', index: 0 })).toBe(1);
    expect(segmentIndexForTextPosition(plan, { kind: 'step', index: 1 })).toBe(2);
    expect(textPositionForSegmentIndex(plan, 1)).toEqual({ kind: 'step', index: 0 });
    expect(textPositionForSegmentIndex(plan, 2)).toEqual({ kind: 'step', index: 1 });
  });

  it('round-trips every position both ways', () => {
    const positions = [
      { kind: 'card' } as const,
      ...plan.segments
        .filter((s) => s.kind === 'step')
        .map((s) => ({ kind: 'step', index: s.stepIndex! }) as const),
    ];
    for (const position of positions) {
      const index = segmentIndexForTextPosition(plan, position);
      expect(textPositionForSegmentIndex(plan, index)).toEqual(position);
    }
  });

  it('lands on the intro rather than crashing when a step has no segment', () => {
    expect(segmentIndexForTextPosition(plan, { kind: 'step', index: 99 })).toBe(0);
    expect(textPositionForSegmentIndex(plan, 99)).toEqual({ kind: 'card' });
  });

  it('names segments by position, so ids do not depend on authored content', () => {
    expect(segmentId('intro', null)).toBe('intro');
    expect(segmentId('step', 2)).toBe('step-2');
  });
});
