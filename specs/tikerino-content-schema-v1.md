# Tikerino Content Schema v1

**Status:** contract between content and code, 12 Sep 2026.
**Rule:** code loads content strictly by this schema; content is authored strictly against it. If either side needs a new field or a new enum value, bump `schemaVersion` here and in the pack's `curriculumVersion` minor version together. No silent drift, no undeclared optional fields in graded content.

Reference implementation of a valid pack: `tikerino-content-pack-v0.1.json`.

---

## 1. Top level: `ContentPack`

| Field | Type | Required | Notes |
|---|---|---|---|
| `packVersion` | string semver | yes | Content pack release, e.g. `"0.1.0"`. |
| `curriculumVersion` | string semver | yes | Stored with every graded answer (audit). Pinned per user until they opt into an update. |
| `locale` | string BCP 47 | yes | MVP: always `"en"`. Other locales rejected at load. |
| `generatorVersionCompat` | string semver range | yes | e.g. `">=1.0.0 <2.0.0"`. Loader refuses packs outside its engine's range. |
| `scenarioSpecVersion` | string | yes | Must match the engine's implemented scenario spec. Stored with every graded answer. |
| `meta` | object | yes | See 1.1. |
| `topics` | `Topic[]` | yes | Exactly 2 in MVP. |
| `lessons` | `Lesson[]` | yes | 8 in the starter pack. |
| `exercises` | `Exercise[]` | yes | 15 in the starter pack. |

### 1.1 `meta`

| Field | Type | Notes |
|---|---|---|
| `productName` | string | Display name. Currently `"Tikerino"` (provisional; swap is a content change only). |
| `audience` | string | Free text, informational. |
| `syntheticDataLabel` | string | Rendered on every chart, always visible. |
| `revealDisclaimer` | string | Rendered on every reveal screen (locked requirement). |
| `examDisclaimer` | string | Rendered on every exam screen. |
| `authoringNote` | string | Provenance note; not rendered. |

## 2. `Topic`

| Field | Type | Notes |
|---|---|---|
| `topicId` | string, unique, kebab | Stable forever; referenced by lessons. |
| `title` | string | Display. |
| `order` | int | Path ordering. |
| `description` | string | Internal/documentation. |

## 3. `Lesson`

| Field | Type | Required | Notes |
|---|---|---|---|
| `lessonId` | string, unique, kebab | yes | Stable forever. |
| `topicId` | string ref | yes | Must exist in `topics`. |
| `order` | int | yes | Order within the whole path (starter pack uses global 0-7). |
| `title` | string | yes | |
| `estimatedMinutes` | int | yes | 2-4 in MVP. |
| `crownLevelCap` | int 0-5 | yes | Progression ceiling; 5 in MVP. |
| `skills` | string[] | yes | Skill DAG tags from the closed list in §6. |
| `principleCard` | object | yes | `title` (string), `body` (string, **<=60 words**, no jargon not yet taught), `miniChart` (`ChartRef` or null). |
| `guidedExample` | object | yes | `chart` (`ChartRef`), `steps`: array of `{ text: string, annotateCandleIndex: int }`. `annotateCandleIndex` indexes into the window candles (0-based); client highlights that candle while the step is shown. |
| `exerciseIds` | string[] | yes | 1-3 per lesson in MVP; every id must exist in `exercises`. |

## 4. `Exercise` (discriminated union on `type`)

Common fields, all required unless noted:

| Field | Type | Notes |
|---|---|---|
| `exerciseId` | string, unique, `ex-NNN` | Stable forever; never reused after retirement. |
| `lessonId` | string ref | |
| `order` | int | Order within the lesson. |
| `type` | `"multiple_choice"` \| `"pick_the_candle"` | **Closed enum for day one.** Drag/line-placement types are deferred and will add new enum values later. |
| `difficultyTier` | int 1-2 | XP multiplier: 1 -> x1, 2 -> x2. |
| `skills` | string[] | Skills this item teaches/tests (§6). |
| `chart` | `ChartRef` or null | Null only for vocabulary MC. When present, the server cuts the window at `windowSize`; the client never receives post-window candles until grading. |
| `prompt` | string | One sentence. Plain words, no unexplained jargon. |
| `hint` | `{ text: string }` | Costs 50% of the exercise's XP (locked scoring rule). |
| `feedback` | `{ correct: string, incorrect: string }` | Each **<=40 words**, repeats the concept name, contains one "why" sentence. Shown with the reveal. |

### 4.1 `type: "multiple_choice"`

| Field | Type | Notes |
|---|---|---|
| `options` | `{ optionId: "a".."d", text: string }[]` | 3-4 options, stable ids. |
| `correctOptionId` | string | Must be one of the option ids. |

### 4.2 `type: "pick_the_candle"`

| Field | Type | Notes |
|---|---|---|
| `target` | `{ rule: CandleRule }` | Closed enum, see §5. The rule resolves deterministically against the window candles. |
| (no `options`, no `correctOptionId`) | | |

## 5. `CandleRule` (closed enum)

Resolved by the engine over the window candles only:

| Rule | Resolution |
|---|---|
| `first_bullish` | First index where `c > o`. Unique by construction. |
| `first_bearish` | First index where `c < o`. Unique by construction. |
| `highest_close` | Index of max `c`. |
| `lowest_close` | Index of min `c`. |
| `longest_upper_wick` | Index of max (`h - max(o,c)`). |
| `longest_lower_wick` | Index of max (`min(o,c) - l`). |
| `longest_body` | Index of max abs(`c - o`). |
| `highest_volume` | Index of max `v`. |

Tie-break for argmax rules: earliest index. **Content CI rule:** for every `pick_the_candle` exercise, CI regenerates the series from the seed and asserts the rule resolves to a unique candle with a margin (no near-ties within 1% of range for length rules). If it fails, the seed changes, never the tie-break.

## 6. `skills` closed list (starter)

`chart-axes`, `price-meaning`, `percent-change`, `volume`, `timeframe`, `vocab-spread`, `vocab-orders`, `vocab-long-short`, `ohlc`, `wicks`, `bullish-bearish`, `range-body`, `interpretation-limits`.

## 7. `ChartRef`

| Field | Type | Notes |
|---|---|---|
| `syntheticSeriesId` | string | Unique series identifier; starter convention `cp0.1/<slug>`. Stored with graded answers. |
| `scenarioFamily` | enum | `trend_up`, `trend_down`, `range_bound`, `volatile`, `ambiguous`. See engine spec. |
| `scenarioSpecVersion` | string | `"1.0"` in MVP. |
| `seed` | string | Full seed input to the generator. Same seed + family + spec version = same series, bit for bit. |
| `windowSize` | int > 0 | Candles visible through cut point T (indices 0..windowSize-1). |
| `revealSize` | int >= 0 | Post-T candles generated and served only after answer lock. 0 for lesson cards and guided examples. |
| `timeframeLabel` | string | Display string, e.g. `"1 day per candle"`. Never a real date or ticker. |

## 8. Versioning and validation rules

- `exerciseId`, `lessonId`, `syntheticSeriesId`, and `seed` are immutable once shipped. Fixes ship as a `curriculumVersion` bump.
- Pack load-time validation (client and CI): unique ids; all refs resolve; MC `correctOptionId` exists; every pick-the-candle has a chart and a valid rule; feedback word counts <= 40; principle card bodies <= 60 words; `locale` is `en`; all charts carry `syntheticDataLabel` indirectly via `meta`.
- Nothing in the pack may name a real ticker, company, or date. CI greps for patterns (ticker-shaped ALL-CAPS tokens against a denylist, calendar dates).
