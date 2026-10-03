# Design review and plan: Tikerino

## 1. Summary
Tikerino has established a robust, accessible instructional loop in production—shipping onboarding, lesson cards, narrated/stepped walkthroughs, chart exercises, and reveals with exemplary WCAG 2.2 AA compliance (`repo/docs/accessibility/MATRIX.md`). However, the visual experience is caught in an awkward transitional state: the live app runs a dark linear card-list for "The Living Chart" (`repo/client/src/screens/PathHome.tsx`, `design/live/02-path-full.png`) alongside light lesson views (`design/live/03-lesson-card.png`), lacking the full spatial metaphor, bull mascot integration, and tokenized iconography. More critically, recent exploratory mockups in Google Stitch (`design/stitch/`, `design/stitch-journey/`) have drifted dangerously into prohibited mechanics—introducing hearts/energy, real tickers (AAPL, TSLA, BTC/USD), profit claims, and trading simulators in direct violation of the locked Product Bible (`docs/01-product-bible-v0.2.md` §1). The single most important next step is to align the Journey Path and feedback experience with the locked Progression Spec v1.0 and Design Tokens v2, purging unauthorized gamification bloat and establishing a unified, accessible Living Chart visual standard.

---

## 2. Current state

### Visual styling, tokens & typography
- **Tokens v1 in production:** Shipped in `repo/specs/tikerino-design-tokens-v1.css` and mirrored in `repo/specs/tikerino-tailwind.config.js` and `repo/client/src/styles/index.css`. Core brand colors are Growth Green (`#10B981`), Ink Navy (`#0F2B46`), Paper (`#FAFAF7`), Surface (`#FFFFFF`), Line (`#E8E4DB`), and Soft Mint (`#E7F8F1`).
- **Data colors frozen:** Bullish hollow bodies (`#0E9F6E`) and bearish filled bodies (`#DC2626`) are strictly separated from brand styling and never retinted (`repo/specs/DECISIONS.md`).
- **Typography:** Self-hosted Google Fonts Baloo 2 (display) and Nunito (body) (`repo/client/index.html`). Strict 18px body base with a 16px minimum floor (`--text-xs: 1rem`) and tabular numerals for data alignment (`.tabular`).
- **Contrast & Ergonomics:** Touch targets enforce a minimum 48×48px boundary (`.target`, `repo/client/src/components/CandleChart.tsx`). High-contrast focus rings (`--focus-ring: #2C5677`, 3px outline) are active across all interactive elements (`repo/client/src/styles/index.css`).

### Shipped screens and user journey
- **Onboarding (`repo/client/src/screens/Onboarding.tsx`, `design/live/01-onboarding-1.png`–`03.png`):** Three clean value-proposition cards with progress pills and accessible screen-reader live announcements (`repo/docs/accessibility/transcripts/01-onboarding-1.txt`). Uses emoji (`📈`, `🎯`, `🔥`) as temporary illustrations.
- **Path Home / The Living Chart (`repo/client/src/screens/PathHome.tsx`, `design/live/02-path-full.png`):** Dark gradient background (`.journey-shell`), HUD showing Knowledge Index XP and persistence days (`▥`), a 7-day persistence volume panel, a reversed candle list (newest candle on top, ordered 01 to 09), a "Resistance" gate marker, and a sticky "Continue the live candle" CTA docked to the bottom.
- **Lesson Principle & Guided Walkthrough (`repo/client/src/screens/LessonCard.tsx`, `design/live/03-lesson-card.png`, `04-guided-narrated.png`, `05-guided-text.png`):** Principle card with mini-chart, switching into a guided example. Offers both a narrated mode (auto-drawing candles synced to Nova TTS audio via audio sprites; `repo/client/src/narration.ts`) and a stepped text mode with a dashed candle spotlight.
- **Graded Practice & Reveal (`repo/client/src/screens/ExerciseScreen.tsx`, `RevealScreen.tsx`, `design/live/06-exercise.png`, `07-exercise-selected.png`):** Point-in-time cut practice charts with multiple choice and interactive candle selection (`pick_the_candle`). Score breakdown displays base, difficulty, speed bonus, and hint deductions without confusing exercise score with lifetime Knowledge Index XP (`repo/docs/accessibility/transcripts/06-reveal-correct.txt`).
- **Profile & Legal (`repo/client/src/screens/Profile.tsx`, `LegalScreen.tsx`):** Local device stats (XP, streaks, lessons completed, crowns), narration preference toggle, and links to Terms of Use and Privacy Policy.

---

## 3. Gaps against the documented intent

| Spec / requirement | Source doc | Status | Evidence |
|---|---|---|---|
| **Living Chart Spatial Journey** | `docs/01-product-bible-v0.2.md` §2; `docs/02-living-chart-progression-spec.md` | **Partial / Diverged** | Live app implements a vertical card stack with candle icons (`repo/client/src/screens/PathHome.tsx`, `design/live/02-path-full.png`), not a climbing candlestick ridge or spatial trail. In Stitch (`design/stitch-journey/`), concepts explore trading floors and city streets instead of the core candlestick progression metaphor. |
| **Design Tokens v2 (State Colors, Layout Chrome, Icons)** | `docs/09-design-spec-tokens-v2-motion-annotations.md` Part 1 | **Missing** | Only Tokens v1 is present in the repo (`repo/specs/tikerino-design-tokens-v1.css`). Onboarding still uses raw emoji (`repo/client/src/screens/Onboarding.tsx: CARDS`), and the Path HUD relies on unicode glyphs (`✓`, `↑`, `▶`, `◇`, `▥` in `PathHome.tsx`). |
| **Chart Annotation Vocabulary** | `docs/09-design-spec-tokens-v2-motion-annotations.md` Part 3 | **Missing** | Shipped `CandleChart.tsx` only renders single-candle spotlights (`highlightIndex`) and the cut line. Range brackets, price zones, trendlines, volume highlights, and moving averages are not implemented. |
| **Tikerino Bull Mascot UI Integration** | `docs/01-product-bible-v0.2.md` §6; `docs/04-bull-character-animation-brief.md` | **Missing** | No bull mascot assets appear anywhere in the live app (`design/live/`). The header uses a plain text wordmark. Stitch explorations feature unapproved round green alien-like mascots (`design/stitch/screens/bullissimo-brand-splash-screen.png`, `onboarding-registration.png`) violating the locked hand-drawn bull head logo (`repo/specs/DECISIONS.md`). |
| **Daily Persistence Ladder (+2 XP/day capped at +20)** | `docs/01-product-bible-v0.2.md` §3; `docs/02-living-chart-progression-spec.md` §2 | **Partial** | Shipped path HUD displays a static `+10 XP` daily practice label (`DAILY_PRACTICE_XP`), failing to reflect the approved consecutive-day ladder (+10, +12, +14... up to +30 max) in UI copy. |
| **Explorable Explanation / Misconception Feedback** | `docs/06-design-template-library.md` T6; `docs/10-game-design-playbook.md` P1 | **Partial** | Shipped `RevealScreen.tsx` shows text feedback and reveal candles, but lacks interactive diagnostic tapping or a structured recovery/retry loop for missed questions. |
| **Stitch Mockup Alignment with Product Rules** | `docs/01-product-bible-v0.2.md` §1, §3, §4, §5 | **Spec Violation in Design** | Stitch mockups (`design/stitch/screens/exercise-incorrect-answer-feedback-mobile.png`, `market-exam.png`, `onboarding-registration.png`) introduce hearts/lives (❤️ 5), real tickers ("AAPL", "TSLA"), simulated returns ("+6.4% Rally!"), trading simulator CTAs ("Trade/Wait/Skip"), and registration name/email forms—all explicitly forbidden by Bible locks. |
| **Theme Cohesion (Dark vs Light)** | `docs/01-product-bible-v0.2.md` §6; `docs/02-living-chart-progression-spec.md` §7 | **Partial** | Path Home is forced into a dark gradient shell (`.journey-shell`), while Lesson Cards and Exercises are rendered on paper white (`#FAFAF7`) without unified theme tokens or user toggles. |

---

## 4. Risks and issues

### High Severity
1. **Severe Scope Creep & Regulatory Contradiction in Design Mockups:**
   - *Why it matters:* Several Stitch design files (`design/stitch/screens/exercise-incorrect-answer-feedback.png`, `market-exam.png`, `lesson-support-and-resistance.png`) introduce a Duolingo-style hearts/life loss system (`❤️ 5`), real-world tickers (`AAPL`, `TSLA`, `BTC/USD`), return predictions (`+6.4% Rally!`), and trading simulation commands (`Trade, wait, or skip?`). Product Bible v0.2 §1 strictly forbids trading simulation, real tickers, return claims, and loss/punishment mechanics. If Engineering treats Stitch as a visual specification, it will violate regulatory boundaries and product integrity contracts.
2. **Path Home Sticky CTA Collides with Content on Mobile Viewports:**
   - *Why it matters:* In `design/live/02-path.png` and `02-path-full.png`, the sticky green bottom button (`.journey-cta`) directly overlaps and obscures candle rows (specifically candle 04 and 05). While keyboard focus handles scroll padding (`repo/client/src/styles/index.css`), visual touch interaction is compromised, breaking thumb-zone ergonomics and obscuring lesson progression.

### Medium Severity
3. **Absence of Approved Mascot Asset in Live Experience:**
   - *Why it matters:* Guy’s hand-drawn bull head logo was officially locked on 12 September (`repo/specs/DECISIONS.md`), but the live app still displays a generic text wordmark and emoji. Meanwhile, Stitch features an unauthorized green blob ("Pippin"), creating brand confusion and delaying emotional milestones (onboarding welcome, exam passes).
4. **Reliance on Raw Unicode & System Emojis:**
   - *Why it matters:* `repo/client/src/screens/Onboarding.tsx` uses raw emoji (`📈`, `🎯`, `🔥`), and `PathHome.tsx` uses raw Unicode symbols (`✓`, `↑`, `▶`, `◇`, `▥`). These render unpredictably across operating systems (iOS vs Android vs Windows), undermining the professional aesthetic and violating the Design Tokens v2 iconography specification (`docs/09-design-spec-tokens-v2-motion-annotations.md`).
5. **Theme Discontinuity Between Journey and Learning Loop:**
   - *Why it matters:* The abrupt jump from the dark, immersive Living Chart (`#071827`, `design/live/02-path-full.png`) to the stark white paper theme of lesson cards and exercises (`#FAFAF7`, `design/live/03-lesson-card.png`) creates optical jarring and eye fatigue, lacking the unified light/dark experience promised in Product Bible §6.

### Low Severity
6. **Physical Device Screen-Reader Verification Outstanding:**
   - *Why it matters:* The accessibility matrix (`repo/docs/accessibility/MATRIX.md`) confirms automated Axe-core and Chrome AX-tree passes, but physical testing on VoiceOver (iOS) and TalkBack (Android) remains `UNVERIFIED`. Live gesture swipes and audio focus switches during narration could exhibit undetected edge cases.

---

## 5. Plan of action

### P0 (Do Next - Immediate Alignment & Ergonomic Fixes)

#### P0.1: Sanitize & Re-align Design Specifications to Product Bible
- **Goal:** Discard non-compliant mechanics (hearts, real tickers, trading buttons, user registration) from design mockups and re-establish a single source of design truth matching Product Bible v0.2.
- **Concrete Deliverables:** Sanitized template guideline document for Exercise, Feedback, and Path screens; redline audit rejecting hearts, real assets, and "Trade" CTAs in Stitch.
- **Files/Specs:** `docs/01-product-bible-v0.2.md`, `docs/06-design-template-library.md`, `design/stitch/`.
- **Acceptance Criteria:** Zero mockups contain lives/hearts, real company tickers, return promises, or trading simulator CTAs. Graded practice strictly uses synthetic assets and multiple choice / candle picker.
- **Effort:** Small (S).
- **Dependencies:** None.

#### P0.2: Fix Path Home Ergonomics and Floating CTA Collision
- **Goal:** Eliminate the visual overlap where the sticky continue button occludes candles on standard 390px viewports.
- **Concrete Deliverables:** Updated CSS and layout markup for `PathHome.tsx` adding proper container clearance (`padding-bottom: 7.5rem`) and thumb-friendly card hierarchy.
- **Files/Specs:** `repo/client/src/screens/PathHome.tsx`, `repo/client/src/styles/index.css`, `design/live/02-path.png`.
- **Acceptance Criteria:** On a 390×844px viewport, the learner can smoothly scroll every candle card completely above the sticky CTA; no text or glyph is clipped or occluded.
- **Effort:** Small (S).
- **Dependencies:** Engineering hand-off to implement CSS tweaks.

#### P0.3: Adopt Tokens v2 & Formalize Iconography System
- **Goal:** Replace temporary platform emoji and raw Unicode glyphs with an accessible, coherent SVG icon library.
- **Concrete Deliverables:** SVG icon sprite / component spec (24px grid, 2px stroke, rounded caps: streak flame, Knowledge Index diamond, locked padlock, checkmark, play arrow, volume bars); update `tikerino-design-tokens-v2.css`.
- **Files/Specs:** `docs/09-design-spec-tokens-v2-motion-annotations.md`, `repo/specs/tikerino-design-tokens-v1.css`, `repo/client/src/screens/Onboarding.tsx`, `repo/client/src/screens/PathHome.tsx`.
- **Acceptance Criteria:** Emojis completely removed from onboarding cards; path status indicators use accessible vector icons; all icons pass WCAG non-text contrast (3:1).
- **Effort:** Medium (M).
- **Dependencies:** Engineering to import SVG components into client bundle.

---

### P1 (Soon - Visual Upgrades & Pedagogy Polish)

#### P1.1: Advance Living Chart Path UX (Concept Selection Implementation)
- **Goal:** Transition from the linear card list (`design/live/02-path-full.png`) into the approved "Living Chart" candlestick progression world.
- **Concrete Deliverables:** High-fidelity component specs for forming candles, the Safe Floor baseline, resistance breakout gates, and the +2 to +20 XP persistence volume ladder.
- **Files/Specs:** `docs/02-living-chart-progression-spec.md`, `docs/05-journey-path-two-concepts.md`, `repo/client/src/screens/PathHome.tsx`.
- **Acceptance Criteria:** Shipped path reflects forming candles, clear Safe Floor support line, and persistence volume ladder (+2 to +20) adhering to WCAG 2.1 AA non-color cues.
- **Effort:** Large (L).
- **Dependencies:** Product Owner decision on Journey Concept A vs B; Engineering state integration.

#### P1.2: Chart Annotation Component Library (T4, T5, D2)
- **Goal:** Deliver design specs for the extended chart annotation vocabulary required for upcoming modules (support/resistance, indicators).
- **Concrete Deliverables:** Spec sheet and SVG styling rules for price zones, candle ranges, trendlines, moving average lines, and indicator sub-panels, complete with screen-reader narrative templates.
- **Files/Specs:** `docs/09-design-spec-tokens-v2-motion-annotations.md` Part 3, `repo/client/src/components/CandleChart.tsx`.
- **Acceptance Criteria:** All annotation patterns pass 3:1 non-text contrast against both light and dark chart backgrounds; each pattern provides an accessible screen-reader readout.
- **Effort:** Medium (M).
- **Dependencies:** Content workstream requirements; Engineering chart renderer updates.

#### P1.3: Bull Mascot Integration (Logo & Milestone Cameos)
- **Goal:** Integrate Guy's approved hand-drawn bull head logo into app chrome and define emotional milestone cameo rules.
- **Concrete Deliverables:** Production vector SVG assets of the approved bull head logo; layout specs for onboarding welcome, empty states, and exam pass celebrations per Character Brief v0.1.
- **Files/Specs:** `docs/04-bull-character-animation-brief.md`, `repo/client/src/components/ui.tsx`, `repo/client/src/screens/Onboarding.tsx`.
- **Acceptance Criteria:** Bull head logo cleanly rendered in app headers at 48px; mascot character appears strictly at approved emotional milestones, never inside exercises or persistent navigation.
- **Effort:** Small (S).
- **Dependencies:** PO selection of upright body variant (V1 vs V2).

---

### P2 (Later - Theming & Hardware Validation)

#### P2.1: Unified Dark / Light Theme Parity
- **Goal:** Resolve the jarring visual break between the dark Path and white lesson cards.
- **Concrete Deliverables:** Design system color tokens and UI specs for complete Light and Dark modes across all screens (Journey, Lesson, Practice, Reveal, Profile).
- **Files/Specs:** `docs/01-product-bible-v0.2.md` §6, `docs/02-living-chart-progression-spec.md` §7, `repo/client/src/styles/index.css`.
- **Acceptance Criteria:** Contrast table verifies WCAG 2.1 AA compliance across both color modes; user preference toggle persists in client profile.
- **Effort:** Large (L).
- **Dependencies:** Product Owner ratification of default theme.

#### P2.2: Physical Hardware Accessibility Verification
- **Goal:** Close the final verification gap in the accessibility bar.
- **Concrete Deliverables:** Device test protocol and audit log evaluating VoiceOver on iOS Safari and TalkBack on Android Chrome.
- **Files/Specs:** `repo/docs/accessibility/RELEASE_BAR.md`, `repo/docs/accessibility/MATRIX.md`.
- **Acceptance Criteria:** Zero focus loss or trapped focus during full loop traversal on physical devices; verified status updated in `MATRIX.md`.
- **Effort:** Medium (M).
- **Dependencies:** Access to physical testing hardware.

---

## 6. Decisions needed from the product owner

1. **Journey Path Metaphor Selection: Concept A vs Concept B**
   - *Context:* `docs/05-journey-path-two-concepts.md` proposed Concept A ("The Trail / Exchange Floor") and Concept B ("The Chart Climb / Candlestick Ridge"). The later Progression Spec (`docs/02-living-chart-progression-spec.md`) assumes a candlestick chart world, while Stitch explorations (`design/stitch-journey/`) explored 3D isometric exchange floors and desk expeditions.
   - *Blocks:* P1.1 (Living Chart visual progression overhaul).
   - *Recommendation:* **Approve Concept B ("The Chart Climb")**. It reinforces the core brand premise (raising the Knowledge Index on an authentic candlestick chart), aligns with Progression Spec v1.0, and avoids looking like a generic casual gaming clone.
2. **Upright Bull Character Body Selection: Variant 1 vs Variant 2**
   - *Context:* Guy approved the upright mascot direction and requested refinement between two Stitch options (`docs/04-bull-character-animation-brief.md`): V1 Athletic Guide (~3.5 heads tall) vs V2 Compact Spark (~2.5 heads tall).
   - *Blocks:* P1.3 (Milestone animations and SVG character assets).
   - *Recommendation:* **Approve Variant 2 ("Compact Spark")**. The ~2.5 heads ratio scales significantly better on mobile screens (retaining readability at 48px), preserves the primacy of the approved face drawing, and feels energetic without entering juvenile cartoon territory.
3. **Primary App Theme: Dark Mode Default vs Light Mode Default**
   - *Context:* Product Bible v0.2 §6 notes Guy has not formally chosen between dark and light, though dark is the planned primary theme for charting.
   - *Blocks:* P2.1 (Full theme unification).
   - *Recommendation:* **Adopt Dark Mode as the primary default**, with complete light mode parity available via profile settings. Dark charting reflects professional financial tooling and matches the shipped Living Chart path (`#071827`).
4. **Purging Prohibited Mechanics from Design Concept Boards**
   - *Context:* Stitch mockups contain hearts/lives, real stock tickers (AAPL, TSLA), return claims, and trading execution CTAs ("Trade/Wait/Skip"), which violate Product Bible §1.
   - *Blocks:* P0.1.
   - *Recommendation:* **Formally instruct all contributors to discard these mechanics** from UI boards, maintaining Tikerino's position as a low-stress, evidence-based learning game.

---

## 7. Hand-offs to the other domain

### What UI/UX Design needs from Engineering:
1. **Layout & Scroll Clearance Adjustments:** Implement bottom padding in `PathHome.tsx` and `.journey-shell` (`html { scroll-padding-bottom: 7.5rem }` and container padding) so the floating continue button no longer occludes the lower candle cards.
2. **Design Tokens v2 CSS Integration:** Consume the extended `tikerino-design-tokens-v2.css` variables in Tailwind and replace inline color values.
3. **SVG Icon Component Architecture:** Wire an SVG icon loader/component library into `client/src/components/ui.tsx` to replace raw Unicode glyphs (`▥`, `◇`) and emoji.
4. **Consecutive Persistence Ladder Display:** Connect the calculated daily practice award (+10 base + 2 per consecutive day, up to +30 max) to the Path Home UI copy instead of the hardcoded `+10 XP` string.
5. **Chart Annotation Layer Props:** Expose SVG annotation container hooks in `CandleChart.tsx` to support upcoming multi-candle ranges, horizontal price zones, and trendlines.

### What UI/UX Design will give Engineering:
1. **Production-Ready SVG Icon Pack:** Pixel-crisp, 24×24px vector icons with 2px stroke and rounded caps (Streak Flame, Knowledge Diamond, Check, Locked Padlock, Play, Volume Bar) tested for 3:1 contrast against both `--paper` and `--ink`.
2. **Living Chart Component Specs & Redlines:** Pixel-precise spacing, states (forming, complete, locked, resistance gate), and animation timing curves (`--ease-standard`, `--ease-spring`) for the rising candlestick path.
3. **Chart Annotation Language Style Guide:** SVG stroke weights, dash arrays, safe margin insets (12px), and accessibility narration formulas for price zones, ranges, trendlines, and moving averages.
4. **Master Mascot Asset Suite:** Production-ready SVG files of Guy's approved hand-drawn bull head logo and static fallback milestone poses for reduced-motion compliance.