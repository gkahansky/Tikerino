#!/usr/bin/env node
/**
 * Offline capture and recovery, through the real client.
 *
 * packages/state unit-tests the queue, and the server suite proves a resent
 * answer is idempotent, but nothing drove the two through a browser: the part
 * a learner actually experiences - answer with no signal, get the grade when
 * the signal returns - was only ever checked by hand. This does it against a
 * running client, so the evidence is reproducible.
 *
 *   CLIENT_URL=http://127.0.0.1:4173 npm run test:offline
 *
 * Navigation mirrors tests/a11y/full-loop.mjs so the selectors are the ones
 * the rest of the suite already relies on - including switching out of the
 * narrated default early, so the offline capture is not racing an audio sprite.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:5173';
const shots = process.env.OUT ?? resolve(here, '../../screenshots/viewport');
mkdirSync(shots, { recursive: true });

function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const preinstalled = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return existsSync(preinstalled) ? preinstalled : undefined;
}

const failures = [];
const check = (label, pass, detail = '') => {
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!pass) failures.push(label);
};

const browser = await chromium.launch({ executablePath: resolveChrome() });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (let step = 0; step < 3; step++) {
    const next = page.getByRole('button', { name: /Next|Start learning/ });
    if (await next.isVisible()) await next.click();
  }
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();
  check('onboarding completes and the path renders', true);

  await page.getByRole('button', { name: /^Meet the chart\./ }).click();
  await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor();
  await page.getByRole('button', { name: 'Show me' }).click();

  // Narrated is the default lesson mode and auto-plays a real audio sprite -
  // this test is about the offline queue, not narration, so it switches to
  // text mode rather than waiting on audio timing (which is what
  // full-loop.mjs already exists to verify).
  await page.getByText('Narrated walkthrough').waitFor();
  await page.getByRole('button', { name: 'Switch to text only' }).click();
  await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor();
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.getByText(/Walkthrough . step 1 of/).waitFor();

  for (let guard = 0; guard < 8; guard++) {
    const practise = page.getByRole('button', { name: 'Practise this' });
    if (await practise.isVisible()) {
      await practise.click();
      break;
    }
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await page.getByText(/Question 1 of/).waitFor();
  check('lesson card, guided example and the first exercise are reachable', true);

  // Everything that is not an answer on this screen.
  const CHROME = /^(←|Check|Show a hint|Hint|Skip|Next|Show me|Practise this)/i;
  await context.setOffline(true);

  const buttons = page.locator('button:visible');
  const total = await buttons.count();
  let picked = null;
  for (let i = 0; i < total; i++) {
    const option = buttons.nth(i);
    const label = ((await option.textContent()) ?? '').trim();
    if (label && !CHROME.test(label) && !/XP|◆/.test(label)) {
      await option.click();
      picked = label;
      break;
    }
  }
  check('an answer can be given with no connection', picked !== null, picked ?? 'no option found');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.waitForTimeout(2500);

  const body = await page.locator('body').innerText();
  check(
    'no grade is shown while offline',
    !/^(Correct|Not this time)$/m.test(body),
    'the server is the only place that grades',
  );
  check(
    'the learner is told the answer is queued, not lost',
    /offline/i.test(body) && /queued/i.test(body),
  );
  await page.screenshot({ path: `${shots}/offline-locked.png` });

  await context.setOffline(false);

  // ExerciseScreen has no progress pill on the locked phase; the reveal
  // screen's heading is the signal that the deferred reveal arrived.
  const verdict = page.getByRole('heading', { name: /Correct|Not this time/ });
  await verdict.waitFor({ timeout: 20000 }).catch(() => {});
  check(
    'the deferred reveal arrives once the connection returns',
    (await verdict.count()) > 0,
    'the flush must reach the locked screen, not just the store',
  );
  check('the reveal carries a real exercise score, not a placeholder', (await page.getByText('Exercise score').count()) > 0);
  await page.screenshot({ path: `${shots}/offline-recovered.png` });

  // The Knowledge Index only moves on lesson completion, so it cannot prove a
  // single exercise was credited. localStorage can: the queue this answer sat
  // in must now be empty, and applyConfirmedAnswer's idempotency key recorded.
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('tikerino.progress.v1');
    return raw ? JSON.parse(raw) : null;
  });
  check(
    'the answer captured offline is credited once the queue flushes and leaves the queue',
    stored !== null && stored.pending.length === 0 && stored.confirmed.length === 1,
    `pending=${stored?.pending.length ?? 'n/a'} confirmed=${stored?.confirmed.length ?? 'n/a'}`,
  );
} catch (error) {
  check('the offline run completes', false, error.message);
} finally {
  await browser.close();
}

console.log(
  failures.length
    ? `\n${failures.length} check(s) failed:\n  ${failures.join('\n  ')}`
    : '\nOffline capture and recovery verified end to end.',
);
process.exit(failures.length ? 1 : 0);
