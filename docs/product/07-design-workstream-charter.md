<!-- Snapshot of Google Doc "Tikerino Design Workstream - Charter and Stage Plan" (Drive), taken 2026-10-03. -->

# Tikerino Design Workstream - Charter and Stage Plan (19 Sep 2026)
Design is one of three parallel endeavours (Guy, 19/9): Coding/Engineering (heavy lifting by Claude); Content (curriculum, text lessons, narration, video); Design (creative, user path and workflow, journey path, animations).

## 1. Mission and scope
Design owns creative direction, the design system, user path and workflow, the learning journey path, and animations. Design produces specs, templates and visual assets that Engineering implements and Content fills. Every scope change goes back to Guy.

## 2. Standing constraints (locked)
- Palette: Growth Green only (violet dropped 11/9). Brand colours and chart data colours are separate scales; data colours frozen and never retinted. Coral and sun accents never inside the chart canvas.
- Type: Baloo 2 display + Nunito body. Body base 18px, nothing under 16px, tabular chart numerals.
- Accessibility: WCAG 2.1 AA on every screen; touch targets >= 48px; every candle states direction in words; non-colour encoding mandatory (hollow bullish vs filled bearish).
- Video/content framing (Guy, 13/9): title on its own line; captions in a fixed band never covering the chart; no invented price axis; no mascot in frame unless professional; every taught fact has a worked example; examples from the US market only (AAPL, NVDA, MSFT).
- Product locks: mobile-first PWA, English only, synthetic charts for graded exercises, server-side grading, point-in-time cuts with no post-cut leaks.
- Logo/brand: the bull logo is Guy's own drawing, used pixel-exact; the master SVG/PNG set is the design system of record.

## 3. Current-state audit (19 Sep, live app + repo)
Audited the full live loop on tikerino.com: onboarding (3 steps), Your path, lesson principle card, narrated walkthrough, stepped text walkthrough, multiple-choice exercise, wrong and correct feedback with post-cut reveal, and progress screen. Repo ground truth: specs/tikerino-design-tokens-v1.css plus specs/tikerino-tailwind.config.js; Tailwind consumes the spec verbatim.

Works well: green/ink/paper tokens live and consistent; chart is the hero; text/narrated parity with mid-lesson switch; stepped walkthrough with dashed spotlight; XP breakdown on feedback; accessibility basics.

Gaps:
1. No journey path - "Your path" is a flat list with lock icons.
2. Narration player controls thin - no replay, speed, captions, transcript, visible reduced-motion behaviour.
3. Annotation vocabulary minimal - only dashed spotlight box and dashed cut line.
4. Emoji stand-ins instead of iconography (onboarding, lock icons).
5. Exercise/feedback templates cover only the current two types; mixed review, market exam, transfer, hint and retry/recovery states undesigned.
6. Progress display is XP/streak/crowns only; no mastery view.
7. No celebration or motion spec.

## 4. Deliverables and stages
Each stage ends with the spec in the repo specs/ folder, a visual proof at 390x844, and a note in the production-readiness dashboard.
- D1 - Design tokens v2 and motion spec.
- D2 - Chart annotation language.
- D3 - Template library (with word/character budgets for Content).
- D4 - Journey path and progression UX (presentation only).
- D5 - Iconography and illustration (replace emoji; bull rules).
- D6 - Visual QA acceptance criteria.
Order: D1 + D2 first, then D3, then D4/D5 in parallel, D6 last.

## 5. Interfaces
Engineering (Claude, via GitHub issue #1): Design ships specs and tokens into specs/; Claude implements against them. Design reviews diffs/screenshots/CI; merges only inside approved scope with green checks. New behaviour or surfaces wait for Guy.
Content: Content hands Design per lesson the semantic segment IDs, copy, chart state and annotation intent, captions, interactions, error states, accessibility notes. Design hands Content word budgets, storyboard-safe regions, annotation limits, caption density, reduced-motion behaviour, visual QA criteria.

## 6. Process
Draft -> critic review -> consolidate -> fix -> re-check -> show Guy. Evidence: every visual claim backed by a 390x844 screenshot; WCAG pairings measured; real-Safari check for animation/audio. Specs in repo specs/; working docs in Drive.

## 9. Direction update (Guy, 19 Sep, approved)
- Design is produced in Stitch (signed in as gkahansky@gmail.com).
- Target feel: highly intuitive, animated and vibrant, while professional.
- The bull may gain a body and act as an animated journey companion (onboarding, empty states, milestones only).
- Design critic: OpenAI GPT-6 Astra where available; four-model panel as fallback.
- Journey path: build a spatial map/path; two distinct concepts to Guy.
- Skills/mastery progress view: approved to explore.
- The learning-app pattern study grounds every design choice.
