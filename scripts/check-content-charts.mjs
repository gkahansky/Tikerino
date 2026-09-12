#!/usr/bin/env node
/**
 * Regenerate every chart in the pack and report on it.
 *
 * This is the content CI rule from content schema section 5: every
 * pick_the_candle rule must resolve to a unique candle with a margin (no near-ties
 * within 1% of range for length rules). If a seed fails, the seed changes - never
 * the tie-break, and never the generator.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GENERATOR_VERSION,
  SCENARIO_SPEC_VERSION,
  bodySize,
  cutWindow,
  generateSeries,
  resolveWithMargin,
} from '@tikerino/engine';
import { indexPack, loadContentPack } from '@tikerino/content';

import { loadDeviations, warn } from './deviations.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const packPath = resolve(here, '../specs/tikerino-content-pack-v0.1.json');

const pack = loadContentPack(JSON.parse(readFileSync(packPath, 'utf8')), {
  engineGeneratorVersion: GENERATOR_VERSION,
  engineScenarioSpecVersion: SCENARIO_SPEC_VERSION,
  knownDeviations: loadDeviations(),
  onWarning: warn,
});
indexPack(pack);

const charts = [];
for (const lesson of pack.lessons) {
  if (lesson.principleCard.miniChart) {
    charts.push({ owner: `${lesson.lessonId} card`, chart: lesson.principleCard.miniChart });
  }
  charts.push({ owner: `${lesson.lessonId} guided`, chart: lesson.guidedExample.chart });
}
for (const exercise of pack.exercises) {
  if (exercise.chart) charts.push({ owner: exercise.exerciseId, chart: exercise.chart });
}

let failures = 0;
console.log(`Regenerating ${charts.length} charts...\n`);

for (const { owner, chart } of charts) {
  try {
    const series = generateSeries({
      seed: chart.seed,
      family: chart.scenarioFamily,
      windowSize: chart.windowSize,
      revealSize: chart.revealSize,
      scenarioSpecVersion: chart.scenarioSpecVersion,
    });
    const window = cutWindow(series);
    const prices = window.flatMap((c) => [c.h, c.l]);
    console.log(
      `ok   ${owner.padEnd(28)} ${chart.scenarioFamily.padEnd(12)} ` +
        `n=${series.candles.length} resamples=${series.resampleAttempts} ` +
        `range=${Math.min(...prices).toFixed(2)}-${Math.max(...prices).toFixed(2)}`,
    );
  } catch (error) {
    failures++;
    console.log(`FAIL ${owner.padEnd(28)} ${error.message}`);
  }
}

console.log('\npick_the_candle rule resolution:');
for (const exercise of pack.exercises) {
  if (exercise.type !== 'pick_the_candle') continue;
  const chart = exercise.chart;
  const series = generateSeries({
    seed: chart.seed,
    family: chart.scenarioFamily,
    windowSize: chart.windowSize,
    revealSize: chart.revealSize,
    scenarioSpecVersion: chart.scenarioSpecVersion,
  });
  const window = cutWindow(series);
  try {
    const { index, margin, unique } = resolveWithMargin(exercise.target.rule, window);
    const ok = unique && margin > 0.01;
    if (!ok) failures++;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${exercise.exerciseId} ${exercise.target.rule.padEnd(20)} ` +
        `-> candle ${index}, margin ${(margin * 100).toFixed(1)}% of range, unique=${unique}`,
    );
  } catch (error) {
    failures++;
    console.log(`FAIL ${exercise.exerciseId} ${exercise.target.rule}: ${error.message}`);
  }
}

/*
 * Guided-example annotations.
 *
 * `annotateCandleIndex` was authored before this engine existed, so nobody could
 * see the chart a seed actually produces - the indices were picked blind. These
 * checks read the step text for claims that CAN be verified against the candle it
 * points at, so a step can no longer say "hollow green body" over a red one.
 *
 * Heuristic by nature: only unambiguous phrasings are checked, and anything found
 * is a content fix (the text or the index), never a generator change.
 */
console.log('\nguided-example annotations:');

const acknowledged = new Set(
  (JSON.parse(readFileSync(resolve(here, '../content-deviations.json'), 'utf8'))
    .guidedAnnotations ?? []).map((entry) => entry.id),
);

for (const lesson of pack.lessons) {
  const chart = lesson.guidedExample.chart;
  const window = cutWindow(
    generateSeries({
      seed: chart.seed,
      family: chart.scenarioFamily,
      windowSize: chart.windowSize,
      revealSize: chart.revealSize,
      scenarioSpecVersion: chart.scenarioSpecVersion,
    }),
  );
  const bodyShare = (c) => (c.h - c.l > 0 ? bodySize(c) / (c.h - c.l) : 0);
  const smallest = window.reduce((a, b) => (bodyShare(a) <= bodyShare(b) ? a : b));

  for (const [n, step] of lesson.guidedExample.steps.entries()) {
    const id = `${lesson.lessonId}#${n}`;
    const candle = window[step.annotateCandleIndex];
    const text = step.text.toLowerCase();
    const isBullish = candle.c > candle.o;
    const isBearish = candle.c < candle.o;

    const problems = [];
    if (/hollow|green body|price rose|closes? (is )?the top edge/.test(text) && !isBullish) {
      problems.push('text describes a BULLISH candle, but this one is not');
    }
    if (/solid red|red body|price fell|closes? (is )?the bottom edge/.test(text) && !isBearish) {
      problems.push('text describes a BEARISH candle, but this one is not');
    }
    if (/smallest body|tiny body/.test(text) && candle.i !== smallest.i) {
      problems.push(
        `text says smallest body, but candle ${candle.i} fills ${Math.round(bodyShare(candle) * 100)}% ` +
          `of its range - candle ${smallest.i} is the smallest at ${Math.round(bodyShare(smallest) * 100)}%`,
      );
    }
    if (/run of bullish candles/.test(text) && !isBullish) {
      problems.push('text talks about bullish candles, but this one is not bullish');
    }

    if (problems.length === 0) {
      console.log(`ok   ${id.padEnd(30)} candle ${candle.i}`);
      continue;
    }
    if (acknowledged.has(id)) {
      console.log(`warn ${id.padEnd(30)} candle ${candle.i}: ${problems.join('; ')} [acknowledged]`);
      continue;
    }
    failures++;
    console.log(`FAIL ${id.padEnd(30)} candle ${candle.i}: ${problems.join('; ')}`);
  }
}

console.log(failures === 0 ? '\nAll charts good.' : `\n${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
