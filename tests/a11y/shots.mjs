#!/usr/bin/env node
/** Viewport-sized screenshots of each screen, for eyeballing the real phone layout. */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const shots = resolve(here, '../../screenshots/viewport');
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

mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: resolveChrome() });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: 'networkidle' });
for (let i = 0; i < 3; i++) {
  const next = page.getByRole('button', { name: /Next|Start learning/ });
  if (await next.isVisible()) await next.click();
}
await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();
await page.screenshot({ path: `${shots}/path.png` });

await page.getByRole('button', { name: /^Meet the chart\./ }).click();
await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor();
await page.screenshot({ path: `${shots}/lesson-card.png` });

await page.getByRole('button', { name: 'Show me' }).click();
const textOnly = page.getByRole('button', { name: 'Switch to text only' });
await textOnly.waitFor({ state: 'visible', timeout: 2_000 }).catch(() => {});
if (await textOnly.isVisible()) {
  await textOnly.click();
  await page.getByRole('button', { name: 'Show me' }).click();
}
await page.getByText(/Walkthrough/).waitFor();
await page.screenshot({ path: `${shots}/guided.png` });

for (let guard = 0; guard < 6; guard++) {
  const practise = page.getByRole('button', { name: 'Practise this' });
  if (await practise.isVisible()) {
    await practise.click();
    break;
  }
  await page.getByRole('button', { name: 'Next' }).click();
}
await page.getByText(/Question 1 of/).waitFor();
await page.waitForSelector('svg[role="img"]');
await page.screenshot({ path: `${shots}/exercise-mc.png` });

await page.getByRole('button', { name: /Time, from oldest/ }).click();
await page.getByRole('button', { name: 'Check' }).click();
await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
await page.waitForTimeout(600);
await page.screenshot({ path: `${shots}/reveal.png` });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.screenshot({ path: `${shots}/reveal-bottom.png` });

await browser.close();
console.log('viewport screenshots written');
