#!/usr/bin/env node
/**
 * WCAG 1.4.11 non-text contrast (3:1) for chart marks, measured from the live
 * DOM: each mark's computed colour (with opacity) against the colour actually
 * behind it (ancestor backgrounds composited, over the page base).
 *
 * States: exercise chart before the reveal, pick-the-candle with a candle
 * highlighted and selected (focus ring), the reveal with the correct candle
 * highlighted, and the dark Living Chart path.
 *
 * Writes docs/accessibility/contrast-results.json. Exits 1 if a mark that
 * carries meaning is under 3:1.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:5173';
const chrome = process.env.CHROME_PATH ?? (existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

/** Runs in the page. Returns [{mark, colour, against, ratio}] for each selector. */
function measure(specs) {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
    return [Number(r), Number(g), Number(b), Number(a)];
  };
  const over = (top, under) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
  const hex = (c) => `#${c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const opacityChain = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const behind = (el, base) => {
    const layers = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      if (n instanceof SVGElement) continue;
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg[3] > 0) layers.push(bg);
      if (bg && bg[3] === 1) break;
    }
    return layers.reverse().reduce((acc, l) => over(l, acc), base);
  };
  const out = [];
  for (const spec of specs) {
    const els = [...document.querySelectorAll(spec.sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 || r.height > 0; });
    if (!els.length) { out.push({ mark: spec.mark, missing: true }); continue; }
    const el = els[spec.index ?? 0];
    const s = getComputedStyle(el);
    const raw = parse(spec.prop === 'outline' ? s.outlineColor : spec.prop === 'stroke' ? s.stroke : spec.prop === 'bg' ? s.backgroundColor : spec.prop === 'border' ? s.borderTopColor : s.fill);
    if (!raw) { out.push({ mark: spec.mark, missing: true }); continue; }
    const propOpacity = spec.prop === 'stroke' ? Number(s.strokeOpacity) : spec.prop === 'fill' ? Number(s.fillOpacity) : 1;
    const back = spec.against ? parse(spec.against) : behind(el, parse(spec.base ?? 'rgb(250,250,247)'));
    const colour = over([raw[0], raw[1], raw[2], raw[3] * propOpacity * opacityChain(el)], back);
    out.push({ mark: spec.mark, required: spec.required !== false, colour: hex(colour), against: hex(back), ratio: Math.round(ratio(colour, back) * 100) / 100, note: spec.note ?? '' });
  }
  return out;
}

const svg = 'figure svg[role="img"]';
const chartMarks = (prefix) => [
  { mark: `${prefix}: bullish body border + wick (--data-up)`, sel: `${svg} rect[stroke="var(--data-up)"]`, prop: 'stroke' },
  { mark: `${prefix}: bearish body + wick (--data-down)`, sel: `${svg} rect[fill="var(--data-down)"]`, prop: 'fill' },
  { mark: `${prefix}: unchanged (doji) body (--ink-2)`, sel: `${svg} rect[stroke="var(--ink-2)"]:not([fill="var(--data-volume)"])`, prop: 'stroke' },
  { mark: `${prefix}: volume bar (--data-volume)`, sel: `${svg} rect[fill="var(--data-volume)"]`, prop: 'fill' },
  { mark: `${prefix}: volume bar outline`, sel: `${svg} rect[fill="var(--data-volume)"]`, prop: 'stroke' },
  { mark: `${prefix}: gridline (--data-grid)`, sel: `${svg} line[stroke="var(--data-grid)"]`, prop: 'stroke', required: false, note: 'Decorative: prices are read from candle positions and the text list; no gridline value is needed to answer.' },
];


/** Sample real rendered pixels: mark vs its surroundings. For gradient and translucent (dark path) surfaces. */
async function pixelPairs(page, state, specs) {
  const colours = [];
  for (const sp of specs) {
    const pt = await page.evaluate(({ sel, markAt }) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0);
      if (!el) return null;
      el.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -120);
      const r = el.getBoundingClientRect();
      const at = { centre: [r.left + r.width / 2, r.top + r.height / 2], border: [r.left + 1, r.top + r.height / 2] }[markAt];
      return { mark: at, bg: [r.left - 4, r.top + r.height / 2] };
    }, { sel: sp.sel, markAt: sp.markAt });
    if (!pt) { colours.push(null); continue; }
    const shot = (await page.screenshot({ scale: 'css' })).toString('base64');
    colours.push(await page.evaluate(async ({ shot, p }) => {
      const img = new Image(); img.src = `data:image/png;base64,${shot}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const px = ([x, y]) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3);
      return { mark: px(p.mark), bg: px(p.bg) };
    }, { shot, p: pt }));
  }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const hex = (c) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  specs.forEach((sp, i) => {
    const c = colours[i];
    if (!c) { rows.push({ state, mark: sp.mark, missing: true }); return; }
    const [a, b] = [lum(c.mark), lum(c.bg)].sort((x, y) => y - x);
    rows.push({ state, mark: sp.mark, required: sp.required !== false, colour: hex(c.mark), against: hex(c.bg), ratio: Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100, note: `${sp.note ?? ''} (sampled pixels)`.trim() });
  });
}

const browser = await chromium.launch({ executablePath: chrome });
const rows = [];
const add = (state, list) => list.forEach((r) => rows.push({ state, ...r }));
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    if (localStorage.getItem('tikerino.progress.v1')) return;
    localStorage.setItem('tikerino.subjectId.v1', 'contrast-subject');
    localStorage.setItem('tikerino.progress.v1', JSON.stringify({ version: 1, subjectId: 'contrast-subject', onboardingComplete: true, lessonMode: 'text', totalXp: 20, streak: { current: 1, longest: 1, lastActiveDay: new Date().toLocaleDateString('en-CA') }, practiceDays: [new Date().toLocaleDateString('en-CA')], lessons: { 'lesson-0-meet-the-chart': { completedExerciseIds: ['ex-001', 'ex-002'], completed: true, crownLevel: 1, xpEarned: 20 } }, answers: {}, pending: [] }));
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();

  await pixelPairs(page, 'Living Chart path (dark)', [
    { mark: 'path: open lesson candle outline (#7bcab2)', sel: '.lesson-candle.is-forming .candle-mark i', markAt: 'border', required: false, note: 'Decorative (aria-hidden); state is in visible text (LIVE · forming).' },
    { mark: 'path: completed candle body (#4ba98c)', sel: '.is-complete .candle-mark i', markAt: 'centre', required: false, note: 'Decorative; "Complete" is visible text.' },
    { mark: 'path: locked candle mark (#75908b)', sel: '.is-locked .candle-mark i', markAt: 'centre', required: false, note: 'Decorative; "locked" is visible text.' },
    { mark: 'path: forming lesson border (#5ce1b5)', sel: '.lesson-candle.is-forming', markAt: 'border', note: 'Marks the one lesson to continue.' },
    { mark: 'path: persistence bar, active day (#4ba98c)', sel: '.volume-bars i.is-active', markAt: 'centre', required: false, note: 'aria-hidden; "Day N" is visible text.' },
    { mark: 'path: persistence bar, inactive day', sel: '.volume-bars i:not(.is-active)', markAt: 'centre', required: false, note: 'aria-hidden; the day count is visible text.' },
  ]);

  const practise = async () => {
    await page.getByRole('button', { name: 'Show me' }).click();
    for (let g = 0; g < 8; g++) {
      const p = page.getByRole('button', { name: 'Practise this' });
      if (await p.isVisible()) { await p.click(); break; }
      await page.getByRole('button', { name: 'Next' }).click();
    }
  };
  await page.getByRole('button', { name: /^Meet the chart\./ }).click();
  await practise();
  await page.getByText(/Question 1 of/).waitFor();
  await page.waitForSelector(svg);
  add('Exercise chart, before reveal', await page.evaluate(measure, [
    ...chartMarks('exercise'),
  ]));
  await page.getByRole('button', { name: /Time, from oldest on the left/ }).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  add('Exercise, keyboard focus', await page.evaluate(measure, [
    { mark: 'focus ring on an answer (--focus-ring, 3px) vs paper', sel: ':focus-visible', prop: 'outline', against: 'rgb(250,250,247)' },
    { mark: 'focus ring vs white card', sel: ':focus-visible', prop: 'outline', against: 'rgb(255,255,255)' },
  ]));
  await page.getByRole('button', { name: /Time, from oldest on the left/ }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  await page.waitForTimeout(600);
  add('Reveal chart', await page.evaluate(measure, [
    ...chartMarks('reveal'),
    { mark: 'reveal: cut-point line (--ink-2, dashed)', sel: `${svg} line[stroke="var(--ink-2)"][stroke-dasharray]`, prop: 'stroke' },
  ]));
  await page.getByRole('button', { name: /Next question/ }).click();
  await page.getByText(/Question 2 of/).waitFor();
  await page.getByRole('button', { name: /The most recent price paid/ }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: /Back to the path/ }).click();
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();

  await page.getByRole('button', { name: /^Price moves and percent change\./ }).click();
  await practise();
  await page.getByText(/Question 1 of/).waitFor();
  await page.getByRole('button', { name: /\+10%/ }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  await page.getByRole('button', { name: /Next question/ }).click();
  await page.getByText(/Question 2 of/).waitFor();
  const targets = page.getByRole('group', { name: 'Pick a candle' }).getByRole('button');
  await targets.first().focus();
  await page.keyboard.press('ArrowRight');
  add('Pick the candle, keyboard focus', await page.evaluate(measure, [
    { mark: 'pick: focused candle target outline (--focus-ring, 3px)', sel: ':focus-visible', prop: 'outline', against: 'rgb(255,255,255)' },
  ]));
  await page.keyboard.press('Enter');
  add('Pick the candle, selected', await page.evaluate(measure, [
    { mark: 'pick: selected candle ring (--focus-ring, 3px)', sel: `${svg} rect[stroke="var(--focus-ring)"]`, prop: 'stroke' },
    ...chartMarks('pick'),
  ]));
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  await page.waitForTimeout(600);
  add('Pick the candle, reveal', await page.evaluate(measure, [
    { mark: 'pick reveal: correct-candle ring (--brand-strong on --brand-soft)', sel: `${svg} rect[stroke="var(--brand-strong)"]`, prop: 'stroke', against: 'rgb(231,248,241)' },
    { mark: 'pick reveal: correct-candle surface vs card (--brand-soft)', sel: `${svg} rect[stroke="var(--brand-strong)"]`, prop: 'fill', required: false, note: 'The 3px --brand-strong ring is the boundary that carries the meaning; the mint fill is decoration.' },
  ]));
  await ctx.close();
} finally {
  await browser.close();
}
// A volume bar's edge is its outline when one is drawn: then the fill is not the boundary.
for (const r of rows) {
  if (!/volume bar \(--data-volume\)/.test(r.mark) || r.missing) continue;
  const outline = rows.find((o) => o.state === r.state && /volume bar outline/.test(o.mark) && !o.missing);
  if (outline && outline.ratio >= 3) { r.required = false; r.note = `Fill only; the bar's boundary is the ${outline.ratio}:1 outline.`; }
}
const measured = rows.filter((r) => !r.missing);
const fails = measured.filter((r) => r.required && r.ratio < 3);
writeFileSync(resolve(here, '../../docs/accessibility/contrast-results.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, threshold: 3, rows }, null, 2)}\n`);
for (const r of rows) console.log(r.missing ? `-    ${r.state} | ${r.mark} | not present` : `${r.required && r.ratio < 3 ? 'FAIL' : r.ratio < 3 ? 'info' : 'ok  '} ${r.ratio.toFixed(2)} ${r.colour} on ${r.against} | ${r.state} | ${r.mark}`);
process.exit(fails.length ? 1 : 0);
