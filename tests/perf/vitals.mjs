#!/usr/bin/env node
/**
 * Field-style web-vitals on the learner loop at phone size on slow 4G.
 *
 * Lighthouse measures a cold load but has no interactions, so it cannot report
 * INP. This drives onboarding -> path -> first lesson -> "Show me" with the
 * web-vitals library listening, under the same network and CPU conditions
 * Lighthouse uses for mobile (150 ms RTT, 1.6 Mbps down, 4x CPU slowdown).
 *
 * Usage: CLIENT_URL=https://tikerino.com node tests/perf/vitals.mjs [runs]
 * Prints one JSON line per run and the median.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:5173';
const RUNS = Number(process.argv[2] ?? 3);
const vitalsSrc = readFileSync(resolve(dirname(require.resolve('web-vitals')), 'web-vitals.iife.js'), 'utf8');

const listen = `
  window.__vitals = {};
  addEventListener('DOMContentLoaded', () => {
    const put = (m) => { window.__vitals[m.name] = m.value; };
    webVitals.onLCP(put, { reportAllChanges: true });
    webVitals.onCLS(put, { reportAllChanges: true });
    webVitals.onINP(put, { reportAllChanges: true });
    webVitals.onFCP(put);
    webVitals.onTTFB(put);
  });
`;

async function run() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0;
  let js = 0;
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
  const types = new Map();
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
  cdp.on('Network.loadingFinished', (e) => { if (types.get(e.requestId) === 'Script') js += e.encodedDataLength; });
  await page.addInitScript({ content: vitalsSrc + listen });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.getByRole('heading').first().waitFor({ timeout: 30000 });
  await page.waitForLoadState('networkidle');
  const loadBytes = { total: bytes, js };
  // Onboarding, then the path, then the first lesson's guided example.
  for (let i = 0; i < 3; i += 1) {
    const next = page.getByRole('button', { name: /Next|Start learning/ });
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(300);
  }
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: /^Meet the chart\./ }).click();
  await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.waitForTimeout(1500);
  const v = await page.evaluate(() => window.__vitals);
  await browser.close();
  return { LCP: Math.round(v.LCP), FCP: Math.round(v.FCP), TTFB: Math.round(v.TTFB), CLS: Number((v.CLS ?? 0).toFixed(3)), INP: Math.round(v.INP ?? 0), loadKB: Math.round(loadBytes.total / 1024), loadJsKB: Math.round(loadBytes.js / 1024) };
}

const results = [];
for (let i = 0; i < RUNS; i += 1) {
  const r = await run();
  console.log(JSON.stringify(r));
  results.push(r);
}
const median = (k) => results.map((r) => r[k]).sort((a, b) => a - b)[Math.floor(results.length / 2)];
console.log('median', JSON.stringify(Object.fromEntries(Object.keys(results[0]).map((k) => [k, median(k)]))));
