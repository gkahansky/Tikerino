<!-- Snapshot of Google Doc "Tikerino Design - Template Library v0.1 (DRAFT)" (Drive), taken 2026-10-03. -->

# Tikerino Design - Template Library v0.1 (DRAFT, 19 Sep 2026)
Serves the Content Workstream Contract's Design interface: reusable states and templates, not lesson-specific compositions. Grounding: tokens v1/v2, video framing rules, the 19/9 pattern study, Guy's direction (intuitive, animated, vibrant, professional; bull only in onboarding/empty states/milestones).

## Global layout grammar (every template)
- One idea per screen; if it scrolls, it splits.
- Z-order fixed: chart canvas < annotation layer < caption band / title strip < controls.
- The chart is the hero: full-bleed, zero competing chrome inside the canvas.
- Title on its own fully visible line; 18px body floor; 48px targets; focus ring on all interactive elements; non-colour cue beside every colour signal.
- Animation budget: max one ambient animation per screen; nothing moves during a reading or decision moment; celebrations only at completion beats.

## T1 - Module map (journey path / home)
Module title; spatial path (concept pending); node states locked/current/done (+check); streak + XP chips; "Up next" card with lesson title + time estimate; optional daily-session framing (pending approval). Bull at current node and milestones, idle loop max 2s, paused on scroll/interaction. Budgets: module title <= 24 chars; "Up next" <= 60; unlock hint <= 60.

## T2 - Module intro
Module title, one-sentence promise, 3-4 skill chips, estimated time, start CTA. Bull milestone pose allowed. Budgets: promise <= 90 chars; chip <= 20; time label <= 20.

## T3 - Lesson objective / principle card
Lesson title (own line); principle body (<= 60 words); one annotated example chart (static in text mode); "Show me" entry to guided mode; mode switch both directions. Budgets: title <= 40 chars; body <= 360 chars; caption <= 40; alt text auto-derived + <= 140 chars summary.

## T4 - Worked-example sequence
One chart; 3-8 beats; exactly one focused annotation per beat; beat text in a fixed card; Next/Back; progress dots; switch to narrated. Narrated parity: same beats/order/annotations; audio sprite keyed by semantic segment ID. Budgets: beat text <= 140 chars; annotation label <= 30.

## T5 - Practice states (close + transfer)
Question counter; prompt (<= 20 words); cut chart with dashed cut line; answer affordance (MC / pick-the-candle / future types); hint button with its cost stated; Check disabled until selection. Transfer variant flags the changed surface feature. Budgets: prompt <= 120 chars; MC option <= 60, 3-4 options; hint <= 140.

## T6 - Feedback, retry and recovery
Correct: "Correct" + XP chip; explanation <= 40 words naming the evidence; XP breakdown; reveal animation; Next. Incorrect: no-shame "Not quite"; explanation names the misconception and points to exact candles; interactive-explorable explanation (tap the evidence candle); retry or "see the answer"; XP breakdown shows 0 without red overload. Recovery loop: missed exercises return at lesson end once; lesson completes only when every exercise is correct once. Budgets: correct <= 240 chars; incorrect <= 300 + evidence reference; retry label <= 24.

## T7 - Narration player states
Playing, paused, replay segment, speed (0.75/1/1.25/1.5x), captions on/off, transcript view, no-audio (text parity), reduced-motion variant, audio-failure fallback (auto-offer text mode). Layout: title strip; chart canvas with draw-on + spotlight synced to segments; caption band (fixed, 2 lines max, never over chart); transport row; mode switch. Budgets: caption <= 84 chars/line, <= 2 lines.

## T8 - Mixed review
"Mixed review" badge naming pooled skills; T5 skeleton; per-item skill tag (icon + label); end-of-set recap per skill.

## T9 - Market exam
Intro (stakes + rules, bull milestone pose allowed); 5-10 unseen charts; no hints; answers locked until end; pass celebration (the only full-screen one) or "not yet" recovery with exact skills to revisit and direct lesson links.

## T10 - Progress / mastery view (exploration approved 19/9)
XP + streak + crowns; mastery matrix per module (Khan pattern): skill squares in five states (not started / seen / practised / proficient / mastered) with non-colour encoding; per-skill drill-down. Presentation only.

## Parity and accessibility (every template)
Text-only mode complete without audio/video; captions and transcript first-class; reduced-motion variant per animation; non-colour cue for every state, candle direction, annotation and mastery level; screen-reader patterns (candle sentences, annotation sentences, grade announcements); contrast pairs only from the v1 verified table; tabular chart numerals.

## What Engineering needs (interface note)
- Transport controls state machine keyed by semantic segment IDs.
- Annotation layer API per the annotation language (candle/range/zone/trendline/volume/MA/indicator panel).
- Mastery matrix data source (per-skill state) - needs Guy's product approval before build.
- Caption band + title strip layout regions as fixed chrome.
