#!/usr/bin/env node
/**
 * Play every starter exercise through the real UI, in order, answering each one
 * correctly, and check the reveal every time.
 *
 * The harness knows the answers (it loads the full pack and the engine directly);
 * the app under test never does. That is the point - if the client could work the
 * answers out, the integrity contract would already be broken.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { cutWindow, generateSeries, resolveCandleRule } from '@tikerino/engine';

const here = dirname(fileURLToPath(import.meta.url));
const pack = JSON.parse(
  readFileSync(resolve(here, '../../specs/tikerino-content-pack-v0.2.json'), 'utf8'),
);
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:5173';

/**
 * Where Chromium lives.
 *
 * CI installs it through Playwright, which resolves it on its own, so returning
 * undefined is the right answer there. This dev container ships a pre-installed,
 * version-pinned copy that Playwright will not find by itself. CHROME_PATH
 * overrides both.
 */
function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const preinstalled = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return existsSync(preinstalled) ? preinstalled : undefined;
}


const exerciseById = new Map(pack.exercises.map((e) => [e.exerciseId, e]));
const lessons = [...pack.lessons].sort((a, b) => a.order - b.order);

const failures = [];
const played = [];

function check(label, condition, detail = '') {
  if (!condition) failures.push(`FAIL ${label} ${detail}`);
}

/** The correct answer, worked out the way only a privileged caller can. */
function correctAnswerFor(exercise) {
  if (exercise.type === 'multiple_choice') {
    const option = exercise.options.find((o) => o.optionId === exercise.correctOptionId);
    return { kind: 'option', text: option.text };
  }
  const chart = exercise.chart;
  const series = generateSeries({
    seed: chart.seed,
    family: chart.scenarioFamily,
    windowSize: chart.windowSize,
    revealSize: chart.revealSize,
    scenarioSpecVersion: chart.scenarioSpecVersion,
  });
  return { kind: 'candle', index: resolveCandleRule(exercise.target.rule, cutWindow(series)) };
}

const browser = await chromium.launch({ executablePath: resolveChrome() });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (error) => failures.push(`FAIL page error: ${error.message}`));

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (let i = 0; i < 3; i++) {
    const next = page.getByRole('button', { name: /Next|Start learning/ });
    if (await next.isVisible()) await next.click();
  }
  await page.getByRole('heading', { name: 'Your path' }).waitFor();

  for (const lesson of lessons) {
    await page.getByRole('button', { name: new RegExp(lesson.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
    await page.getByRole('heading', { name: lesson.principleCard.title }).waitFor();

    await page.getByRole('button', { name: 'Show me' }).click();
    for (let guard = 0; guard < 8; guard++) {
      const practise = page.getByRole('button', { name: 'Practise this' });
      if (await practise.isVisible()) {
        await practise.click();
        break;
      }
      await page.getByRole('button', { name: 'Next' }).click();
    }

    const exercises = lesson.exerciseIds
      .map((id) => exerciseById.get(id))
      .sort((a, b) => a.order - b.order);

    for (const [position, exercise] of exercises.entries()) {
      await page.getByText(new RegExp(`Question ${position + 1} of ${exercises.length}`)).waitFor();

      const answer = correctAnswerFor(exercise);
      if (answer.kind === 'option') {
        await page
          .getByRole('button', { name: answer.text, exact: true })
          .click();
      } else {
        // Use the text list: it is the accessible path, and exercising it here
        // means every pick-the-candle is proven playable without a pointer on the chart.
        await page.locator('details > summary').first().click();
        await page.getByRole('button', { name: `Select candle ${answer.index + 1}`, exact: true }).click();
      }

      await page.getByRole('button', { name: 'Check' }).click();
      await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();

      const heading = await page.getByRole('heading', { level: 1 }).first().innerText();
      check(`${exercise.exerciseId} graded correct`, heading.trim() === 'Correct', `got "${heading}"`);

      const body = await page.locator('body').innerText();
      check(
        `${exercise.exerciseId} shows the reveal disclaimer`,
        body.includes(pack.meta.revealDisclaimer),
      );

      if ((exercise.chart?.revealSize ?? 0) > 0) {
        const revealed = await page.locator('.reveal-candle').count();
        check(
          `${exercise.exerciseId} reveals ${exercise.chart.revealSize} post-T candles`,
          revealed === exercise.chart.revealSize,
          `saw ${revealed}`,
        );

        // Regression guard: the CSS reveal animation must not override the SVG
        // positional transform and stack every revealed candle at x = 0.
        const xs = await page.evaluate(() => {
          const svg = document.querySelector('svg[role="img"]');
          return [...svg.querySelectorAll('g[transform]')].map((g) =>
            Number.parseFloat(g.getAttribute('transform').match(/translate\(([-\d.]+)/)[1]),
          );
        });
        check(
          `${exercise.exerciseId} lays revealed candles out left to right`,
          new Set(xs).size === xs.length && xs.every((x, i) => i === 0 || x > xs[i - 1]),
          `xs: ${xs.slice(0, 4).join(',')}...`,
        );
      }

      played.push(exercise.exerciseId);
      await page.getByRole('button', { name: /Next question|Back to the path/ }).click();
    }

    await page.getByRole('heading', { name: 'Your path' }).waitFor();
  }

  const progress = await page.getByLabel(/Your progress/).innerText();
  console.log(`Played ${played.length} exercises. Final progress pill: ${progress.replace(/\n/g, ' ')}`);

  // Derived from the pack, not hard-coded: a content version bump should not
  // need this file edited.
  check(
    `all ${pack.exercises.length} starter exercises played`,
    played.length === pack.exercises.length,
    `played ${played.length} of ${pack.exercises.length}`,
  );
  check(
    'every lesson is marked done',
    (await page.getByText(/Done ·/).count()) === lessons.length,
    `${await page.getByText(/Done ·/).count()} of ${lessons.length}`,
  );

  await page.screenshot({ path: resolve(here, '../../screenshots/viewport/path-complete.png') });
} catch (error) {
  failures.push(`FAIL threw after ${played.length} exercises (${played.at(-1) ?? 'none'}): ${error.message}`);
  await page
    .screenshot({ path: resolve(here, '../../screenshots/play-all-error.png'), fullPage: true })
    .catch(() => {});
} finally {
  await browser.close();
}

console.log(
  failures.length === 0
    ? `All ${played.length} exercises playable, graded and revealed.`
    : `${failures.length} failure(s):\n${failures.join('\n')}`,
);
process.exit(failures.length === 0 ? 0 : 1);
