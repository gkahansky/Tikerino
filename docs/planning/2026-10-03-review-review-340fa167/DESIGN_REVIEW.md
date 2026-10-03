# Design review and plan: Tikerino

## 1. Summary
The design workstream has successfully defined tokens, accessibility pairings, and the core template structure for Tikerino, and the repository accurately reflects the v1 design system. However, the Stitch design workspace is heavily bloated with superseded concepts, unbuilt features (Drills, Personas, Accounts), banned mechanics (Hearts), and rejected visual directions (Dark Living Chart, 4-legged mascot). The immediate next step is to execute a ruthless cleanup of the Stitch workspace based on the Product Owner's explicit directives so Engineering only sees locked, approved screens.

## 2. Current state
The repository accurately mirrors the approved v1 design system (`repo/specs/tikerino-design-tokens-v1.css`, `repo/specs/tikerino-tailwind.config.js`). The live app successfully implements the mobile-first layouts, accessible touch targets (>= 48px), tabular chart numerals, and contrast rules without dark-mode pollution. However, the Stitch workspace is in a divergent state: there are 55 screens across two projects, many of which directly contradict the locked MVP boundaries defined in the Product Bible and `docs/04-bull-character-animation-brief.md`.

## 3. Gaps against the documented intent
| Spec / requirement | Source doc | Status (shipped / partial / missing) | Evidence |
|---|---|---|---|
| Single approved journey path | PO Directive & `docs/05-journey-path-two-concepts.md` | Partial | `design/stitch-4394499492415802116` is cluttered with raw AI art and rejected District/Desk concepts instead of only the approved Exchange Floor. |
| Zero loss framing or punishment | `docs/02-living-chart-progression-spec.md` (Sec 4) | Missing (in mockups) | `design/stitch.../exercise-incorrect-answer-feedback.png` includes "-1 Heart", violating the locked guardrails. |
| Mascot body selected | `docs/04-bull-character-animation-brief.md` | Partial | `design/stitch.../mascot-refinement-upright-variants.png` is ready but awaiting Guy's final pick. |
| No account/registration walls | `docs/01-product-bible-v0.2.md` (Sec 5) | Missing (in mockups) | `design/stitch.../onboarding-registration.png` features "Create Account" and "Sign In", which are not in the current MVP scope. |

## 4. Risks and issues
*   **High:** Developer confusion from Stitch bloat. If Engineering references screens like `status-progress-hub.png` or `learning-path-candlestick-ridge.png`, they will build rejected features (Drills, Masteries) or the deleted "lessons are candles" dark theme.
*   **High:** Accidental inclusion of banned loss-framing. Mockups containing "Hearts" directly threaten the strict self-determination theory and "no punishment" game design rules.
*   **Medium:** Missing UI definitions for approved features. We lack clean, finalized mockups for the multiple-choice mixed review (`docs/06-design-template-library.md` T8) and the exact recovery flow without the "Hearts" UI.

## 5. Plan of action

### P0: Execute Stitch Cleanup Inventory
*   **Goal:** Strip the Stitch workspace down to only approved or active work-in-progress files, per the Product Owner's directive.
*   **Concrete deliverables:** Apply the following table to Stitch.
*   **Touches:** Stitch Projects `2752353384096587514` and `4394499492415802116`.
*   **Acceptance criteria:** All screens marked DELETE are archived/removed.
*   **Effort:** S
*   **Dependencies:** None.

#### Stitch Cleanup Inventory
*Note: Specific 32-character node IDs are inferred where absent based on filename/title.*

**Project: 4394499492415802116 (Tikerino Journey Map Concepts)**
| # / Title (File) | Classification | Reason |
|---|---|---|
| 1. Full mobile screen... auth.png | DELETE | Raw AI generation; superseded. |
| 2. Concept A: Exchange Floor | DELETE | Contains unbuilt features (Drills, Leagues). |
| 3. Full mobile screen... tangi.png | DELETE | Raw AI generation (Desk); superseded. |
| 4. Full mobile screen... dd03.png | DELETE | Raw AI generation (Daylight); superseded. |
| 5. Concept B: Market District | DELETE | Unbuilt features; concept superseded. |
| 6. Full mobile screen... 9824.png | DELETE | Raw AI generation (Night); superseded. |
| 7. Concept A: Exchange Floor (75f0) | DELETE | Older variant with unbuilt features. |
| 8. Full vertical mobile... 9:16 | DELETE | Raw AI generation; superseded. |
| 9. Concept C: Trading Desk | DELETE | Superseded concept. |
| 10. Concept A: Exchange Floor (v2) | DELETE | Superseded curriculum map. |
| 11. Vertical mobile map... bri.png | DELETE | Raw AI generation; superseded. |
| 12. Full mobile screen... dayli.png | DELETE | Raw AI generation (District); superseded. |
| 13. Concept A: Exchange Floor (v3) | KEEP-APPROVED | Latest approved design (matches PO's Exchange Floor node 8d628d06fa43461bbcb03c3396bf9c80 request). *Requires UI strip of "Drills" nav.* |
| 14. Concept C: Trading Desk (983e) | DELETE | Superseded concept. |
| 15. Concept B: Market District (af4a) | DELETE | Superseded concept. |

**Project: 2752353384096587514 (Investing Education Game - MVP)**
| # / Title (File) | Classification | Reason |
|---|---|---|
| 1. Correct Answer Feedback (Dark) | DELETE | PO directive: delete dark-theme versions. |
| 2. Onboarding & Registration | DELETE | Accounts/registration are unbuilt features. |
| 3. The Living Chart | DELETE | PO directive: delete 'lessons are candles' / dark journey. |
| 4. Tikerino - Design System | KEEP-IN-PROGRESS | Primary spec for Tokens v2 and components. |
| 5. Market Exam | DELETE | Uses banned action term "Trade". |
| 6. Learning Path - Tikerino | DELETE | Old/superseded map concept. |
| 7. Learning Path - Reading Charts | DELETE | Old/superseded map concept. |
| 8. Design System (2fef) | DELETE | Duplicate/superseded. |
| 9. Candlestick Summit Map | DELETE | 'Lessons are candles' concept. |
| 10. Lesson: Support and Resistance | KEEP-IN-PROGRESS | Valid lesson UI template (needs content check). |
| 11. Design System (8b27) | DELETE | Duplicate/superseded. |
| 12. Settings & Account Menu (Mobile) | DELETE | Unbuilt features (Premium, profile editing). |
| 13. Settings & Account Menu | DELETE | Unbuilt features. |
| 14. DESIGN.md | DELETE | Auto-generated/obsolete. |
| 15. The Living Chart - Light | DELETE | 'Lessons are candles' concept. |
| 16. Mascot Refinement - Upright | KEEP-IN-PROGRESS | Awaiting Guy's pick (Athletic Guide vs Compact Spark). |
| 17. Candlestick Ridge | DELETE | 'Lessons are candles' concept. |
| 18. Tickerino Splash Screen | DELETE | Old working name. |
| 19. Design System (4ad9) | DELETE | Duplicate/superseded. |
| 20. Onboarding & Registration (Mobile) | DELETE | Accounts are unbuilt. |
| 21. Four-legged Study | DELETE | PO directive / rig dropped. |
| 22. Correct Answer Feedback | KEEP-IN-PROGRESS | Valid light-mode feedback template. |
| 23. DESIGN.md (1032) | DELETE | Auto-generated/obsolete. |
| 24. Learning Path - Journey Centered | DELETE | Old concept. |
| 25. Mascot Body Options | DELETE | Unapproved Blob/Chibi bodies dropped by Guy. |
| 26. Correct Answer Feedback (Mobile) | KEEP-IN-PROGRESS | Valid light-mode feedback template. |
| 27. Tradisimo! Splash Screen | DELETE | Old working name. |
| 28. Status & Progress Hub | DELETE | UI for unbuilt features (Drills, Mastery by Unit). |
| 29. Mascot Body Options (6490) | DELETE | Superseded variants. |
| 30. Design System (65a7) | DELETE | Duplicate/superseded. |
| 31. Learning Path - Reading Charts | DELETE | Old concept. |
| 32. Incorrect Answer Feedback | DELETE | Features banned mechanics (Hearts). |
| 33. Bullissimo Splash Screen | DELETE | Old working name. |
| 34. DESIGN.md (1457) | DELETE | Auto-generated/obsolete. |
| 35. Status & Progress Hub (Mobile) | DELETE | UI for unbuilt features. |
| 36. Incorrect Answer Feedback (Mobile) | DELETE | Features banned mechanics (Hearts). |
| 37. Design System (a1c4) | DELETE | Duplicate/superseded. |
| 38. Learning Path - Centered | DELETE | Old concept. |
| 39. Mascot v3 - Connected Silhouette | DELETE | Unapproved body variants (Fintech vs Editorial). |
| 40. Onboarding - Welcome Screen | DELETE | Has "I already have an account". |

### P1: Reorganize Stitch Workspace
*   **Goal:** Create a clean taxonomy so Engineering and Content can self-serve the source of truth without ambiguity.
*   **Concrete deliverables:** Implement the following folder/naming structure in Stitch:
    *   `01_Approved_Journey_Map` (Contains only the Exchange Floor v6b)
    *   `02_Design_System` (Tokens v1/v2, Typography, Components)
    *   `03_Screen_Templates` (Cleaned Lesson Cards, Exercises, Reveals)
    *   `04_Mascot_Assets` (Upright variants awaiting pick)
    *   `99_Archive` (For reference, if deletion isn't permanent)
*   **Touches:** Stitch project organization.
*   **Acceptance criteria:** Folders exist and correctly house the 5 KEEP files.
*   **Effort:** S
*   **Dependencies:** P0 complete.

### P2: Clean up the Approved Templates
*   **Goal:** Ensure the surviving screens reflect the absolute letter of the Product Bible.
*   **Concrete deliverables:** 
    1. Scrub the bottom navigation bar on `Concept A: Exchange Floor (v3)` to remove "Drills" and "Personas".
    2. Redesign the "Incorrect Answer Feedback" template without Hearts or penalty framing, replacing it with the explorable diagnostic state required by `docs/06-design-template-library.md`.
*   **Touches:** Stitch screens `13` (Map) and a new iteration for `36` (Incorrect Feedback).
*   **Acceptance criteria:** Mockups contain zero banned terms and zero unbuilt navigation tabs.
*   **Effort:** M
*   **Dependencies:** None.

## 6. Decisions needed from the product owner
*   **Mascot Body Pick:** Decide between *V1 Athletic Guide* and *V2 Compact Spark* from the `Mascot Refinement - Upright Variants` screen so animation rigging can begin. (Recommendation: V2 Compact Spark; its 2.5 head ratio scales better on mobile UI nodes).
*   **Exchange Floor Navigation Scrub:** Confirm it is correct to digitally paint out "Drills" and "Personas" from the bottom navigation of the KEEP-APPROVED Exchange Floor map, as they are out of scope for the MVP. (Recommendation: Yes, scrub them to prevent scope creep).

## 7. Hand-offs to the other domain
*   **What I need from Engineering:** Please pause extracting any assets, hex codes, or layouts from the Stitch links until the P0 cleanup is complete, as the current workspace contains dangerous contradictions to the codebase.
*   **What I will give Engineering:** A newly structured Stitch workspace (`01_Approved_Journey_Map`, `02_Design_System`, etc.) that perfectly mirrors the established bounds of the app, ensuring you never waste time building a rejected feature.