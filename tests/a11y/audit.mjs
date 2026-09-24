#!/usr/bin/env node
/**
 * Accessibility release-bar audit (docs/accessibility/RELEASE_BAR.md).
 *
 * Walks every live learner screen and state at 390px and, per screen, checks:
 *   axe      axe-core with WCAG 2.0/2.1/2.2 A+AA tags, zero critical/serious
 *   focus    after a screen change, focus lands on the new screen (not <body>)
 *   keyboard every visible control is reachable with Tab, focus is visible and
 *            not hidden under sticky/fixed UI
 *   labels   every control and image has an accessible name (Chrome AX tree)
 *   order    AX reading order matches visual top-to-bottom order
 *   contrast axe color-contrast finds nothing
 *   motion   with prefers-reduced-motion: reduce, no animation is running
 *   reflow320 at 320 CSS px nothing scrolls sideways (1.4.10)
 *   text200  with text at 200% every text run scales and nothing is lost (1.4.4)
 *   chart    every chart has a text name and a text route to its data
 *
 * Writes docs/accessibility/audit-results.json and one AX-tree transcript per
 * screen to docs/accessibility/transcripts/. The transcripts are what a screen
 * reader is given (role, name, state, in reading order). They are not VoiceOver
 * or TalkBack recordings.
 *
 * Expects the server (8787) and the client dev server (5173) to be running.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../docs/accessibility');
const transcriptDir = resolve(outDir, 'transcripts');
const BASE = process.env.CLIENT_URL ?? 'http://127.0.0.1:5173';
mkdirSync(transcriptDir, { recursive: true });

function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const preinstalled = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return existsSync(preinstalled) ? preinstalled : undefined;
}

const rows = [];

async function axTranscript(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const root = nodes.find((n) => !n.parentId) ?? nodes[0];
  const lines = [];
  const skip = new Set(['none', 'generic', 'InlineTextBox', 'LineBreak', 'RootWebArea']);
  const walk = (node, depth) => {
    if (!node) return;
    const role = node.role?.value ?? '';
    const name = (node.name?.value ?? '').replace(/\s+/g, ' ').trim();
    const ignored = node.ignored;
    let next = depth;
    if (!ignored && !skip.has(role) && !(role === 'StaticText' && lines.at(-1)?.endsWith(`"${name}"`))) {
      const states = (node.properties ?? [])
        .filter((p) => ['pressed', 'checked', 'expanded', 'disabled', 'level', 'selected', 'invalid'].includes(p.name) && p.value?.value !== false && p.value?.value !== 'false')
        .map((p) => `${p.name}=${p.value?.value}`);
      if (role === 'StaticText') lines.push(`${'  '.repeat(depth)}"${name}"`);
      else lines.push(`${'  '.repeat(depth)}${role}${name ? ` "${name}"` : ''}${states.length ? ` [${states.join(', ')}]` : ''}`);
      next = depth + 1;
    }
    for (const id of node.childIds ?? []) walk(byId.get(id), next);
  };
  walk(root, 0);
  return lines;
}

async function keyboardCheck(page) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const focusables = await page.evaluate(() => {
    const sel = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll(sel)].filter((el) => {
      if (el.disabled || el.closest('[inert],[aria-hidden="true"]')) return false;
      if (el.tabIndex < 0) return false; // roving tabindex: reached with arrow keys (full-loop proves arrows + Enter)
      const closed = el.closest('details:not([open])');
      if (closed && !el.closest('summary')) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden';
    });
    els.forEach((el, i) => el.setAttribute('data-a11y-k', String(i)));
    return els.length;
  });
  const visited = new Set();
  const problems = [];
  for (let i = 0; i < focusables + 3; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const k = el.getAttribute('data-a11y-k');
      const s = getComputedStyle(el);
      const visible = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      const r = el.getBoundingClientRect();
      // 2.4.11: fail only when the focused control is entirely hidden.
      const pts = [[0.5, 0.5], [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].map(([fx, fy]) => [r.left + r.width * fx, r.top + r.height * fy]);
      let hit = null;
      const covered = pts.map(([x, y]) => {
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return true;
        const h = document.elementFromPoint(x, y);
        if (h && h !== el && !el.contains(h) && !h.contains(el)) { hit = h; return true; }
        return false;
      });
      const obscured = covered.every(Boolean) && !!hit;
      const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 50);
      return { k, visible, obscured, label, by: obscured ? (hit.className || hit.tagName).toString().slice(0, 40) : '' };
    });
    if (!info) continue;
    if (info.k !== null) visited.add(info.k);
    if (!info.visible) problems.push(`no visible focus: ${info.label}`);
    if (info.obscured) problems.push(`focus hidden under ${info.by}: ${info.label}`);
  }
  const missing = focusables - visited.size;
  if (missing > 0) problems.push(`${missing} of ${focusables} controls never reached by Tab`);
  return { pass: problems.length === 0, detail: [...new Set(problems)].join('; ') || `${focusables} controls reached` };
}

async function labelsCheck(page) {
  const unnamed = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[role="img"],img,svg:not([aria-hidden="true"])')) {
      if (el.closest('[aria-hidden="true"]')) continue;
      if (el.tagName.toLowerCase() === 'svg' && !el.getAttribute('role')) {
        const r = el.getBoundingClientRect();
        if (r.width < 40) continue; // icon inside a named control
        bad.push('svg without role/name'); continue;
      }
      const name = el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title')
        || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) || el.textContent;
      if (!name || !name.trim()) bad.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 50));
    }
    return bad;
  });
  return { pass: unnamed.length === 0, detail: unnamed.join('; ') || 'all named' };
}

async function orderCheck(page) {
  const inversions = await page.evaluate(() => {
    const els = [...document.querySelectorAll('h1,h2,h3,p,button,a[href],li,dt,dd,label,[role="img"]')].filter((el) => {
      const r = el.getBoundingClientRect();
      let n = el; while (n && n !== document.body) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return false; n = n.parentElement; }
      if (r.width <= 2 || r.height <= 2) return false; // visually hidden (sr-only) text
      const closed = el.closest('details:not([open])');
      if (closed && !el.closest('summary')) return false; // collapsed disclosure content
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'absolute' || getComputedStyle(el).position === 'absolute') return false; // chart overlays
      return !el.closest('[aria-hidden="true"],svg');
    });
    const bad = [];
    for (let i = 1; i < els.length; i++) {
      const a = els[i - 1].getBoundingClientRect(); const b = els[i].getBoundingClientRect();
      if (els[i - 1].contains(els[i]) || els[i].contains(els[i - 1])) continue;
      if (b.bottom + scrollY < a.top + scrollY - 4) bad.push(`${(els[i].textContent || '').trim().slice(0, 30)} renders above ${(els[i - 1].textContent || '').trim().slice(0, 30)}`);
    }
    return bad;
  });
  return { pass: inversions.length === 0, detail: inversions.slice(0, 4).join('; ') || 'DOM order = visual order' };
}

async function motionCheck(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(400);
  const running = await page.evaluate(() => document.getAnimations()
    .filter((a) => a.playState === 'running' && Number(a.effect?.getComputedTiming?.().duration ?? 0) > 50)
    .map((a) => a.animationName || a.transitionProperty || 'animation'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { pass: running.length === 0, detail: running.join(', ') || 'no running animation' };
}

async function overflowAt(page) {
  return page.evaluate(() => {
    const over = document.documentElement.scrollWidth - innerWidth;
    const wide = over > 1 ? [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('svg')).slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`) : [];
    const clipped = [...document.querySelectorAll('h1,h2,h3,p,button,li,span,dd,strong,small')].filter((el) => {
      const st = getComputedStyle(el); const rect = el.getBoundingClientRect();
      return rect.width > 2 && (st.overflow === 'hidden' || st.textOverflow === 'ellipsis') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    }).map((el) => (el.textContent || '').trim().slice(0, 30));
    return { over, wide, clipped };
  });
}

/** 1.4.10 Reflow: at 320 CSS px (400% of 1280) nothing scrolls sideways. */
async function reflowCheck(page) {
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 320, height: vp.height });
  await page.waitForTimeout(200);
  const r = await overflowAt(page);
  await page.setViewportSize(vp);
  await page.waitForTimeout(150);
  const problems = [];
  if (r.over > 1) problems.push(`scrolls sideways by ${r.over}px (${r.wide.join(', ')})`);
  if (r.clipped.length) problems.push(`clipped: ${r.clipped.slice(0, 3).join(' | ')}`);
  return { pass: problems.length === 0, detail: problems.join('; ') || 'reflows at 320px' };
}

/** 1.4.4 Resize text: browser text size 200% at 390px, all text scales and nothing is lost. */
async function text200Check(page) {
  const r = await page.evaluate(async () => {
    const sample = () => [...document.querySelectorAll('h1,h2,p,button,strong,small,span,li')].filter((el) => el.getBoundingClientRect().width > 2 && el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && /\p{L}|\d/u.test(n.textContent))).map((el) => [el, parseFloat(getComputedStyle(el).fontSize)]);
    const before = sample();
    document.documentElement.style.fontSize = '200%';
    await new Promise((res) => setTimeout(res, 200));
    const fixed = before.filter(([el, px]) => parseFloat(getComputedStyle(el).fontSize) < px * 1.5).map(([el]) => (el.textContent || '').trim().slice(0, 24));
    return { fixed: [...new Set(fixed)], n: before.length };
  });
  const o = await overflowAt(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  const problems = [];
  if (r.fixed.length) problems.push(`${r.fixed.length}/${r.n} text runs ignore text size (px fonts): ${r.fixed.slice(0, 3).join(' | ')}`);
  if (o.over > 1) problems.push(`scrolls sideways by ${o.over}px (${o.wide.join(', ')})`);
  if (o.clipped.length) problems.push(`clipped: ${o.clipped.slice(0, 3).join(' | ')}`);
  return { pass: problems.length === 0, detail: problems.join('; ') || 'all text scales, no loss' };
}

async function chartCheck(page) {
  const r = await page.evaluate(() => {
    const charts = [...document.querySelectorAll('svg[role="img"], svg.candle-chart, figure svg')].filter((s) => s.getBoundingClientRect().width > 100);
    if (!charts.length) return null;
    const named = charts.filter((s) => (s.getAttribute('aria-label') || '').trim().length > 10 || s.getAttribute('aria-labelledby') || s.querySelector('title,desc'));
    const route = !!document.querySelector('details, table, [aria-controls]') || /as text/i.test(document.body.innerText);
    return { n: charts.length, named: named.length, route };
  });
  if (!r) return { pass: null, detail: 'no chart' };
  const pass = r.named === r.n && r.route;
  return { pass, detail: `${r.named}/${r.n} charts named; text route ${r.route ? 'present' : 'missing'}` };
}

async function audit(page, id, name, opts = {}) {
  await page.waitForTimeout(300);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']).analyze();
  const serious = axe.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  const contrast = axe.violations.filter((v) => v.id === 'color-contrast');
  const landed = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el?.tagName.toLowerCase() ?? 'none', text: (el?.textContent ?? '').trim().slice(0, 40) };
  });
  const transcript = await axTranscript(page);
  writeFileSync(resolve(transcriptDir, `${id}.txt`), `# ${name}\n# Chrome accessibility tree in reading order (what VoiceOver/TalkBack are given). Not a device recording.\n\n${transcript.join('\n')}\n`);
  const row = {
    id, name,
    axe: { pass: serious.length === 0, detail: axe.violations.map((v) => `${v.id}(${v.impact},${v.nodes.length})`).join(', ') || 'clean' },
    focusOnArrival: { pass: opts.stayed ? null : landed.tag !== 'body' && landed.tag !== 'none', detail: opts.stayed ? 'same screen' : `focus on ${landed.tag} "${landed.text}"` },
    keyboard: await keyboardCheck(page),
    labels: await labelsCheck(page),
    order: await orderCheck(page),
    contrast: { pass: contrast.length === 0, detail: contrast.length ? contrast[0].nodes.slice(0, 3).map((n) => n.target.join(' ')).join('; ') : 'axe color-contrast clean' },
    motion: await motionCheck(page),
    reflow320: await reflowCheck(page),
    text200: await text200Check(page),
    chart: await chartCheck(page),
  };
  rows.push(row);
  const fails = Object.entries(row).filter(([, v]) => v && v.pass === false).map(([k]) => k);
  console.log(`${fails.length ? 'FAIL' : 'ok  '} ${id} ${fails.join(',')}`);
  return row;
}

const browser = await chromium.launch({ executablePath: resolveChrome() });
const ctxOpts = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 };

async function toPractise(page) {
  await page.getByRole('button', { name: 'Show me' }).click();
  for (let guard = 0; guard < 8; guard++) {
    const practise = page.getByRole('button', { name: 'Practise this' });
    if (await practise.isVisible()) { await practise.click(); return; }
    await page.getByRole('button', { name: 'Next' }).click();
  }
}

try {
  /* Fresh learner: the core loop. */
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (let step = 1; step <= 3; step++) {
    await audit(page, `01-onboarding-${step}`, `Onboarding, step ${step}`, { stayed: true });
    const next = page.getByRole('button', { name: /Next|Start learning/ });
    if (await next.isVisible()) await next.click();
  }
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor();
  await audit(page, '02-path-new', 'Path home, new learner (locked lessons)');
  await page.getByRole('button', { name: /^Meet the chart\./ }).click();
  await audit(page, '03-lesson-card', 'Lesson card');
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.getByText('Narrated walkthrough').waitFor();
  await audit(page, '04-guided-narrated', 'Guided example, narrated (default)', { stayed: true });
  await page.getByRole('button', { name: 'Switch to text only' }).click();
  await page.getByRole('heading', { name: 'A chart is a story of trades' }).waitFor();
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.getByText(/Walkthrough . step 1 of/).waitFor();
  await audit(page, '04b-guided-text', 'Guided example, text only', { stayed: true });
  for (let guard = 0; guard < 8; guard++) {
    const practise = page.getByRole('button', { name: 'Practise this' });
    if (await practise.isVisible()) { await practise.click(); break; }
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await page.getByText(/Question 1 of/).waitFor();
  await page.waitForSelector('svg[role="img"]');
  await audit(page, '05-exercise-choice', 'Exercise, multiple choice');
  const hint = page.getByRole('button', { name: /Show a hint/ });
  if (await hint.isVisible()) { await hint.click(); await audit(page, '05b-exercise-hint', 'Exercise with hint open', { stayed: true }); }
  await page.getByRole('button', { name: /Time, from oldest on the left/ }).click();
  await audit(page, '05c-exercise-selected', 'Exercise, answer selected', { stayed: true });
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  await audit(page, '06-reveal-correct', 'Reveal, correct (+10 daily)');
  await page.getByRole('button', { name: /Next question/ }).click();
  await page.getByText(/Question 2 of/).waitFor();
  const wrong = page.locator('button[aria-pressed]').filter({ hasNotText: /most recent price paid/ }).first();
  await wrong.click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  await audit(page, '07-reveal-wrong', 'Reveal, not this time');
  await page.getByRole('button', { name: /Next question|Back to the path|Try again/ }).first().click();
  for (let guard = 0; guard < 4 && !(await page.getByRole('heading', { name: 'The Living Chart' }).isVisible()); guard++) {
    if (await page.getByText(/Question \d+ of/).isVisible()) {
      await page.getByRole('button', { name: /The most recent price paid/ }).click();
      await page.getByRole('button', { name: 'Check' }).click();
      await page.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
    }
    await page.getByRole('button', { name: /Back to the path|Next question/ }).first().click();
  }
  await page.getByRole('heading', { name: 'The Living Chart' }).waitFor({ timeout: 10000 }).catch(() => {});
  await audit(page, '08-path-progress', 'Path home after practice');
  await page.getByLabel(/Your progress/).click();
  await page.getByRole('heading', { name: 'Your progress' }).waitFor();
  await audit(page, '09-profile', 'Profile');
  await page.getByRole('button', { name: 'Terms of use' }).click();
  await audit(page, '10-terms', 'Terms of use');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Privacy' }).click();
  await audit(page, '11-privacy', 'Privacy');
  await ctx.close();

  /* Seeded states. */
  const seedBase = { version: 1, onboardingComplete: true, lessonMode: 'text', totalXp: 24, answers: {}, pending: [], confirmed: [], progressionRuleset: 'prog-rules-v1.0' };
  async function seeded(seed, clock) {
    const c = await browser.newContext(ctxOpts);
    await c.addInitScript((s) => {
      if (!localStorage.getItem('tikerino.progress.v1')) {
        localStorage.setItem('tikerino.subjectId.v1', s.subjectId);
        localStorage.setItem('tikerino.progress.v1', JSON.stringify(s));
      }
    }, seed);
    const p = await c.newPage();
    if (clock) await p.clock.setFixedTime(new Date(clock));
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.getByRole('heading', { name: 'The Living Chart' }).waitFor();
    return { c, p };
  }
  const lesson0 = { 'lesson-0-meet-the-chart': { completedExerciseIds: ['ex-001', 'ex-002'], completed: true, crownLevel: 1, xpEarned: 24 } };
  const ret = await seeded({ ...seedBase, subjectId: 'audit-return', streak: { current: 2, longest: 2, lastActiveDay: '2026-10-21' }, lessons: lesson0, practiceDays: ['2026-10-20', '2026-10-21'], lessonAwards: { 'lesson-0-meet-the-chart': { xp: 25, awardedAt: '2026-10-21T09:00:00.000Z' } } }, '2026-10-25T10:00:00+02:00');
  await audit(ret.p, '12-return-after-gap', 'Path home, returning after missed days', { stayed: true });
  await ret.c.close();

  const legacy = await seeded({ version: 1, subjectId: 'audit-legacy', onboardingComplete: true, lessonMode: 'text', totalXp: 20, streak: { current: 1, longest: 1, lastActiveDay: null }, lessons: lesson0, answers: {}, pending: [] });
  await audit(legacy.p, '13-legacy-path', 'Path home, legacy save', { stayed: true });
  /* Lesson 1: pick-the-candle and percent exercises. */
  await legacy.p.getByRole('button', { name: /^Price moves and percent change\./ }).click();
  await toPractise(legacy.p);
  for (let q = 1; q <= 4; q++) {
    await legacy.p.getByText(/Question \d+ of/).waitFor();
    const pickGroup = legacy.p.getByRole('group', { name: 'Pick a candle' });
    if (await pickGroup.count()) {
      await audit(legacy.p, '14-exercise-pick-candle', 'Exercise, pick the candle');
      await legacy.p.locator('details > summary').first().click();
      await audit(legacy.p, '14c-exercise-pick-candle-text', 'Exercise, pick the candle, text list open', { stayed: true });
      await legacy.p.getByRole('button', { name: /^Select candle/ }).first().click();
    } else {
      if (q === 1) await audit(legacy.p, '14b-exercise-percent', 'Exercise, percent change');
      await legacy.p.locator('button[aria-pressed]').first().click();
    }
    await legacy.p.getByRole('button', { name: 'Check' }).click();
    await legacy.p.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
    const nextQ = legacy.p.getByRole('button', { name: /Next question/ });
    if (!(await nextQ.count())) break;
    await nextQ.click();
  }
  await legacy.c.close();

  /* Offline queued and save failed. */
  const off = await seeded({ ...seedBase, totalXp: 0, subjectId: 'audit-offline', streak: { current: 0, longest: 0, lastActiveDay: null }, lessons: {}, lessonAwards: {} });
  await off.p.getByRole('button', { name: /^Meet the chart\./ }).click();
  await toPractise(off.p);
  await off.p.getByText(/Question 1 of/).waitFor();
  await off.p.getByRole('button', { name: /Time, from oldest on the left/ }).click();
  await off.c.setOffline(true);
  await off.p.getByRole('button', { name: 'Check' }).click();
  await off.p.getByRole('heading', { name: 'Answer queued' }).waitFor();
  await audit(off.p, '15-offline-queued', 'Answer queued offline', { stayed: true });
  await off.p.getByRole('button', { name: /Back to the lesson/ }).click();
  await off.p.getByRole('button', { name: /Back|Path/ }).first().click().catch(() => {});
  await off.p.getByRole('heading', { name: 'The Living Chart' }).waitFor();
  await audit(off.p, '15b-path-queued', 'Path home with a queued answer');
  await off.c.close();

  const fail = await seeded({ ...seedBase, totalXp: 0, subjectId: 'audit-fail', streak: { current: 0, longest: 0, lastActiveDay: null }, lessons: {}, lessonAwards: {} });
  await fail.p.evaluate(() => { window.__failProgressSaves = true; });
  await fail.p.getByRole('button', { name: /^Meet the chart\./ }).click();
  await toPractise(fail.p);
  await fail.p.getByText(/Question 1 of/).waitFor();
  await fail.p.getByRole('button', { name: /Time, from oldest on the left/ }).click();
  await fail.p.getByRole('button', { name: 'Check' }).click();
  await fail.p.getByRole('heading', { name: /Correct|Not this time/ }).waitFor();
  await audit(fail.p, '16-save-failed', 'Reveal when the save fails', { stayed: true });
  await fail.c.close();
} finally {
  writeFileSync(resolve(outDir, 'audit-results.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, viewport: '390x844', rows }, null, 2)}\n`);
  await browser.close();
}
