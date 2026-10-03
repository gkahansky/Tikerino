# Design review and plan: Tikerino

## 1. Summary
The instructional core of Tikerino is live, shipping a clean, accessible, light-themed learning loop. However, the journey map is currently transitioning from the shipped dark "Living Chart" to the PO-mandated light "Exchange Floor" architectural map. The single most important thing to do next is to finalize the v2 Design Tokens, motion specs, and iconography inventory so Engineering can build this new daylit journey map while respecting our strict WCAG 2.2 AA accessibility and "no-loss / no-currency" constraints.

## 2. Current state
*   **Core Learning Loop**: Onboarding, path, principle cards, and exercises are functional and reachable (`repo/client/src/App.tsx`).
*   **Visual Implementation**: Lessons and exercises correctly utilize the light paper/surface theme and frozen v1 data tokens (`design/live/03-lesson-card.png`, `repo/client/src/styles/index.css`).
*   **Accessibility**: The live app has excellent baseline accessibility, passing keyboard focus, screen-reader reading order, and 200% text scaling (`repo/docs/accessibility/MATRIX.md`).
*   **Journey Map**: The live app currently uses the deprecated dark-themed "Living Chart" concept (`design/live/02-path.png`), which features dark gradients and green glowing elements. 

## 3. Gaps against the documented intent

| Spec / requirement | Source doc | Status (shipped / partial / missing) | Evidence |
| :--- | :--- | :--- | :--- |
| **Journey Map Concept** | PO Decision (D4) | Missing | `design/live/02-path.png` shows the dark "Living Chart". It must be replaced by the light "Exchange Floor" concept. |
| **Exercise Score** | PO Decision (D3) | Partial (Conflicts) | `repo/client/src/screens/RevealScreen.tsx` displays an "Exercise score" breakdown. PO explicitly mandated "no exercise score." |
| **Hint Cost** | PO Decision (D3) | Partial (Conflicts) | `repo/client/src/screens/ExerciseScreen.tsx` states "costs half the XP." PO explicitly mandated "hints are free." |
| **Banned Terminology** | PO constraint / Product Bible | Partial (Conflicts) | `design/live/02-path.png` uses "Streak Volume". Mockups use "Trader Desk". These violate the "no streak / no trade" rule. |
| **Iconography** | D5 / N9 Roadmap | Missing | `repo/client/src/screens/PathHome.tsx` uses text glyphs (`✓`, `↑`, `◇`) instead of the required custom vector icon inventory. |

## 4. Risks and issues
*   **High: Text Contrast on the Exchange Floor Map**. Isometric architectural maps create complex, unpredictable background colors. If text is placed directly on the map, it will fail WCAG 1.4.3 (4.5:1). This requires the strict use of solid white label plates.
*   **High: Banned Terminology in UI**. The live code and design files heavily use the terms "streak", "trade", and "ticker". Given the PO's strict negative constraints, leaving these in the UI risks violating the product's non-financial-advice / low-pressure boundaries.
*   **Medium: Mascot Inconsistencies**. The live app currently lacks the mascot entirely (`design/live/01-onboarding-1.png`), while mockups show multiple unapproved full-body variants. We must standardize on the locked head-only logo and a single upright body variant to prevent asset drift.

## 5. Plan of action

**P0 (Do next)**

*   **Goal**: Finalize Design Tokens v2 (N8) for the Light "Exchange Floor" map.
*   **Concrete deliverables**: Update `docs/09-design-spec-tokens-v2...md` with:
    *   *Surfaces*: Map background `--paper` (`#FAFAF7`), HUD/Video Wall `--surface` (`#FFFFFF`) with `--line` border. Solid label plates (`#FFFFFF`) to prevent bleed.
    *   *Station States*: 
        *   Locked: `--state-locked` (`#5B7186`) on plate (4.8:1 AA).
        *   Current: `--brand` (`#10B981`) border, text `--ink` (`#0F2B46`) (13.4:1 AA). Bull marker positioned here.
        *   Done: `--state-done` (`#0B5643`) on plate (6.4:1 AA).
    *   *Path Elements*: Review-gate barrier & Exit gate use `--ink` (`#0F2B46`). Safe Floor uses `--data-up` (`#0E9F6E`). Pullback uses `--accent-coral` (`#FF6B57`).
    *   *Mastery Levels* (Not started, Seen, Practised, Proficient, Mastered): Encoded via increasing border thickness/fill of `--brand-ink` on white plates.
    *   *Module Exam*: Uses `--accent-sun` (`#FFB020`) container with `--ink` text.
*   **Files touched**: `docs/09-design-spec-tokens-v2-motion-annotations.md`
*   **Acceptance criteria**: All token combinations pass WCAG 2.2 AA (min 4.5:1 for 16px text); UI for unbuilt features is removed; titles do not truncate; touch targets are >= 48px.
*   **Effort**: S
*   **Dependencies**: None.

*   **Goal**: Define the Brand Asset Pack & Iconography Spec (N9).
*   **Concrete deliverables**: 
    *   *Bull Master SVG Brief*: Head only, `growth-green` face, `ink-navy` horns/tuft, `soft-mint` muzzle. Fixed 2px stroke.
    *   *Icon Inventory* (All `#0F2B46` or `#0B5643`, achieving > 6:1 contrast on white):
        *   `lock` (Meaningful, Alt: "Locked")
        *   `check` (Meaningful, Alt: "Completed")
        *   `volume-1`, `volume-2`, `volume-3` (Meaningful, Alt: "Practice volume", replaces flame/streak).
        *   `play` (Meaningful, Alt: "Start lesson")
        *   `crown` (Meaningful, Alt: "Mastery achieved")
*   **Files touched**: `docs/09-design-spec-tokens-v2-motion-annotations.md`, new `design/icons/` folder.
*   **Acceptance criteria**: Every emoji/unicode glyph in app chrome is replaced. No flame, coin, or dollar icons exist. All icons pass 3:1 non-text contrast.
*   **Effort**: M
*   **Dependencies**: Product Owner decision on OFL vs Drawn icons (see Section 6).

*   **Goal**: Update Motion Spec for Exchange Floor interactions.
*   **Concrete deliverables**: 
    *   *Station Progression*: Bull marker hops to next node (350ms, `--ease-spring`). RM mapping: Instant snap.
    *   *Gate Unlock*: Padlock icon drops/fades out, plate expands (200ms, `--ease-standard`). RM mapping: Instant crossfade.
    *   *Exam Pass*: Full-screen celebration. Golden confetti burst (`--accent-sun`), 1200ms. RM mapping: Static "Exam Passed" banner.
*   **Files touched**: `docs/09-design-spec-tokens-v2-motion-annotations.md`
*   **Acceptance criteria**: Animations never exceed 1500ms; all animations have a 0ms `prefers-reduced-motion` static fallback.
*   **Effort**: S
*   **Dependencies**: Requires finalized v2 tokens.

**P1 (Soon)**

*   **Goal**: Remove banned terminology, scoring, and hint costs from the UI.
*   **Concrete deliverables**: Redesign the Reveal and Exercise screens to remove the "Exercise score" breakdown entirely. Update the hint button to remove "costs half the XP." Audit and replace any remaining uses of "streak", "trade", "ticker", and "currency" in layout copy with "practice volume", "market", "instrument", and "XP".
*   **Files touched**: `repo/client/src/screens/RevealScreen.tsx`, `repo/client/src/screens/ExerciseScreen.tsx`, `repo/client/src/screens/PathHome.tsx`
*   **Acceptance criteria**: No calculation/score UI appears on the reveal screen; hints show no cost; banned terms return 0 results in a repo text search.
*   **Effort**: S
*   **Dependencies**: Engineering implementation.

**P2 (Later)**

*   **Goal**: Integrate the upright Mascot into Onboarding and Milestones.
*   **Concrete deliverables**: Finalize the upright body variant (waiting on previous PO pick between V1 and V2) and create the static SVG poses for onboarding (Welcome) and module milestones (Flag-plant).
*   **Files touched**: `docs/04-bull-character-animation-brief.md`, `repo/client/src/screens/Onboarding.tsx`
*   **Acceptance criteria**: Mascot appears only in non-instructional moments. Colors match the strict 3-color brand palette.
*   **Effort**: M
*   **Dependencies**: Engineering asset pipeline.

## 6. Decisions needed from the product owner

1.  **Caption band default background**: 
    *   *Recommendation*: Use the Light/Paper surface (`#FAFAF7`) with `--ink` text. This perfectly matches the overall light theme of the exercises and the new Exchange Floor, ensuring visual cohesion, whereas a dark band would create an unnecessarily heavy visual break.
2.  **Icon set approach (Drawn vs OFL)**: 
    *   *Recommendation*: Adopt an OFL set (Phosphor) adapted to our brand (2px stroke, round caps, `--ink` color). This saves weeks of custom asset generation while maintaining the professional, geometric aesthetic required.
3.  **Moving Average (MA) legend chip categorization**: 
    *   *Recommendation*: Treat it strictly as *chrome* (placed outside the chart plot area). This preserves the chart as the uncluttered "hero" and ensures the legend text can be rendered at the mandatory 16px minimum size without obscuring data.

## 7. Hand-offs to the other domain

**What I need from Engineering:**
*   A staging deployment of the new Exchange Floor map with the blank architectural assets so I can run a live WCAG contrast check on the new solid label plates.
*   Confirmation of the routing/state logic for the "free hints" and "no exercise score" requirements, ensuring the backend grading API no longer expects or returns penalty calculations to the frontend.

**What I will give Engineering:**
*   The final, PO-approved CSS additions for `tikerino-design-tokens-v2.css`, providing exact hex codes and borders for the Exchange Floor map.
*   The completed SVG Icon Pack containing the volume glyphs, locks, checks, and crowns to replace all placeholder Unicode text.
*   The updated CSS keyframe logic for the new `hop`, `unlock`, and `exam-pass` animations, including their `@media (prefers-reduced-motion: reduce)` overrides.