# Tikerino accessibility release bar

Status: proposed, waiting for controller review. Written 24 Sep 2026.

## The bar

Every live learner screen and state must meet **WCAG 2.2 Level AA** (https://www.w3.org/TR/WCAG22/) before it ships. Tikerino's audience is 13+, phone first, so we test at 390 CSS px and treat these as release blockers:

| Check | What passes | WCAG 2.2 SC | How it is tested |
|---|---|---|---|
| Keyboard | Every control can be reached with Tab and used with Enter/Space. Focus is always visible, and never fully hidden under the sticky Check/Continue bar. | 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11 | `audit.mjs` keyboard walk |
| Focus on arrival | After a screen change, focus moves to the new screen's heading, not `<body>`. | 2.4.3, 4.1.3 | `audit.mjs` |
| Screen-reader labels | Every control, image and chart has an accessible name, and state (pressed, disabled) is exposed. | 1.1.1, 4.1.2, 1.3.1 | Chrome AX tree (`transcripts/`); **device VoiceOver/TalkBack pass still required** |
| Reading order | AX order matches visual order. | 1.3.2, 2.4.3 | `audit.mjs` |
| Contrast | Text 4.5:1 (3:1 large). UI parts and chart marks 3:1. | 1.4.3, 1.4.11 | axe `color-contrast`; 1.4.11 chart marks by manual review |
| Reduced motion | With `prefers-reduced-motion: reduce`, nothing animates, and every animated cue has a text equivalent. | 2.3.3 (AAA, adopted), 2.2.2 | `audit.mjs`, plus the full-loop reduced-motion checks |
| 200% text | With text at 200%, all text scales, nothing clips, and nothing scrolls sideways. | 1.4.4 | `audit.mjs` (root font-size 200%) |
| Reflow | At 320 CSS px nothing scrolls sideways. | 1.4.10 | `audit.mjs` |
| Chart text alternative | Every chart has a text name and an open-to-all text route ("Read the candles as text") that lets the learner answer. | 1.1.1, 1.3.1 | `audit.mjs` + full-loop pick-the-candle checks |
| Target size | Controls are at least 24x24 CSS px. | 2.5.8 | axe `target-size` (wcag22aa tag) |
| Automated | axe-core, WCAG 2.0/2.1/2.2 A+AA tags: zero critical or serious findings. | many | `audit.mjs`, `full-loop.mjs` |

Severity: **P0** = a WCAG 2.2 A/AA failure in the core loop (onboarding -> path -> lesson -> exercise -> reveal -> path). It blocks release and gets fixed in the same PR. **P1** = an AA failure off the core loop, or a platform-parity gap. It gets a card.

## Israel (LEGAL-IL) - leads, not conclusions

- LEAD: Israel's Equal Rights of Persons with Disabilities Law (1998) and the 2013 service-accessibility regulations require online services to meet Israeli Standard **IS 5568**, which adopts WCAG 2.0 AA with local changes. Sources: https://www.w3.org/WAI/policies/israel/ and the Commission's IS 5568 page https://www.gov.il/he/pages/israeli_standard_5598.
- LEAD: IS 5568 Part 1 has a May 2021 edition (copy seen at https://www.brn.co.il/wp-content/uploads/2024/12/f126aede-511e-41e4-8ad0-b278f33e6c43.pdf). Which edition the regulations currently point to: **UNKNOWN**.
- UNKNOWN: whether the regulations cover a PWA/mobile learning app run by a small Israeli company, and whether any size or revenue exemption applies.
- UNKNOWN: whether an accessibility statement (הצהרת נגישות) and a named accessibility contact are required for Tikerino, and in what form.
- UNKNOWN: whether Hebrew/RTL content will be in scope at launch. If yes, RTL reading order joins this bar.
- Working assumption for Engineering only: WCAG 2.2 AA is a superset of WCAG 2.0 AA, so meeting it should cover IS 5568's technical level. This needs legal confirmation. It is not a legal opinion.

## What this bar does not prove yet

- **No device screen-reader run.** VoiceOver (iOS Safari/PWA) and TalkBack (Android Chrome) have not been run on hardware. The AX-tree transcripts show what those readers are given, not how they speak it. This is the open evidence gap for the core loop.
- Non-text contrast of chart candles (1.4.11) is reviewed by eye, not measured.
- `/ops` is owner-only and out of the learner scope.
