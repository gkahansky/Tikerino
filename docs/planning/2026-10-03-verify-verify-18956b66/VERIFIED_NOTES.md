# Verified notes: Design review and plan: Tikerino

I checked the document's claims against the code at `gukateam/review-review-f1139899`: `client/`, `packages/`, `specs/` and `docs/`. The document's `repo/…` paths are at the repo root here. The `design/live/*.png` screenshots, Stitch mockups and `docs/planning/2026-10-03-review-review-f1139899/` are not in this repo. Contrast ratios marked "hand-computed" use the WCAG relative-luminance formula.

| # | Claim | Verdict | Evidence (path:line) |
|---|---|---|---|
| 1 | Core loop (onboarding, path, principle card, exercises) works and can be reached from `App.tsx` | Confirmed | `client/src/App.tsx:79-154` |
| 2 | Lessons and exercises use the light paper theme and the frozen v1 tokens | Confirmed (code); screenshot Unverifiable | `client/src/styles/index.css:2,17-18,142`; `specs/tikerino-design-tokens-v1.css:28-29` |
| 3 | Accessibility passes keyboard, reading order and 200% text (MATRIX.md) | Partly | `docs/accessibility/MATRIX.md:7-32` shows PASS on every screen. But VoiceOver/TalkBack were never run on devices (`MATRIX.md:5`, all "UNVERIFIED"). The journey also has 14px text, below the 16px floor (`index.css:145-147`, `.875rem`). |
| 4 | The live journey is the dark "Living Chart" with dark gradients and a green glow | Confirmed (code) | `client/src/screens/PathHome.tsx:43`; `index.css:143` (`#071827` gradient, `.is-forming` box-shadow glow) |
| 5 | Exchange Floor journey: Missing; PO D4 replaces the Living Chart map | Confirmed | `docs/decisions/2026-10-03-product-owner-decisions.md:10-19`; no Exchange Floor code in `client/` |
| 6 | RevealScreen shows an "Exercise score" breakdown; D3 removes it | Confirmed | `client/src/screens/RevealScreen.tsx:123-141,144`; `decisions…md:8` |
| 7 | ExerciseScreen says "costs half the XP"; D3 says hints are free | Confirmed | `client/src/screens/ExerciseScreen.tsx:229`; `decisions…md:8` |
| 8 | `02-path.png` uses "Streak Volume", which breaks a "no streak" rule | Refuted / Unverifiable | The live path panel is labelled "Persistence" (`PathHome.tsx:78`). "Streak Volume" is the **approved** label in `docs/product/02-living-chart-progression-spec.md:48`. The screenshot is not in the repo. |
| 9 | Mockups use "Trader Desk" | Unverifiable | No match anywhere in the repo |
| 10 | Iconography gap (D5 / N9); PathHome uses text glyphs `✓ ↑ ◇` | Partly | D5 is the design-charter workstream (`docs/product/07-design-workstream-charter.md:37`), not the PO's D5. N9 is at `JOINT_ROADMAP.md:77`. PathHome also uses `▶` and `▥` (`PathHome.tsx:29,66`), `▥` is also in `components/ui.tsx:106`, and onboarding uses emoji 📈🎯🔥 (`Onboarding.tsx:17,22,27`). |
| 11 | Exchange Floor text needs solid label plates | Confirmed (plates required); "isometric" Unverifiable | `decisions…md:15` |
| 12 | Live code "heavily" uses "streak", "trade" and "ticker" | Partly | "streak" appears in learner copy at `Onboarding.tsx:25-26`, `Profile.tsx:28,55` and `LegalScreen.tsx:43`. "trade" and "ticker" appear in no client UI string. What is banned is **real tickers** (AAPL etc.), not the word (`ENGINEERING_CRITIQUE.md:94`, `JOINT_ROADMAP.md:72`). |
| 13 | The live app has no mascot | Confirmed | No bull or mascot asset in `client/` (search) |
| 14 | Logo is head-only and locked; body variants not yet approved | Confirmed | `docs/product/04-bull-character-animation-brief.md:48-49`; D8 still open at `decisions…md:28` |
| 15 | Token file is `docs/09-design-spec-tokens-v2...md` | Refuted | It is `docs/product/09-design-spec-tokens-v2-motion-annotations.md`. Final tokens must land in `specs/` after Guy signs off (`decisions…md:7`, `JOINT_ROADMAP.md:76`). |
| 16 | Token hex values for paper, surface, brand, ink, brand-ink, data-up, coral and sun | Confirmed | `specs/tikerino-design-tokens-v1.css:16-38` |
| 17 | Locked state: `--state-locked` `#5B7186` at 4.8:1 | Partly | The draft sets `--state-locked: #9AA7B0`, decorative only (`09-…md:8`). `#5B7186` is actually `--ink-2` (`v1.css:22`). 4.8:1 is the ratio on paper (`v1.css:6`); on a white plate it is about 5.1:1 (hand-computed). |
| 18 | Current: `--ink` text at 13.4:1 | Partly | 13.4:1 is the ratio on paper (`v1.css:5`). On a white plate it is about 14.4:1 (hand-computed). A `--brand` border alone is about 2.2:1 (`v1.css:7`), which fails 3:1 non-text contrast. |
| 19 | Done: `--state-done` `#0B5643` at 6.4:1 | Partly | 6.4:1 is the v1 comment, measured on paper (`v1.css:8`). Hand-computed on white it is about 8.6:1. It passes either way. |
| 20 | Pullback uses `--accent-coral`; Safe Floor uses `--data-up` | Partly (rule conflict) | The pullback is drawn on the Knowledge Index chart (`decisions…md:24`). Coral is "NEVER inside the chart canvas" (`v1.css:24`), and state and accent colours stay out of the canvas (`09-…md:13`). `--data-up` is about 3.3:1, for graphics only (`v1.css:12`). |
| 21 | Exam container uses `--accent-sun` with `--ink` text | Confirmed | `v1.css:25` |
| 22 | Five mastery levels | Confirmed | `decisions…md:22` |
| 23 | Tokens P0 has no dependencies | Refuted | D2 requires Guy's sign-off (`decisions…md:7`) |
| 24 | Bull SVG brief: head only, green face, navy horns and tuft, mint muzzle, fixed 2px stroke | Partly | Anatomy matches (`04-…md:43,48`). The outline is "2px navy outline **optional** at small sizes" (`04-…md:10`). |
| 25 | Icons in `#0F2B46` or `#0B5643` reach more than 6:1 on white | Confirmed | Hand-computed: about 14.4:1 and 8.6:1 |
| 26 | Volume glyph replaces the flame; icons need 3:1 non-text contrast | Confirmed | `JOINT_ROADMAP.md:77` |
| 27 | Motion: bull hops 350ms with `--ease-spring`; gate 200ms with `--ease-standard` | Partly | The tokens exist (`09-…md:28`). The bull brief says walk-ahead is a **600–800ms** trot (`04-…md:20`). |
| 28 | Exam pass is the only full-screen celebration, with confetti up to 1200ms; cap of 1500ms | Confirmed | `09-…md:26,36`; `02-…spec.md:65` (exam 1500ms). The live reduced-motion setting is 0.001ms, not 0ms (`index.css:121`). |
| 29 | P1 files: Reveal, Exercise, PathHome | Partly | The list misses `Onboarding.tsx:21` ("XP broken down by base, difficulty and speed", a D3 conflict, plus "streak" at lines 25-26), `Profile.tsx:55` ("Longest streak") and `LegalScreen.tsx:43` |
| 30 | P1 acceptance: banned terms return 0 results in a repo text search | Refuted (not achievable) | "streak" is in code identifiers (`app-state.tsx:16,49`) and approved spec copy (`02-…spec.md:48`). N4 limits the test to learner-facing strings and allowlists the legal pages (`JOINT_ROADMAP.md:72`). |
| 31 | Mascot only in non-instructional moments; 3-colour palette | Confirmed | `04-…md:5,10` |
| 32 | Caption band recommendation: paper `#FAFAF7` | Partly | The draft's two options are dark `#0F2B46` at 92%, or **`#FFFFFF` surface** with a `--line` border (`09-…md:16,56`). Paper is not one of them. |
| 33 | Icon set choice is OFL (Phosphor) vs drawn | Confirmed | `09-…md:57` (Phosphor/Iconoir) |
| 34 | MA legend chip counts as chrome, outside the plot area | Confirmed | `09-…md:58` |
| 35 | Ask the backend to stop returning penalty calculations | Partly | The grading package still returns `hintPenaltyApplied` and `speedBonus` (`packages/grading/src/index.ts:21-23,124`). D3 keeps the score "in the audit record only" (`decisions…md:8`), so it should be hidden from the UI, not removed from the backend. |

## Corrections
- **#3:** The baseline is good, but not "excellent" without caveats. Device screen readers were never tested. The journey CSS has three 14px rules (`index.css:145-147`), already tracked as N5.
- **#8, #12:** "Streak Volume" is approved spec copy, and the live path says "Persistence". The real "streak" problems are onboarding card 3, Profile's "Longest streak" and the privacy text. "ticker" is not a banned word; real ticker symbols are. Don't rename "ticker" to "instrument" across the codebase.
- **#10:** The full glyph list is `✓ ↑ ▶ ◇ ▥` in PathHome and the TopBar, plus emoji 📈🎯🔥 in onboarding.
- **#15, #23:** Edit `docs/product/09-…md`. The final tokens move to `specs/` only after Guy's D2 sign-off, so the tokens P0 does depend on that.
- **#17–19:** The plan quietly changes `--state-locked` from `#9AA7B0` (about 2.5:1 on white, decorative only) to `--ink-2`. That change should be stated openly. The quoted ratios were measured on paper; the white-plate figures are about 5.1, 14.4 and 8.6. Current-state cues can't rely on a `--brand` border alone, because it is about 2.2:1.
- **#20:** Coral, and any non-data colour, can't mark pullbacks inside the Knowledge Index chart. Pick an ink or data-colour treatment, or get the v1 rule changed.
- **#24, #27:** The 2px outline is optional, not fixed. The bull's move to the next station is 600–800ms in the brief, not 350ms. Either line them up or flag the change.
- **#29:** P1 must also cover `Onboarding.tsx` (D3 score copy and streak), `Profile.tsx` and `LegalScreen.tsx`.
- **#30:** Reuse N4's acceptance criterion: a language contract test over learner-facing strings, with legal pages allowlisted.
- **#32:** The draft's light caption-band option is the white `#FFFFFF` surface with a `--line` top border, not paper.
- **#35:** Engineering should stop showing the score and hint penalty in the UI and keep them in the audit record, as D3 says. Removing them from the grading API goes further than D3.
- **Not in the gaps table:** the mascot (#13) depends on the PO's D8 decision (V1 vs V2), but the plan lists "Engineering asset pipeline" as its dependency and leaves D8 out of Section 6.