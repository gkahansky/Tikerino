import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ContentPack } from '@tikerino/content';

import {
  NARRATED_PILOT_LESSON_IDS,
  clampDrawCount,
  drawTiming,
  drawnCountAt,
  estimateDurationMs,
  pilotNarrationPlan,
  segmentIndexToStep,
  stepToSegmentIndex,
} from '../client/src/narration';
import { LESSON_SPRITES } from '../client/src/narration-audio';

const ROOT = resolve(__dirname, '..');
const pack = JSON.parse(
  readFileSync(resolve(ROOT, 'specs/tikerino-content-pack-v0.2.json'), 'utf8'),
) as ContentPack;

const pilotLesson = pack.lessons.find((l) => l.lessonId === 'lesson-0-meet-the-chart')!;
const otherLesson = pack.lessons.find((l) => l.lessonId !== 'lesson-0-meet-the-chart')!;

describe('pilotNarrationPlan', () => {
  it('builds the plan from the lesson content, not a copy of it', () => {
    const plan = pilotNarrationPlan(pilotLesson)!;
    expect(plan.lessonId).toBe('lesson-0-meet-the-chart');
    expect(plan.intro.text).toBe(pilotLesson.principleCard.body);
    expect(plan.intro.candleIndex).toBeNull();
    expect(plan.steps).toHaveLength(pilotLesson.guidedExample.steps.length);
    expect(plan.steps.map((s) => s.text)).toEqual(
      pilotLesson.guidedExample.steps.map((s) => s.text),
    );
    expect(plan.steps.map((s) => s.candleIndex)).toEqual(
      pilotLesson.guidedExample.steps.map((s) => s.annotateCandleIndex),
    );
  });

  it('plays every segment from one sprite, in order, with no gaps', () => {
    const plan = pilotNarrationPlan(pilotLesson)!;
    expect(plan.spriteFile).toBe('walkthrough.mp3');
    const all = [plan.intro, ...plan.steps];
    // One src for the whole walkthrough: the player seeks instead of
    // swapping src (iOS blocks play() after a src swap outside a gesture).
    expect(all[0]!.offsetMs).toBe(0);
    for (let i = 1; i < all.length; i += 1) {
      expect(all[i]!.offsetMs).toBe(all[i - 1]!.offsetMs + all[i - 1]!.durationMs);
      expect(all[i]!.durationMs).toBeGreaterThan(0);
    }
  });

  it('returns null outside the pilot list', () => {
    expect(pilotNarrationPlan(otherLesson)).toBeNull();
    expect(NARRATED_PILOT_LESSON_IDS).not.toContain(otherLesson.lessonId);
  });
});

describe('estimateDurationMs', () => {
  it('has a floor so short lines do not flash past', () => {
    expect(estimateDurationMs('Hi.')).toBeGreaterThanOrEqual(1800);
  });

  it('grows with word count at roughly narration pace', () => {
    const short = estimateDurationMs('Find the bottom axis.');
    const long = estimateDurationMs(pilotLesson.principleCard.body);
    expect(long).toBeGreaterThan(short);
    const words = pilotLesson.principleCard.body.trim().split(/\s+/).length;
    expect(long).toBe(Math.max(1800, Math.round(words * 360) + 700));
  });
});

describe('drawTiming + drawnCountAt', () => {
  const candleCount = pilotLesson.guidedExample.chart.windowSize;
  const introMs = estimateDurationMs(pilotLesson.principleCard.body);
  const timing = drawTiming(candleCount, introMs);

  it('keeps the stagger inside a watchable range', () => {
    expect(timing.staggerMs).toBeGreaterThanOrEqual(140);
    expect(timing.staggerMs).toBeLessThanOrEqual(420);
  });

  it('draws nothing before the lead-in and everything by the end of the intro', () => {
    expect(drawnCountAt(0, candleCount, timing)).toBe(0);
    expect(drawnCountAt(timing.startMs - 1, candleCount, timing)).toBe(0);
    expect(drawnCountAt(timing.startMs, candleCount, timing)).toBe(1);
    expect(drawnCountAt(introMs, candleCount, timing)).toBe(candleCount);
  });

  it('never exceeds the candle count', () => {
    expect(drawnCountAt(introMs * 5, candleCount, timing)).toBe(candleCount);
  });
});

describe('clampDrawCount', () => {
  it('passes null through (no animation)', () => {
    expect(clampDrawCount(null, 12)).toBeNull();
    expect(clampDrawCount(undefined, 12)).toBeNull();
  });

  it('clamps into [0, total]', () => {
    expect(clampDrawCount(-3, 12)).toBe(0);
    expect(clampDrawCount(5, 12)).toBe(5);
    expect(clampDrawCount(99, 12)).toBe(12);
  });
});

describe('mid-lesson mode switching', () => {
  it('maps the principle card to the intro segment and steps 1:1 after it', () => {
    expect(stepToSegmentIndex(-1)).toBe(0);
    expect(stepToSegmentIndex(0)).toBe(1);
    expect(stepToSegmentIndex(2)).toBe(3);
  });

  it('maps back the other way', () => {
    expect(segmentIndexToStep(0)).toBe(-1);
    expect(segmentIndexToStep(1)).toBe(0);
    expect(segmentIndexToStep(3)).toBe(2);
  });

  it('round-trips every position in the pilot lesson', () => {
    const plan = pilotNarrationPlan(pilotLesson)!;
    const positions = [-1, ...plan.steps.map((_, i) => i)];
    for (const step of positions) {
      expect(segmentIndexToStep(stepToSegmentIndex(step))).toBe(step);
    }
  });
});

describe('sprite files (generated audio)', () => {
  const audioDir = resolve(ROOT, 'client/public/audio/lessons');
  const ffprobeAvailable = (() => {
    try { execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); return true; }
    catch { return false; }
  })();
  const durationMs = (file: string): number => Math.round(Number(execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','csv=p=0',file], { encoding: 'utf8' }).trim()) * 1000);

  it('offsets in narration-audio.ts match the real mp3s (regenerate with scripts/build-audio-sprite.mjs)', () => {
    for (const [lessonId, sprite] of Object.entries(LESSON_SPRITES)) {
      const dir = resolve(audioDir, lessonId);
      expect(existsSync(resolve(dir, sprite.spriteFile)), `${lessonId} sprite exists`).toBe(true);
      if (!ffprobeAvailable) continue;
      let offset = 0;
      for (const [id, timing] of Object.entries(sprite.segments)) {
        const real = durationMs(resolve(dir, `${id}.mp3`));
        expect(timing.offsetMs, `${lessonId}/${id} offset`).toBe(offset);
        expect(Math.abs(timing.durationMs - real), `${lessonId}/${id} duration`).toBeLessThanOrEqual(50);
        offset += timing.durationMs;
      }
      const spriteReal = durationMs(resolve(dir, sprite.spriteFile));
      expect(Math.abs(spriteReal - offset), `${lessonId} sprite total`).toBeLessThanOrEqual(500);
    }
  });
});
