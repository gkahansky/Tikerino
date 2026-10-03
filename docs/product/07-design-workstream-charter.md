# **Tikerino Design Workstream \- Charter and Stage Plan**

**Date:** 19 September 2026 **Owner:** Design workstream (one of three parallel Tikerino endeavours: Coding/Engineering, Content, Design) **Source request (Guy, 19/9 11:26):** "run this in 3 parallel endeavours: Coding and features development (heavy lifting by Claude); Content creation \- curriculum, Text lessons, narration, video; Design system: Creative, user path and workflow, journey path, animations etc."

## **1\. Mission and scope**

Design owns: creative direction, the design system, user path and workflow, the learning journey path, and animations. Design produces specs, templates, and visual assets that Engineering (Claude) implements and Content fills. Design does not change approved product or UX scope on its own; every scope change goes back to Guy.

## **2\. Standing constraints (locked, bind every deliverable)**

> * **Palette:** Growth Green only (violet dropped 11/9). Brand colours and chart data colours are separate scales; data colours are frozen and never retinted. Coral and sun accents never appear inside the chart canvas.  
> * **Type:** Baloo 2 display \+ Nunito body. Body base 18px, nothing under 16px anywhere, tabular chart numerals.  
> * **Accessibility:** WCAG 2.1 AA on every screen; touch targets at least 48px; every candle states direction in words; non-colour encoding mandatory (hollow bullish body vs filled bearish body).  
> * **Video/content framing (Guy, 13/9):** title on its own fully visible line; captions in a fixed band that never covers the chart; no invented price axis; no mascot in the frame unless it looks professional; every taught fact has at least one worked example; examples from the US market only (AAPL, NVDA, MSFT).  
> * **Product locks:** mobile-first PWA, English only for now, synthetic charts for graded exercises, freemium with modules 1-3 free, server-side grading, point-in-time cuts with no post-cut leaks.  
> * **Logo/brand:** the bull logo is Guy's own drawing, used pixel-exact; the Instinct-produced master SVG/PNG set is the design system of record.

## **3\. Current-state audit (19 Sep, live app \+ repo)**

Audited the full live loop on tikerino.com (fresh profile): onboarding (3 steps), Your path, lesson principle card, narrated walkthrough, stepped text walkthrough, multiple-choice exercise, wrong and correct feedback with post-cut reveal, and the progress screen. Repo ground truth: specs/tikerino-design-tokens-v1.css (tokens, WCAG pairings, frozen data colours) plus specs/tikerino-tailwind.config.js; Tailwind consumes the spec verbatim, so spec and code cannot drift.  
What already exists and works well: the green/ink/paper token set is live and consistent; the chart is the hero on every screen; text/narrated parity with a mid-lesson switch; stepped walkthrough with a dashed spotlight annotation; XP breakdown on feedback; accessibility basics (chart alt text, "read the candles as text", large type).  
Gaps against the Content workstream contract (the interface Design must serve):

> 1. **No journey path yet.** "Your path" is a flat list with lock icons. There is no module map, no spatial path, no sense of place or progress through a course.  
> 2. **Narration player controls are thin.** Pause/resume and mode switch exist. No replay, no speed control, no captions, no transcript view, no visible reduced-motion behaviour. The contract requires all of these as first-class states.  
> 3. **Annotation vocabulary is minimal.** Only a dashed spotlight box and a dashed cut line exist. The contract needs annotations for candle, candle range, price zone, trendline, volume, moving average, and indicator panels, each with a non-colour cue.  
> 4. **Emoji stand-ins instead of iconography.** Onboarding uses emoji (chart, target, flame); locked lessons use a lock emoji. Inconsistent with the brand and with the "professional" bar Guy set for visuals.  
> 5. **Exercise/feedback templates cover only the current two types.** Mixed review, market exam, transfer practice, hint and retry/recovery states need designed templates before Content can serialise Stage C.  
> 6. **Progress display is XP/streak/crowns only.** The contract asks for skills/mastery-based progress. Showing mastery is a presentation design task; the underlying model is Engineering/product scope.  
> 7. **No celebration or motion spec.** Motion today is ad hoc (chart draw-on, reveal). No documented durations, easings, or reduced-motion mapping beyond one token.

## **4\. Deliverables and stages**

Each stage ends with: the spec in the repo specs/ folder (spec-docs-always-current rule), a visual proof at 390x844, and a note in the production-readiness dashboard. Guy sees the corrected version of anything the panel reviewed.

> * **D1 \- Design tokens v2 and motion spec.** Extend tokens v1: state colours (locked/current/done/error/success), caption-band and video-frame tokens, icon sizes; motion language (durations, easings, choreography for draw-on, spotlight, reveal, celebration) with an explicit reduced-motion mapping for every animation.  
> * **D2 \- Chart annotation language.** The reusable annotation set (candle, range, zone, trendline, volume, MA, indicator panel) with shape, colour, non-colour cue, label placement, and storyboard-safe regions. Defines annotation limits per template so Content knows what a beat may ask for.  
> * **D3 \- Template library.** Reusable states, not lesson-specific compositions: module map and module intro; lesson objective/principle; worked-example sequence with one focused annotation per beat; close practice, transfer practice, feedback, retry/recovery, hint; mixed review; market exam; text-only and narrated/video parity; narration player states (pause, replay, speed, captions, transcript, reduced motion, no audio). Each template ships with word/character budgets, which Content needs before finalising Stage B/C.  
> * **D4 \- Journey path and progression UX.** Module map / path visualisation, lock-unlock-complete states, streak and XP presentation, crowns/mastery display. Presentation only; any change to progression mechanics goes to Guy first.  
> * **D5 \- Iconography and illustration.** Brand-consistent icon set to replace emoji; rules for when the bull may appear (UI only, professional bar, never inside graded chart frames).  
> * **D6 \- Visual QA acceptance criteria.** The checklist Content and Engineering test against: framing rules, caption density, contrast pairs, 390x844 evidence, reduced-motion pass, screen-reader candle descriptions.

Suggested order: D1 and D2 first (both unblock Content and video work), then D3, then D4/D5 in parallel, D6 last as the consolidator.

## **5\. Interfaces**

**With Engineering (Claude, via GitHub issue \#1 per the approved handoff channel):** Design ships specs and tokens into specs/; Claude implements components against them. Design reviews diffs/screenshots/CI under the standing authorization (review and fix requests without per-reply approval; merges only inside approved scope with green checks). New behaviour, new surfaces, or mechanic changes wait for Guy.  
**With Content (per the Content Workstream Contract, 19/9):** Content hands Design, per lesson: semantic segment IDs, learner-facing copy, chart state and annotation intent, visual priority and required non-colour cue, caption/transcript text, expected interaction and success evidence, error/recovery state, accessibility notes. Design hands Content, before Stage B/C templates freeze: word/character budgets per template, storyboard-safe chart regions and annotation limits, caption density and reduced-motion behaviour, visual QA acceptance criteria. Design treats the contract's template list as interface requirements, not as permission to change product scope.

## **6\. Process**

> * Review cycle mirrors the content track: draft, panel review (Bobby's four models) where the deliverable is a judgment call, consolidate, fix, re-check, then show Guy the corrected version with what the panel agreed and disputed. Confirm with Guy whether he wants the same gate on design stages.  
> * Evidence standard: every visual claim backed by a 390x844 screenshot; WCAG pairings measured, not asserted; real-Safari check for anything that animates or plays audio.  
> * Files of record: specs in the repo specs/ folder; working docs in Drive AI Projects/Tikerino; the readiness dashboard updated as stages complete.

## **7\. Decisions parked for Guy**

> 1. Does the design track go through Bobby's panel like Content, or straight to Guy review?  
> 2. Journey path direction: keep the list and enrich it, or a spatial path/map visualisation (presentation-only change)?  
> 3. Skills/mastery progress display: new product surface beyond XP/streak/crowns \- approve exploring designs?  
> 4. Mascot in UI: the pose set exists and was kept for UI use; confirm where, if anywhere, the bull appears in the app chrome.

## **8\. Out of scope for Design**

Lesson content and copy (Content), code and architecture (Engineering), product mechanics changes, paid media generation, market-data licensing, and anything touching accounts, payments, or analytics.  
\#\# 9\. Direction update (Guy, 19 Sep 2026, approved and expanded)

\- Design is produced in Stitch (stitch.google.com, signed in as gkahansky@gmail.com).  
\- Target feel: highly intuitive, animated and vibrant, while projecting professionalism.  
\- The bull logo is showcased. The bull may gain a body and act as an animated journey companion between milestones and lessons. Placement locked with Guy: onboarding, empty states and milestone moments only; never persistent navigation, lesson content or videos. Focused learning interactions stay clear of distracting animation.  
\- Design critic: OpenAI's GPT-6 Astra (model id gpt-6-astra) reviews each design stage where available; Bobby's four-model panel is the fallback only if Astra is not accessible on Guy's account. Astra is a critic, not the primary designer.  
\- Journey path: build a spatial map/path. Two genuinely distinct concepts with mockups go to Guy for the pick (approved 19/9 11:35).  
\- Skills/mastery progress view: approved to explore alongside XP, streak and crowns.  
\- The learning-app pattern study (7 apps) now grounds every design choice; recorded in Drive as 'Tikerino Design \- Learning-App Pattern Study (19 Sep 2026)'.

This update amends sections 4-7 where they conflict; the panel-per-stage question in section 7 is resolved (Astra critic, panel fallback). D4 journey-path direction is resolved: spatial path, two concepts to mock up.  
