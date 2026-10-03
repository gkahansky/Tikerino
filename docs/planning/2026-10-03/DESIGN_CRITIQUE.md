# UI/UX Designer critique of the Engineering plan

## 1. Agreements
* **P0-1 (Persistence ladder implementation):** Endorse completely. Shipped UI hardcodes flat `+10 XP` because `packages/state/src/index.ts` enforces `DAILY_PRACTICE_XP = 10`. Aligning code and UI copy with the Product Bible §3 formula (+10 base, +2/day up to +30 max) is a mutual priority.
* **P0-2 (Storage durability & language contract test):** Endorse. Silently resetting corrupt storage to empty directly endangers learner trust. Automated linting for banned loss/punishment vocabulary across all learner-facing strings protects regulatory positioning.
* **P0-3 (Enforce 16px typography floor in CI):** Endorse. Catching `.875rem` (14px) violations in `index.css` via an automated computed-font check ensures strict compliance with our design tokens.
* **P1-1 (Semantic-event progression core):** Endorse. Grounding Living Chart states in an append-only, deterministic event stream guarantees consistent visual replay and text equivalents for accessibility.
* **Decision 3 (Retire legacy "Exercise score"):** Strongly endorse. Removing speed bonuses and hint deductions resolves learner confusion against Knowledge Index XP and eliminates punitive game mechanics.

---

## 2. Corrections and disagreements

### 1. Screen-reader reading order vs CTA positioning
* **Quote (Section 3 & Section 7):** *"Screen-reader order: HUD → current candle/CTA → gate → volume → nav ... PathHome.tsx puts the CTA last, after the volume panel ... The current CTA placement conflicts with §7."*
* **Why it is wrong/overstated:** Visual layout order does not dictate screen-reader order. The floating "Continue the live candle" CTA is docked at the visual bottom for ergonomic thumb reach on mobile viewports. Accessibility reading order can and should be controlled independently via logical DOM sequencing (or `aria-owns` / container grouping) without breaking visual ergonomics.
* **Fix:** Keep the floating CTA docked at the bottom of the viewport for physical thumb reach, but order the DOM elements or wrap accessibility focus landmarks so assistive technology reads: HUD → Active Forming Candle & Continue Action → Gate → Volume Panel → Navigation.
* **Certainty:** Certain (documented standard accessible layout pattern).

### 2. Deferral of brand assets and theme tokens to P2
* **Quote (Section 5, P2-2):** *"P2-2. Theme and brand assets ... Replace emoji with the icon set. Integrate the approved pixel-exact head-only bull..."*
* **Why it conflicts with documented rules:** Leaving P2-2 in "Later" forces production to continue displaying raw OS emojis (`📈`, `🎯`, `🔥`), platform unicode glyphs (`▥`, `◇`), and plain text wordmarks through all of P0 and P1. The bull logo was locked on 12 September (`repo/specs/DECISIONS.md`), and Tokens v2 iconography is already specified. Furthermore, theme divergence (dark path vs paper lesson cards) is the single most glaring visual defect on `tikerino.com`.
* **Fix:** Split P2-2. Move the **Bull Logo SVG integration** and **SVG Icon System** into **P0** (or early P1) alongside P0-1. Leave full dynamic light/dark runtime theme toggling in P2.
* **Certainty:** Certain.

### 3. Misclassification of Stitch mockups as active drift
* **Note on both plans:** Both plans flagged gamified elements (hearts, real tickers, "Trade" CTAs). However, the Engineering plan notes this in Section 4 Risk 1, while my own plan treated Stitch mockups as active drift.
* **Correction:** Verified project history shows Stitch mockups ("Investing Education Game - MVP") date back to 11 September, predating the locked Product Bible (19–25 September). They are superseded legacy explorations, not active engineering drift or live regulatory violations.
* **Fix:** Formally mark `design/stitch/` as archived legacy explorations. Treat them as historical reference rather than a live threat to the codebase.
* **Certainty:** Verified by human project notes.

---

## 3. Dependencies and hand-off conflicts

### 1. Persistence Ladder Copy & UI Layout (P0-1)
* **Conflict:** Engineering cannot ship P0-1 without the exact string format, empty-state copy, and placement for the consecutive day counter.
* **Resolution & Delivery:**
  * Active run copy: `"Day {N} in a row: +{X} XP"` (e.g., `"Day 3 in a row: +14 XP"`).
  * 0-day / missed run copy: `"Start a new streak today: +10 XP"`.
  * Design will provide exact badge styling and placement specs for `PathHome.tsx` and `RevealScreen.tsx` immediately to unblock P0-1.

### 2. Save-Warning Copy Replacement (P0-2)
* **Conflict:** P0-2 contract tests will fail on `RevealScreen.tsx` line 84 (*"Progress may be lost"*). Engineering needs non-punitive replacement copy before landing the test.
* **Resolution & Delivery:** Design supplies the compliant text:
  * *Headline:* `"Save pending"`
  * *Body:* `"We couldn't reach the server just now. Your progress is saved safely on this device and will sync automatically once reconnected."*

### 3. Path Home Bottom Clearance vs Sticky CTA (P0-2 / P0-3)
* **Conflict:** My plan flagged that the sticky CTA overlaps candles 04 and 05 on mobile. Engineering notes this is unverified in live scrolling.
* **Resolution:** Before engineering rewrites container layout, Design and Engineering will verify scrolling clearance on a physical 390×844px device. If content is occluded at maximum scroll, Engineering will add `scroll-padding-bottom: 7.5rem` and matching container clearance in `client/src/styles/index.css`.

### 4. Sequencing of Tokens v2 and Event Model (P1-1 vs P1-2)
* **Conflict:** Engineering's P1-1 (Progression core) expects visual Living Chart states (Safe Floor, pullback, breakout) that Design has not yet fully tokenized for dark/light themes.
* **Resolution:**
  1. **Step 1:** Design delivers static SVG specs and color tokens for Safe Floor, forming candles, and breakout gates (`docs/09-design-spec-tokens-v2-motion-annotations.md`).
  2. **Step 2:** Engineering wires the semantic-event state machine (`packages/progression`).
  3. **Step 3:** Joint integration on `PathHome.tsx`.

---

## 4. Changes to my own plan

1. **Downscale Stitch Mockup Alert (P0.1):** Drop P0.1 as a high-severity redline crisis. Reclassify it as an asset-hygiene task: move `design/stitch/` into `design/archive-pre-bible-stitch/` to prevent contributor confusion.
2. **Add Missing Copy Deliverables to P0:** Explicitly add the copy hand-offs requested by Engineering to my P0 deliverables:
   - Persistence ladder pill strings (Day N vs Day 0).
   - "Save pending" replacement copy for `RevealScreen.tsx`.
   - "Results ready" state indicator copy for reconnected offline answers (P1-2).
3. **Onboarding Streak Language Audit (P0.3):** Update Onboarding card 3 ("Build your streak, climb the path") and Profile screen ("Longest streak") to eliminate aggressive streak pressure, aligning with Product Bible §3 ("Avoid streak anxiety / pressure"). Replace with "Daily rhythm" or "Consecutive practice days".
4. **Resequence Bull Logo & Core Icons into P0:** Move the vector Bull Head master SVG and basic 24px icon set (flame, diamond, padlock, checkmark) into P0 to eliminate emojis and raw unicode simultaneously with the ladder copy update. Full theme switching remains in P2.
5. **Screen-Reader Reading Order Alignment:** Update the Living Chart component spec to explicitly instruct DOM node ordering: HUD → Live Candle/CTA landmark → Resistance Gate → Volume Ladder → Navigation, harmonizing visual bottom placement with accessible focus flow.