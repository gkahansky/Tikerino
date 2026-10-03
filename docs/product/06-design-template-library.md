# **Tikerino Design \- Template Library v0.1 (DRAFT, for review)**

**Status:** Draft, 19 Sep 2026\. Serves the Content Workstream Contract's Design interface: reusable states and templates, not lesson-specific compositions. Word budgets here are what Content needs before Stage B/C freezes. **Grounding:** locked constraints (tokens v1/v2, video framing rules), the 19/9 pattern study (7 apps), Guy's direction: intuitive, animated, vibrant, professional; bull only in onboarding/empty states/milestones.

## **Global layout grammar (every template)**

> * One idea per screen; if it scrolls, it splits (v0.3 principle, confirmed by pattern study).  
> * Z-order fixed: chart canvas \< annotation layer \< caption band / title strip \< controls.  
> * The chart is the hero: full-bleed, zero competing chrome inside the canvas.  
> * Every screen: title on its own fully visible line; large type (18px body floor); 48px targets; focus ring on all interactive elements; non-colour cue beside every colour signal.  
> * Animation budget: max one ambient animation per screen; nothing moves during a reading or decision moment; celebrations only at completion beats.

## **T1 \- Module map (journey path screen)**

Purpose: home; where am I, what's next, why come back. Contents: module title; spatial path (concept pending Guy's pick); node states locked/current/done (+check, never colour alone); streak \+ XP chips; "Up next" card with lesson title \+ time estimate; optional daily-session framing (pending product approval). Bull: may appear at the current node and at milestone landmarks, idle-loop max 2s, paused when the user scrolls or interacts. Budgets: module title \<= 24 chars; "Up next" line \<= 60 chars; unlock hint \<= 60 chars.

## **T2 \- Module intro state**

Purpose: first entry to a module; sets the contract for the module. Contents: module title, one-sentence promise ("By the end you can read any candle's story."), 3-4 skill chips this module builds, estimated total time, start CTA. Bull: milestone pose allowed (pointing ahead). No animation longer than 1.2s. Budgets: promise \<= 90 chars; skill chip \<= 20 chars; time label \<= 20 chars.

## **T3 \- Lesson objective / principle card**

Purpose: the single principle, text-first, complete without audio. Contents: lesson title (own line); principle body (\<= 60 words, v0.3 rule); one annotated example chart (static in text mode); "Show me" entry to the guided mode; mode switch both directions. Budgets: title \<= 40 chars; principle body \<= 360 chars (60 words); chart caption \<= 40 chars; alt text auto-derived from candle data \+ \<= 140 chars summary.

## **T4 \- Worked-example sequence (guided example)**

Purpose: the principle applied step by step on one chart. Contents: one chart; 3-8 beats; exactly one focused annotation per beat (annotation language, D2); beat text in a fixed card; Next / Back a step; progress dots; switch to narrated. Narrated parity: same beats, same order, same annotations; audio sprite keyed by semantic segment ID; controls per T7. Budgets: beat text \<= 140 chars (one sentence, two max); beats per example 3-8; annotation label \<= 30 chars.

## **T5 \- Practice states (close practice \+ transfer practice)**

Purpose: graded attempt on a cut chart. Contents: question counter ("Question 1 of 2"); prompt (\<= 20 words); cut chart with dashed cut line; answer affordance by exercise type (MC options / pick-the-candle / future types); hint button with its cost stated ("Show a hint (costs half the XP)"); Check disabled until selection. Transfer variant: same skeleton, different surface feature flagged visually (new timeframe, new pattern context) so transfer reads as "same skill, new clothes". Budgets: prompt \<= 120 chars; MC option \<= 60 chars, 3-4 options; hint \<= 140 chars.

## **T6 \- Feedback, retry and recovery states**

Purpose: grade \+ teach, on both outcomes. Correct: "Correct" \+ XP chip; explanation \<= 40 words naming the evidence; XP breakdown card (base/difficulty/speed); reveal animation per motion spec; Next CTA. Incorrect: no-shame framing ("Not quite"); explanation names the misconception and points to the exact candles; interactive-explorable explanation state (pattern 9: tap the evidence candle to see why); retry affordance (re-attempt or "see the answer"); XP breakdown shows 0 without red overload. Recovery loop: missed exercises return at lesson end once; lesson completes only when every exercise is correct once (matches current product behaviour \- presentation only). Budgets: correct explanation \<= 240 chars; incorrect explanation \<= 300 chars \+ evidence reference; retry label \<= 24 chars.

## **T7 \- Narration player states**

Purpose: narrated/video parity with full control. States required (Content contract): playing, paused, replay segment, speed (0.75x / 1x / 1.25x / 1.5x), captions on/off, transcript view, no-audio (text parity), reduced-motion variant, audio-failure fallback (auto-offer text mode). Layout: title strip; chart canvas with draw-on \+ spotlight synced to segments; caption band (fixed, 2 lines max, never over chart); transport row (play/pause, replay, speed, captions, transcript); mode switch. Budgets: caption \<= 84 chars per line, \<= 2 lines per segment; transcript \= full script, segmented; speed labels fixed set.

## **T8 \- Mixed review state**

Purpose: spaced pull from earlier skills. Contents: "Mixed review" badge naming the skills pooled; same exercise skeleton as T5; per-item skill tag (non-colour: skill icon \+ label); end-of-set recap: per-skill result row. Budgets: badge \<= 40 chars; skill tag \<= 20 chars; recap row \<= 50 chars.

## **T9 \- Market exam state**

Purpose: unseen-data module exam (product's "market exam" concept). Contents: exam intro (stakes \+ rules, bull milestone pose allowed); 5-10 unseen charts; no hints; no mid-exam explanations (answers locked until end); end: pass celebration (the only full-screen one) or "not yet" recovery with exact skills to revisit and a direct link to the right lesson. Budgets: rules \<= 3 lines; result line \<= 60 chars; revisit row \<= 50 chars.

## **T10 \- Progress / mastery view (exploration approved by Guy 19/9)**

Purpose: progress beyond XP. Contents: XP \+ streak \+ crowns (existing); mastery matrix per module (Khan pattern): skill squares in five states (not started / seen / practised / proficient / mastered) with non-colour encoding (fill density \+ icon); per-skill drill-down to the lesson that teaches it. Presentation only; the mastery model itself is Engineering/product scope.

## **Parity and accessibility requirements (every template)**

> * Text-only mode is complete without audio or video (contract).  
> * Captions and transcript are first-class, not an afterthought.  
> * Reduced-motion variant defined per animation (motion spec D1).  
> * Non-colour cue for every state, candle direction, annotation and mastery level.  
> * Screen-reader patterns: candle sentences, annotation sentences, state announcements on grade.  
> * Contrast pairs only from the v1 verified table; chart numerals tabular.

## **What Engineering needs to implement these (interface note, not scope change)**

> * Transport controls state machine (play/pause/replay/speed/captions/transcript) keyed by semantic segment IDs.  
> * Annotation layer API per the D2 language (candle/range/zone/trendline/volume/MA/indicator panel).  
> * Mastery matrix data source (per-skill state) \- new surface; needs Guy's product approval before build.  
> * Caption band \+ title strip layout regions as fixed chrome.