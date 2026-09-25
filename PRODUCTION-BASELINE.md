# Production baseline vs `main`

What is live, what is in this repository, and every difference between them that is known
at the time of writing. First written 16 September 2026 during PR #2's Phase 1 pass;
rewritten 25 September 2026 after auditing that PR against nine days and 19 merged PRs of
work that landed on `main` in the meantime, most of it a separate, independent
reconciliation pass (commits by `Instinct Agent`, merged 21 September, before PR #2's branch
was ever updated).

**Bottom line: most of what PR #2 called blocked is already on `main`.** The narrated
lesson pilot, the legal pages, lesson-mode switching, and an automatic audit-schema
migration were all recovered by that separate pass. What remains open is narrower than PR
#2 described, and is listed under "Open" below.

Source for what production has: the **Tikerino Architecture** living record in Drive (state
13 September 2026), owned by Guy - the only description of production reachable from this
environment. Nothing below claims to have been checked against the live app or its database;
that route is still closed (see "What is still blocked").

---

## 1. Where production runs

| | |
|---|---|
| App | `https://app-production-ed2d.up.railway.app`, and `https://tikerino.com` |
| Platform | Railway, agent-operated account, login by email code |
| Audit store | managed Postgres |

## 2. Recovered (already on `main`, verified present and tested here)

| Item | Where | Verified |
|---|---|---|
| Railway deploy shape (one origin, Postgres audit store) | `server/`, `railway.json`, `scripts/migrate-audit-to-postgres.mjs` | `npm run staging` builds and serves it; `npm run verify` green on Postgres |
| Narrated lesson pilot (Nova audio, `lessonMode`) | `client/src/narration.ts`, `narration-audio.ts`, `useNarration.ts` | `tests/narration.test.ts` (14 tests); `npm run test:browser`'s narration checks (real chained audio playback, no rejected plays) |
| Legal pages (Terms of use, Privacy policy) carrying every disclaimer | `client/src/screens/LegalScreen.tsx` | `npm run test:browser`: "terms of use carries the no-advice disclaimer", "privacy policy carries the generated-data disclaimer", axe clean on both |
| Mode switching (narrated ⇄ text) | `client/src/screens/LessonCard.tsx` | exercised in `npm run test:browser` |
| Owner-only ops PWA, private service-worker scope kept off learner devices | `client/src/screens/Ops*`, related worker-scope commits | on `main`; not otherwise re-verified here (out of this pass's scope) |
| Audit schema divergence (see §4) | `server/src/audit.ts` | automatic migration present and covered by `tests/audit.postgres.test.ts` |

## 3. Fixed in this pass (not present on `main` before)

**The offline-reveal bug PR #2 fixed is real again, on the current architecture, and is
fixed again.** `main`'s offline queue was rewritten between PR #2 and now (PR #18,
`feat/offline-queue`) to a `PendingAnswer[]` / `applyConfirmedAnswer` design that PR #2 never
saw. The underlying bug PR #2 described was still present in the rewrite: `flushPending`
recorded progress correctly via `applyConfirmedAnswer`, but `ExerciseScreen`'s
`offline-locked` phase had no way to learn its own answer had come back - the learner sat
reading "checked when you reconnect" under a pill that had already moved, and had to
navigate away to see anything.

Fixed the same way PR #2 fixed it, adapted to the current state shape: `flushPending` now
also leaves the graded `AnswerResponse` in a `resolvedAnswers` map keyed by
`pendingKey({exerciseId, assignmentSnapshotAt})` - the same idempotency key `confirmed`
already uses - and the locked screen picks up its own result and navigates to the normal
reveal screen. Not persisted, on purpose: worth showing to the learner still on the screen,
not worth restoring days later. `client/src/app-state.tsx`, `ExerciseScreen.tsx`, `App.tsx`.

Guarded by `tests/a11y/offline-recovery.mjs` (`npm run test:offline`), rewritten against the
current UI (PR #2's script used selectors - `Your path`, a specific onboarding/lesson
sequence - that no longer match after the Living Chart lesson-loop rewrite, PR #9). Proven a
real regression test, not a decoration: reverting the three files above makes exactly two of
its eight checks fail ("the deferred reveal arrives once the connection returns" and "the
reveal carries a real exercise score"), and the credit-once check passes either way - the
flush was never broken, only the reveal. Wired into CI's browser job (`.github/workflows/verify.yml`).

**`npm run staging` did not exist on `main`.** Re-added from PR #2's `scripts/staging.mjs`
unchanged (it is deployment-shape infrastructure, not coupled to content or UI, so nothing
about it had gone stale). Built and verified end to end against Postgres 16 in this session:
`npm run test:browser`, `npm run test:play-all` and `npm run test:offline` all pass against
it (see `docs/` note below for one caveat).

**The guarded audit-migration script did not exist on `main`.** See §4.

## 4. The audit schema: two migration paths, and why both now exist

Production (per the architecture record) writes answers to `audit_records`: one row per
answer, the whole audit identity in a `record` JSONB column. `main` writes to
`audit_answers`: the same identity flattened into 15 typed columns, with
`UNIQUE (subject_id, exercise_id, assignment_snapshot_at)` for idempotency. Both tables
`CREATE ... IF NOT EXISTS`, so without a migration, deploying `main` over the production
database starts a second, empty table beside the live one: zero answers reported, an empty
idempotency index, a resent offline answer recorded twice, and every existing record
invisible.

**What's on `main` already:** `AUDIT_SCHEMA` (`server/src/audit.ts`) carries an automatic
migration that runs as part of every `store.migrate()` call, i.e. on every server boot. If
`audit_records` exists, its rows are copied into `audit_answers` via `ON CONFLICT DO NOTHING`
and the source is never modified. This is idempotent and non-destructive, and it is enough
for a routine redeploy once a database has been migrated once. It is not, by itself, enough
for the *first* migration of a database that has been recording real production answers:
there is no backup gate, no dry-run, and no report of what it found or skipped - a routine
boot and a first-ever data migration look identical from the outside.

**What this pass adds:** `scripts/migrate-audit-records-to-answers.mjs` and
`tests/audit.migration.test.ts`, restored from PR #2 and adapted (the columns it targets are
unchanged, so the mapping itself needed no changes; the test needed the schema-isolation fix
below). It is the same copy, under operator control:

- Only ever reads `audit_records` (`SELECT`, nothing else) - rollback is redeploying the
  previous build against a source that was never written to.
- Refuses to write until the operator states the backup they took, echoed into the run
  output.
- `--dry-run` reads and maps every row, reports what would be inserted, writes nothing.
- Stops rather than copying a record missing required audit identity.
- Reads a migrated record back field-by-field to prove the round trip.

**In finding it while auditing this, a real pre-existing bug surfaced:** `06229bf` (the
commit that added the automatic migration) also added a test to
`tests/audit.postgres.test.ts` that creates a `public.audit_records` table and never drops
it. That leaked table then satisfies `AUDIT_SCHEMA`'s `to_regclass('public.audit_records')`
guard for every `store.migrate()` call for the rest of that test run - including a
differently-schema'd one, because the guard is schema-qualified to `public` but the `INSERT`
it guards is not, and follows `search_path`. This is exactly the kind of interference the
57825fa schema-isolation fix (also part of PR #2) was written to prevent for `audit_answers`
itself; it did not cover this. Fixed here with one `DROP TABLE` at the end of that test.
Confirmed: 256/256 passing across three consecutive runs with `TEST_DATABASE_URL` set,
before and after the fix is exercised.

**Demonstrated, not run against production - because production is still unreachable from
here (see below):** a scratch Postgres seeded with 18 synthetic rows shaped exactly like
production's `audit_records` (same columns, same JSONB identity shape). Backup gate refuses
without a `--backup=` statement; a real `pg_dump --format=custom` backup was taken and
restore-verified into a separate scratch database (18/18 rows) before the real run;
`--dry-run` mapped all 18 and wrote nothing; the real run inserted cleanly and verified the
field-by-field round trip; a second run inserted 0 and skipped all 18; a row with required
identity fields deleted stopped the run before writing anything new; `audit_records` held all
19 rows (18 good + 1 malformed) afterward, unmodified, exactly as the design promises.

**The number 18 is not a claim about production.** It was chosen to demonstrate the tooling
at a plausible scale; this environment has no way to read production's actual
`audit_records` - same blocker PR #2 documented, unchanged. Whoever runs this against the
real database gets the real inventory as this script's own output (row count, mapped vs.
rejected, the round-trip proof) - that is what `--dry-run` is for. This is an owner decision,
not one this pass can make: which migration path to rely on for the live database, and when.

## 5. What is still blocked

Every route to production checked in PR #2 was re-checked here; none has changed:

| Route | Result |
|---|---|
| Railway CLI / API token | Absent from this environment |
| Network to production | Blocked - `app-production-ed2d.up.railway.app`, `tikerino.com`, `railway.app`, `backboard.railway.app` all fail to connect |
| Real iPhone/Safari | Not reachable from here |

So a live staging-vs-production comparison, and confirmation of production's actual
`audit_records` row count and content, remain owner-side work.

**One item from PR #2's inventory is confirmed still missing, precisely:** the bull logo.
`client/public/icons/icon-{192,512}.png` exist and are wired into the manifest, but both
depict a candlestick glyph, not a bull - so this is not "recovered and unverified", it is
verified absent. Same root cause as everything else in this section: the actual asset is not
reachable from here.

## 6. One environment caveat found while verifying `npm run staging`

The narrated lesson's auto-playing audio (real chained playback across the full walkthrough
sprite) has been observed to stall indefinitely against the **built** bundle in this
session's sandboxed headless-Chromium - reproduced with `tests/a11y/full-loop.mjs`
unmodified, run against `npm run staging` instead of `npm run dev`. Not reproduced against
`npm run dev`, which is what CI's browser job actually drives, so this does not affect CI.
`tests/a11y/offline-recovery.mjs` and `tests/a11y/play-all.mjs` route around it by switching
to text mode immediately (the same control a learner has), since neither is testing
narration. Flagging this for whoever next runs the narrated-lesson checks against a staged
build, in this environment or another sandboxed one - it may be specific to headless
Chromium here, or to caching behavior introduced by `perf/slow-4g` (self-hosted fonts,
immutable asset caching), and either way it was not chased further because it is outside
this pass's scope.

## 7. Suites, current head

| Suite | Result |
|---|---|
| `npm run verify`, Postgres 16 | **256 passed, 0 skipped**, 12 files |
| `npm test` without a database | **243 passed, 13 skipped** |
| Full suite, three consecutive runs | 256/256 every time |
| `npm run test:browser` — dev | passed, axe clean on every screen |
| `npm run test:play-all` — dev and staging | 16/16 both |
| `npm run test:offline` — dev and staging | 8/8 both |
| `npm run content:check` | all charts good |
