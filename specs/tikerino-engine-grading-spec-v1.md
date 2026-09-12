# Tikerino Engine + Grading Implementation Spec v1

**Status:** implementation contract, 12 Sep 2026. This is a spec, not code - Claude implements it in framework-neutral TypeScript.
**Scope:** day-one build. Covers the seeded synthetic chart generator, window cutting, grading rules, XP scoring, reveal payload, and the two thin-server endpoints.

---

## 1. Architecture placement

Two consumers share the same framework-neutral packages:

- `engine` package: deterministic OHLCV generation, scenario families, series invariants, candle-rule resolution, candle accessibility narrative.
- `grading` package: answer grading, XP scoring.
- `content` package: pack loading + validation per `tikerino-content-schema-v1.md`.
- `state` package: progress, XP, streaks, crowns (local persistence day one).

The thin server imports `engine` + `grading` + `content`. The client imports `content` (types/validation only) + `state`, and renders. **Post-T candles exist only inside the server's process until an answer is recorded.** The client bundle must never contain a generated reveal, and the window endpoint must never serialize one.

## 2. Deterministic generator contract

### 2.1 Seed derivation

- Input: string `seed` from the pack (e.g. `"cp0.1/ex-004"`).
- Hash to uint32 with FNV-1a (32-bit): h = 2166136261; for each byte: h ^= byte; h = Math.imul(h, 16777619) >>> 0.
- PRNG: mulberry32(h). Exact reference:
  ```
  next(): h = (h + 0x6D2B79F5) >>> 0
          t = h
          t = Math.imul(t ^ (t >>> 15), t | 1)
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  ```
- Any other PRNG is forbidden: replay must be bit-for-bit identical across client, server, CI, and future React Native port.

### 2.2 Series model

`Candle = { i: int, o: number, h: number, l: number, c: number, v: int }`

- All prices are integer cents divided by 100 (round to 2 decimals at every step) so replays never diverge on floats.
- Invariants, enforced at generation and re-asserted server-side before serving: `l <= min(o,c)`, `h >= max(o,c)`, `v >= 0`, exactly `windowSize + revealSize` candles, indices 0..N-1.
- Total length = `windowSize + revealSize`. Cut point T is index `windowSize - 1`.

### 2.3 Scenario families (spec version "1.0")

Each family is a parameterized random-walk variant; parameters are drawn from the seeded PRNG inside the stated ranges so each seed yields a distinct but in-family series. Start price: uniform 20-80.

| Family | Drift per candle | Volatility (per-candle stddev of return) | Extras |
|---|---|---|---|
| `trend_up` | +0.4% to +0.9% | 0.8-1.5% | Occasional red candles allowed (p=0.25). |
| `trend_down` | -0.4% to -0.9% | 0.8-1.5% | Occasional green candles (p=0.25). |
| `range_bound` | ~0 (mean-reverting to start +/- 3%) | 0.6-1.2% | Mixed directions, no sustained trend. |
| `volatile` | 0 | 1.8-3.0% | At least one candle with a pronounced upper wick (wick >= 2x body); one volume spike (>= 2.5x median). |
| `ambiguous` | small random | 1.0-2.0% | Must contain at least one tiny-body/long-wick candle (body <= 20% of range, range > 1.5x median range). |

Per candle: close = previous close x (1 + drift + normal(0, vol)); open = previous close + small gap (normal(0, 0.3%)); high = max(o,c) + wick draw; low = min(o,c) - wick draw; wick sizes scaled to family volatility. Volume: baseline lognormal around 1.0 (scaled to 1000-9000 integer shares), multiplied 1.5-2.5x on candles with large absolute moves. The generator must guarantee the family "Extras" within the window portion (not only in reveal): if a candidate series fails, resample using continued PRNG draws (never reseed - that would break seed->series uniqueness).

Normal distribution: Box-Muller from the same seeded PRNG stream.

### 2.4 Replay and integrity tests

- Golden-seed replay test: a fixed list of (seed, family, windowSize, revealSize) regenerates and must match stored SHA-256 hashes of the serialized series. Mismatch blocks release.
- Negative test (CI): for every exercise, the window endpoint payload must contain zero candles with index > windowSize - 1; serialization is scanned for post-T data.
- Uniqueness validation: every `pick_the_candle` exercise's rule resolves to exactly one candle with margin (see content schema §5).

## 3. Candle-rule resolution (grading targets)

Implement exactly the resolutions in the content schema §5 over the window candles only. Tie-break: earliest index (content CI guarantees no real ties).

## 4. Grading rules

- `multiple_choice`: correct iff `answer.selectedOptionId == correctOptionId`. Exact match, no tolerance.
- `pick_the_candle`: correct iff `answer.selectedCandleIndex == ruleResolution(window)`. Exact index, day one. (Drag/stepper types with tolerance are deferred.)

Grading runs server-side only. The client sends the raw answer; the server regenerates the window from the pack ref, resolves the rule, grades, then returns grading + reveal in one response.

## 5. XP scoring (locked model)

- Base: 10 XP per correct answer. Incorrect: 0 XP.
- Difficulty multiplier: tier 1 -> x1, tier 2 -> x2 (applied to base).
- Hint used: total XP for that exercise halved (50% cost), rounded down, minimum 0.
- Speed bonus: only on correct answers, +2 XP if answered in under half the exercise's par time, +1 under par. Par time day one: 45s MC, 60s pick-the-candle. Speed is never worth more than accuracy: maximum bonus is +2 vs 10-20 base.
- Response echoes the full breakdown so the client can show it.

## 6. Endpoints (thin server, day one)

Node + Fastify, TypeScript. No database day one: the content pack is a JSON file the server loads at boot; answer records append to a JSONL audit file.

### 6.1 `GET /api/exercises/:exerciseId/window`

Looks up the exercise in the pack, generates the full series, cuts at T.

Response 200:
```
{
  "exerciseId": "ex-004",
  "curriculumVersion": "0.1.0",
  "generatorVersion": "1.0.0",
  "type": "pick_the_candle",
  "prompt": "...",
  "options": [...] | null,
  "chart": {
    "syntheticSeriesId": "cp0.1/ex-004",
    "scenarioSpecVersion": "1.0",
    "timeframeLabel": "1 day per candle",
    "syntheticDataLabel": "Practice chart - generated data, not a real stock.",
    "candles": [ { "i":0,"o":..,"h":..,"l":..,"c":..,"v":.. }, ... ]   // exactly windowSize
  }
}
```
Errors: 404 unknown exerciseId. The response must never contain candle index >= windowSize, the target resolution, or the correct option id.

### 6.2 `POST /api/answers`

Request:
```
{
  "subjectId": "anon-local-uuid",
  "exerciseId": "ex-004",
  "answer": { "selectedOptionId": "a" } | { "selectedCandleIndex": 7 },
  "hintUsed": false,
  "timeToAnswerMs": 12340,
  "capturedOffline": false,
  "assignmentSnapshotAt": "2026-09-12T07:30:00.000Z"
}
```

Response 200:
```
{
  "exerciseId": "ex-004",
  "correct": true,
  "target": { "optionId": "a" } | { "candleIndex": 7 },
  "xp": { "base": 10, "multiplier": 2, "hintPenaltyApplied": false, "speedBonus": 1, "total": 21 },
  "feedback": { "correct": "...", "incorrect": "..." },
  "reveal": {
    "candles": [ ... ],                // exactly revealSize post-T candles; [] if revealSize is 0
    "disclaimer": "<meta.revealDisclaimer>"
  },
  "audit": {
    "syntheticSeriesId": "cp0.1/ex-004",
    "scenarioSpecVersion": "1.0",
    "generatorVersion": "1.0.0",
    "curriculumVersion": "0.1.0"
  }
}
```

Server behavior:
- Regenerates the series from the pack ref, re-asserts invariants, resolves target, grades, computes XP.
- Appends one JSONL audit record: subjectId, exerciseId, syntheticSeriesId, scenarioSpecVersion, generatorVersion, curriculumVersion, answer payload, hintUsed, timeToAnswerMs, capturedOffline, assignmentSnapshotAt, serverReceivedAt, correct, xp.total.
- Idempotency: retries of the same (subjectId, exerciseId, assignmentSnapshotAt) return the recorded result without double-counting.
- Offline rule honored: `capturedOffline: true` records are accepted late; the client locks the answer locally and does not reveal until this response arrives (deferred reveal).

## 7. Accessibility narrative

`engine` exports `describeCandles(candles, timeframeLabel): string[]` producing the ordered screen-reader alternative: one entry per candle - direction, open/close, high/low, body size vs range, volume vs median. The chart region exposes this as an accessible list; every pick-the-candle target must be selectable from this list with the same grading result (tap/select parity, locked requirement).

## 8. Explicitly out of scope day one

Drag/line-placement exercise types, Postgres, multi-service split, accounts/auth, analytics sink (stub event names to console/local storage), exam mode, Hebrew/i18n, real market data, streak server sync.
