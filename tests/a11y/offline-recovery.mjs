/**
 * Offline capture and recovery, through the real client.
 *
 * packages/state unit-tests the queue, and the server suite proves a resent
 * answer is idempotent, but nothing drove the two through a browser: the part
 * a learner actually experiences - answer with no signal, get the grade when
 * the signal returns - was only ever checked by hand. This does it against a
 * staging origin, so the evidence is reproducible.
 *
 *   CLIENT_URL=http://127.0.0.1:4173 npm run test:offline
 *
 * Navigation mirrors tests/a11y/play-all.mjs so the selectors are the ones the
 * rest of the suite already relies on.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:4173';
const shots = process.env.OUT ?? resolve(here, '../../screenshots/viewport');

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
  for (let i = 0; i < 3; i++) {
    const next = page.getByRole('button', { name: /Next|Start learning/ });
    if (await next.isVisible()) await next.click();
  }
  await page.getByRole('heading', { name: 'Your path' }).waitFor();
  check('onboarding completes and the path renders', true);

  await page.getByRole('button', { name: /Meet the chart/ }).click();
  await page.getByRole('button', { name: 'Show me' }).click();
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

  let body = await page.locator('body').innerText();
  check(
    'no grade is shown while offline',
    !/^(Correct|Not this time)$/m.test(body),
    'the server is the only place that grades',
  );
  check(
    'the learner is told the answer is locked, not lost',
    /offline/i.test(body) && /saved|locked/i.test(body),
  );
  await page.screenshot({ path: `${shots}/offline-locked.png` });

  const xpBefore = await page.getByLabel(/Your progress/).innerText();

  await context.setOffline(false);
  await page.waitForTimeout(5000);

  const xpAfter = await page.getByLabel(/Your progress/).innerText();
  check(
    'the queue flushes when the connection returns',
    xpBefore !== xpAfter,
    `progress pill ${xpBefore.replace(/\n/g, ' ')} -> ${xpAfter.replace(/\n/g, ' ')}`,
  );

  body = await page.locator('body').innerText();
  check(
    'the deferred reveal is shown once the answer is graded',
    /Correct|Not this time/.test(body),
    'README, "The integrity contract": "when the connection returns the queue is flushed and the reveal is shown"',
  );
  await page.screenshot({ path: `${shots}/offline-recovered.png` });
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
