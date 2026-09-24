#!/usr/bin/env node
/** Render docs/accessibility/MATRIX.md from audit-results.json (tests/a11y/audit.mjs). */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/accessibility');
const { generatedAt, base, viewport, rows } = JSON.parse(readFileSync(resolve(dir, 'audit-results.json'), 'utf8'));
const cols = [
  ['focusOnArrival', 'Focus on arrival'], ['keyboard', 'Keyboard'], ['labels', 'SR labels (AX tree)'], ['order', 'Reading order'], ['contrast', 'Contrast'],
  ['motion', 'Reduced motion'], ['text200', '200% text'], ['reflow320', 'Reflow 320px'], ['chart', 'Chart text alt'], ['axe', 'axe 2.2 AA'],
];
const mark = (c) => (c == null || c.pass == null ? 'n/a' : c.pass ? 'PASS' : 'FAIL');
const esc = (s) => String(s).replace(/\|/g, '\\|');
let md = `# Accessibility matrix\n\nGenerated ${generatedAt} by \`tests/a11y/audit.mjs\` against ${base} at ${viewport}. Bar: [RELEASE_BAR.md](RELEASE_BAR.md).\n\n`;
md += 'Device screen readers (VoiceOver on iOS, TalkBack on Android) have **not** been run on hardware. "SR labels" is checked from the Chrome accessibility tree, which is what both screen readers are given; see `transcripts/`. Device status: UNVERIFIED.\n\n';
md += `| Screen / state | ${cols.map(([, h]) => h).join(' | ')} | VoiceOver / TalkBack device |\n|${'---|'.repeat(cols.length + 2)}\n`;
for (const r of rows) md += `| ${esc(r.name)} (\`${r.id}\`) | ${cols.map(([k]) => mark(r[k])).join(' | ')} | UNVERIFIED |\n`;
md += '\n## Details\n\n';
for (const r of rows) {
  md += `### ${r.name} (\`${r.id}\`)\n\n`;
  for (const [k, h] of cols) if (r[k]) md += `- ${h}: ${mark(r[k])} - ${esc(r[k].detail)}\n`;
  md += `- Transcript: [transcripts/${r.id}.txt](transcripts/${r.id}.txt)\n\n`;
}
writeFileSync(resolve(dir, 'MATRIX.md'), md);
console.log(`MATRIX.md: ${rows.length} screens`);
