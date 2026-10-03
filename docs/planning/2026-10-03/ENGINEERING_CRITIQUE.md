# Software Engineer critique of the Design plan

## 1. Agreements

- **Ladder copy (their hand-off 4).** They state the formula correctly: +10 base, +2 per consecutive day, max +30. This is the same work as my P0-1.
- **Emoji and Unicode in the chrome (P0.3, risk 4).** Confirmed in the live screenshots. The SVG icon set matches my P2-2.
- **No bull logo in the app (P1.3, risk 3).** Confirmed. The static head logo in the header is cheap and independent of other work.
- **Dark path vs. light lesson/exercise screens (risk 5, P2.1).** Confirmed. My plan already flags the journey colours as hard-coded hex values, so they need tokenizing first.
- **Missing chart annotation vocabulary (P1.2).** Accurate against `CandleChart.tsx`.
- **Stitch boards must never be treated as a spec (P0.1).** I agree with the rule, but not the severity (see §2).
- **Device VoiceOver/TalkBack run (P2.2).** Agree. It is correctly placed late because Guy deferred it to production preparation.
- **Recovery loop after missed answers.** Agree. It matches my P2-3 and Bible §2.

## 2. Corrections and disagreements

1. **Risk 1, "recent exploratory mockups … have drifted dangerously" (High).**
   - The mockups exist, but the Stitch project was created on 11 Sep under the earlier product name. That is before the Bible decisions of 19–25 Sep. None of it is in the shipped app.
   - **Fix:** downgrade to Low housekeeping. P0.1 becomes "archive and label `design/stitch*` as superseded pre-Bible explorations" (XS).
   - Decision 4 is not needed from Guy, because the Bible already forbids these mechanics.
   - **Sure** (verified).

2. **Risk 2 / P0.2, "sticky CTA directly overlaps and obscures candle rows" (High).**
   - This is unverified. A sticky element always overlaps scrolling content in a static screenshot. The plan itself notes that scroll padding already exists.
   - **Fix:** first add a 390×844 browser test that scrolls to the end and checks the last row's bounding box clears the CTA. Change the CSS only if the test fails.
   - The verified CTA problem is a different one: screen-reader order. LC spec §7 wants HUD → current candle/CTA → gate → volume → nav, but `PathHome.tsx` puts the CTA last.
   - **Sure** about the order issue. **Unsure** about the visual overlap.

3. **"Exemplary WCAG 2.2 AA compliance" and "strict … 16px minimum floor".**
   - These are overstated. `.journey-sync`, `.persistence-lifetime` and `.persistence-daily` are 14px (`index.css` lines 145–147). The SR order above is also off-spec.
   - **Fix:** say "automated audit passes; known gaps listed".
   - **Sure.**

4. **Ladder status "Partial … failing to reflect the ladder in UI copy".**
   - The ladder does not exist in state at all. `DAILY_PRACTICE_XP = 10`, and `normaliseDailyAwards` clamps every stored award to 10. Changing the copy alone would display numbers the state does not award.
   - **Fix:** mark it Missing. It is delivered by my P0-1.
   - Also, "+2 XP/day capped at +20" (gap table) and "+2 to +20 XP persistence volume ladder" (P1.1) are ambiguous. The bonus caps at +20; the award caps at +30.
   - **Fix:** specs should use "+10 → +30" and the LC spec §6 copy "Day N in a row: +X XP".
   - **Sure.**

5. **P0.3 icon list includes "Streak Flame", and Profile "streaks" is described neutrally.**
   - This conflicts with the no-streak-pressure rule (Bible §3, LC spec §4).
   - The plan also misses two verified copy issues:
     - Onboarding card 3, "Build your streak, climb the path" with 🔥.
     - "may be lost" in `RevealScreen.tsx`, which is banned loss language.
   - **Fix:**
     - Replace the flame with a persistence/volume glyph.
     - Rename "Longest streak".
     - Rewrite both strings. My P0-2 contract test will then enforce the wording.
   - **Sure.**

6. **Score breakdown with speed bonus and hint deductions, presented as a strength.**
   - Bible §3 lists only four awards. The Playbook warns against rewarding speed and charging for hints. The ops board already records the "+10 vs legacy 12" confusion.
   - **Fix:** Design should back my Decision 3: remove the score from the learner UI and make hints free.
   - **Sure** about the code. The Playbook reading comes from my plan.

7. **WCAG 2.1 AA in the P1.1 and P2.1 acceptance criteria.** The release bar is 2.2 AA (`RELEASE_BAR.md`). **Sure.**

8. **"Locked … Design Tokens v2" / "Adopt Tokens v2".** As far as I know, doc 09 is still a draft and has not been handed into `specs/`. Only v1 is in the repo. It should be finalized before anyone consumes it. **Medium** confidence.

9. **P1.1 acceptance criteria that require a shipped Safe Floor line.**
   - The Safe Floor and mastery interactions are Open (Bible §7). Visuals can be specced now, but shipping depends on my Decision 1 and my P1-1. Pullbacks must stay presentation-only.
   - **Fix:** split P1.1 into "spec now" and "ship after D1 + P1-1".
   - **Sure.**

10. **P1.3 effort S, including exam-pass cameos.**
    - The module exam does not exist and its rules are Open.
    - **Fix:** split it. The static head logo in the header is S, now. Milestone cameos come later and only for events that exist.
    - **Sure.**

11. **Decision 1, Concept A vs. B.**
    - The LC spec already defines a candlestick-chart world, so this decision may already be settled.
    - **Fix:** ask Guy to confirm that the LC spec supersedes doc 05, rather than opening a new decision.
    - **Unsure:** I can't verify whether Guy has formally ruled on this.

12. **"Crowns" in the Profile description.** This is not in my code inventory, so I can't verify it.

13. **Missing from their plan:** a "results ready" state for answers confirmed after reconnect (Bible §2), which my P1-2 needs. I need Design copy and a state for it.

## 3. Dependencies and hand-off conflicts

| Their ask | Problem | Sequencing that works |
|---|---|---|
| H4: ladder display | There is no calculated award to connect to yet | I ship P0-1 (state + tests) with the spec §6 copy as a placeholder. Design confirms placement in the same PR window. Their P1.1 copy follows. |
| H1: CTA padding | The overlap is unverified; the SR order is the real defect | I add the scroll-clearance test and fix the DOM order in one PR. I need a 1-line confirmation of the order from Design. |
| H2: consume tokens v2 CSS | I can't consume a draft | Design hands the final v2 file into `specs/`. I then tokenize the dark journey hex values with no visual change, and verify with screenshot diffs. Light parity (P2.1) waits for Decision 3. |
| H3: SVG icon component | Fine to build. Each icon needs an accessible name or an `aria-hidden` ruling, and there is an 80 KB first-load JS budget | I build an inline sprite component with no runtime loader. Design supplies a per-icon decorative/meaningful flag. P0-3 CI checks 3:1 non-text contrast and the budget. |
| H5: annotation hooks | Annotations need `describeCandles` text, content-schema fields (Content-owned, P1-5) and an integrity rule | I won't build hooks speculatively. Order: Design spec P1.2 → Content schema fields → my renderer. Annotation geometry on exercise charts must use only pre-cut candles, and I will add this to `server.integrity` tests. |
| P1.1: Living Chart overhaul | Visual states must bind to real events, each with text and reduced-motion equivalents | Design specs bind to my P1-1 event names and payloads. I deliver the event API before Design finalizes redlines, plus per-screen performance headroom for animation. |
| P1.3: mascot milestones | Animation runtime cost; exam event not yet defined | Static SVG first. Any animation runtime needs a budget line from me before Design commits to a format. |

## 4. Changes to my own plan

- **P0-2 (extended):**
  - Add these to the language contract banned list: hearts/lives, "trade", currency-price axes, and real tickers (AAPL, TSLA, BTC). This guards against the Stitch patterns re-entering the app.
  - Include the onboarding streak card, the 🔥, the "Longest streak" label and "may be lost" as named fixes, with Design copy.
- **P0-3 (extended):** add the 390×844 CTA scroll-clearance test and the LC spec §7 DOM-order fix for `PathHome.tsx`. This was in my gap table but had no plan item.
- **P0-1 (extended):** add an acceptance criterion that every learner-facing ladder string reads +10…+30 and the spec §6 wording. Correct the "+2 to +20" phrasing wherever it is shared.
- **New P1-8 (pulled from P2-2):** the inline SVG icon component and the static head-only bull logo in the header, as soon as the assets land. The rest of P2-2 (light parity) stays in P2.
- **P2-2 (reordered):** tokenizing the dark journey colours moves ahead of the light theme and is gated only on the tokens v2 handover.
- **New P2-4:** a chart annotation layer in `CandleChart.tsx`, with `describeCandles` extensions and a pre-cut-only integrity test. It depends on Design P1.2 and Content P1-5.
- **§7 hand-offs (added):** a request for Design to confirm the "results ready" state for P1-2, and the decorative/meaningful flag for each icon.
- **Dropped:** nothing.