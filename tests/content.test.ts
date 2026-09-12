import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  GENERATOR_VERSION,
  SCENARIO_SPEC_VERSION,
  cutWindow,
  generateSeries,
  resolveWithMargin,
} from '@tikerino/engine';
import {
  ContentValidationError,
  countWords,
  findForbiddenTokens,
  loadContentPack,
  satisfiesRange,
  toClientPack,
  type ContentDeviation,
  type ContentPack,
} from '@tikerino/content';

const ROOT = resolve(__dirname, '..');
const pack = JSON.parse(
  readFileSync(resolve(ROOT, 'specs/tikerino-content-pack-v0.2.json'), 'utf8'),
) as ContentPack;

const deviations = (
  JSON.parse(readFileSync(resolve(ROOT, 'content-deviations.json'), 'utf8')) as {
    deviations: ContentDeviation[];
  }
).deviations;

const loadOptions = {
  engineGeneratorVersion: GENERATOR_VERSION,
  engineScenarioSpecVersion: SCENARIO_SPEC_VERSION,
  knownDeviations: deviations,
};

describe('the shipped content pack', () => {
  it('loads and validates', () => {
    expect(() => loadContentPack(pack, loadOptions)).not.toThrow();
  });

  it('has the locked MVP shape: 2 topics, 9 lessons, 16 exercises', () => {
    // Still exactly 2 topics - the locked scope. v0.2.0 split lesson-4 in two and
    // added ex-016, taking the starter pack to 9 lessons and 16 exercises.
    expect(pack.topics).toHaveLength(2);
    expect(pack.lessons).toHaveLength(9);
    expect(pack.exercises).toHaveLength(16);
  });

  it('keeps every principle card within 60 words', () => {
    for (const lesson of pack.lessons) {
      expect(countWords(lesson.principleCard.body), lesson.lessonId).toBeLessThanOrEqual(60);
    }
  });

  it('uses only the two day-one exercise types', () => {
    for (const exercise of pack.exercises) {
      expect(['multiple_choice', 'pick_the_candle']).toContain(exercise.type);
    }
  });

  it('names no real ticker, company or date', () => {
    expect(findForbiddenTokens(pack)).toEqual([]);
  });

  it('keeps every feedback string within 40 words', () => {
    for (const exercise of pack.exercises) {
      expect(countWords(exercise.feedback.correct)).toBeLessThanOrEqual(40);
      expect(countWords(exercise.feedback.incorrect)).toBeLessThanOrEqual(40);
    }
  });

  it('carries the disclaimers the UI is required to render', () => {
    expect(pack.meta.revealDisclaimer.length).toBeGreaterThan(0);
    expect(pack.meta.syntheticDataLabel.length).toBeGreaterThan(0);
  });

  it('gives lesson charts revealSize 0 - nothing after the cut to protect', () => {
    for (const lesson of pack.lessons) {
      expect(lesson.guidedExample.chart.revealSize).toBe(0);
      if (lesson.principleCard.miniChart) {
        expect(lesson.principleCard.miniChart.revealSize).toBe(0);
      }
    }
  });
});

describe('acknowledged deviations', () => {
  it('has none: the shipped pack validates clean', () => {
    // The strongest form of this test. Content pack v0.2.0 fixed every defect
    // v0.1.0 carried, so the escape hatch is unused - the pack loads with no
    // deviations allowed at all. If this fails, a new debt was taken on.
    expect(deviations).toEqual([]);
    expect(() =>
      loadContentPack(pack, { ...loadOptions, knownDeviations: [] }),
    ).not.toThrow();
  });

  it('reports no warnings', () => {
    const warnings: string[] = [];
    loadContentPack(pack, { ...loadOptions, onWarning: (w) => warnings.push(w) });
    expect(warnings).toEqual([]);
  });

  it('still has a working escape hatch, should content ever need one again', () => {
    const broken = structuredClone(pack);
    broken.lessons[0]!.principleCard.body = 'word '.repeat(80);

    expect(() => loadContentPack(broken, loadOptions)).toThrow(/principleCard body is 80 words/);

    const warnings: string[] = [];
    expect(() =>
      loadContentPack(broken, {
        ...loadOptions,
        knownDeviations: [
          {
            id: 'test-only',
            matches: `lesson ${broken.lessons[0]!.lessonId}: principleCard body is`,
            owner: 'test',
            detail: 'synthetic',
            suggestedFix: 'none',
          },
        ],
        onWarning: (w) => warnings.push(w),
      }),
    ).not.toThrow();
    expect(warnings[0]).toContain('test-only');
  });

  it('blocks a violation that is not on the list', () => {
    const broken = structuredClone(pack);
    broken.lessons[1]!.principleCard.body = 'word '.repeat(80);
    expect(() => loadContentPack(broken, loadOptions)).toThrow(/principleCard body is 80 words/);
  });
});

describe('content CI rule: pick_the_candle resolves uniquely with margin', () => {
  const picks = pack.exercises.filter((e) => e.type === 'pick_the_candle');

  it('covers every pick_the_candle exercise in the pack', () => {
    expect(picks.length).toBeGreaterThan(0);
  });

  it.each(picks.map((e) => [e.exerciseId, e] as const))(
    '%s has one clear winner',
    (_id, exercise) => {
      const chart = exercise.chart!;
      const series = generateSeries({
        seed: chart.seed,
        family: chart.scenarioFamily,
        windowSize: chart.windowSize,
        revealSize: chart.revealSize,
        scenarioSpecVersion: chart.scenarioSpecVersion,
      });
      const resolution = resolveWithMargin(exercise.target.rule, cutWindow(series));

      expect(resolution.unique).toBe(true);
      // "no near-ties within 1% of range for length rules"
      expect(resolution.margin).toBeGreaterThan(0.01);
      expect(resolution.index).toBeGreaterThanOrEqual(0);
      expect(resolution.index).toBeLessThan(chart.windowSize);
    },
  );
});

describe('validation rules', () => {
  it('reads the pack version range the schema documents', () => {
    expect(satisfiesRange('1.0.0', '>=1.0.0 <2.0.0')).toBe(true);
    expect(satisfiesRange('1.9.9', '>=1.0.0 <2.0.0')).toBe(true);
    expect(satisfiesRange('2.0.0', '>=1.0.0 <2.0.0')).toBe(false);
    expect(satisfiesRange('0.9.0', '>=1.0.0 <2.0.0')).toBe(false);
  });

  it('rejects a locale other than en', () => {
    const broken = structuredClone(pack);
    broken.locale = 'he';
    expect(() => loadContentPack(broken, loadOptions)).toThrow(/locale/);
  });

  it('rejects a dangling exercise reference', () => {
    const broken = structuredClone(pack);
    broken.lessons[0]!.exerciseIds = ['ex-404'];
    expect(() => loadContentPack(broken, loadOptions)).toThrow(/does not resolve/);
  });

  it('rejects a correctOptionId that is not an option', () => {
    const broken = structuredClone(pack);
    const mc = broken.exercises.find((e) => e.type === 'multiple_choice')!;
    if (mc.type === 'multiple_choice') mc.correctOptionId = 'z';
    expect(() => loadContentPack(broken, loadOptions)).toThrow(/correctOptionId/);
  });

  it('rejects an engine outside the pack generatorVersionCompat range', () => {
    expect(() =>
      loadContentPack(pack, { ...loadOptions, engineGeneratorVersion: '2.0.0' }),
    ).toThrow(/generatorVersionCompat/);
  });

  it('spots a ticker-shaped token if content ever adds one', () => {
    const broken = structuredClone(pack);
    broken.exercises[0]!.prompt = 'Look at AAPL on this chart.';
    expect(findForbiddenTokens(broken).join(' ')).toContain('AAPL');
  });

  it('spots a calendar date if content ever adds one', () => {
    const broken = structuredClone(pack);
    broken.exercises[0]!.prompt = 'This chart covers 2024-03-01.';
    expect(findForbiddenTokens(broken).join(' ')).toContain('2024-03-01');
  });
});

describe('the client pack', () => {
  const clientPack = toClientPack(pack);

  it('strips every answer', () => {
    for (const exercise of clientPack.exercises) {
      expect(exercise).not.toHaveProperty('correctOptionId');
      expect(exercise).not.toHaveProperty('target');
      expect(exercise).not.toHaveProperty('feedback');
    }
  });

  it('strips exercise chart seeds, so the reveal cannot be regenerated locally', () => {
    for (const exercise of clientPack.exercises) {
      if (!exercise.chart) continue;
      expect(exercise.chart).not.toHaveProperty('seed');
      expect(exercise.chart).not.toHaveProperty('scenarioFamily');
      expect(exercise.chart).not.toHaveProperty('revealSize');
      expect(exercise.chart.syntheticSeriesId).toBeTruthy();
      expect(exercise.chart.timeframeLabel).toBeTruthy();
    }
  });

  it('keeps what the offline lesson shell needs', () => {
    expect(clientPack.lessons).toHaveLength(9);
    for (const lesson of clientPack.lessons) {
      expect(lesson.principleCard.body.length).toBeGreaterThan(0);
      expect(lesson.guidedExample.steps.length).toBeGreaterThan(0);
      // Lesson charts keep their seed: revealSize is 0, nothing to protect.
      expect(lesson.guidedExample.chart.seed).toBeTruthy();
    }
    expect(clientPack.meta.revealDisclaimer).toBe(pack.meta.revealDisclaimer);
  });

  it('leaves no answer text anywhere in the serialised bundle payload', () => {
    const serialised = JSON.stringify(clientPack);
    expect(serialised).not.toContain('correctOptionId');
    expect(serialised).not.toContain('"target"');
    expect(serialised).not.toContain('"feedback"');
    for (const exercise of pack.exercises) {
      expect(serialised).not.toContain(exercise.feedback.correct);
    }
  });
});
