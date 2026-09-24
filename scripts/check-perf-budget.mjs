#!/usr/bin/env node
/**
 * Performance budget for the first load on a mid-range phone on slow 4G.
 *
 * Reads the built client (client/dist) and adds up what index.html makes the
 * browser fetch before the first screen: entry and preloaded scripts,
 * stylesheets and the self-hosted fonts, measured gzipped (fonts as-is, woff2 is
 * already compressed). Fails when any line goes over budget, or when the page
 * pulls anything from a third-party origin on the critical path.
 *
 * Budgets sit a little above the measured size on 24 Sep 2026 after self-hosting fonts (JS 70.4 KB,
 * CSS 4.7 KB, fonts 70.5 KB, total 145.6 KB). Raising one is allowed, but it should be
 * a visible line in a diff with a reason, not drift.
 *
 * Usage: npm run build --workspace @tikerino/client && node scripts/check-perf-budget.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const KB = 1024;
export const BUDGET = {
  js: 80 * KB,
  css: 8 * KB,
  fonts: 80 * KB,
  total: 165 * KB,
};

const dist = resolve(process.argv[2] ?? 'client/dist');
const htmlPath = resolve(dist, 'index.html');
if (!existsSync(htmlPath)) {
  console.error(`No build at ${htmlPath}. Run: npm run build --workspace @tikerino/client`);
  process.exit(1);
}
const html = readFileSync(htmlPath, 'utf8');

const tags = [...html.matchAll(/<(script|link)\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

const critical = { js: [], css: [], fonts: [] };
const thirdParty = [];
for (const tag of tags) {
  const url = attr(tag, 'src') ?? attr(tag, 'href');
  if (!url) continue;
  const rel = attr(tag, 'rel');
  if (/^(https?:)?\/\//.test(url)) {
    if (rel !== 'manifest') thirdParty.push(url);
    continue;
  }
  if (tag.startsWith('<script') && attr(tag, 'type') === 'module') critical.js.push(url);
  else if (rel === 'modulepreload') critical.js.push(url);
  else if (rel === 'stylesheet') critical.css.push(url);
  else if (rel === 'preload' && attr(tag, 'as') === 'font') critical.fonts.push(url);
}
// Fonts are not preloaded, but every @font-face in index.html is fetched
// for the first screen, so they count against the first-load budget.
for (const m of html.matchAll(/url\((\/fonts\/[^)]+)\)/g)) if (!critical.fonts.includes(m[1])) critical.fonts.push(m[1]);

const size = (url, kind) => {
  const bytes = readFileSync(resolve(dist, `.${url}`));
  return kind === 'fonts' ? bytes.length : gzipSync(bytes, { level: 9 }).length;
};

const failures = [];
const totals = {};
for (const kind of ['js', 'css', 'fonts']) {
  totals[kind] = 0;
  for (const url of critical[kind]) {
    const n = size(url, kind);
    totals[kind] += n;
    console.log(`  ${kind.padEnd(5)} ${(n / KB).toFixed(1).padStart(6)} KB  ${url}`);
  }
}
totals.total = totals.js + totals.css + totals.fonts;

for (const kind of ['js', 'css', 'fonts', 'total']) {
  const over = totals[kind] > BUDGET[kind];
  console.log(`${over ? 'FAIL' : 'ok  '} ${kind.padEnd(5)} ${(totals[kind] / KB).toFixed(1)} KB / ${(BUDGET[kind] / KB).toFixed(0)} KB`);
  if (over) failures.push(kind);
}
if (critical.js.length === 0) failures.push('no entry script found');
for (const url of thirdParty) {
  console.log(`FAIL third-party request on the critical path: ${url}`);
  failures.push('third-party');
}

if (failures.length > 0) {
  console.error(`Performance budget failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('Performance budget met.');
