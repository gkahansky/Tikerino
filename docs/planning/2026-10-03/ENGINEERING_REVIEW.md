# Engineering review and plan: Tikerino

## 1. Summary

The shipped core is in good shape. The integrity contract is implemented and enforced in CI: deterministic generator with golden hashes, server-only post-cut candles, server-side grading, and Postgres idempotency. The Living Chart path, the +25 lesson award, the flat +10 daily award, missed-day recovery and the offline queue are live, with strong unit and property tests.

The main problem is that the progression layer has drifted from its specs:

- **Persistence ladder.** The approved ladder (Product Bible §3, Living Chart spec §2) is not built. The code hard-codes a flat +10 (`packages/state/src/index.ts`, `DAILY_PRACTICE_XP`), and the ops board still lists the ladder as "Blocked, awaiting Guy" (`server/src/ops-board.ts`).
- **Event model.** Progression is a client-side reducer over localStorage ledgers. The spec's engineering criteria (§10) call for a semantic-event stream with a deterministic projection.
- **Durability.** Progress is not durable. It is device-local, and corrupt storage is silently reset to empty.

**Single most important next step:** bring progression into conformance with `prog-rules-v1.0` by implementing the ladder as a deterministic, monotonic projection, and harden it with guardrail tests. Every later reward (mastery, exam, Safe Floor, Google profile sync) depends on that layer.

## 2. Current state

**Integrity contract: shipped and enforced**
- **Generator.** FNV-1a + mulberry32, verbatim from the spec (`packages/engine/src/prng.ts`). Equal-draw branching and resampling without reseeding (`packages/engine/src/generator.ts`).
- **Golden replay.** 30 pinned SHA-256 hashes (`tests/engine.replay.test.ts`, `scripts/generate-goldens.mjs`).
- **Cut point.** Enforced at serialization with `assertNoPostCutCandles` (`server/src/app.ts`). Each exercise's raw payload is scanned for post-T candles and answer fields (`tests/server.integrity.test.ts`).
- **Sanitised client pack.** Exercise seeds and answers are stripped at build time, with a fail-loud check (`scripts/sanitize-content.mjs`, `packages/content/src/load.ts`). The client refuses to generate a chart with `revealSize > 0` (`client/src/useLocalChart.ts`).
- **Audit store.**
  - Postgres `audit_answers` with a unique idempotency constraint and legacy `audit_records` backfill (`server/src/audit.ts`).
  - Refuses to start if `DATABASE_URL` is set but unreachable (`server/src/store.ts`).
  - Concurrency and real-request idempotency tests run against a real Postgres in CI (`tests/audit.postgres.test.ts`, `.github/workflows/verify.yml`).

**Progression: partially shipped**
- **Awards.**
  - +25 lesson completion, credited once (`LESSON_COMPLETION_XP`, `recordAnswer`).
  - +10 for the first server-confirmed answer of each local day (`dailyAwards`).
  - The Knowledge Index is derived from the award ledgers on load and never trusted from storage (`loadProgress`). All in `packages/state/src/index.ts`.
- **Missed days.** Restart the run only. Lifetime practice days are kept. DST and local-day tests pass. A property test checks that XP, awards and lifetime days never decrease across 200 randomized runs (`tests/state.test.ts`).
- **Offline answers.** Queued, credited only through `applyConfirmedAnswer` and the `confirmed` ledger, which is merge-safe across tabs and devices (`client/src/app-state.tsx`).
- **Living Chart path.**
  - Lessons render as candles, with "LIVE · forming", a resistance gate, a persistence volume panel and a welcome-back copy (`client/src/screens/PathHome.tsx`).
  - The ruleset ID `prog-rules-v1.0` is stored on state.

**Learner loop and accessibility**
- **Screens.** Onboarding, lesson, exercise, reveal, profile and legal (`client/src/App.tsx`).
- **Narrated pilot.** Lesson 0 only, using one audio sprite to work around iOS (`client/src/useNarration.ts`, `client/src/narration-audio.ts`). Text/narrated parity with mid-lesson switching.
- **Chart accessibility.**
  - Text alternative from `describeCandles` (`packages/engine/src/describe.ts`).
  - Hollow/filled non-colour encoding, 48px pick targets and a keyboard-scrollable chart (`client/src/components/CandleChart.tsx`).
- **Audit coverage.** The WCAG 2.2 AA release bar plus a 24-screen matrix (`docs/accessibility/RELEASE_BAR.md`, `tests/a11y/matrix.mjs`).

**Performance and operations**
- Self-hosted fonts, immutable caching and preloaded startup chunks. A budget script exists (`scripts/check-perf-budget.mjs`, `server/src/static-cache.ts`, `docs/perf/2026-09-24-slow-4g.md`).
- Railway deploy (`railway.json`).
- Two CI jobs: typecheck/tests/content, and browser full-loop + axe + play-all (`.github/workflows/verify.yml`).
- Parallel worktree lanes (`docs/PARALLEL_AGENTS.md`, `scripts/worktrees.sh`).
- Owner-only `/ops` with an HMAC session (`server/src/ops.ts`).

## 3. Gaps against the documented intent

| Spec / requirement | Source doc | Status | Evidence |
|---|---|---|---|
| Lesson +25, daily +10 base | Bible §3; LC spec §1 | shipped | `packages/state/src/index.ts` (`LESSON_COMPLETION_XP`, `DAILY_PRACTICE_XP`) |
| Persistence ladder: +2/day from day 2, cap +20 | Bible §3 (Decided, reaffirmed 25 Sep); LC spec §2, §10 | **missing** | Flat `DAILY_PRACTICE_XP = 10`. `normaliseDailyAwards` forces every stored award to 10. The ops board still shows it "Blocked" (`server/src/ops-board.ts`), so it is stale against Bible v0.2 |
| Skill mastery +40; module exam +150 | Bible §3; LC spec §1, §6 | missing | No skill-level state. Exam mode is out of scope in `specs/tikerino-engine-grading-spec-v1.md` §8. The interactions are Open (Bible §7) |
| Safe Floor; pullbacks presentation-only | LC spec §4, §10 | missing | No floor or pullback in state or `PathHome.tsx` |
| State = deterministic function of semantic event stream | LC spec §10, §9 | partial | Award ledgers plus a derived index, but no event log, no server copy and no section 6 events emitted |
| No code path decreases XP | LC spec §10; Bible §3 | partial | Property test exists. However, `loadProgress` returns `emptyProgress` on parse failure or unknown version, and the next save overwrites the stored state |
| Ruleset version stored with progression state | LC spec §8 | partial | Stored as `prog-rules-v1.0`, but the state does not implement v1.0's ladder |
| Offline: neutral queued state, idempotent reconcile | LC spec §6, §10; Bible §3 | shipped | `applyConfirmedAnswer`, `confirmed` ledger, server unique key |
| Feedback and outcome for answers reconciled after reconnect | Bible §2 (journey: grade, feedback, then outcome) | missing | `flushPending` updates progress only. No code path in `App.tsx` or `app-state.tsx` shows the deferred reveal, although the README claims it does |
| Mastery survives content-version changes | LC spec §10 | missing | No skill mastery. Skills are a closed list in the schema (`packages/content/src/types.ts`) |
| Contract tests: no money/loss/punishment language | LC spec §4, §10 | missing | No such test. "may be lost" appears in `RevealScreen.tsx`'s save-failure alert |
| Text + reduced-motion equivalents for every animated state | LC spec §6, §10; Bible §6 | partial | Global reduced-motion CSS and draw skip in `useNarration.ts`. Section 6 events do not exist yet |
| Screen-reader order: HUD → current candle/CTA → gate → volume → nav | LC spec §7 | partial | `PathHome.tsx` puts the CTA last, after the volume panel |
| Nothing under 16px | Tokens v1; Design charter §2 | partial | `.journey-sync`, `.persistence-lifetime` and `.persistence-daily` use `.875rem` (14px) in `client/src/styles/index.css` |
| Avoid streak pressure | Bible §3; LC spec §4 | partial | Onboarding card "Build your streak" with 🔥 (`Onboarding.tsx`); "Longest streak" (`Profile.tsx`) |
| Repeated-error recovery (hint, worked example or easier case, then retry) | Bible §2 | partial | Hint only. A retry re-serves the identical seeded chart |
| Google sign-in profile with prefs, progress, bonus, streak | Bible §5 (MVP target) | missing | Device-local only. `LegalScreen.tsx` promises "no accounts" |
| Safe update between lessons, never mid-answer | Bible §5 (Planned) | unverified | `registerType: 'autoUpdate'` (`client/vite.config.ts`). Update timing is not tested |
| Light theme with full parity | Bible §6 (Planned; choice Open) | missing | Journey colours are hard-coded dark hex values, not tokens (`index.css`) |
| Narration pause/replay | Bible §6 | partial | Pause, resume and "Watch again" exist. No segment replay, speed, captions or transcript. Lesson 0 only |
| Curriculum v2 scale (29 modules, 188 titles) | Bible §4 | missing | Validator requires exactly 2 topics. Closed skill list. Whole pack bundled into JS (`client/src/content.ts`) |
| Perf budget enforced in CI | `docs/perf/2026-09-24-slow-4g.md` | partial | Script exists. The CI step was never pushed (token lacks `workflow` scope) |
| Device VoiceOver/TalkBack run | Bible §6; `RELEASE_BAR.md` | missing | Deferred by Guy to production preparation |

## 4. Risks and issues

**High**

1. **Approved ladder not built, and the team board says it is blocked.** Bible v0.2 marks the ladder Decided, but `server/src/ops-board.ts` (verified 24 Sep) still shows "Awaiting Guy". Stored states are labelled `prog-rules-v1.0` while running a non-v1.0 rule, which undermines the "deterministic, explainable, replayable" versioning promise (LC spec §8).

2. **Progress loss is plausible.** Progress lives only in localStorage (`packages/state/src/index.ts`).
   - Corrupt or unknown-version storage resets to empty, and the next save overwrites the original data.
   - WebKit's script-writable storage policy can evict site data after about 7 days without interaction for non-installed web apps. The spec's own "return after 10 quiet days" scenario (LC spec §3) is exactly that case. This is not verified on a device here.
   - This conflicts with Bible §5 ("Preserve a learner's earned progress").

3. **Content scale will break both the schema and the performance budget.**
   - `validateTopics` hard-requires 2 topics.
   - Skills are a closed list of 13.
   - The whole sanitised pack is imported into the JS bundle (`client/src/content.ts`), against an 80 KB first-load JS budget (`scripts/check-perf-budget.mjs`).
   - Curriculum v2 has 188 titles.

**Medium**

4. **Offline-answered exercises never show feedback or the outcome.** This breaks the core learning loop for exactly the users the offline queue serves (`client/src/app-state.tsx`, `App.tsx`).

5. **CI does not cover what ships.**
   - No `vite build` (the browser job uses the dev server).
   - No perf budget, and no `a11y:audit` or contrast checks in `.github/workflows/verify.yml`.
   - No ESLint, although the code carries `eslint-disable` comments.

6. **Unbounded, unthrottled inputs.**
   - `POST /api/answers` accepts arbitrary-length `subjectId` and `assignmentSnapshotAt` strings, so the audit table can be flooded.
   - `/ops/login` has no rate limiting.
   - CORS reflects any origin (`server/src/app.ts`, `server/src/ops.ts`).

7. **Legacy per-answer "Exercise score" runs alongside the Knowledge Index.** Its speed bonus uses client-supplied `timeToAnswerMs`, and hints "cost half the XP" (`packages/grading/src/index.ts`, `ExerciseScreen.tsx`, `Profile.tsx`). This adds a confusing second currency. The Playbook warns against rewarding speed and charging for hints. The ops card on "+10 XP vs legacy score of 12" notes the confusion.

8. **Documentation drift misleads agents and reviewers.**
   - README says "exactly two endpoints", but `/ops` exists. It also says the bull logo is still pending and that the reveal is shown after a flush.
   - The architecture record names `audit_records`; the code uses `audit_answers`.
   - `RELEASE_BAR.md`, `docs/decisions/progress-persistence.md` and the ops board say "13+", while Bible §1 says interim 18+.
   - Schema §1.1 says the synthetic label is "always visible", which was removed by ruling.

9. **PWA `autoUpdate` may activate a new build mid-exercise.** This is not verified either way. Queued answers survive because they are persisted, but an unsubmitted selection would not (Bible §5).

**Low**

10. **Unreviewed branches.** Three `claude/*` branches carry unmerged commits. One is "Stop the migration tests sharing a table with the store tests", a possible test-isolation fix (repository state).

11. **Dead config.**
    - Google Fonts runtime caching remains in `vite.config.ts` after fonts were self-hosted.
    - A stale `knownDeviations` entry for a lesson id that no longer exists is in `client/src/content.ts`.

12. **Brittle and fragile tests.**
    - `tests/ops.test.ts` asserts board prose, so every board refresh needs test edits.
    - `xpCreditedByAnswer` links awards to answers by timestamp equality, which is fragile.

13. **Public repo exposure.** The repo is public (`docs/PARALLEL_AGENTS.md`), and `ops-board.ts` publishes internal planning text. Confirm this is acceptable.

## 5. Plan of action

### P0 — do next

**P0-1. Implement the approved persistence ladder (conform to `prog-rules-v1.0`)**
- **Goal:** Daily award = 10 + 2 × min(run − 1, 10), computed as a deterministic, monotonic projection.
- **Deliverables:**
  - In `packages/state`, the daily award for a day becomes a pure function of the `practiceDays` ledger (the run ending that day).
  - `normaliseDailyAwards` stops clamping to 10, and the index is still derived, never trusted.
  - The reveal pill and path copy use the spec §6 text "Day N in a row: +X XP".
- **Files:** `packages/state/src/index.ts`, `tests/state.test.ts`, `client/src/screens/PathHome.tsx`, `RevealScreen.tsx`, `server/src/ops-board.ts`.
- **Acceptance criteria:**
  - The Dana worked examples from LC spec §3 run as tests: 7 days gives 112 daily XP; missing day 8 gives +10 on day 9.
  - Day 11+ is capped at 30.
  - Existing saved states only go up on load.
  - A two-device merge gives one award per day.
  - The XP-monotonic property test stays green.
- **Interpretation note:** Because `practiceDays` only grows, a merge can raise a past day's award but never lower it. I'll flag this; I will not treat it as a product change.
- **Effort:** M. **Dependencies:** none blocking. Design confirms the copy placement.

**P0-2. Progression guardrails: storage safety and language contract tests**
- **Goal:** No silent loss. Enforce the "no loss/money/punishment" contract by test.
- **Deliverables:**
  - On parse failure or unknown version, keep the raw blob under a backup key and never overwrite it. Call `navigator.storage.persist()`.
  - Add a contract test that walks every learner-facing string (screens, the client pack, `describeCandles` output, section 6 equivalents) against the LC spec §4 banned list. Legal pages are allowlisted.
  - Reword the "may be lost" save warning (with Design).
- **Files:** `packages/state/src/index.ts`, `client/src/app-state.tsx`, a new `tests/progression.contract.test.ts`, `RevealScreen.tsx`.
- **Acceptance criteria:**
  - A corrupt-storage test proves the original bytes are preserved.
  - The contract test fails if "lost", "down" and similar terms are added to a learner path.
- **Effort:** M. **Dependencies:** Design for replacement copy.

**P0-3. Make CI cover what ships**
- **Goal:** Catch build, performance and accessibility regressions before merge.
- **Deliverables:**
  - Add a `npm run build` + `perf:budget` step and the `a11y:audit` and contrast checks to `verify.yml`.
  - Extend `tests/a11y/audit.mjs` with a computed-font-size ≥16px check.
  - Fix the three 14px rules in `client/src/styles/index.css`.
- **Acceptance criteria:**
  - Both new steps are required on `main`.
  - The font-floor check fails on the current CSS before the fix and passes after.
- **Effort:** S. **Dependencies:** Guy must push the workflow change or grant `workflow` scope (see §6).

**P0-4. Truth maintenance**
- **Goal:** Make the board and docs match the Bible.
- **Deliverables:**
  - Refresh the ops board (ladder Decided; 18+ interim).
  - Correct the drift listed in risk 8.
  - Triage the three unmerged `claude/*` branches: merge, rebase or close each, with a note.
  - Remove the dead config from risk 11.
- **Acceptance criteria:** README, `RELEASE_BAR.md` and the memo do not contradict Bible v0.2. No unmerged branch is left without a recorded disposition.
- **Effort:** S. **Dependencies:** none.

### P1 — soon

**P1-1. Semantic-event progression core**
- **Goal:** Satisfy LC spec §10 (deterministic replay) and give mastery, exam, Safe Floor and sync one foundation.
- **Deliverables:**
  - A new framework-neutral `packages/progression` with the spec §6 event types, idempotency keys and an append-only log.
  - A `ruleset → projection` function, plus golden replay fixtures like `tests/goldens`.
  - A migration that synthesises events from existing ledgers.
- **Acceptance criteria:**
  - Replaying the same events gives byte-identical state.
  - No event reduces XP.
  - Section 6 text equivalents are generated from events.
- **Effort:** L. **Dependencies:** Content's semantic-event and skill-ID contract; Design's state spec.

**P1-2. Close the offline loop**
- **Goal:** Feedback and the outcome are shown once a queued answer is confirmed.
- **Deliverables:**
  - Store the server response per confirmed key.
  - A "results ready" entry from the path that opens the reveal.
  - Also queue answers that hit 5xx or timeout errors, not only offline errors.
- **Files:** `app-state.tsx`, `App.tsx`, `ExerciseScreen.tsx`, browser suites.
- **Acceptance criteria:** An e2e test goes offline → answer → reconnect → reveal shown once, with no double credit.
- **Effort:** M. **Dependencies:** Design state for "confirmed result ready".

**P1-3. Safe updates between lessons**
- **Goal:** Never update mid-answer.
- **Deliverables:** Switch the PWA to prompt-style registration and apply updates only on the path or onboarding screens.
- **Acceptance criteria:** A browser test with a new service worker waiting during an exercise shows no reload until the path. Queued answers are preserved.
- **Effort:** S–M.

**P1-4. API and ops hardening**
- **Deliverables:**
  - Length and format bounds on answer fields (ISO-8601 snapshot, max lengths) and an explicit `bodyLimit`.
  - Rate limits on `/api/answers` and `/ops/login`.
  - CORS restricted to own origin unless `VITE_API_BASE_URL` splits the deployment.
- **Constraint:** This adds no new learner endpoint.
- **Acceptance criteria:** Integration tests return 400 or 429 as appropriate, and existing suites stay green.
- **Effort:** S–M.

**P1-5. Content-scale readiness (with Content)**
- **Goal:** The schema and delivery handle curriculum v2.
- **Deliverables:**
  - Schema v2: modules, stable skill IDs, and retire/split/merge rules.
  - Lift the "exactly 2 topics" rule.
  - Ship the sanitised pack as precached JSON per module instead of bundled JS, keeping the sanitiser and leak tests.
- **Acceptance criteria:** A synthetic 29-module pack passes validation, and the first-load JS stays within budget.
- **Effort:** L. **Dependencies:** Content owns the schema; curriculum v2 accepted (Bible §4).

**P1-6. Mastery +40, module exam +150, Safe Floor**
- **Goal:** Implement on top of P1-1 once the interactions are decided.
- **Acceptance criteria:**
  - Mastery is visibly larger than attendance.
  - Pullbacks are a pure presentation transform bounded by the stored floor.
  - The exam is MC and auto-graded on unseen charts.
- **Effort:** L. **Dependencies:** Decision D1 (§6) and Design.

**P1-7. Google profile: engineering design doc and spike only**
- **Deliverables:**
  - Data model using "link, don't move" for `subjectId`s (per `docs/decisions/progress-persistence.md`).
  - Server-side event storage and a merge plan reusing P1-1.
  - Deletion path and threat model.
- **Constraint:** No production auth until decisions D2 and D3 and the legal/privacy review are done.
- **Effort:** M for the doc; L to build later.

### P2 — later

**P2-1. Narration scaling and controls**
- **Deliverables:** Build the T7 player (segment replay, speed, captions, transcript) once Design hands it over. Add an audio precache budget before narration expands beyond lesson 0.
- **Effort:** M–L.

**P2-2. Theme and brand assets**
- **Deliverables:**
  - Tokenize the dark journey colours.
  - Light parity after Guy's choice.
  - Replace emoji with the icon set.
  - Integrate the approved pixel-exact head-only bull, replacing the `scripts/make-icons.mjs` placeholder.
- **Effort:** M. **Dependencies:** Design tokens v2 handed into `specs/`.

**P2-3. Recovery after repeated errors**
- **Deliverables:** Offer an easier parallel case or a worked example on repeated failure, served from a different seed.
- **Effort:** M. **Dependencies:** Content items and Design T6.

## 6. Decisions needed from the product owner

1. **Exact mastery, module-exam and Safe Floor interactions** (Open, Bible §7). This blocks P1-6.
   - *Recommendation:* review Design proposal v2.1. Specify mastery as a server-computed function of graded answers per stable skill ID, and the Safe Floor as locking at exam pass or mastery events, so it stays deterministic.

2. **Google-profile continuity, merge, recovery and deletion, plus what progression data is stored and its retention** (Open, Bible §5; LC spec §9). This blocks P1-7 builds.
   - *Recommendation:* link device IDs rather than rewriting audit rows; store only the semantic events plus preferences; hard-delete on request. Get legal review against the interim 18+ classification. In the meantime, consider the memo's export/restore code as a stopgap against risk 2.

3. **Legacy per-answer "Exercise score"** (speed bonus, hint halves score). Bible §3 lists only the four awards. This blocks the copy and clean-up in P0-2 and P1-1.
   - *Recommendation:* remove it from learner UI and keep it in the audit record only. Make hints free.

4. **Owner action: allow CI workflow changes.** Either grant `workflow` scope to the agent token or push the `verify.yml` diff yourself. This blocks P0-3.
   - *Recommendation:* push it yourself, once, so branch protection policy stays in your hands.

## 7. Hand-offs to the other domain

**Needed from Design**
- **Copy and placement** for:
  - the ladder award ("Day N in a row: +X XP", spec §6);
  - the "0 days" run pill (open ops card);
  - a replacement for the "may be lost" save warning;
  - the "results ready" state after reconnect.
- **State spec** for the neutral pending candle, Safe Floor, pullback, mastery close and breakout, consistent with LC spec §6 and §7, including screen-reader order. The current CTA placement conflicts with §7.
- **Assets and tokens:**
  - tokens v2 and the motion spec handed into `specs/` (still a draft per doc 09);
  - dark-journey tokens to replace the hard-coded hex values;
  - the icon set choice;
  - the pixel-exact head-only bull master SVG/PNG.
- **Onboarding.** A ruling on "Build your streak" / 🔥 and the "Longest streak" label against the no-streak-pressure rule.
- **Templates.** T6 recovery and T7 narration specs before P2 work.

**Engineering will give Design**
- 390×844 screenshots (`npm run shots`) and the accessibility matrix with contrast results for every changed screen.
- The string inventory produced by the P0-2 language contract test, so Design can review every learner-facing string in one place.
- The event-to-state API from P1-1 (event names, payloads, text equivalents) as the binding interface for Living Chart visuals.
- Measured performance headroom per screen, so animation budgets stay inside the slow-4G budget.