# Joint roadmap: Tikerino

## 1. Executive summary
Tikerino's core learning loop is live, and its integrity guarantees are enforced in CI. The progression layer has drifted from its spec: the approved persistence ladder is not built, progress lives only on the device, and some learner copy and type sizes break the accessibility and no-pressure rules. The next phase is about making the shipped app match what is already decided, before adding new rewards or a visual overhaul. The top three moves are:
1. Build the persistence ladder (+10 → +30) on top of storage-loss guardrails (N3 → N1).
2. Add a copy-and-accessibility conformance pass, enforced by a language contract test and the 16px font floor in CI (N2, N4, N5, N6).
3. Have Design deliver the bull head logo, icon set and final tokens now, so the emoji and Unicode glyphs can be replaced early in Next (N8, N9 → X1).

## 2. Decisions needed from the product owner

1. **Allow CI workflow changes.**
   - **Question:** How should the `verify.yml` change get pushed? The agent token lacks `workflow` scope.
   - **Options:** (a) push the diff yourself once; (b) grant `workflow` scope to the agent token.
   - **Recommendation:** (a), so branch-protection policy stays with you. Engineering proposed this; Design did not comment.
   - **Blocks:** N6.

2. **Status of Design Tokens v2 (doc 09).**
   - **Question:** Is doc 09 final and ready to hand into `specs/`?
   - **Options:** (a) confirm it is final as written; (b) approve it after Design's finalization pass in N8; (c) keep v1 for now.
   - **Recommendation:** The specialists disagree. Design treats v2 as locked; Engineering believes it is still a draft (medium confidence). The team recommends (b): a short Design pass, then your sign-off.
   - **Blocks:** N8, X2, and the token side of X1.

3. **The legacy per-answer "Exercise score"** (speed bonus; hints cost half).
   - **Question:** Keep it in the learner UI, or remove it? Bible §3 lists only four awards.
   - **Options:** (a) remove it from the learner UI, keep it in the audit record only, and make hints free; (b) keep it but relabel it; (c) keep it as is.
   - **Recommendation:** (a). Both specialists agree after the critiques. The Playbook warns against rewarding speed and charging for hints, and the ops board already records confusion between "+10 XP" and the legacy "12".
   - **Blocks:** X9.

4. **Journey metaphor: confirm the LC spec, or choose between Concepts A and B.**
   - **Question:** Does the Living Chart progression spec (a candlestick world) supersede doc 05's two concepts?
   - **Options:** (a) confirm the LC spec supersedes doc 05; (b) formally choose Concept B, "Chart Climb"; (c) choose Concept A, "Trail / Exchange Floor".
   - **Recommendation:** The specialists disagree on framing. Design asks for a new A/B decision and recommends B. Engineering thinks the LC spec has already settled it, but cannot verify that you ruled. Both positions lead to the candlestick world. The team recommends (a), with an explicit confirmation.
   - **Blocks:** X5, L1.

5. **Mastery, module-exam and Safe Floor interactions** (Open, Bible §7).
   - **Question:** What are the exact rules for mastery (+40), the module exam (+150), when the Safe Floor locks, and how pullbacks are bounded?
   - **Options:** (a) adopt Design proposal v2.1 as written; (b) adopt v2.1 with Engineering's determinism constraints; (c) ask for a revised proposal.
   - **Recommendation:** Engineering recommends (b): mastery is computed on the server from graded answers per stable skill ID; the Safe Floor locks only at exam-pass or mastery events; pullbacks are presentation-only. Design has not taken a position beyond speccing the visuals.
   - **Blocks:** L1 and L6. X5 can spec the visuals now but must mark them "pending D5".

6. **Google-profile continuity** (Open, Bible §5; LC spec §9).
   - **Question:** How should merge, recovery and deletion work? What progression data is stored server-side, and for how long?
   - **Options:** (a) Engineering's model: link device IDs without rewriting audit rows, store only semantic events and preferences, hard-delete on request, with legal review against the interim 18+ classification; (b) a different model; (c) defer accounts and ship an interim export/restore code to reduce the risk of progress loss.
   - **Recommendation:** (a) as the target. Consider (c) as a stopgap. This is Engineering's recommendation; Design did not comment.
   - **Blocks:** L10. The X10 design doc and spike can proceed without this decision.

7. **Default theme** (Open, Bible §6).
   - **Options:** (a) dark by default, with light available; (b) light by default, with dark available; (c) follow the system setting.
   - **Recommendation:** Design recommends (a), because it matches the shipped path and charting conventions. Engineering takes no position.
   - **Blocks:** L5. Tokenizing the dark journey colours (X2) is not blocked.

8. **Bull body variant.**
   - **Options:** V1 "Athletic Guide" (about 3.5 heads tall) or V2 "Compact Spark" (about 2.5 heads tall).
   - **Recommendation:** Design recommends V2, because it reads better at small mobile sizes. Engineering takes no position.
   - **Blocks:** L6 only. The static head logo is already locked and is not blocked.

9. **Public repository exposure.**
   - **Question:** The repo is public, and `server/src/ops-board.ts` publishes internal planning text. Is that acceptable?
   - **Options:** (a) accept; (b) move the board content out of the repo; (c) make the repo private.
   - **Recommendation:** Engineering flags this for your call; the team has no strong view.
   - **Blocks:** nothing directly. It affects how N7 refreshes the board.

## 3. Roadmap

### Now (next 1–2 weeks)

| ID | Item | Owner | Depends on | Acceptance criteria | Effort |
|---|---|---|---|---|---|
| N1 | **Persistence ladder** to `prog-rules-v1.0` (Eng P0-1; Des hand-off 4) | Engineering | N3; N2 for placement (the LC spec §6 wording can ship as a placeholder) | • Daily award = 10 + 2 × min(run − 1, 10).<br>• Dana tests pass: 7 days = 112 daily XP; missing day 8 gives +10 on day 9.<br>• Day 11 and later are capped at +30.<br>• Existing saved states only go up on load.<br>• A two-device merge gives one award per day.<br>• The XP-monotonic property test stays green.<br>• Every ladder string reads "Day N in a row: +X XP" within +10…+30. No "+20 cap" phrasing anywhere. | M |
| N2 | **Learner copy pack** (Des-crit §3.1–3.2, §4.2–4.3; Eng §7 hand-offs) | Design | — | Final strings and placement for:<br>• the ladder pill on the path and the reveal;<br>• the zero-day pill (no "streak" wording);<br>• a replacement for "may be lost", factually accurate for the actual failure mode (checked with Engineering);<br>• onboarding card 3 (no streak or 🔥);<br>• a rename of "Longest streak";<br>• the "results ready" state.<br>Also a one-line confirmation of the LC §7 screen-reader order. No banned terms. | S |
| N3 | **Storage safety** (Eng P0-2, storage part) | Engineering | — | • On a parse failure or unknown version, the raw blob is copied to a backup key and never overwritten.<br>• `navigator.storage.persist()` is requested.<br>• A corrupt-storage test proves the original bytes are preserved. | S |
| N4 | **Language contract test and copy fixes** (Eng P0-2 and its critique extension; Des-crit §4.3) | Engineering | N2 | • The test walks every learner-facing string (screens, client pack, `describeCandles`); legal pages are allowlisted.<br>• The banned list covers LC §4 terms plus hearts/lives, "trade", currency price axes and real tickers.<br>• The test fails if a banned term is added.<br>• The N2 rewrites ship for `RevealScreen.tsx:84`, `Onboarding.tsx:25` and the Profile label.<br>• The string inventory is handed to Design. | M |
| N5 | **Path Home accessibility fixes** (Eng P0-3 extension; Des P0.2 reframed; Des-crit §2.1) | Engineering | N2 (order confirmation) | • The three 14px rules (`index.css` lines 145–147) are raised to at least 16px.<br>• Screen-reader order is HUD → current candle/CTA → gate → volume → nav, while the CTA stays docked visually at the bottom.<br>• A 390×844 test scrolls to the end and asserts the last row clears the CTA. The CSS changes only if that test fails. | S |
| N6 | **CI covers what ships** (Eng P0-3) | Engineering | D1, N5 | • `verify.yml` runs `npm run build`, `perf:budget`, `a11y:audit` and the contrast checks, plus a computed font-size ≥16px check.<br>• The font check fails on the pre-N5 CSS and passes after N5.<br>• All new steps are required on `main`. | S |
| N7 | **Truth maintenance** (Eng P0-4; Eng risks 8, 10, 11, 12) | Engineering | — | • The ops board shows the ladder as Decided and the age as 18+ interim.<br>• README, `RELEASE_BAR.md`, the architecture record and the persistence memo no longer contradict Bible v0.2.<br>• `tests/ops.test.ts` no longer asserts board prose.<br>• Each of the three `claude/*` branches has a recorded disposition.<br>• The dead config is removed. | S |
| N8 | **Single design source of truth** (Des P0.1 reframed; Des-crit §4.1; Eng-crit §2.8) | Design | D2 | • Final tokens v2 and the motion spec are in `specs/`.<br>• `design/stitch*` is moved to an archive folder labelled "superseded, pre-Bible (11 Sep)".<br>• No active design doc references hearts, tickers or "Trade". | S |
| N9 | **Brand asset pack** (Des P0.3, P1.3 logo part; Des-crit §4.4) | Design | — | • A pixel-exact, head-only bull master SVG from the locked 12 Sep drawing.<br>• A 24px icon set with no flame; persistence is shown with a volume glyph.<br>• Each icon is flagged decorative or meaningful, with an accessible name.<br>• 3:1 non-text contrast on both paper and ink. | M |

### Next (following 2–4 weeks)

| ID | Item | Owner | Depends on | Acceptance criteria | Effort |
|---|---|---|---|---|---|
| X1 | **Icon component and static bull logo in the header** (Eng P1-8; Des P0.3, P1.3 logo) | Engineering | N9, N6 | • No emoji or raw Unicode glyphs remain in onboarding or path chrome.<br>• An inline sprite with no runtime loader.<br>• aria handling follows the N9 flags.<br>• The logo renders at 48px.<br>• First-load JS stays within 80 KB. | M |
| X2 | **Tokenize the dark journey colours** (Eng P2-2, moved earlier; Des hand-off 2) | Engineering | N8 | • No hard-coded hex values remain in journey CSS.<br>• Screenshot diffs show no visual change. | S |
| X3 | **Semantic-event progression core** (Eng P1-1) | Engineering | N1, X4 | • `packages/progression` contains the §6 event types and an append-only log.<br>• Replaying the same events gives byte-identical state, checked by golden fixtures.<br>• No event reduces XP.<br>• Migrating from the existing ledgers never lowers a total.<br>• §6 text equivalents are generated from events.<br>• Timestamp-equality linking is replaced.<br>• A draft event API is sent to Design in week 1. | L |
| X4 | **Content schema v2 and event/skill-ID contract** (Eng P1-5, schema part) | Content | Curriculum v2 status confirmed per Bible §4 | • Modules and stable skill IDs, with retire/split/merge rules.<br>• A semantic-event contract.<br>• A synthetic 29-module fixture is in the repo.<br>• Engineering signs off. | M |
| X5 | **Living Chart state spec** (Des P1.1, spec part; Des-crit §3.4; Eng §7) | Design | D4, X3 draft event API | • Redlines and tokens for the pending candle, results ready, forming candle, gate, Safe Floor, pullback, mastery close and breakout.<br>• Each state has a text equivalent and a reduced-motion equivalent.<br>• Screen-reader order follows LC §7.<br>• Everything meets WCAG 2.2 AA.<br>• Safe Floor and mastery are marked "pending D5". | M |
| X6 | **Close the offline loop** (Eng P1-2) | Engineering | N2, X5 (results-ready state) | • 5xx errors and timeouts are queued as well as offline errors.<br>• An e2e test passes: offline → answer → reconnect → reveal shown exactly once, with no double credit. | M |
| X7 | **Safe updates between lessons** (Eng P1-3) | Engineering | — | • The PWA uses prompt-style registration.<br>• A browser test with a waiting service worker during an exercise shows no reload until the path screen.<br>• Queued answers are preserved. | S |
| X8 | **API and ops hardening** (Eng P1-4) | Engineering | — | • Bounds on answer fields and a `bodyLimit`.<br>• Rate limits on `/api/answers` and `/ops/login`.<br>• CORS restricted to the app's own origin.<br>• Tests return 400 or 429 as appropriate.<br>• No new learner endpoint. | S |
| X9 | **Retire the legacy exercise score** (Eng D3; Des-crit §1) | Engineering | D3, N2 | • The learner UI shows only Knowledge Index awards.<br>• Hints are free.<br>• The score remains in the audit record only.<br>• The contract test stays green. | S |
| X10 | **Google profile design doc and spike** (Eng P1-7) | Engineering | — (any build waits for D6) | • The doc covers "link, don't move", server-side event storage reusing X3, merge, deletion and a threat model.<br>• No production auth ships.<br>• The "no accounts" legal text is unchanged. | M |

### Later

| ID | Item | Owner | Depends on | Acceptance criteria | Effort |
|---|---|---|---|---|---|
| L1 | **Mastery +40, module exam +150, Safe Floor**, from state through to Living Chart visuals (Eng P1-6; Des P1.1, ship part) | Engineering | D5, X3, X5 | • Mastery is visibly larger than attendance.<br>• Pullbacks are a presentation transform bounded by the stored floor.<br>• The exam is multiple choice and auto-graded on unseen charts. | L |
| L2 | **Content-scale delivery** (Eng P1-5, delivery part) | Engineering | X4 | • The 2-topic rule is lifted.<br>• Content ships as per-module precached JSON.<br>• The sanitiser and leak tests are kept.<br>• A synthetic 29-module pack keeps first-load JS within budget.<br>• **Must land before any third topic ships.** | L |
| L3 | **Chart annotation spec** (Des P1.2) | Design | X4 | • Specs for zones, ranges, trendlines, moving averages and sub-panels.<br>• 3:1 contrast on light and dark backgrounds.<br>• A screen-reader readout template for each. | M |
| L4 | **Chart annotation renderer** (Eng P2-4; Des hand-off 5) | Engineering | L3, X4 schema fields | • `describeCandles` is extended to cover annotations.<br>• An integrity test proves exercise annotations use only pre-cut candles. | M |
| L5 | **Light/dark theme parity** (Des P2.1; Eng P2-2) | Engineering | D7, X2, Design contrast table | • Every screen works in both modes at WCAG 2.2 AA.<br>• The preference persists. | L |
| L6 | **Bull milestone cameos** (Des P1.3, cameo part) | Design | D8, L1, Engineering budget line | • Cameos appear only at approved milestones that already exist as events.<br>• Static reduced-motion fallbacks.<br>• Never inside exercises. | M |
| L7 | **Repeated-error recovery** (Eng P2-3; Des T6 gap) | Engineering | Content items, Design T6 spec | • On repeated failure, the learner gets an easier parallel case or a worked example, served from a different seed. | M |
| L8 | **Narration controls and scaling** (Eng P2-1) | Engineering | Design T7 spec | • Segment replay, speed, captions and transcript.<br>• An audio precache budget before narration extends beyond lesson 0. | L |
| L9 | **Physical VoiceOver/TalkBack run** (Des P2.2) | Design | Production prep (your timing) | • The full loop is run on iOS and Android devices with no focus loss or trapped focus.<br>• `MATRIX.md` is updated. | M |
| L10 | **Google profile build** (Eng P1-7, build part) | Engineering | D6, legal review, X10 | • Implemented as specified in X10.<br>• Deletion verified end to end. | L |

## 4. Resolved conflicts

| Topic | Disagreement | Resolution |
|---|---|---|
| Stitch mockups | Design rated them High, "recent drift", and asked you for a decision. | The verified notes show they predate the Bible (11 Sep). They are downgraded to housekeeping: archive and label them in N8. Design's Decision 4 is dropped because the Bible already forbids these mechanics. N4's banned list guards against regression. |
| Sticky CTA | Design asserted that the CTA overlaps candle rows. Engineering said this was unverified and that the real defect is screen-reader order. | Overlap is unverified per the human notes, so N5 tests first and changes CSS only if the test fails. Both specialists agree on screen-reader order: keep the visual dock and fix the DOM order. |
| Bull logo and icon timing | Design wanted them in P0. Engineering had them in P2, then moved them to P1 after the critique. | Design produces the assets in Now (N9). Engineering integrates them at the start of Next (X1), behind the budget gate. Full theming stays Later. |
| Ladder status and numbers | Design called the ladder "Partial, copy only" and wrote "+2 to +20". | The verified notes show the ladder is not built in state. N1 builds state and copy together. All specs use "+10 → +30" and the LC §6 wording. |
| Streak language | Design's plan listed a "Streak Flame" icon. Design's own critique proposed the copy "Start a new streak today". | Both conflict with the no-streak-pressure rule that both specialists cite. The flame is dropped, and N2 must produce zero-day copy without "streak". |
| Save-failure copy | Design proposed "Your progress is saved safely on this device". | Not adopted as written. Device storage can be corrupted or evicted (Eng risk 2), so the claim may be false. N2 copy must match the actual failure mode and be checked by Engineering. |
| Accessibility claims | Design described the app as having "exemplary" WCAG compliance and a "strict 16px floor", and used WCAG 2.1 in its acceptance criteria. | Corrected to "automated audit passes; known gaps listed": the 14px rules and the screen-reader order. The release bar is WCAG 2.2 AA throughout. |
| Living Chart overhaul (Des P1.1) | Design's acceptance criteria required a shipped Safe Floor, but the interactions are Open. | Split into a spec now (X5, marked pending D5) and shipping later (L1). |
| Event core vs. Design state spec order | Design wanted tokens and specs first. Engineering wanted the event API first. | Interleaved. Engineering sends a draft event API in week 1 of X3, and Design binds the X5 redlines to it. Static tokens (N8) are not blocked. |
| Annotation hooks (Des hand-off 5) | Design asked Engineering for hooks now. | Not built speculatively. The order is spec (L3) → Content schema fields (X4) → renderer (L4), with a pre-cut integrity test. |
| Mascot effort (Des P1.3, S) | Design sized the item including exam-pass cameos. | Split. The static logo is X1. Cameos are L6 and wait for exam events and D8. |
| Exercise score | Design presented the score breakdown as a strength. | Design's critique reversed this and now endorses removal. The decision still goes to you as D3, with a unanimous recommendation. |
| Tokens v2, Concept A/B | The specialists still disagree. | Escalated as D2 and D4, not decided here. |

## 5. Dropped or deferred

| Item | Source | Reason |
|---|---|---|
| Redline audit as a High-severity crisis; Decision 4 | Des P0.1, §6.4 | The mockups predate the Bible (verified). Replaced by archiving in N8. |
| CSS padding fix as specified | Des P0.2 | The overlap is unverified. Replaced by the test-first approach in N5. |
| "Streak Flame" icon | Des P0.3 | Conflicts with the no-streak-pressure rule. |
| "Start a new streak today" copy | Des-crit §3.1 | Same reason. N2 replaces it. |
| "Saved safely on this device" copy | Des-crit §3.2 | Possibly inaccurate. N2 replaces it. |
| Exam-pass cameos as part of the logo item | Des P1.3 | Deferred to L6. The exam does not exist yet. |
| Speculative annotation hooks | Des hand-off 5 | Deferred to L4, after the spec and schema. |
| Content delivery as per-module JSON | Eng P1-5 | Deferred to L2, with the trigger "before a third topic ships". |
| ESLint in CI | Eng risk 5 | No plan item in either plan. Revisit once N6 lands. |
| Export/restore code stopgap | Eng D2 | Offered as option (c) in D6 rather than scheduled. |
| Dark-default and theme toggle choices | Des §6.3, P2.1 | Await D7. Only X2 tokenizing proceeds. |
| "Crowns" on Profile | Des §2 | Not in Engineering's code inventory and unverified, so not acted on. |

## 6. Risks to watch

1. **D1 is not actioned.** N6 would stall, and N1 would change progression math without build, budget or font-floor gates in CI. Ask for the workflow push in week 1.
2. **N1 touches stored learner data.** N1 is sequenced after N3 so the raw backup exists before any normalisation changes. A two-device merge can raise a past day's award; Engineering treats this as within the Decided rule, and you can object in the N1 PR review.
3. **Device-only progress remains at risk during Now.** WebKit can evict site data after about 7 days without interaction, and nothing in Now fixes that. N3 only prevents self-inflicted loss. The real fix depends on D6.
4. **Design copy is on the critical path.** N4 and N5 wait for N2. N1 can ship with the LC §6 wording as a placeholder, so N2 should be first in Design's queue.
5. **Unchecked claims from the design review.** It ran on Gemini Flash (free tier), and the engineering review did not see the screenshots. Verify any design-review claim before building on it. Examples: the CTA overlap, "Crowns", and the status of tokens v2.
6. **Stale docs and board misdirect parallel agents until N7 lands.** Schedule N7 first. The unmerged branch "Stop the migration tests sharing a table with the store tests" may affect CI reliability once N6 adds steps.