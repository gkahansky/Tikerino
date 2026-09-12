# Tikerino

A mobile game that teaches you to read markets one tiny principle at a time, practised on
chart exercises with instant feedback.

**Every chart in this app is synthetic, generated practice data.** There is no real market
data, no real tickers, no dates, and nothing here is investment advice. That is not a
disclaimer bolted on at the end — it is the reason the engine exists.

Day one covers two topics (trading fundamentals, candlestick reading), 8 lessons and 15
exercises, on 6 phone-sized screens.

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
npm run verify         # typecheck, 152 unit/integration tests, regenerate every pack chart
npm run test:browser   # full loop in a real browser + axe on every screen
npm run test:play-all  # play all 15 starter exercises through the UI, checking each reveal
npm run shots          # phone-sized screenshots of each screen
```

`npm run test:browser` and `npm run test:play-all` need `npm run dev` running.

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
specs/             the authoritative specs, byte-identical to the Drive originals
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
29 series — all 24 charts the pack references plus coverage for families it does not use —
and the replay test fails if any of them shifts.

**The cut point holds.** The learner sees candles `0..windowSize-1`. Post-T candles are
generated and held **only on the server** until an answer is recorded. Enforced in three
places:

- `GET /api/exercises/:id/window` re-asserts invariants, then calls `assertNoPostCutCandles`
  on the exact array it is about to serialise.
- CI scans the serialised payload of every chart exercise for post-T candles, and separately
  for `correctOptionId`, `target`, `seed`, `scenarioFamily` and `feedback`.
- The client bundle is built from a *sanitised* pack (see below), so the answers and the
  exercise seeds are not sitting in devtools.

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

## Known content defect

`specs/tikerino-content-pack-v0.1.json` breaks its own schema in one place:

> `lesson-4-trading-words`: the principle card body is **76 words**; content schema v1 §3 caps
> it at 60.

The loader refuses to run on any validation failure, which would block the build. Rather than
weaken the rule or edit content this repo does not own, the one reviewed violation is recorded
in [`content-deviations.json`](./content-deviations.json), which downgrades *that specific
issue* to a loud boot-time warning. Every other violation — including a new one in the same
lesson — still stops the process, and a test asserts the pack would not load without the
acknowledgement.

Content owner's call. The card teaches five terms (bid, ask, spread, market vs limit order,
long vs short) in one screen, which also strains the locked "one idea per screen" rule, so the
fix is probably a split rather than a trim. Nothing is truncated in the meantime: the card
renders in full.

Delete the entry when the content is fixed.

---

## What is deliberately not here

Day-one scope, locked: no drag or line-placement exercise types, no exam mode, no accounts or
auth, no Postgres, no multi-service split, no analytics sink, no Hebrew or i18n, no real
market data, no streak server sync, no marketing pages. The palette is Growth Green only.

The bull logo is still one of three candidates awaiting a one-time pick, so the build ships a
Tikerino text wordmark and a placeholder candle icon (`scripts/make-icons.mjs`).

---

## The two endpoints

```
GET  /api/exercises/:exerciseId/window
POST /api/answers
```

No database: the content pack is a JSON file loaded at boot, and answer records append to
`server/data/audit.jsonl`. Each record carries the full audit identity — `syntheticSeriesId`,
`scenarioSpecVersion`, `generatorVersion`, `curriculumVersion` — so any answer can be replayed
bit-for-bit years from now. The idempotency index is rebuilt from that log at startup, so a
restart cannot double-count an answer.
