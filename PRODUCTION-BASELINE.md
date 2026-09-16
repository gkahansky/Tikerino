# Production baseline vs `main`

What is live, what is in this repository, and every difference between them that is known
at the time of writing. Written during the Phase 1 reconciliation, 16 September 2026.

**`main` is not the production baseline.** Production carries work that was never pushed
here. Until that lands, a deploy from `main` is a *downgrade* of the live app, and one part
of it (the audit store) would orphan live data. Both are detailed below.

Source for everything attributed to production: the **Tikerino Architecture** living record
in Drive (state as of 13 September 2026), owned by Guy. It is the only description of
production this reconciliation could reach - see "What blocked the recovery".

---

## 1. Where production runs

| | |
|---|---|
| App | `https://app-production-ed2d.up.railway.app`, and `https://tikerino.com` |
| Platform | Railway, agent-operated account. One project, two services: app (Node) + managed Postgres |
| Shape | **One origin, one process**: a single Fastify process serves the built client (`client/dist`, SPA fallback) *and* the API. No `VITE_API_BASE_URL` in production |
| Live since | The narrated pilot, 12 September 2026 22:00 IDT |

## 2. What production has that `main` does not

Two commits exist only in the Railway deploy and as a patch held outside this repo, plus a
third change that the record marks as pending deploy:

1. **Railway deploy + Postgres audit log.** Including the one-origin static serving that
   `main`'s server does not do at all - see §3, which is the dangerous one.
2. **Walkthrough rework, and legal text moved.** Onboarding sells the loop across three
   cards. Disclaimers move *out* of the screens into client-side **Terms of use** and
   **Privacy policy**, linked from the profile. The "generated practice data" caption chips
   are removed from every chart, the reveal-screen disclaimer paragraph is removed, and the
   profile storage note no longer appends the label. The chart's accessible name keeps the
   label for screen readers. `main` has none of this: it has no legal pages, and it still
   renders the caption chip, the reveal disclaimer (`play-all.mjs` asserts it) and the
   profile label.
3. **Narrated lessons (pilot) and lesson-mode preference.** `client/src/narration.ts`, a
   `useNarration` playback driver, a `drawCount` mode on `CandleChart`, and per-segment Nova
   mp3s under `client/public/audio/lessons/lesson-0-meet-the-chart/`, precached by the
   service worker. `lessonMode` (text vs narrated) lives on `ProgressState`, is settable
   from the profile and mid-lesson both ways, and narrated is the default. `main` contains
   no narration, no audio, and no `lessonMode` - verified by search.
4. **iOS audio-sprite hardening (13 Sep, recorded as pending Guy's deploy word).** One
   `walkthrough.mp3` sprite per lesson with the player seeking between ffprobe-measured
   offsets on a single gesture-blessed element, because iOS Safari blocks `play()` after an
   out-of-gesture `src` swap - only the first segment voiced on Guy's device. Also: intro
   draw timed from measured durations, a stall guard with silent fallback, and a service
   worker that answers Range requests for audio. Ships `scripts/build-audio-sprite.mjs` and
   vitest coverage cross-checking offsets against the real mp3s.
5. **Brand.** The hand-drawn bull logo, vector-traced, with the full PNG set. `main` still
   ships the placeholder candle icon and a text wordmark from `scripts/make-icons.mjs`.

## 3. The audit store: two different schemas, same database

This is the one difference that can destroy evidence rather than merely lose a feature.

| | Production (per the architecture record) | `main` (`server/src/audit.ts`) |
|---|---|---|
| Table | `audit_records` | `audit_answers` |
| Shape | `id BIGSERIAL`, `subject_id`, `exercise_id`, `assignment_snapshot_at`, `record JSONB` holding the whole audit identity | `id bigserial` plus **fifteen typed columns** - the identity flattened, with `answer jsonb` |
| Idempotency | `UNIQUE (subject_id, exercise_id, assignment_snapshot_at)` | identical rule, as `CONSTRAINT audit_answers_idempotency` |
| Tests | none implied by the record's own count (see §5) | 10 tests against a real Postgres |

The two were written independently against the same decision, and they do not meet. Both
create their table with `CREATE TABLE IF NOT EXISTS` on boot, so **deploying `main` over the
production database would not fail and would not migrate**. It would create a second, empty
table beside the live one and start recording there. Every existing production answer would
still exist in `audit_records` and would be invisible to the running app: the boot log would
report zero answers recorded, and the idempotency index would be empty, so any answer
resent from a learner's offline queue would be graded and recorded a second time.

For a store whose entire purpose is "the evidence that a grade was correct", that is the
worst available outcome, and it is silent.

### Migration and rollback

**Do not deploy `main` onto the production database until one of these is decided.**

- *Option A - carry the data across (recommended).* Write a forward migration that reads
  `audit_records` and inserts into `audit_answers`, unpacking `record` JSONB into the typed
  columns, through the same `ON CONFLICT DO NOTHING` path the server uses, so it is
  re-runnable and resumable. `scripts/migrate-audit-to-postgres.mjs` is the working model -
  it migrates JSONL into `audit_answers` and reads one record back field by field to prove
  the round trip rather than treating "no error" as success. It cannot be reused as-is: its
  source is a file, not a table. Rollback is clean while the old table is untouched: point
  the previous build back at `audit_records`, which still holds every row.
- *Option B - keep production's schema.* Replace `main`'s `audit_answers` with production's
  `audit_records` shape as part of recovering commit 1, and drop the flattened columns.
  Cheaper operationally, and it discards the typed columns and the 10 tests that cover them.
- *Option C - do nothing.* Rejected: it silently orphans the live audit log, which is the
  one thing this project treats as non-negotiable.

Whichever is chosen, the deploy needs a verified backup of the production database first,
and the readiness check afterwards is not "the app responds": it is that the boot log
reports the **expected non-zero** count of answers already recorded.

## 4. What `main` has that production may not

`main` carries the Postgres audit store work with its 10-test suite and a CI service
container, plus `scripts/migrate-audit-to-postgres.mjs`. Whether production's tree contains
any of this is unverified - §5.

## 5. Test counts, reconciled

| Count | What it is | Status |
|---|---|---|
| **172** | `main` today, with `TEST_DATABASE_URL` set. 8 files: content 28, server.integrity 34, engine.replay 42, engine.rules 20, state 18, grading 14, audit.postgres 10, api.base-url 6 | **Verified** on a clean clone against Postgres 16 |
| 162 | `main` with no database: the same run with the 10 Postgres tests skipping themselves | Verified |
| 179 | Production, per the architecture record, "17 new narration/preference tests" | Not verifiable from here |

`162 + 17 = 179` exactly, which implies production's tree does **not** contain `main`'s 10
Postgres audit-store tests - the store that records every live answer would then have no
automated coverage in the tree that is actually deployed. That is arithmetic on someone
else's numbers, not a measurement, and it should be confirmed against the real tree before
anyone relies on it.

## 6. What blocked the recovery

The production-only code could not be recovered in this environment. Precisely:

- **No Railway access.** No CLI, no token, no credentials of any kind in this environment.
  The account is described as agent-operated, with login by email code to a mailbox this
  session does not have.
- **No network route to production.** Outbound access is allowlisted, and
  `app-production-ed2d.up.railway.app`, `tikerino.com` and `railway.app` all fail to
  connect (the proxy answers 403 to CONNECT). So the deployed bundle could not be fetched
  and read either - which would otherwise have been a partial recovery route, since the
  client is built with `sourcemap: true`.
- **No patch.** The architecture record states the two commits exist "as a patch held by
  Instinct". Nothing in this repository or in Drive contains it.
- **No iPhone.** Real iPhone/Safari verification is not possible from this environment at
  all; the iOS audio-sprite fix in §2.4 is precisely the change that cannot be verified
  anywhere else, since Chromium was explicitly unaffected by the bug it fixes.

What was possible without that access was done: the full clean verification suite, the
staging origin, and the behavioural verification in §7.

## 7. Verified in staging, at 390x844

Against `npm run staging` - the built bundle on one origin with Postgres behind it:

- Onboarding, path home with locking, lesson card, guided example, exercise submit, reveal
  with post-T candles and the animation's left-to-right layout guard, profile counters.
- Axe: no critical or serious violations on any screen.
- All 16 exercises played, graded and revealed through the UI.
- Offline capture and recovery: answer with the network cut, no grade shown, queue flushed
  on reconnect - and the reveal gap recorded in the README.
- Postgres persistence across a restart: `2 answers already recorded` in the boot log, a
  replayed answer added no row, and a replay carrying a different answer returned the
  originally recorded result.

Not verifiable here, because the feature does not exist in `main`: **narrated lesson 1**,
**lesson-mode switching**, and the **legal pages**. Those are §2 items, and they stay
unverified until the production baseline is recovered.
