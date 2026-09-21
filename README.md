# Tikerino

A mobile game that teaches you to read markets one tiny principle at a time, practised on
chart exercises with instant feedback.

**Every chart in this app is synthetic, generated practice data.** There is no real market
data, no real tickers, no dates, and nothing here is investment advice. That is not a
disclaimer bolted on at the end — it is the reason the engine exists.

Day one covers two topics (trading fundamentals, candlestick reading), 9 lessons and 16
exercises, on 6 phone-sized screens. Content pack v0.2.0.

---

## Running it

```sh
npm install
npm run dev          # server on :8787, client on :5173
```

Open `http://localhost:5173` on a phone-sized viewport. The full loop is playable:
onboarding → path home → lesson card (principle + guided example) → exercises on charts cut
at T → grading, XP, the animated reveal and the disclaimer → back to the path with XP and
streak updated.

### Verifying it

```sh
npm run verify         # typecheck, 156 unit/integration tests, regenerate every pack chart
npm run test:browser   # full loop in a real browser + axe on every screen
npm run test:play-all  # play every starter exercise through the UI, checking each reveal
npm run shots          # phone-sized screenshots of each screen
```

`npm run test:browser` and `npm run test:play-all` need `npm run dev` running.

### Deploying it

```sh
npm ci
npm run build --workspace @tikerino/client    # static files in client/dist
HOST=0.0.0.0 PORT=8787 npm run start --workspace @tikerino/server
```

`HOST` defaults to `127.0.0.1`, which is right on a laptop and wrong in a container -
nothing outside reaches it. Set it to `0.0.0.0` anywhere the process sits behind a
proxy or an ingress.

The client asks for `/api/...` **relative**, so the default deployment is one origin:
serve `client/dist` and let the same host proxy `/api` to the server. To split them,
build the client with an API origin baked in:

```sh
VITE_API_BASE_URL=https://api.tikerino.example npm run build --workspace @tikerino/client
```

It is read at build time and inlined, so a client built for one API origin cannot be
repointed without rebuilding. The server already answers with permissive CORS, so
nothing changes on its side. See `client/.env.example`.

Two deployment facts worth knowing before the first attempt:

- **The PWA needs https.** A service worker will not register over plain http (beyond
  `localhost`), so the install prompt and offline shell simply do not appear. An https
  page also may not call an http API - the client refuses to start on that mismatch
  rather than letting it surface to the learner as "you appear to be offline".
- **There is no health endpoint.** The engine spec locks the server to exactly two
  endpoints, so rather than quietly adding a third, use
  `GET /api/exercises/ex-001/window` as the readiness check - it exercises content
  loading and chart generation, which is a better check than a bare `200 OK` anyway.

### The audit store

Every graded answer is recorded with the full audit identity of its chart
(`syntheticSeriesId`, `scenarioSpecVersion`, `generatorVersion`, `curriculumVersion`),
so any answer can be replayed bit-for-bit years later. This is not a log. It is the
evidence that a grade was correct.

There are two backings, chosen by whether `DATABASE_URL` is set:

| | `DATABASE_URL` unset | `DATABASE_URL` set |
|---|---|---|
| Store | JSONL at `server/data/audit.jsonl` | Postgres |
| Idempotency | in-memory `Map`, rebuilt by reading the file at boot | `UNIQUE (subject_id, exercise_id, assignment_snapshot_at)` |
| Processes | exactly one, by construction | any number |
| For | dev, CI, the browser suites | **deployment** |

A deployment sets `DATABASE_URL`. The schema is created on boot and the migration is
idempotent, so every replica can run it. If `DATABASE_URL` is set and the database is
unreachable the server refuses to start — it will not fall back to a file nobody is
going to look at.

To carry an existing JSONL log across:

```sh
DATABASE_URL=postgres://... node scripts/migrate-audit-to-postgres.mjs
```

It is safe to re-run: inserts go through the same `ON CONFLICT DO NOTHING` path the
server uses, so a half-finished migration resumes rather than duplicating. It reports
how many rows it skipped, and reads one record back field-by-field to prove the round
trip rather than treating "no error" as success.

**`DATABASE_URL` is a secret** — it carries a password. It is the only one this project
has; everything else (`PORT`, `HOST`, `VITE_API_BASE_URL`) is plain configuration. See
`server/.env.example`.

---

## Layout

```
packages/engine    seeded OHLCV generator, scenario families, candle-rule resolution,
                   accessibility narrative                      (no React, no Node APIs)
packages/grading   answer grading + XP scoring                  (no React, no Node APIs)
packages/content   content-pack types, loader, validation       (no React, no Node APIs)
packages/state     progress, XP, streaks, offline queue         (no React, no Node APIs)
server/            one thin Fastify server, exactly two endpoints
client/            Vite + React + TypeScript, Tailwind, installable PWA
specs/             the authoritative specs, byte-identical to the Drive originals.
                   Both content-pack versions are kept: v0.2.0 is what the app loads,
                   v0.1.0 stays so answers audited against curriculumVersion 0.1.0 can
                   still be replayed against the pack they were actually graded on.
tests/             unit, integration and browser suites; tests/goldens holds the replay hashes
```

The four `packages/*` are framework-neutral TypeScript with no React imports and no Node
built-ins, so the React Native client will take them unchanged. Only screens, navigation and
platform glue get rewritten. `packages/state` takes an injected storage adapter for the same
reason — the web client passes `localStorage`, React Native will pass AsyncStorage.

---

## The integrity contract

This is the product, not a feature of it.

**Deterministic generation.** Every chart comes from `(scenarioFamily, seed,
scenarioSpecVersion)` through the exact FNV-1a + mulberry32 pair in the engine spec. Same
seed, same series, bit for bit, forever. `tests/goldens/series.json` pins SHA-256 hashes for
30 series — all 25 charts the pack references plus coverage for families it does not use —
and the replay test fails if any of them shifts.

This survived its first real test. Content pack v0.2.0 restructured the curriculum (a lesson
split in two, an exercise added, four guided-example indices corrected) and all 24 charts
carried over from v0.1.0 regenerated to byte-identical hashes. A content version bump moves
content; it must never move a chart, and now there is evidence rather than a promise.

**The cut point holds.** The learner sees candles `0..windowSize-1`. Post-T candles are
generated and held **only on the server** until an answer is recorded. Enforced in three
places:

- `GET /api/exercises/:id/window` re-asserts invariants, then calls `assertNoPostCutCandles`
  on the exact array it is about to serialise.
- CI scans the serialised payload of every chart exercise for post-T candles, and separately
  for `correctOptionId`, `target`, `seed`, `scenarioFamily` and `feedback`.
- The client bundle is built from a *sanitised* pack (see below), so the answers and the
  exercise seeds are not sitting in devtools.

**Guided examples say what the chart shows.** `annotateCandleIndex` points a walkthrough step
at one candle, and nothing structural stops it pointing at the wrong one -- the indices in
v0.1.0 were authored before this engine existed, so they were picked without anyone being
able to see the generated chart. `scripts/check-content-charts.mjs` now reads each step for
claims it can verify ("hollow green body", "smallest body", "a run of bullish candles") and
fails if the candle contradicts them.

**Grading is server-side.** `POST /api/answers` regenerates the series from the pack ref —
the client's copy of the chart is never trusted — re-asserts invariants, resolves the target,
grades, scores, appends one JSONL audit record, and returns grading + XP + reveal +
disclaimer in one response. The client shows the reveal only after that response arrives.

**Offline answers lock.** With no connection the answer is stored locally exactly as given
and the reveal is deferred; when the connection returns the queue is flushed and the reveal
is shown. Retries are idempotent on `(subjectId, exerciseId, assignmentSnapshotAt)`, so a
resent answer never double-counts — the recorded result is replayed, even if the retry
carries a different answer.

---

## Decisions made where the specs were silent

The brief says: when something is ambiguous, choose the option that keeps the integrity
contract and the accessibility requirements intact, and note it here. These are those calls.

### Generator

1. **Box-Muller returns `z0` and discards `z1`** — two uniforms per normal, always. Caching
   the second value would make a normal's value depend on how many normals preceded it,
   which makes the stream position fragile under any later refactor.
2. **Every branch consumes the same number of draws.** The counter-trend coin and the volume
   spike multiplier are drawn unconditionally; only their *effect* is conditional. A candle's
   outcome can never shift the stream for the candles after it.
3. **Volume is mapped linearly with a median near 2000**, a hard floor at 1000 and a strictly
   increasing soft ceiling approaching 9000. Two spec requirements pin this down and both are
   easy to break by accident: `volatile` needs a spike of ≥2.5× the window median, which is
   *arithmetically impossible* inside a 1000–9000 band if the median sits mid-band (2.5 ×
   3900 = 9750); and `highest_volume` must resolve to a unique candle, which a hard clamp
   breaks, because every clamped candle ties at the bound. The first version of this used a
   mid-band squash and no `volatile` seed in the pack could be generated at all.
4. **`range_bound` mean-reverts with a pull of 0.25 toward the start price and *reflects* at
   the ±3% band** rather than clamping to it. Clamping would park several candles on the
   identical price and manufacture ties.
5. **Counter-trend candles (p=0.25 in the trend families) mirror the body about the open**,
   preserving the drawn magnitude. The spec says such candles are *allowed*, not required, so
   nothing asserts their presence.
6. **Family "Extras" are checked over the window portion only** — the learner has to be able
   to see the feature the exercise asks about. On failure the candidate is resampled from the
   *continuing* stream, never a reseed, capped at 200 attempts before throwing. A seed that
   cannot satisfy its family is a content fix (schema §5: the seed changes, never the
   generator).
7. **The first candle treats `startPrice` as the previous close**, since it has no predecessor.

### Grading and XP

8. **XP order is `base × multiplier + speedBonus`, then halve for a hint.** The spec's worked
   example (base 10, multiplier 2, speed 1, total 21) fixes the bonus as *inside* the
   halving, not after it.
9. **`hintPenaltyApplied` records that the 50% cost was applied to the calculation**, so it
   is `true` whenever the learner spent a hint, including on an incorrect answer where the
   total is 0 regardless.
10. **Idempotent retries recompute XP from the recorded inputs** rather than storing the
    breakdown. This keeps the audit record to exactly the fields the spec lists while still
    letting a retry return the identical result after a restart.

### Client

11. **The client gets a sanitised pack.** `scripts/sanitize-content.mjs` strips
    `correctOptionId`, `target` and `feedback` (which names the answer in prose), and strips
    `seed`, `scenarioFamily`, `revealSize` and `windowSize` from *exercise* chart refs. The
    engine is framework-neutral and therefore also runs in a browser: shipping an exercise
    seed would let anyone regenerate the post-T candles locally and walk straight around the
    cut point. The endpoint would be honest and the bundle would not be.
12. **Lesson charts keep their seeds and are generated in the browser.** Principle cards and
    guided examples have `revealSize: 0` — there is nothing after the cut to protect — and
    generating them locally is what makes the offline lesson shell work. `useLocalChart`
    throws if it is ever handed a chart with a non-zero `revealSize`.
13. **Exercise windows are deliberately not cached by the service worker.** Offline, the
    lesson shell works and the exercise screen says plainly that this one needs a connection,
    because only the server knows where the cut point is.
14. **Lesson `n` unlocks when lesson `n-1` is complete.** The specs describe a path but not
    its gating; this is the ordinary Duolingo-shaped convention.
15. **XP is credited once per exercise**, on the first answer, so replaying a lesson cannot
    farm it. Re-answering still counts for completion and for the streak.
16. **Streaks use the local calendar day and advance on graded activity**, so an answer
    captured offline moves the streak when the server acknowledges it, not when it was tapped.

### Accessibility and layout

17. **48px candle columns apply only when candles are selectable.** In `pick_the_candle` every
    candle is a touch target, so columns are ≥48px wide and the chart scrolls sideways on a
    narrow phone (12 candles need 576px). Everywhere else — lesson cards, guided examples,
    multiple choice, the reveal — the candles are not targets, so there is no target-size rule
    to satisfy and the chart is fitted to the viewport instead. Making a read-only chart
    scroll would cost comprehension for nothing.
18. **The chart's scroll container is keyboard-focusable** (`tabindex="0"` with a group label).
    Without it a keyboard user cannot scroll to the candles past the fold — axe flags this as
    a serious `scrollable-region-focusable` violation, and it was a real bug here.
19. **The text alternative is a visible disclosure, not a screen-reader-only block.** It holds
    `engine.describeCandles()` output — one line per candle with direction in words, OHLC,
    body vs range and volume vs median — and in `pick_the_candle` each row carries its own
    Select button. Tap, arrow keys + Enter, and the text list are three equal inputs with
    identical grading.
20. **`timeframeLabel` becomes the period each candle covers** in the narration: "1 day per
    candle" is read as "Candle 3 of 12, 1 day." Repeating the full phrase on every row is
    noise for someone listening to eighteen of them.
21. **The hint sits inline, not in the sticky footer.** Two stacked full-width buttons pushed
    the answers below the fold on a 390px phone, which is the wrong thing to hide.
22. **Candle index labels are 16px**, the floor, not the 11px they started at. Nothing under
    16px anywhere, including inside the SVG.

### One implementation note worth keeping

A CSS `transform` beats an SVG `transform` attribute on the same element. The reveal
animation and the positional transform therefore live on **nested** groups — animating the
outer one slid every revealed candle back to x=0 and stacked them on top of candle 1.
`tests/a11y/play-all.mjs` guards against the regression by asserting the candle x positions
are distinct and strictly increasing.

---

## Content defects found, and closed

Nothing outstanding. Recorded because the history is the useful part.

The first build ran against content pack v0.1.0 and surfaced five defects, four of which were
invisible until the engine could actually render a seed:

- `lesson-4-trading-words`'s principle card was **76 words** against the schema's 60-word cap —
  it taught five terms on one screen, which also strained the locked "one idea per screen" rule.
- `lesson-6`'s two walkthrough steps were **inverted**: "Hollow green body... Price rose" pointed
  at a bearish candle and "Solid red body... Price fell" at a bullish one, in the one lesson
  whose entire subject is telling the two apart.
- `lesson-7` step 0 said "smallest body... tiny body" over the **largest** body in the window
  (91% of its range).
- `lesson-7` step 1 talked about a run of bullish candles over a **bearish** one.

Content pack v0.2.0 fixed all of them: the lesson split into "Bid, ask, and spread" and
"Orders, long and short" (31 and 48 words), lesson 6 moved to candles 1 and 3, lesson 7 to
candles 2 and 8, and `ex-016` was added for order types.

`content-deviations.json` is the ledger that tracked them, and it is now **empty** — which is
the state to keep it in. It exists so a reviewed content defect can be acknowledged loudly
instead of either blocking the build or being silently tolerated; a test asserts it is empty,
so taking on new debt is a deliberate act rather than a drift.

## What is deliberately not here

Day-one scope, locked: no drag or line-placement exercise types, no exam mode, no accounts or
auth, no multi-service split, no analytics sink, no Hebrew or i18n, no real market data, no
streak server sync, no marketing pages. The palette is Growth Green only.

**One deliberate departure from that list: Postgres.** The engine+grading spec names it in
its own out-of-scope line and states "No database day one." Guy overrode that explicitly
before deployment, on the reasoning that the audit store is the one component where the
day-one shortcut is expensive to unwind later — it is the evidence behind every grade, and
the file-backed version is single-process by construction. Switching before any real learner
data existed cost nothing; switching after would have meant migrating live records. The JSONL
store is kept as the default when `DATABASE_URL` is unset, so development and CI still need
no database. Nothing else on the locked list has moved.

The bull logo is still one of three candidates awaiting a one-time pick, so the build ships a
Tikerino text wordmark and a placeholder candle icon (`scripts/make-icons.mjs`).

---

## The two endpoints

```
GET  /api/exercises/:exerciseId/window
POST /api/answers
```

Still exactly two, which is why there is no `/healthz` — use
`GET /api/exercises/ex-001/window` as the readiness check. It exercises content loading and
chart generation, so it is a better check than a bare `200 OK` anyway.

The content pack is a JSON file loaded at boot. Answer records go to the audit store
described above — Postgres in a deployment, JSONL in development. Each record carries the full
audit identity — `syntheticSeriesId`, `scenarioSpecVersion`, `generatorVersion`,
`curriculumVersion` — so any answer can be replayed bit-for-bit years from now, and
`(subjectId, exerciseId, assignmentSnapshotAt)` is enforced as unique, so a restart or a
second replica cannot double-count an answer.
