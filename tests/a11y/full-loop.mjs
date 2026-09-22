#!/usr/bin/env node
/**
 * Drive the whole day-one loop in a real browser at phone size, and run axe on
 * the exercise and reveal screens.
 *
 * Definition of done: onboarding -> path -> lesson -> guided example -> exercise
 * on a chart cut at T -> submit -> grading, XP, reveal, disclaimer -> back to the
 * path with XP and streak updated, with zero critical/serious axe findings.
 *
 * Expects the server (8787) and the client dev server (5173) to be running.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const shots = resolve(here, '../../screenshots');
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:5173';

mkdirSync(shots, { recursive: true });

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

const failures = [];
const notes = [];

function check(label, condition, detail = '') {
  if (condition) {
    notes.push(`ok   ${label}`);
  } else {
    failures.push(`FAIL ${label} ${detail}`);
    notes.push(`FAIL ${label} ${detail}`);
  }
}

async function axeScan(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const serious = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  check(
    `axe ${label}: no critical or serious violations`,
    serious.length === 0,
    serious.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes)`).join('; '),
  );

  const minor = results.violations.filter((v) => !['critical', 'serious'].includes(v.impact));
  if (minor.length > 0) {
    notes.push(`     (${label} minor/moderate: ${minor.map((v) => v.id).join(', ')})`);
  }
  return results;
}

const browser = await chromium.launch({ executablePath: resolveChrome() });

// Probe real audio playback: capture every Audio element and the fate of
// every play() promise, so the narration checks below can tell real chained
// playback apart from the silent estimated-timing fallback.
async function instrumentAudio(context) {
  await context.addInitScript(() => {
    window.__audioPlays = [];
    window.__audios = [];
    const OrigAudio = window.Audio;
    window.Audio = function instrumentedAudio(...args) {
      const a = new OrigAudio(...args);
      window.__audios.push(a);
      const origPlay = a.play.bind(a);
      a.play = () =>
        origPlay()
          .then((r) => {
            window.__audioPlays.push('resolved');
            return r;
          })
          .catch((e) => {
            window.__audioPlays.push(`rejected:${e && e.name}`);
            throw e;
          });
      return a;
    };
  });
}
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone-ish
  deviceScaleFactor: 2,
});
await instrumentAudio(context);
const page = await context.newPage();

page.on('pageerror', (error) => failures.push(`FAIL page error: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') notes.push(`     console error: ${message.text()}`);
});

try {
  /* ---------------------------------------------------------------- 1. onboarding */
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('onboarding renders', await page.getByRole('heading').first().isVisible());
  await page.screenshot({ path: `${shots}/1-onboarding.png` });
  await axeScan(page, 'onboarding');

  // The walkthrough explains what the app DOES. The legal text (generated
  // data, no advice) moved to Terms of use and Privacy - checked in section 10.
  let sawLearnLoop = false;
  let sawStreaks = false;
  let legalInWalkthrough = false;
  for (let step = 0; step < 3; step++) {
    const text = await page.locator('body').innerText();
    if (text.includes('You call what the chart') && text.includes('XP broken down')) {
      sawLearnLoop = true;
    }
    if (text.includes('grows your streak') && text.includes('unlock the next')) {
      sawStreaks = true;
    }
    if (text.includes('made up') || text.includes('Nothing here is advice')) {
      legalInWalkthrough = true;
    }
    const next = page.getByRole('button', { name: /Next|Start learning/ });
    if (await next.isVisible()) await next.click();
  }
  check('walkthrough explains the learn loop', sawLearnLoop);
  check('walkthrough explains streaks and progression', sawStreaks);
  check('walkthrough carries no legal disclaimers', !legalInWalkthrough);

  /* ---------------------------------------------------------------- 2. path home */
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();
  check('path home lists both topics', (await page.getByRole('button', { name: /Open lesson|unlock/ }).count()) === 9);
  check(
    'later lessons start locked',
    (await page.getByRole('button', { name: /Finish the previous lesson to unlock/ }).count()) > 0,
  );
  await page.screenshot({ path: `${shots}/2-path-home.png`, fullPage: true });
  await axeScan(page, 'path home');

  const startingXp = await page.locator('.journey-index').innerText();

  /* ---------------------------------------------------------------- 3. lesson card */
  await page.getByRole('button', { name: /^Meet the chart\./ }).click();
  await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor();
  check('principle card shows its chart', (await page.locator('svg[role="img"]').count()) > 0);
  check(
    'no practice-data caption chip takes chart real estate (Terms carries it)',
    (await page.getByText('Practice chart - generated data, not a real stock.').count()) === 0,
  );
  await page.screenshot({ path: `${shots}/3-lesson-card.png`, fullPage: true });
  await axeScan(page, 'lesson card');

  /* ---------------------------------------------------------------- 4. guided example */
  await page.getByRole('button', { name: 'Show me' }).click();
  // Narrated is the default mode: the walkthrough auto-plays for a user who
  // never picked a mode.
  await page.getByText('Narrated walkthrough').waitFor();
  check('narrated is the default lesson mode (auto-plays)', true);
  // The whole walkthrough chains off ONE audio sprite: every segment must
  // advance with REAL playback, no rejections. Per-segment src swaps broke
  // this on iOS (Guy, 13 Sep: only the intro voiced, the rest silent text).
  // 8x speed so the test does not sit through the 32s sprite.
  await page.evaluate(() => {
    for (const a of window.__audios ?? []) a.playbackRate = 8;
  });
  await page.getByRole('button', { name: 'Practise this' }).waitFor({ timeout: 30000 });
  const plays = await page.evaluate(() => window.__audioPlays ?? []);
  check(
    'narration chains all segments with real playback (no rejected plays)',
    plays.length > 0 && plays.every((p) => p === 'resolved'),
    JSON.stringify(plays),
  );
  check('narrated walkthrough completes to the practise prompt', true);
  // Restart the narration so the switch below happens mid-intro again.
  await page.getByRole('button', { name: 'Watch again' }).click();
  await page.getByRole('button', { name: 'Switch to text only' }).waitFor();
  // Switching during the intro lands on the equivalent position - the
  // principle card - then the manual step-through drives as before.
  await page.getByRole('button', { name: 'Switch to text only' }).click();
  await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor();
  check('switching to text mid-intro lands on the principle card', true);
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.getByText(/Walkthrough . step 1 of/).waitFor();
  check('guided example steps through', true);
  await page.screenshot({ path: `${shots}/4-guided-example.png`, fullPage: true });

  for (let guard = 0; guard < 6; guard++) {
    const practise = page.getByRole('button', { name: 'Practise this' });
    if (await practise.isVisible()) {
      await practise.click();
      break;
    }
    await page.getByRole('button', { name: 'Next' }).click();
  }

  /* ---------------------------------------------------------------- 5. exercise */
  await page.getByText(/Question 1 of/).waitFor();
  await page.waitForSelector('svg[role="img"]');

  const windowResponse = await page.evaluate(async () => {
    const response = await fetch('/api/exercises/ex-001/window');
    return response.json();
  });
  check(
    'window endpoint serves exactly windowSize candles',
    windowResponse.chart.candles.length === 12,
    `got ${windowResponse.chart.candles.length}`,
  );
  check(
    'window endpoint leaks no post-T candle',
    windowResponse.chart.candles.every((c) => c.i <= 11),
  );
  check(
    'window endpoint ships no answer',
    !JSON.stringify(windowResponse).includes('correctOptionId'),
  );

  check('exercise shows the prompt', (await page.getByRole('heading', { level: 1 }).count()) === 1);
  check('hint is offered', await page.getByRole('button', { name: /Show a hint/ }).isVisible());
  check(
    'check button is disabled until an answer is picked',
    await page.getByRole('button', { name: 'Check' }).isDisabled(),
  );

  // Touch targets: everything interactive must be at least 48x48.
  const smallTargets = await page.evaluate(() => {
    const tooSmall = [];
    for (const element of document.querySelectorAll('button, a, summary, [tabindex="0"]')) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.height < 48 || rect.width < 48) {
        tooSmall.push(
          `${element.tagName}.${element.className}: ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        );
      }
    }
    return tooSmall;
  });
  check('every touch target is at least 48x48', smallTargets.length === 0, smallTargets.join(' | '));

  // Font sizes: nothing under 16px.
  const smallText = await page.evaluate(() => {
    const small = [];
    for (const element of document.querySelectorAll('body *')) {
      if (element.children.length > 0) continue;
      const text = element.textContent?.trim();
      if (!text) continue;
      const size = Number.parseFloat(getComputedStyle(element).fontSize);
      if (size < 16) small.push(`${element.tagName} "${text.slice(0, 20)}": ${size}px`);
    }
    return small;
  });
  check('no text under 16px', smallText.length === 0, smallText.join(' | '));

  await page.screenshot({ path: `${shots}/5-exercise.png`, fullPage: true });
  await axeScan(page, 'exercise');

  // Keyboard: tab to the first answer and choose it with the keyboard alone.
  await page.getByRole('button', { name: /Time, from oldest on the left/ }).focus();
  await page.keyboard.press('Enter');
  check(
    'an option can be chosen by keyboard',
    (await page.getByRole('button', { name: /Time, from oldest/ }).getAttribute('aria-pressed')) ===
      'true',
  );

  /* ---------------------------------------------------------------- 6. reveal */
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();

  const revealText = await page.locator('body').innerText();
  check('reveal carries no legal text (Terms/Privacy are the only home for it)', !revealText.includes('Nothing here is investment advice.') && !revealText.includes('generated practice data'));
  check('reveal shows an XP breakdown', revealText.includes('Base') && revealText.includes('Total'));
  check('reveal shows what happened next', revealText.includes('What happened next'));

  const revealedCandles = await page.evaluate(
    () => document.querySelectorAll('.reveal-candle').length,
  );
  check('post-T candles are revealed', revealedCandles === 6, `saw ${revealedCandles}`);

  await page.screenshot({ path: `${shots}/6-reveal.png`, fullPage: true });
  await axeScan(page, 'reveal');

  /* ---------------------------------------------------------------- 7. second question: pick the candle */
  await page.getByRole('button', { name: /Next question/ }).click();
  await page.getByText(/Question 2 of/).waitFor();
  await page.screenshot({ path: `${shots}/7-exercise-2.png`, fullPage: true });

  const pickButtons = await page.getByRole('button', { name: /^Select candle/ }).count();
  notes.push(`     text-list select buttons on question 2: ${pickButtons}`);

  const options = await page.getByRole('button', { name: /The most recent price paid/ }).count();
  if (options > 0) {
    await page.getByRole('button', { name: /The most recent price paid/ }).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
    await page.getByRole('button', { name: /Back to the path|Next question/ }).click();
  }

  /* ---------------------------------------------------------------- 8. back to the path */
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();
  const endingXp = await page.locator('.journey-index').innerText();
  check('lesson completion awards canonical +25 once', endingXp === '25 XP', `${startingXp} -> ${endingXp}`);
  notes.push(`     progress pill: ${startingXp.replace(/\n/g, ' ')} -> ${endingXp.replace(/\n/g, ' ')}`);
  await page.screenshot({ path: `${shots}/8-path-after.png`, fullPage: true });

  /* ---------------------------------------------------------------- 9. profile */
  await page.getByLabel(/Your progress/).click();
  await page.getByRole('heading', { name: 'Your progress' }).waitFor();
  await page.screenshot({ path: `${shots}/9-profile.png`, fullPage: true });
  await axeScan(page, 'profile');
  check('profile separates Knowledge Index from legacy exercise XP', (await page.getByText('Knowledge Index').count()) > 0 && (await page.getByText('Exercise XP (legacy)').count()) > 0);

  /* ---------------------------------------------------------------- 9b. legal pages */
  await page.getByRole('button', { name: 'Terms of use' }).click();
  await page.getByRole('heading', { name: 'Terms of use', exact: true }).waitFor();
  const termsText = await page.locator('body').innerText();
  check(
    'terms of use carries the no-advice disclaimer',
    termsText.includes('Nothing here is advice') && termsText.includes('investment advice'),
  );
  await page.screenshot({ path: `${shots}/10-terms.png`, fullPage: true });
  await axeScan(page, 'terms of use');

  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Privacy' }).click();
  await page.getByRole('heading', { name: 'Privacy policy' }).waitFor();
  const privacyText = await page.locator('body').innerText();
  check(
    'privacy policy carries the generated-data disclaimer',
    privacyText.includes('Every chart here is made up'),
  );
  await page.screenshot({ path: `${shots}/11-privacy.png`, fullPage: true });
  await axeScan(page, 'privacy policy');

  // Back to the profile, where the next section picks up the flow.
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('heading', { name: 'Your progress' }).waitFor();

  /* ---------------------------------------------------------------- 10. pick-the-candle, by keyboard */
  await page.getByRole('button', { name: /Back|Path/ }).first().click();
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();

  // Lesson 0 is done, so lesson 1 (which holds the first pick-the-candle) is open.
  await page.getByRole('button', { name: /^Price moves and percent change\./ }).click();
  await page.getByRole('button', { name: 'Show me' }).click();
  for (let guard = 0; guard < 6; guard++) {
    const practise = page.getByRole('button', { name: 'Practise this' });
    if (await practise.isVisible()) {
      await practise.click();
      break;
    }
    await page.getByRole('button', { name: 'Next' }).click();
  }

  // ex-003 is multiple choice; answer it to reach ex-004, the pick-the-candle.
  await page.getByText(/Question 1 of/).waitFor();
  await page.getByRole('button', { name: /\+10%/ }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: /Next question/ }).click();

  await page.getByText(/Question 2 of/).waitFor();
  await page.waitForSelector('svg[role="img"]');
  check(
    'pick-the-candle asks for a candle',
    (await page.getByRole('heading', { level: 1 }).innerText()).toLowerCase().includes('candle'),
  );

  // The text alternative sits behind a disclosure; open it the way a reader would.
  await page.locator('details > summary').first().click();
  const selectButtons = await page.getByRole('button', { name: /^Select candle/ }).count();
  check(
    'every candle is selectable from the text list too',
    selectButtons === 12,
    `saw ${selectButtons}`,
  );

  const firstDescription = await page.locator('details ol li').first().innerText();
  check(
    'the text list describes each candle in words',
    /Candle 1 of 12/.test(firstDescription) &&
      /(Bullish|Bearish|Unchanged)/.test(firstDescription) &&
      /Volume/.test(firstDescription),
    firstDescription.slice(0, 80),
  );

  // Arrow keys + Enter must play it, with no pointer at all.
  const candleTargets = page.getByRole('group', { name: 'Pick a candle' }).getByRole('button');
  await candleTargets.first().focus();
  for (let step = 0; step < 6; step++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');

  const pressedByKeyboard = await page
    .getByRole('group', { name: 'Pick a candle' })
    .getByRole('button', { pressed: true })
    .count();
  check('a candle can be chosen with arrow keys and Enter', pressedByKeyboard === 1);

  const keyboardLabel = await page
    .getByRole('group', { name: 'Pick a candle' })
    .getByRole('button', { pressed: true })
    .getAttribute('aria-label');
  check(
    'the focused candle announces itself as a described candle',
    (keyboardLabel ?? '').startsWith('Candle 7 of 12'),
    keyboardLabel ?? 'no label',
  );

  await page.screenshot({ path: `${shots}/10-pick-the-candle.png`, fullPage: true });
  await axeScan(page, 'pick the candle');

  // The text list is an equal input: selecting there moves the same selection.
  await page.getByRole('button', { name: 'Select candle 3' }).click();
  const afterListPick = await page
    .getByRole('group', { name: 'Pick a candle' })
    .getByRole('button', { pressed: true })
    .getAttribute('aria-label');
  check(
    'the text list and the chart drive the same selection',
    (afterListPick ?? '').startsWith('Candle 3 of 12'),
    afterListPick ?? 'no label',
  );

  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  check(
    'a pick-the-candle answer is graded and revealed',
    (await page.locator('body').innerText()).includes('What happened next'),
  );
  await page.screenshot({ path: `${shots}/11-pick-reveal.png`, fullPage: true });
  await axeScan(page, 'pick the candle reveal');
} catch (error) {
  failures.push(`FAIL threw: ${error.message}`);
  await page.screenshot({ path: `${shots}/error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log(notes.join('\n'));
console.log(
  failures.length === 0
    ? '\nFull loop passed, axe clean on every screen.'
    : `\n${failures.length} failure(s):\n${failures.join('\n')}`,
);
process.exit(failures.length === 0 ? 0 : 1);
