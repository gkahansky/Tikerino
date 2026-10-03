<!-- Snapshot of Google Doc "Tikerino - The Living Chart: Progression Design Spec v1.0" (Drive), taken 2026-10-03. -->

# Tikerino - The Living Chart: Progression Design Spec
**Version:** prog-rules-v1.0 | **Status:** Approved core constants; visual theme in A/B review | **Date:** 2026-09-19 | **Owner:** Design workstream

This is the authoritative progression behavior spec for The Living Chart, Tikerino's mobile journey screen. The whole vertical screen is a living candlestick chart world: lessons are candles, review gates are resistance lines, module exams are breakouts, and the player raises their own Knowledge Index through demonstrated learning and daily persistence. The trend represents growing capability - never money, returns, or prediction.

## 1. Approved constants
| Rule | Value | Status / source |
|---|---|---|
| Lesson completed | +25 XP | APPROVED - Guy, 2026-09-19 |
| Daily practice completed | +10 XP base | APPROVED - Guy, 2026-09-19 |
| Skill mastery | +40 XP | APPROVED - Guy, 2026-09-19 |
| Module exam completed | +150 XP | APPROVED - Guy, 2026-09-19 |
| Pullbacks | Visual only; zero XP loss, ever | APPROVED - Guy, 2026-09-19 |
| Persistence bonus | +2 XP per consecutive day from day 2, capped at +20 | APPROVED - Guy, 2026-09-19 |

## 2. Persistence ladder (approved)
Daily practice award = 10 XP base + 2 XP x (consecutive days - 1), bonus capped at +20. Maximum daily award is +30 XP from day 11 onward.

| Consecutive day | 1 | 2 | 3 | 4 | 5 | 7 | 9 | 11+ |
|---|---|---|---|---|---|---|---|---|
| Total daily XP | +10 | +12 | +14 | +16 | +18 | +22 | +26 | +30 (cap) |

**Missed day:** zero XP removed, no punishment visual. The consecutive-day counter restarts; the Streak Volume panel simply begins a new run. Lifetime practice days remain visible forever. **Day boundary:** the user's device-local day; evaluation happens at local midnight rollover, never retroactively.

**Why this shape:** linear and explainable; the cap prevents grind compulsion; mastery (+40) always beats the maximum daily attendance award (+30); no clawback.

## 3. Worked examples
- **Steady week:** Dana practices 7 days in a row and completes 2 lessons with 1 skill mastered. XP = (10+12+14+16+18+20+22) + 2x25 + 40 = 112 + 50 + 40 = **202 XP**. Chart: two candles close, one strong mastery close, seven volume bars.
- **Missed day:** Dana misses day 8. Nothing is removed; the consecutive counter restarts. Day 9 earns +10 base again and a new volume run starts. Chart: flat segment, then a fresh candle; no red, no drop below the Safe Floor.
- **Return after a gap:** Dana returns after 10 quiet days to a welcoming bounce-back message (no guilt, no "broken streak" framing), practices, and earns +10 base plus any lesson/mastery XP. Lifetime practice-day count keeps its full history.

## 4. Guardrails (locked product rules)
- XP never decreases for any reason. Pullbacks are purely visual and never drop below the last locked-in Safe Floor (LOCKED BASELINE marker).
- No loss language: banned terms include "lost", "down", "wiped out", "liquidated", "recovered your money", negative balances, debt.
- Mastery must always read as more valuable than attendance (+40 > +30 max daily).
- No money, profit, portfolio, return, or prediction framing anywhere; the index is capability, labeled KNOWLEDGE INDEX, denominated in XP.
- No fragile streak pressure: persistence is celebrated as volume, never threatened.
- Recovery after an error earns progress only through completed learning evidence - never through purchase or skipping.
- No coins, dollar signs, money bags, or money-symbol imagery in rewards.

## 5. Learner-facing copy (current approved patterns)
| Moment | Copy |
|---|---|
| Safe Floor explainer | "Mistakes cause small pullbacks, but never drop below your locked support level." |
| Current candle prompt | "Form this candle!" |
| Persistence label | "Streak Volume - 7 Days" + "7-DAY RUN" (never "CONSISTENCY: 100%") |
| Review gate | "MAJOR RESISTANCE: 5,000 XP" with lock badge |
| Exam zone | "BREAKOUT ZONE - MODULE EXAM - Breakout! +150 XP", and on completion a summary naming the actual skills demonstrated |
| Return after gap | Welcoming bounce-back; no guilt, debt, or repair language |

Real lesson titles come from Content; current screen titles are placeholders.

## 6. Event / state mapping (consumes Content's semantic events)
| Semantic event | Chart effect | Max motion | Text / reduced-motion equivalent |
|---|---|---|---|
| lesson_started | Current candle wick begins forming; goal preview card names the skill | 400ms | "Lesson started: [skill]" |
| worked_example_completed | Wick extends; small evidence tick (not mastery) | 600ms | "Worked example done" |
| close_practice_completed / transfer_practice_completed | Candle body fills; partial reasoning = smaller fill + coach note | 600ms | "Practice complete: [result]" |
| misconception_detected | Small pullback wick above the Safe Floor only; diagnosis + offered worked example or easier parallel case | 600ms | "Not yet - here's the idea to check" |
| recovery_completed | Pullback retraced with bounce-back glow + plain-words explanation | 900ms | "Recovered: [skill] understood" |
| skill_mastered | Candle closes strong + named skill marker; visibly larger than attendance moves | 900ms | "Skill mastered: [skill] (+40 XP)" |
| mixed_review_completed | Thin connectors from earlier skill candles into the current one | 900ms | "Review connected N earlier skills" |
| module_exam_completed | Breakout through resistance into the golden zone + before/after mastery summary | 1500ms | "Exam passed: [skills] (+150 XP)" |
| daily_practice_completed | +1 volume bar; index bump per approved ladder | 600ms | "Day N in a row: +X XP" |
| return_after_gap | Welcoming bounce-back candle; zero penalty | 900ms | "Welcome back - your progress held" |
| offline/queued answer | Neutral gray pending candle until server grading confirms; idempotent reconcile | n/a | "Answer sent - confirming" |

Server-confirmed grading and stable lesson/skill IDs are authoritative. The chart never infers progress from screen visits or local animation state.

## 7. Accessibility
- Every state pairs color with icon + text label; never color alone. Hollow vs filled candle semantics carry shape cues.
- Touch targets >= 48px; current lesson CTA sits in the thumb zone (center-low).
- Screen-reader order: HUD index -> current candle/CTA -> gate -> volume panel -> navigation.
- Text-only and reduced-motion modes render the static equivalents in section 6; no information exists only in animation.
- WCAG 2.1 AA contrast in both themes: dark uses neon green on deep navy; light uses Ink Navy text on white/pale-mint.

## 8. Versioning
This ruleset carries version ID **prog-rules-v1.0**. The version is stored with every progression state so results stay deterministic, explainable, replayable and testable. Any change to approved constants requires Guy's explicit approval and a version bump with a changelog entry here.

## 9. Analytics and privacy (open questions)
- What progression behavior data is stored, where, and with what retention - needs Guy's decision with Engineering's privacy review before any new behavior is persisted.
- A/B measurement plan for dark vs light theme (metric, duration, guardrails) - to be defined before the test starts.
- Preferred storage shape per Engineering: append-only/versioned semantic-event record plus a deterministic projection.

## 10. Engineering acceptance criteria
- Progression state is a deterministic function of the semantic event stream; replaying the same events yields the same state.
- Server-confirmed grading is the only source of learning credit; offline work produces only the neutral queued state and reconciles idempotently (duplicate deliveries never double-credit).
- No code path can decrease XP; pullbacks are presentation-only transforms bounded by the stored Safe Floor.
- Persistence bonus implements exactly: base 10, +2 per consecutive day from day 2, bonus cap +20; missed day restarts the counter and removes nothing; device-local day boundary.
- Mastery survives content-version changes; skill-ID continuity, retired/split/merged skills follow the Content versioning rules.
- Every animated state ships with its text and reduced-motion equivalent from section 6.
- Contract tests prove no event implies money, loss, prediction, debt, or punishment - including text-only paths.

## 11. Open decisions (not locked here)
- Dark vs light journey theme: dark is primary; light variant built for A/B and in panel review; Guy ratifies after the panel.
- "+2.4% this week" display: proposed as week-over-week Knowledge Index change; definition pending Guy.
- "Mastery level" titles (e.g. "Bullish Reversal Specialist"): placeholder naming system pending.
- Mascot cameo: approved to keep; production uses the pixel-exact approved head-only bull asset, not regenerated art. Body variant still awaiting Guy's pick.
- Real lesson titles and module names: owned by Content.
