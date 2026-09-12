#!/usr/bin/env node
/**
 * Build the client-safe content pack.
 *
 * The full pack holds the answers (correctOptionId, target.rule, feedback) and the
 * exercise chart seeds. None of that may reach the browser, so the client bundle
 * imports this generated file instead of specs/tikerino-content-pack-v0.2.json.
 *
 * Runs before `dev` and `build`. The output is gitignored - it is derived, and the
 * spec pack is the single source of truth.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GENERATOR_VERSION, SCENARIO_SPEC_VERSION } from '@tikerino/engine';
import { loadDeviations, warn } from './deviations.mjs';
import { loadContentPack, toClientPack } from '@tikerino/content';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../specs/tikerino-content-pack-v0.2.json');
const destination = resolve(here, '../client/src/content/pack.client.json');

const pack = loadContentPack(JSON.parse(readFileSync(source, 'utf8')), {
  engineGeneratorVersion: GENERATOR_VERSION,
  engineScenarioSpecVersion: SCENARIO_SPEC_VERSION,
  knownDeviations: loadDeviations(),
  onWarning: warn,
});

const clientPack = toClientPack(pack);

// Fail loudly rather than shipping a leak if the stripping ever regresses.
//
// Scope matters: EXERCISES must carry no answers and no chart seeds, while LESSON
// charts keep theirs on purpose - revealSize is 0 there, so there is nothing after
// the cut to protect, and the browser generates them for the offline lesson shell.
for (const exercise of clientPack.exercises) {
  for (const forbidden of ['correctOptionId', 'target', 'feedback']) {
    if (forbidden in exercise) {
      throw new Error(`${exercise.exerciseId} still carries "${forbidden}" - sanitisation is broken.`);
    }
  }
  for (const forbidden of ['seed', 'scenarioFamily', 'revealSize', 'windowSize']) {
    if (exercise.chart && forbidden in exercise.chart) {
      throw new Error(
        `${exercise.exerciseId} chart still carries "${forbidden}" - the reveal could be regenerated in the browser.`,
      );
    }
  }
}

for (const lesson of clientPack.lessons) {
  for (const chart of [lesson.principleCard.miniChart, lesson.guidedExample.chart]) {
    if (chart && chart.revealSize !== 0) {
      throw new Error(
        `${lesson.lessonId} ships a chart with revealSize ${chart.revealSize} to the client.`,
      );
    }
  }
}

const serialised = JSON.stringify(clientPack, null, 2);

mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${serialised}\n`, 'utf8');

console.log(
  `Wrote client pack: ${clientPack.exercises.length} exercises, ${clientPack.lessons.length} lessons, answers stripped.`,
);
