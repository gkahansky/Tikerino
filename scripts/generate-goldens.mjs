#!/usr/bin/env node
/**
 * Write the golden-seed fixture the replay test checks against.
 *
 * Run this ONLY to establish goldens for a deliberate generator change (which is a
 * generatorVersion bump). If it changes an existing hash without such a bump, that
 * is the bug the replay test exists to catch - regenerating to make the test pass
 * would destroy the guarantee that a stored answer can be replayed years later.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GENERATOR_VERSION, SCENARIO_SPEC_VERSION, generateSeries } from '@tikerino/engine';

const here = dirname(fileURLToPath(import.meta.url));
const packPath = resolve(here, '../specs/tikerino-content-pack-v0.2.json');
const outPath = resolve(here, '../tests/goldens/series.json');

const pack = JSON.parse(readFileSync(packPath, 'utf8'));

/** Every chart the shipped pack references, plus coverage for families it does not use. */
const cases = [];

for (const lesson of pack.lessons) {
  for (const [label, chart] of [
    ['card', lesson.principleCard.miniChart],
    ['guided', lesson.guidedExample.chart],
  ]) {
    if (chart) cases.push({ id: `${lesson.lessonId}/${label}`, chart });
  }
}
for (const exercise of pack.exercises) {
  if (exercise.chart) cases.push({ id: exercise.exerciseId, chart: exercise.chart });
}

// trend_down and a couple of edge shapes never appear in the starter pack; pin them
// anyway so a change to those code paths is caught too.
for (const extra of [
  { seed: 'golden/trend-down-1', scenarioFamily: 'trend_down', windowSize: 12, revealSize: 6 },
  { seed: 'golden/trend-down-2', scenarioFamily: 'trend_down', windowSize: 8, revealSize: 0 },
  { seed: 'golden/volatile-long', scenarioFamily: 'volatile', windowSize: 20, revealSize: 10 },
  { seed: 'golden/ambiguous-min', scenarioFamily: 'ambiguous', windowSize: 5, revealSize: 1 },
  { seed: 'golden/range-single', scenarioFamily: 'range_bound', windowSize: 1, revealSize: 0 },
]) {
  cases.push({
    id: extra.seed,
    chart: { ...extra, scenarioSpecVersion: SCENARIO_SPEC_VERSION },
  });
}

const goldens = cases.map(({ id, chart }) => {
  const series = generateSeries({
    seed: chart.seed,
    family: chart.scenarioFamily,
    windowSize: chart.windowSize,
    revealSize: chart.revealSize,
    scenarioSpecVersion: chart.scenarioSpecVersion,
  });
  return {
    id,
    seed: chart.seed,
    family: chart.scenarioFamily,
    windowSize: chart.windowSize,
    revealSize: chart.revealSize,
    scenarioSpecVersion: chart.scenarioSpecVersion,
    sha256: createHash('sha256').update(JSON.stringify(series.candles)).digest('hex'),
  };
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  `${JSON.stringify({ generatorVersion: GENERATOR_VERSION, scenarioSpecVersion: SCENARIO_SPEC_VERSION, goldens }, null, 2)}\n`,
);

console.log(`Wrote ${goldens.length} golden hashes for generator ${GENERATOR_VERSION}.`);
