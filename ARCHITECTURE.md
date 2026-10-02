# Tikerino — architecture and orientation

**For a developer joining the project.** Read this first, then `README.md` for the
reasoning behind individual decisions. This document says *where everything is* and
*what state it is in*; the README says *why it was built that way*.

- Updated: 2 October 2026
- Branch this was written from: `claude/tikerino-narrated-lessons-legal-ui` (3607356)
- **Requirements live outside this repo**, in the Drive *Tikerino Product Bible v0.2*.
  See §11 for the full document hierarchy and where the Bible and the code diverge.
- Related docs: `README.md` (rationale, decisions, integrity contract),
  `specs/DECISIONS.md` (product rulings as of 11 Sep — now behind the Bible),
  `PRODUCTION-BASELINE.md` (production/main reconciliation — on branch
  `claude/tikerino-github-coordination-d3v1uf`, PR #2)

---

## 1. What the product is

Tikerino is a mobile-first PWA that teaches market reading one small principle at a
time. A learner walks a path of lessons; each lesson gives a principle card, a guided
walkthrough over a chart, and then exercises on a chart that is **cut at a point T** —
they answer about what they can see, the server grades it, and only then do the candles
after T appear.

Day one: 2 topics, 9 lessons, 16 exercises, 6 screens, content pack v0.2.0.

**Every chart is synthetic, deterministically generated data.** No real tickers, no real
dates, no market data license. This is not a disclaimer bolted on — it is why the engine
exists, and it is the single constraint that shapes most of the codebase.

### The one thing not to break

The *integrity contract*, in four parts. `README.md` → "The integrity contract" has the
full statement; the short version:

1. **Deterministic generation.** `(scenarioFamily, seed, scenarioSpecVersion)` → the same
   series, bit for bit, forever. 30 SHA-256 hashes in `tests/goldens/series.json` pin it.
2. **The cut point holds.** Candles at or after T exist only on the server until an
   answer is recorded. Enforced in three independent places (endpoint assertion, CI
   payload scan, build-time pack sanitisation).
3. **Grading is server-side.** The client's copy of a chart is never trusted; the server
   regenerates from the pack ref.
4. **Every graded answer is auditable.** One record carrying the full chart identity, so
   a grade can be replayed years later.

If a change would weaken any of those, it is the wrong change — the test suite is built
to refuse it.

---

## 2. Repository map — where everything resides

```
packages/engine      Seeded OHLCV generator, scenario families, candle-rule resolution,
                     series invariants, accessible candle narration.
packages/grading     Answer grading + XP scoring. Pure functions; never touches candles.
packages/content     Content-pack types, loader, validator, client-pack sanitiser.
packages/state       Progress, XP, streaks, lesson mode, offline answer queue.

server/              One Fastify server, exactly two endpoints. Audit store lives here.
client/              Vite + React + TypeScript + Tailwind, installable PWA.

specs/               The authoritative specs and content packs. Byte-identical to the
                     Drive originals — these are inputs, not generated output.
scripts/             Build and maintenance scripts (sanitise, goldens, content check,
                     icons, audit migration).
tests/               Unit/integration (vitest) + browser suites (Playwright + axe).
tests/goldens/       Golden-seed replay hashes.
.github/workflows/   CI: verify.yml, two jobs.
screenshots/         Phone-sized verification captures. Gitignored; regenerate.
```

### The dependency rule (important)

The four `packages/*` are **framework-neutral TypeScript**: no React imports, no Node
built-ins. That is deliberate — the final product is React Native, and these four port
across unchanged. Only `client/` screens, navigation and platform glue get rewritten.

```
packages/engine ──┐
packages/grading ─┼──→ server/   (adds Fastify, pg, fs)
packages/content ─┤
packages/state  ──┴──→ client/   (adds React, Vite, Tailwind)
```

Concretely: `packages/state` takes an **injected storage adapter** rather than touching
`localStorage` directly. The web client passes a `localStorage` adapter; React Native
will pass AsyncStorage. If you find yourself importing `react` or `node:fs` into a
`packages/*` file, stop — that is the boundary.

### How one exercise flows end to end

Worth tracing once by hand; it is where the integrity contract becomes code.

```
LEARNER taps a lesson
  │
  ├─ lesson card: principleCard.miniChart + guidedExample.chart
  │    → generated IN THE BROWSER by useLocalChart (revealSize is 0, nothing to protect)
  │    → works offline, because the pack and the engine are both in the bundle
  │
  └─ exercise
       │
       │  GET /api/exercises/:id/window
       ▼
     SERVER  generateSeries(seed, family, …)        ← from the FULL pack, server-side only
             assertSeriesInvariants(all candles)
             cutWindow()                            → candles 0..T-1
             assertNoPostCutCandles(that exact array)
       │
       │  { prompt, options, chart.candles }          ← no target, no answer, no seed
       ▼
     CLIENT  renders CandleChart + the text alternative (describeCandles)
             learner answers → tap, arrow keys + Enter, or the text list (all equal)
       │
       │  POST /api/answers { subjectId, exerciseId, answer, hintUsed,
       │                      timeToAnswerMs, assignmentSnapshotAt }
       ▼
     SERVER  REGENERATES the series from the pack ref   ← the client's chart is not trusted
             resolveTarget()  (candle rule, or correctOptionId)
             audit.find(subjectId, exerciseId, assignmentSnapshotAt)
               ├─ found    → replay the recorded result (idempotent, never double-counts)
               └─ not found→ gradeAndScore() → audit.append(one record)
       │
       │  { correct, target, xp, feedback, reveal.candles, reveal.disclaimer }
       ▼
     CLIENT  RevealScreen animates in the post-T candles, shows XP and the disclaimer
             packages/state folds the result into progress, XP, crown, streak
```

Offline, the `POST` fails with `OfflineError`; the answer is queued in
`progress.pending` exactly as tapped and the reveal is **withheld**. On reconnect
`flushPending()` resubmits with the same `assignmentSnapshotAt`, so the server replays
rather than regrades.

### Code: package by package

| Path | What lives there |
|---|---|
| `packages/engine/src/prng.ts` | FNV-1a + mulberry32, verbatim from the spec. **Do not "improve" this file** — a change silently invalidates every golden hash and every stored audit record. |
| `packages/engine/src/generator.ts` | The random walk, volume mapping, family resampling, `cutWindow` / `cutReveal`. |
| `packages/engine/src/families.ts` | The 5 scenario families (`trend_up`, `trend_down`, `range_bound`, `volatile`, `ambiguous`) and their "extras" checks. |
| `packages/engine/src/rules.ts` | The 8 candle rules (`first_bullish`, `highest_close`, `longest_upper_wick`, …) and margin resolution. |
| `packages/engine/src/invariants.ts` | `assertSeriesInvariants`, `assertNoPostCutCandles`. The cut-point guard. |
| `packages/engine/src/describe.ts` | `describeCandles()` — one line of plain English per candle. This is the accessibility text alternative, not a debug helper. |
| `packages/grading/src/index.ts` | `gradeAnswer`, `computeXp`, `gradeAndScore`. XP order is `base × multiplier + speedBonus`, *then* halve for a hint. |
| `packages/content/src/types.ts` | Content schema v1 as TypeScript, plus the `Client*` views that define what the browser may hold. |
| `packages/content/src/validate.ts` | The validator (557 lines). Refuses a pack that violates the schema unless the violation is an acknowledged deviation. |
| `packages/content/src/load.ts` | `loadContentPack`, `toClientPack` (the sanitiser), `indexPack`. |
| `packages/state/src/index.ts` | `ProgressState`, `recordAnswer`, streaks, the pending-answer queue, `lessonMode`. All pure functions returning new state. |

### Server

| Path | What it does |
|---|---|
| `server/src/index.ts` | Process entry. Builds the audit store **before** the app so a bad `DATABASE_URL` fails loudly at boot, not on the first learner's answer. Graceful shutdown drains the pool. |
| `server/src/app.ts` | The two routes. Window cutting, target resolution, grading, idempotency, audit append, reveal. |
| `server/src/content.ts` | Loads and validates the pack at boot. A pack that fails validation **stops the server**. |
| `server/src/audit.ts` | `AuditRecord`, the `AuditStore` interface, `JsonlAuditStore`, `PostgresAuditStore`, `AUDIT_SCHEMA`. |
| `server/src/store.ts` | Picks the store from the environment. Two options, no silent fallback. |

**The two endpoints, and there are only two:**

```
GET  /api/exercises/:exerciseId/window     → prompt, options, window candles (0..T-1)
POST /api/answers                          → grade + XP + feedback + reveal candles
```

There is deliberately **no `/healthz`** — the spec locks the server to two endpoints.
Use `GET /api/exercises/ex-001/window` as the readiness probe; it exercises content
loading and chart generation, which is a better check than a bare 200 anyway.

### Client

| Path | What it does |
|---|---|
| `client/src/main.tsx` | Mount. Wraps startup in a try/catch so a failed content validation shows a refusal screen instead of a broken curriculum. |
| `client/src/App.tsx` | The router. A plain `useState` discriminated union — no router library. 6 routes. |
| `client/src/app-state.tsx` | React context over `packages/state`. Owns the localStorage adapter, the offline flush loop and the `online` listener. |
| `client/src/api.ts` | `fetchWindow`, `submitAnswer`, `OfflineError` vs `ApiError`, and `resolveApiBaseUrl` (build-time API origin). |
| `client/src/content.ts` | Loads and re-validates the sanitised pack; exposes ordered topics/lessons/exercises. |
| `client/src/useLocalChart.ts` | Generates lesson charts in the browser. **Throws** if handed a chart with non-zero `revealSize`. |
| `client/src/components/CandleChart.tsx` | The chart (375 lines). SVG, keyboard navigation, text alternative, 48px targets when selectable, reveal animation. |
| `client/src/components/ui.tsx` | `Screen`, `PrimaryButton`, `SecondaryButton`, `TopBar`, `Callout`. The phone shell. |
| `client/src/screens/*.tsx` | `Onboarding`, `PathHome`, `LessonCard`, `ExerciseScreen`, `RevealScreen`, `Profile`. |
| `client/src/narration.ts` | Narration plan derived from a lesson (new, branch only). |
| `client/src/narration-player.ts` | Headless sprite player with injected audio (new, branch only). |

---

## 3. Content — where it lives and how it flows

Content is **not** in the database and **not** in the client source. It is a JSON file
under `specs/`, authored outside the repo and committed byte-identical.

```
specs/tikerino-content-pack-v0.2.json      ← the source of truth the app loads
specs/tikerino-content-pack-v0.1.json      ← kept so answers audited against
                                              curriculumVersion 0.1.0 can still be
                                              replayed against the pack they were
                                              actually graded on. Do not delete.
specs/tikerino-content-schema-v1.md        ← the contract content must satisfy
content-deviations.json                    ← ledger of acknowledged schema violations
                                              (currently EMPTY — keep it that way)
```

### The sanitisation pipeline

```
specs/tikerino-content-pack-v0.2.json
        │
        │  server: loadContent() at boot — validate, refuse to run on failure
        ├──────────────────────────────────────→ server holds the FULL pack
        │                                        (answers, seeds, revealSize)
        │
        │  scripts/sanitize-content.mjs  (runs on predev / prebuild / pretypecheck)
        ▼
client/src/content/pack.client.json   ← GENERATED, gitignored
        │
        └──────────────────────────────────────→ client holds the SANITISED pack
```

What `toClientPack()` strips from every **exercise**:

- `correctOptionId`, `target` — the answer itself
- `feedback` — it names the right answer in prose; it arrives with grading instead
- the chart's `seed`, `scenarioFamily`, `revealSize`, `windowSize`

That last one is the subtle part: the engine is framework-neutral and therefore also
runs in a browser. Shipping an exercise seed would let anyone regenerate the post-T
candles locally and walk straight around the cut point — the endpoint would be honest
and the bundle would not be. `scripts/sanitize-content.mjs` re-checks the output and
throws if stripping ever regresses.

What stays: prompts, options, hints, principle cards, guided examples **and their
charts**. Lesson charts keep full `ChartRef`s because `revealSize` is 0 there — nothing
after the cut to protect — and generating them in the browser is what makes the offline
lesson shell work.

### Content stats as shipped (pack v0.2.0)

- 2 topics: `topic-fundamentals`, `topic-candles`
- 9 lessons, 16 exercises (12 `multiple_choice`, 4 `pick_the_candle`)
- 9 exercises carry charts, 7 are chartless vocabulary items
- 25 chart refs across lessons and exercises; 30 golden hashes (the 25 plus 5 pinning
  families the starter pack does not use)

### Changing content

1. Edit the pack under `specs/` (or take a new version from the content owner).
2. A new field or enum value means a `schemaVersion` bump **and** a
   `curriculumVersion` minor bump, together.
3. Run `npm run content:check` — it regenerates every chart and asserts each
   `pick_the_candle` resolves uniquely with margin and no guided-example step
   contradicts the candle it points at.
4. A content version bump moves content; **it must never move a chart.** v0.1.0 → v0.2.0
   restructured the curriculum and all 24 carried-over charts regenerated byte-identical.
   If a golden hash shifts on a content change, that is the bug.

---

## 4. Design system — where the tokens live

The design system is **in `specs/`, not in the client**, and the client points at it
rather than copying it, so the two cannot drift.

```
specs/tikerino-design-tokens-v1.css   ← 33 CSS custom properties. The source of truth.
specs/tikerino-tailwind.config.js     ← the Tailwind mirror of the same values.
client/src/styles/index.css           ← @imports the spec file verbatim, then Tailwind.
client/tailwind.config.cjs            ← one line: require('../specs/...'). A pointer.
```

### Rules baked into the tokens (read the comments before pairing colours)

- **Brand is Growth Green only.** `--brand #10B981`. Violet was dropped.
- **`brand.*` and `data.*` are separate namespaces.** Palette experiments touch `brand.*`
  only.
- **Chart colours are FROZEN.** `--data-up #0E9F6E`, `--data-down #DC2626`. Never
  retinted, never swapped with brand colours, regardless of any future palette test.
- **Non-colour encoding is mandatory** alongside colour: bullish = **hollow** body
  (paper fill, 2px border), bearish = **filled** body. For colour-vision deficiency.
- **Never white text on green** (~2.5:1, fails AA). Text on `--brand` is `--ink`. Green
  *text* uses `--brand-ink #0B5643`.
- **Nothing under 16px, anywhere**, including inside the SVG. Body base is 18px.
- **Every touch target ≥ 48×48** (`--target-min`). Locked.
- **3px focus ring**, offset 2px, on every interactive element.
- `prefers-reduced-motion` zeroes `--motion-reveal`.
- `--accent-coral` and `--accent-sun` are **never** used inside the chart canvas.

Fonts are Baloo 2 (display) + Nunito (body), both OFL, from Google Fonts.

The logo is still one of three candidates awaiting a one-time pick, so the build ships a
Tikerino text wordmark and a placeholder candle icon generated by
`scripts/make-icons.mjs`.

---

## 5. State, storage and the audit trail

### Learner state (client)

Held in `localStorage` under `tikerino.progress.v1`, shaped by
`packages/state`:

- `totalXp`, per-lesson `crownLevel` / `completed` / `xpEarned`
- `streak` — local calendar day, advances on *graded* activity
- `answers` — XP credited once per exercise, so replaying cannot farm it
- `pending` — answers captured offline, locked until the server acknowledges them
- `lessonMode` — `'text' | 'narrated' | null`. `null` means "has not chosen", which is
  deliberately distinct from the default value, so moving the default never overrides
  someone's explicit pick.
- `subjectId` — a stable anonymous UUID under `tikerino.subjectId.v1`. No accounts day
  one; this is the `subjectId` on every audit record.

A corrupt or unreadable store starts clean rather than bricking the app; a failed write
(private browsing, full quota) is swallowed.

### Lesson unlock and offline behaviour

- Lesson `n` unlocks when lesson `n-1` is complete. Lesson 0 is always open.
- The **lesson shell** (app code, fonts, sanitised pack) is precached by the service
  worker, so onboarding, the path and lesson cards work offline.
- **Exercise windows are deliberately not cached.** Only the server knows where the cut
  point is. Offline, the exercise screen says plainly that this one needs a connection.
- An answer given offline is stored exactly as tapped and the **reveal is deferred**
  until the server grades it. On reconnect the queue flushes and the reveal appears.

### The audit store (server)

Every graded answer is recorded with the full audit identity of its chart —
`syntheticSeriesId`, `scenarioSpecVersion`, `generatorVersion`, `curriculumVersion` — so
any answer can be replayed bit-for-bit years later. **This is not a log; it is the
evidence that a grade was correct.**

Two backings, chosen by whether `DATABASE_URL` is set:

| | `DATABASE_URL` unset | `DATABASE_URL` set |
|---|---|---|
| Store | JSONL at `server/data/audit.jsonl` | Postgres |
| Idempotency | in-memory `Map`, rebuilt from the file at boot | `UNIQUE (subject_id, exercise_id, assignment_snapshot_at)` |
| Processes | exactly one, by construction | any number |
| Use for | dev, CI, the browser suites | **deployment** |

The idempotency key is `(subjectId, exerciseId, assignmentSnapshotAt)`. A resent offline
answer replays the recorded result rather than grading again — even if the retry carries
a *different* answer. Postgres uses `ON CONFLICT DO NOTHING` so the check and the insert
are one statement.

If `DATABASE_URL` is set and the database is unreachable, the server **refuses to
start**. There is no silent fallback to a file nobody is going to read.

> **Live schema caveat.** Production currently carries a table named `audit_records`
> (3 key columns + a `record JSONB` blob) while `main` creates `audit_answers`
> (15 typed columns + `answer jsonb`). Both use `CREATE TABLE IF NOT EXISTS`, so a
> deploy would silently create a second empty table and orphan the live rows. The
> reconciliation, a backup-gated migration script and 19 tests are on PR #2 and have
> **not** been run against production. Read `PRODUCTION-BASELINE.md` on that branch
> before touching the deployed database.

---

## 6. Environment and configuration

| Variable | Where | Default | Notes |
|---|---|---|---|
| `PORT` | server | `8787` | |
| `HOST` | server | `127.0.0.1` | Right on a laptop, **wrong in a container** — nothing outside reaches it. Set `0.0.0.0` behind a proxy or ingress. |
| `DATABASE_URL` | server | unset → JSONL | **The only secret this project has.** Carries a password. Provision through the platform's secret store, never in the image or a committed file. |
| `DATABASE_SSL` | server | unset | Set to `require` for a managed Postgres whose TLS cert the container has no root for. |
| `TEST_DATABASE_URL` | tests | unset → suite skips | CI fails the build if it sees the skip notice. |
| `VITE_API_BASE_URL` | client | empty → same origin | **Build-time**, inlined by Vite. A client built for one API origin cannot be repointed without rebuilding. |

See `server/.env.example` and `client/.env.example`. `.env*` is gitignored except the
examples.

---

## 7. Running, verifying, deploying

```sh
npm install
npm run dev            # server :8787, client :5173 (Vite proxies /api)
```

Open on a phone-sized viewport — **390×844** is the reference size everything is checked
at.

```sh
npm run verify         # typecheck all 6 workspaces + unit/integration + content check
npm run test:browser   # full loop in a real browser + axe on every screen
npm run test:play-all  # play every starter exercise through the UI
npm run shots          # phone-sized screenshots of each screen
```

`test:browser` and `test:play-all` need `npm run dev` already running.

**Current test counts** (they move, so verify rather than trust a number in a doc):

| Branch | Against Postgres | Without a database |
|---|---|---|
| `main` | 172 | 162 passed, 10 skipped |
| `claude/...-coordination-d3v1uf` (PR #2) | 191 | 179 passed, 12 skipped |
| `claude/tikerino-narrated-lessons-legal-ui` (here) | 217 | 207 passed, 10 skipped |

Verified by running the suite on each branch, not inferred from the diff. What skips
without a database: the 10 Postgres audit-store tests, plus the 2 migration tests on PR #2
that insert through the store.

> The `### Verifying it` block in `README.md` says 156, which was stale before either
> branch. PR #2 corrects it to 191. It is left alone here to avoid a same-line conflict
> with that PR.

### Deploying

```sh
npm ci
npm run build --workspace @tikerino/client     # static files → client/dist
HOST=0.0.0.0 PORT=8787 npm run start --workspace @tikerino/server
```

The client requests `/api/...` **relative**, so the default deployment is one origin:
serve `client/dist` and proxy `/api` to the server. To split them, build the client with
`VITE_API_BASE_URL=https://api.example` — the server already answers with permissive
CORS, so nothing changes on its side.

Two facts worth knowing before the first attempt:

- **The PWA needs https.** A service worker will not register over plain http beyond
  `localhost`, so the install prompt and the offline shell simply do not appear. An https
  page also may not call an http API — the client refuses to start on that mismatch
  rather than letting it reach the learner as "you appear to be offline".
- **There is no health endpoint.** Use `GET /api/exercises/ex-001/window`.

Production runs on **Railway with Postgres** (ownership held by gkahansky@gmail.com).

---

## 8. Tests and CI

```
tests/engine.replay.test.ts     golden-seed replay — 30 SHA-256 hashes
tests/engine.rules.test.ts      candle-rule resolution and margins
tests/grading.test.ts           grading + XP, including the spec's worked example
tests/content.test.ts           schema validation, client-pack sanitisation
tests/server.integrity.test.ts  both endpoints, post-T leak scan over every exercise
tests/audit.postgres.test.ts    Postgres store + idempotency (skips without a database)
tests/state.test.ts             progress, streaks, offline queue, lesson mode
tests/narration*.test.ts        narration plan + player (branch only)
tests/api.base-url.test.ts      VITE_API_BASE_URL resolution and the mixed-content guard

tests/a11y/full-loop.mjs        whole loop in Chromium at 390×844 + axe on every screen
tests/a11y/play-all.mjs         plays every starter exercise through the UI
tests/a11y/shots.mjs            screenshot capture
```

`.github/workflows/verify.yml` runs two jobs:

- **`verify`** — typecheck, unit/integration against a `postgres:16` service container,
  `content:check`, and a content-debt report. It greps the test log for the Postgres
  skip notice and **fails on it**: losing the service container would otherwise look
  exactly like a pass.
- **`browser`** — installs Chromium, starts both halves, polls `127.0.0.1` for *both*
  (a ready banner in a log is not proof), then runs the full loop and play-all. Uploads
  screenshots on failure.

### Traps the suites exist to catch

- A golden hash shifting without a deliberate `generatorVersion` bump. If this happens,
  **do not regenerate the goldens to make it pass** — that destroys the guarantee the
  test exists for.
- Post-T candles or answer fields reaching a serialised payload or the client bundle.
- A guided-example step describing a candle it does not point at.
- Vite binding `::1` instead of `127.0.0.1` (its default host is the *name*
  `localhost`), which makes everything in the repo that addresses `127.0.0.1` fail
  against a server whose log says it is ready.
- A CSS `transform` and an SVG `transform` attribute on the same element — the reveal
  animation slid every revealed candle back to x=0. `play-all.mjs` asserts candle x
  positions are distinct and strictly increasing.

---

## 9. Branch and PR state right now

| Branch | State |
|---|---|
| `main` | `0616db6` — Postgres audit store, split API origin. The deployable baseline. |
| `claude/tikerino-github-coordination-d3v1uf` | **PR #2 open**, 5 commits, CI green, mergeable, 0 reviews. Production-baseline reconciliation: `PRODUCTION-BASELINE.md`, `scripts/staging.mjs`, the offline deferred-reveal fix, `tests/a11y/offline-recovery.mjs`, the `audit_records` → `audit_answers` migration + 19 tests. **Do not merge without review.** |
| `claude/tikerino-narrated-lessons-legal-ui` | 3 commits past `main`. Narration slice in progress — state layer, plan module, headless player. No PR yet; held until browser evidence exists. |

Nothing on the narration branch touches Railway, the database or `audit_records`.

---

## 10. Feature roadmap and status

Status key:

- **Done** — on `main`, tested, CI green
- **In testing** — code complete on a branch with tests passing, awaiting review/merge
- **In coding** — partially implemented
- **Not started** — no code

### Engine and integrity

| Feature | Status | Where |
|---|---|---|
| Seeded PRNG (FNV-1a + mulberry32) | Done | `packages/engine/src/prng.ts` |
| Deterministic OHLCV generator | Done | `packages/engine/src/generator.ts` |
| 5 scenario families + extras checks | Done | `packages/engine/src/families.ts` |
| 8 candle rules with margin resolution | Done | `packages/engine/src/rules.ts` |
| Series invariants + post-T cut guard | Done | `packages/engine/src/invariants.ts` |
| Golden-seed replay (30 hashes) | Done | `tests/goldens/series.json` |
| Accessible candle narration | Done | `packages/engine/src/describe.ts` |

### Content

| Feature | Status | Where |
|---|---|---|
| Content schema v1 + types | Done | `specs/tikerino-content-schema-v1.md`, `packages/content/src/types.ts` |
| Pack validator (refuse-to-run) | Done | `packages/content/src/validate.ts` |
| Content pack v0.2.0 (2 topics / 9 lessons / 16 exercises) | Done | `specs/tikerino-content-pack-v0.2.json` |
| Client-pack sanitisation + leak check | Done | `scripts/sanitize-content.mjs` |
| Chart/annotation content CI check | Done | `scripts/check-content-charts.mjs` |
| Content deviations ledger (empty) | Done | `content-deviations.json` |
| Topics beyond day one | Not started | — |
| Curriculum expansion (portfolio/funds/risk/etc.) | Not started | Decision package under owner review; neither option ratified |

### Server and audit

| Feature | Status | Where |
|---|---|---|
| `GET /api/exercises/:id/window` | Done | `server/src/app.ts` |
| `POST /api/answers` (server-side grading) | Done | `server/src/app.ts` |
| XP model (base × tier + speed, hint halving) | Done | `packages/grading/src/index.ts` |
| Idempotent retries | Done | `server/src/audit.ts` |
| JSONL audit store | Done | `server/src/audit.ts` |
| Postgres audit store + unique constraint | Done | `server/src/audit.ts` |
| JSONL → Postgres migration | Done | `scripts/migrate-audit-to-postgres.mjs` |
| `audit_records` → `audit_answers` migration | In testing | PR #2: `scripts/migrate-audit-records-to-answers.mjs`, 19 tests. **Never run against production.** |

### Client — day-one loop

| Feature | Status | Where |
|---|---|---|
| Onboarding | Done | `client/src/screens/Onboarding.tsx` |
| Path home with unlock gating | Done | `client/src/screens/PathHome.tsx` |
| Lesson card (principle + guided example) | Done | `client/src/screens/LessonCard.tsx` |
| Exercise screen (both exercise types) | Done | `client/src/screens/ExerciseScreen.tsx` |
| Reveal screen (post-T animation, XP, disclaimer) | Done | `client/src/screens/RevealScreen.tsx` |
| Profile (XP, streak, reset) | Done | `client/src/screens/Profile.tsx` |
| CandleChart: SVG, keyboard, text alternative | Done | `client/src/components/CandleChart.tsx` |
| PWA / service worker / offline lesson shell | Done | `client/vite.config.ts` |
| Offline answer queue + local lock | Done | `packages/state`, `client/src/app-state.tsx` |
| Deferred-reveal delivery on reconnect | In testing | PR #2: `resolvedAnswers` in `app-state.tsx` + `tests/a11y/offline-recovery.mjs` (7 checks, wired into CI) |
| Split API origin (`VITE_API_BASE_URL`) | Done | `client/src/api.ts` |

### Narrated lessons and mode switching

| Feature | Status | Where |
|---|---|---|
| `lessonMode` state (`null` = unchosen) | In testing | `packages/state/src/index.ts` (`b56785f`), 7 tests |
| Narration plan derived from the lesson | In testing | `client/src/narration.ts` (`40ae159`), 24 tests |
| Headless sprite player (iOS-safe seeking) | In testing | `client/src/narration-player.ts` (`3607356`), 14 tests |
| `drawCount` mode on `CandleChart` | Not started | — |
| Narrated lesson screen | Not started | — |
| Mode switch UI (profile toggle + mid-lesson) | Not started | — |
| Audio sprite builder script | Not started | `scripts/build-audio-sprite.mjs` planned |
| Narration audio assets | Not started | **Blocked** — no recorded assets; Playwright's bundled ffmpeg is a stripped build (no `lavfi`, no MP3 encoder, no `ffprobe`) |
| 390×844 narration screenshots | Not started | — |

> **The iOS constraint driving this design:** assigning a new `src` outside a user
> gesture starts a new media load, and `play()` then rejects. So each lesson gets **one
> merged audio sprite** and every segment change is a `currentTime` seek. The player
> asserts `src` is assigned exactly once per walkthrough, and drops to a silent clock if
> audio stalls, is absent, or `play()` rejects — the walkthrough never freezes.

### Legal and walkthrough

| Feature | Status | Where |
|---|---|---|
| Terms of use route | Not started | — |
| Privacy policy route | Not started | — |
| Profile links to legal pages | Not started | — |
| 3-card first-run walkthrough | Not started | — |
| Move legal text out of chart caption chips / reveal disclaimer / profile label (keeping the chart's accessible name) | Not started | Will need the assertions in `tests/a11y/play-all.mjs` updated |

### Testing, CI, operations

| Feature | Status | Where |
|---|---|---|
| Unit/integration suite | Done | `tests/*.test.ts` |
| Browser full loop + axe on every screen | Done | `tests/a11y/full-loop.mjs` |
| Play every exercise through the UI | Done | `tests/a11y/play-all.mjs` |
| CI: two jobs + Postgres service + skip guard | Done | `.github/workflows/verify.yml` |
| Offline-recovery browser suite | In testing | PR #2 |
| One-origin staging runner | In testing | PR #2: `scripts/staging.mjs` |
| Hosted staging environment | Not started | Script exists; nothing is deployed |
| Railway + Postgres production | Done | Live |
| Production/main reconciliation | In testing | PR #2: `PRODUCTION-BASELINE.md` |

### Deliberately out of scope (locked, day one)

All **Not started by decision**, not by omission: drag / line-placement exercise types
(with their accessible stepper alternative), exam mode, accounts or auth, the
multi-service split, an analytics sink, Hebrew / i18n, real market data, streak server
sync, marketing pages, A/B variant assignment (the interfaces stay dormant with nullable
`experimentId` / `variantId`).

**One deliberate departure:** Postgres. The engine spec says "no database day one"; that
was overridden before deployment because the audit store is the one component where the
shortcut is expensive to unwind — switching before any real learner data existed cost
nothing, switching after would have meant migrating live records. JSONL remains the
default when `DATABASE_URL` is unset, so dev and CI still need no database.

### Open decisions that block work

1. **Audit schema** — option A (migrate `audit_records` → `audit_answers`, backup first)
   vs option B (point the code at the existing table). 12 production rows. Owner call.
2. **Drive architecture document** — whether it may be edited to match verified code,
   and which of four proposed edits.
3. **Curriculum** — neither option in the decision package is ratified; eleven owner
   decisions remain open (see `specs/DECISIONS.md` and the review on file).
4. **Product name lock, domain registration, logo selection** — all still open per
   `specs/DECISIONS.md`.

---

## 11. Document hierarchy — which document is authoritative for what

**The requirements document is not in this repository.** It is the *Tikerino Product
Bible | Product behavior and features v0.2* (25 September 2026, owner Guy Kahansky), in
Google Drive:

> https://docs.google.com/document/d/1c-psUs0EjnbjbQhlL4O8VgHoxR07QNJAiQ0PFERmL2E/edit

It states its own standing: "This is the single source for the intended product
experience." Every claim in it is tagged **Decided / Current / Planned / Open** and traced
to a dated decision source. Read it before proposing product behaviour; a tag of `Open`
is explicitly "not permission to fill it by assumption."

| Document | Authoritative for | Location |
|---|---|---|
| **Product Bible v0.2** | **Product requirements.** Promise, boundaries, learner journey, XP rules, course direction, profile, visual/accessibility rules, future boundaries. | Drive |
| Living Chart detailed spec (Bible ref S2) | Design depth for the journey and visual experience. Its unresolved proposals stay unresolved. | Drive |
| `specs/tikerino-engine-grading-spec-v1.md` | Implementation contract: generator, candle rules, grading, XP mechanics, the two endpoints, audit record fields. | this repo |
| `specs/tikerino-content-schema-v1.md` | Implementation contract: the content/code boundary. | this repo |
| `specs/tikerino-design-tokens-v1.css` | The design system as shipped. | this repo |
| `specs/DECISIONS.md` | Product rulings and open owner decisions **as of 11 Sep 2026** — predates the Bible and is now behind it. Where the two differ, the Bible wins. | this repo |
| `README.md` | As-built reasoning: the 22 engineering calls made where a spec was silent, and the content-defect history. | this repo |
| `ARCHITECTURE.md` | As-built layout: this document. | this repo |
| `PRODUCTION-BASELINE.md` | Production vs `main`, the audit-schema divergence, migration and rollback options. | PR #2 |
| ARCHIVE Product Bible v0.1; Full Curriculum Plan; `product-and-architecture-v0.7.html` | **Superseded.** Historical reference only — the Bible says v0.1 is "an archive, not as current approval." | Drive |

Note: some Bible detail links point at `files.instinct.com`, which this project's cloud
sessions cannot reach (the egress proxy refuses the CONNECT). Drive and Docs links work.

### Where the Bible and this codebase currently diverge

Verified against the Bible on 2 October 2026. These are requirements, not bugs — but they
are not implemented, and nothing in the repo says so:

| Bible requirement | Tag | Shipped state |
|---|---|---|
| Core proficiency path is **PROF-1 + PROF-2 + PROF-3** (D6) | Decided | No assessment layer exists. Note this contradicts the PROF-1+2-only core in the curriculum decision package under review. |
| **Curriculum map v2** — 29 modules, 188 titles (22 core / 7 badge); **I1 Technical indicators in the core**; **P9 Investor protection (Israel)** (D5, D8) | Decided | Shipped content is 2 topics / 9 lessons / 16 exercises. |
| MVP assessment is **multiple-choice, automatically graded**; the map's 80% cut, critical-item rule and retry cadence are **not approved** (D6) | Decided | Matches: both shipped exercise types are auto-graded. |
| XP: lesson **+25**, daily practice **+10** with a +2/day ladder capped at +20, skill mastery **+40**, module exam **+150** (D7) | Decided | Not implemented. The code awards per-*exercise* XP (base 10 × tier + speed bonus, halved for a hint), which the Bible does not describe. |
| **Google sign-in and a saved profile** (theme, narration preference, progress, points, streak) (D3) | Decided MVP target | Device-local anonymous `subjectId`; no accounts. |
| **Dark chart as the primary theme**, with a complete light equivalent; final choice still Guy's (S2) | Planned | Light only. |
| **Living Chart** journey and **Knowledge Index** (S2) | Planned | Conventional lesson path. |
| Offline answers stay queued and ungraded; reconnect reconciles **once**, no duplicate rewards (S1, S2) | Decided | Queue on `main`; the reveal-on-reconnect half is **In testing** on PR #2. |
| Text is a complete route; narration is a preference that must not hide instruction (S2, S3) | Decided | `lessonMode` honours this; **In testing** on the narration branch. |
| Head-only bull as primary logo (S2) | Planned | Text wordmark placeholder. `specs/DECISIONS.md` still describes three candidates awaiting a pick — the Bible is newer. |

---

## 12. First week checklist

1. Read the **Product Bible v0.2** (§11) — it is the requirements document, and it is
   ahead of everything in this repo.
2. `npm install && npm run dev`, open at 390×844, play the whole loop.
3. `npm run verify` — note the real test count, not the one in a doc.
4. Read `packages/engine/src/prng.ts` and its header comment. Understand why it is
   frozen.
5. Read `packages/content/src/load.ts` → `toClientPack()`. Understand what the browser
   is and is not allowed to hold, and why.
6. Read `README.md` → "The integrity contract".
7. Open devtools and confirm the bundle holds no `correctOptionId`, no `target`, no
   exercise chart `seed`.
8. Skim `README.md` → "Decisions made where the specs were silent".
9. Before changing anything in `packages/*`: check you are not importing React or a Node
   built-in.
