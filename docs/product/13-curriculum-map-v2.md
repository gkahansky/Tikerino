# Tikerino Curriculum Map v2.0 - Single Map for Ratification

**Status:** Ratification candidate. Not ratified. No lesson scripts, narration, video or media are authorized by this document.
**Supersedes:** Option 1 and Option 2 maps from the 22/9 decision package.
**Owner decisions applied (Guy, 23/9 20:52-20:55):** core certificate = PROF-1 + PROF-2 + PROF-3 with company analysis in core; technical indicators mandatory in core; MVP gates multiple-choice only with automated scoring; audience 13+; jurisdiction Israel.

**Promise (matched to what the gates prove):** A learner who completes the core can, on unseen synthetic cases, set investor constraints, build and maintain a simple diversified portfolio, evaluate investment claims (including indicator claims and AI-assisted notes), analyse a single company, and tell when evidence is enough to act, when it is not, and when licensed help is needed. The certificate records course competence on synthetic cases. It is not a licence, not investment advice, and not evidence of readiness to invest real money.

## Format key

- **Prerequisites:** module IDs. Every listed module must appear earlier in this map.
- **Tiers:** S0 text/table; S1 synthetic chart from the existing deterministic-seed engine; S2 synthetic evidence packet of a named type (registry below); S3 licensed historical data. No core or badge module requires S3.
- **Unseen assessment:** every MVP assessment is multiple-choice with one predefined correct answer per item, scored automatically. No human scorer.
- **Release preconditions:** LEGAL-IL = Israeli legal review signed off before the module or item ships. DESIGN-DATA = Design has approved the storage design for personal financial data before the feature ships.
- **Minors (13-17):** parental-involvement and consent notes for that module.
- **Workload:** lesson titles are not a workload measure. Learner time is **unmeasured**. The validator prints a labelled planning estimate per module for sequencing only; pilot timing replaces it.

## S2 packet registry

Each packet is generated from a seed. The generator emits the packet and its answer key together, so every scored item has a key computed from the packet data, not from an author's judgement at runtime.

| Packet type | Contents | Machine-checkable answer fields |
|---|---|---|
| S2-PERSONA | Investor persona: goal, amount band, date, liquidity need, loss limit | binding constraint label; required reserve; feasible-allocation set |
| S2-FUND | Fund factsheet, index rule, holdings table, costs | top-N weight; overlap %; total cost; tracking difference; concentration flag |
| S2-PORT | Portfolio state, targets, prices, scenario shocks | weights; drift; trade amounts; scenario loss; constraint-violation flags |
| S2-CLAIM | Claim text, source cards, incentive disclosure (hidden or shown) | source-type labels; as-of staleness flag; red-flag set; correct action |
| S2-AINOTE | Static AI research note with seeded errors | error locations; corrected values; fabricated-citation IDs |
| S2-STMT | Three-statement company set that reconciles | margins; free cash flow; profit-to-cash bridge items |
| S2-VAL | Valuation model with sensitivity inputs | range bounds per assumption; driver ranking |
| S2-IND | Price/volume series with a stated indicator rule | indicator values at marked points; signal count; lag in bars; hit rate versus base rate |
| S2-EXEC | Quote/order scenario: spread, depth, gap | fill price; slippage cost; cost-versus-edge verdict |
| S2-REGIME | Dated macro dashboard | channel-direction labels; stale-data flag |
| S2-FACTOR | Vendor-neutral factor definition sheets | definition-drift flag; turnover cost; persistence-claim verdict |
| S2-BT | Backtest with one or two isolated, declared flaws | flaw IDs; sign of corrected result; valid holdout design |
| S2-JOURNAL | Example decision journals (synthetic, no learner data) | process-label per entry; knowable-at-time flags |

## Core curriculum (all mandatory for the core certificate)

### P1 - Investor setup
- **Objective:** Produce a usable investor constraint statement.
- **Prerequisites:** none
- **Lessons:** P1.1 Saving, investing and speculating; P1.2 Goal, amount and date; P1.3 Horizon and liquidity; P1.4 Risk capacity versus tolerance; P1.5 Constraint statement.
- **Tool/practice:** Persona planner with manual worksheet fallback; guided persona, then varied persona.
- **Unseen assessment:** MC on a new persona: identify the binding constraint and the path it rules out.
- **Tier/accessibility:** S0 [S2-PERSONA]; plain form, no slider-only input.
- **Minors (13-17):** practice uses personas only; no prompt to enter the learner's own amounts. Parent note explains the module and suggests a shared family-goal exercise.

### P2 - Investor numeracy
- **Objective:** Calculate and label investment quantities with correct units and periods, and read a return as a spread of outcomes.
- **Prerequisites:** P1
- **Lessons:** P2.1 Units and periods; P2.2 Percent versus percentage point; P2.3 Cumulative versus annualized return; P2.4 Nominal versus real value; P2.5 Compounding; P2.6 Fees compound too; P2.7 Read a table and audit a formula; P2.8 Average return and dispersion.
- **Tool/practice:** Manual worked examples, then calculator/spreadsheet with formulas visible. Diagnostic may skip instruction, not the assessment.
- **Unseen assessment:** MC: pick the correct value for varied cases; pick the plausible worst year from a stated dispersion.
- **Tier/accessibility:** S0; formula in words, calculator permitted.

### P3 - Asset jobs and market plumbing
- **Objective:** Match common assets and market mechanisms to their economic job and risk.
- **Prerequisites:** P2
- **Lessons:** P3.1 Stocks as business claims; P3.2 Bonds as contractual claims; P3.3 Cash and cash equivalents; P3.4 Funds and ETFs; P3.5 Exchanges, brokers and custody (Israel and foreign brokers); P3.6 Bid and ask; P3.7 Spread and liquidity; P3.8 Market and limit orders.
- **Tool/practice:** Asset-card comparison and synthetic quote walkthrough.
- **Unseen assessment:** MC: choose asset type and order type for new constraints; identify the plumbing risk.
- **Tier/accessibility:** S0/S1 [S2-EXEC]; structured comparison and quote text.
- **Release preconditions:** LEGAL-IL (P3.5 account and custody content).
- **Minors (13-17):** P3.5 states that account opening for under-18s involves a parent or guardian under rules confirmed in legal review; no account-opening call to action.

### P4 - Bond, cash and currency risk
- **Objective:** Explain how rate, duration, credit, inflation and currency conditions affect bonds, cash and foreign holdings.
- **Prerequisites:** P3
- **Lessons:** P4.1 Price and yield move differently; P4.2 Maturity and duration; P4.3 Credit risk; P4.4 Inflation and real return; P4.5 Individual bond versus bond fund; P4.6 Currency exposure for a shekel-based investor.
- **Tool/practice:** Compare short/long duration, high/low credit and hedged/unhedged cases.
- **Unseen assessment:** MC: pick the sensitivity direction and the correct uncertainty statement; no price forecast is keyed.
- **Tier/accessibility:** S0 [S2-FUND]; maturity timeline as list.

### P5 - Fund and index anatomy
- **Objective:** Explain what a fund owns, how its rule works and where risk can hide.
- **Prerequisites:** P3
- **Lessons:** P5.1 Fund objective; P5.2 Index methodology; P5.3 Weighting rules; P5.4 Holdings and concentration; P5.5 Benchmark fit; P5.6 Tracking difference; P5.7 Turnover and tax unknowns.
- **Tool/practice:** Fund factsheet and holdings viewer, with spreadsheet fallback.
- **Unseen assessment:** MC: compare two funds for fit; identify the hidden concentration.
- **Tier/accessibility:** S2 [S2-FUND]; sortable table, methodology in plain text.
- **Release preconditions:** LEGAL-IL (P5.7 tax content).

### P6 - Fund cost, overlap and due diligence
- **Objective:** Compare funds without treating one metric as a verdict.
- **Prerequisites:** P2, P5
- **Lessons:** P6.1 Expense ratio; P6.2 Spread and trading cost; P6.3 Tracking quality; P6.4 Holdings overlap; P6.5 Domicile and Israeli tax unknowns; P6.6 Fund decision note.
- **Tool/practice:** Manual overlap count, then neutral overlap tool.
- **Unseen assessment:** MC: rank unseen funds; identify which facts are jurisdiction-dependent and must be checked.
- **Tier/accessibility:** S2 [S2-FUND]; table route, no heatmap dependency.
- **Release preconditions:** LEGAL-IL (P6.5 tax content).

### P7 - First diversified portfolio
- **Objective:** Construct a simple allocation that follows the constraint statement.
- **Prerequisites:** P1, P4, P5
- **Lessons:** P7.1 Diversification by risk source; P7.2 From goal to asset allocation; P7.3 Each holding has a job; P7.4 Concentration and correlation; P7.5 Liquidity reserve; P7.6 Write the first policy.
- **Tool/practice:** Portfolio builder plus spreadsheet export; worked persona.
- **Unseen assessment:** MC: pick the allocation that meets a new persona's constraints; identify the constraint failure in the others.
- **Tier/accessibility:** S2 [S2-PORT]; editable holdings table, no pie-chart dependency.

### P8 - Evidence and source literacy
- **Objective:** Judge a claim using source, as-of date, incentive, benchmark, causal logic and falsifier.
- **Prerequisites:** P2
- **Lessons:** P8.1 Fact, estimate and opinion; P8.2 Primary and secondary sources; P8.3 As-of date and staleness; P8.4 Incentives and conflicts; P8.5 Benchmark; P8.6 Falsification; P8.7 Correlation versus causation; P8.8 Evidence ledger.
- **Tool/practice:** Rank source cards; complete a ledger; spot the confounder in paired charts.
- **Unseen assessment:** MC: classify statements; pick the missing evidence; pick the correct reading of a correlation.
- **Tier/accessibility:** S0/S2 [S2-CLAIM]; source cards in reading order.

### P9 - Investor protection (Israel)
- **Objective:** Identify red flags and choose stop, verify or licensed-help action under Israeli rules.
- **Prerequisites:** P8
- **Lessons:** P9.1 Guaranteed return; P9.2 Urgency and scarcity; P9.3 Licensing in Israel: advisers, marketers and portfolio managers; P9.4 Influencer, issuer and platform incentives; P9.5 Privacy and account security; P9.6 When tax, legal or licensed help is needed.
- **Tool/practice:** Annotate promotions; practise the verification route.
- **Unseen assessment:** MC: classify a new promotion; pick the safe next step.
- **Tier/accessibility:** S0 [S2-CLAIM]; full text.
- **Release preconditions:** LEGAL-IL (whole module, including every item keyed "seek licensed help").
- **Minors (13-17):** parent note on scams aimed at teenagers and on agreeing a family rule before any real-money action.

### P10 - Probability and decision quality
- **Objective:** Compare uncertain choices using base rates, payoffs, ranges and path risk.
- **Prerequisites:** P2, P8
- **Lessons:** P10.1 Outcomes and probabilities; P10.2 Base rates; P10.3 Expected value; P10.4 Sample size and noise; P10.5 Range and uncertainty; P10.6 Sequence of returns risk; P10.7 Update with new evidence; P10.8 Process versus outcome.
- **Tool/practice:** Payoff table, path simulator and calibration history.
- **Unseen assessment:** MC: solve a varied payoff case; pick the riskier withdrawal sequence; identify good process with bad outcome.
- **Tier/accessibility:** S0/S2 [S2-PORT]; table alternative to tree and path chart.

### P11 - Rebalancing and portfolio maintenance
- **Objective:** Maintain a portfolio by policy rather than recent performance.
- **Prerequisites:** P7, P10
- **Lessons:** P11.1 Drift; P11.2 Time-based rebalancing; P11.3 Threshold rebalancing; P11.4 Changed-facts rebalancing; P11.5 Costs and Israeli tax as assumptions; P11.6 Review the policy.
- **Tool/practice:** Rebalance the worked portfolio under a market fall, a life change and a changed holding.
- **Unseen assessment:** MC: respond to drift created by new contributions and to a changed cost assumption.
- **Tier/accessibility:** S2 [S2-PORT]; before/after table and arithmetic.
- **Release preconditions:** LEGAL-IL (P11.5 tax content).

### P12 - Risk budget and position size
- **Objective:** Calculate exposure and scenario loss and stay within a stated risk budget.
- **Prerequisites:** P7, P10
- **Lessons:** P12.1 Position and portfolio exposure; P12.2 Scenario loss; P12.3 Gap assumptions; P12.4 Volatility and size; P12.5 Correlated positions; P12.6 Position-size rule.
- **Tool/practice:** Sizing calculator with formulas and spreadsheet fallback.
- **Unseen assessment:** MC: pick the size that fits the budget inside an existing portfolio; identify the invalid assumption.
- **Tier/accessibility:** S2 [S2-PORT]; labelled fields and units.

### P13 - Behaviour, checklist and journal
- **Objective:** Record what was knowable and review process separately from result.
- **Prerequisites:** P8, P10
- **Lessons:** P13.1 FOMO; P13.2 Loss aversion; P13.3 Overconfidence; P13.4 Anchoring and confirmation; P13.5 Pre-action checklist; P13.6 Decision journal; P13.7 Outcome-blind review.
- **Tool/practice:** Journal with minimised fields; paired lucky/weak versus unlucky/sound example journals.
- **Unseen assessment:** MC: label the process quality of two hidden-outcome decisions.
- **Tier/accessibility:** S2 [S2-JOURNAL]; chronological text log.
- **Release preconditions:** DESIGN-DATA (journal storage); LEGAL-IL (privacy review).
- **Minors (13-17):** journal is example-based or stored on the device only; no goals, amounts or holdings leave the device. Parent note explains what the journal holds.

### P14 - Responsible AI research
- **Objective:** Verify AI-assisted work and reproduce the decision without AI.
- **Prerequisites:** P8, P9
- **Lessons:** P14.1 Suitable AI tasks; P14.2 Claims, sources and uncertainty; P14.3 Fabricated citations; P14.4 Stale facts; P14.5 Privacy and personal data; P14.6 Reproduce without AI.
- **Tool/practice:** Correct a static AI research note against primary sources.
- **Unseen assessment:** MC: locate the errors in a new note; pick the correct recomputed value.
- **Tier/accessibility:** S0/S2 [S2-AINOTE]; no live AI vendor required.
- **Release preconditions:** LEGAL-IL (P14.5 privacy content).

### P15 - Chart and execution literacy
- **Objective:** Describe market structure and form a conditional implementation plan without claiming predictive edge.
- **Prerequisites:** P3, P12
- **Lessons:** P15.1 Axes and timeframe; P15.2 OHLC and volume; P15.3 Swing and range; P15.4 Zones and ambiguity; P15.5 Entry rule; P15.6 Order choice; P15.7 Spread, slippage and gap; P15.8 Invalidation and review date.
- **Tool/practice:** Synthetic chart with full data table; order simulator under liquid, illiquid and gap cases.
- **Unseen assessment:** MC: pick the supported description and the non-inference; pick implement or reject when costs matter.
- **Tier/accessibility:** S1/S2 [S2-EXEC]; full data table and keyboard route; chart-table equivalence check.

### I1 - Technical indicators: tools you measure and test
- **Objective:** Say what an indicator measures, compute it on a small window, show its lag and false signals, and turn one indicator rule into a fair test.
- **Prerequisites:** P10, P15
- **Lessons:** I1.1 An indicator is a formula over past data; I1.2 Moving averages and lag; I1.3 RSI; I1.4 MACD; I1.5 Bollinger bands; I1.6 Volume indicators; I1.7 False signals and base rates; I1.8 Turn one indicator rule into a test.
- **Tool/practice:** Compute each indicator by hand on a short window, then on the engine; count signals, false signals and lag on generated series; compare a rule's hit rate with the base rate and a do-nothing benchmark.
- **Unseen assessment:** MC: pick the correct indicator value at a marked bar; pick the lag; pick the test design that could show the rule does not work.
- **Tier/accessibility:** S1/S2 [S2-IND]; every indicator value available in the data table; no colour-only lines.

### A1 - Business map
- **Objective:** Map how a company creates value and can fail.
- **Prerequisites:** P8
- **Lessons:** A1.1 Customer and product; A1.2 Revenue driver; A1.3 Cost structure; A1.4 Competition; A1.5 Capacity and limits; A1.6 Failure condition.
- **Tool/practice:** Build a map from a worked packet, then a varied packet.
- **Unseen assessment:** MC: pick the revenue driver and the failure condition in a new packet.
- **Tier/accessibility:** S2 [S2-STMT]; structured outline.

### A2 - Financial statements
- **Objective:** Trace business events through statements without confusing profit and cash.
- **Prerequisites:** A1, P2
- **Lessons:** A2.1 Income statement; A2.2 Balance sheet; A2.3 Cash flow statement; A2.4 Margins; A2.5 Profit-to-cash bridge; A2.6 Units and comparisons.
- **Tool/practice:** Reconstruct statements from events.
- **Unseen assessment:** MC: pick the statement effect of a new event; pick the correct margin.
- **Tier/accessibility:** S2 [S2-STMT]; labelled tables and formulas.

### A3 - Earnings quality and capital allocation
- **Objective:** Judge a debt, dilution, buyback or reinvestment choice against business needs.
- **Prerequisites:** A2
- **Lessons:** A3.1 One-off items; A3.2 Working capital; A3.3 Free cash flow; A3.4 Debt and maturity; A3.5 Dilution; A3.6 Buybacks; A3.7 Reinvestment.
- **Tool/practice:** Cash bridge on a worked company.
- **Unseen assessment:** MC: pick the correct free cash flow; pick the allocation choice the packet supports.
- **Tier/accessibility:** S2 [S2-STMT]; S3 historical optional enrichment.

### A4 - Valuation range
- **Objective:** Produce a transparent range and identify the assumption that drives it.
- **Prerequisites:** A3, P10
- **Lessons:** A4.1 Price versus value; A4.2 Comparable multiples; A4.3 Normalize the metric; A4.4 Cash-flow assumptions; A4.5 Sensitivity; A4.6 Expectations in price.
- **Tool/practice:** Build and audit a sensitivity table.
- **Unseen assessment:** MC: rank assumptions by their effect on value; spot the multiple that is not comparable.
- **Tier/accessibility:** S2 [S2-VAL]; manual and spreadsheet routes.

### A5 - Thesis and security decision
- **Objective:** Act on, hold off, or reject a single-company thesis using range, benchmark, risk budget and falsifier.
- **Prerequisites:** A4, P12, I1
- **Lessons:** A5.1 Evidence set and missing data; A5.2 Benchmark; A5.3 Risks; A5.4 Monitoring facts; A5.5 Falsifier; A5.6 Implementation; A5.7 Review.
- **Tool/practice:** Two worked packets: one where acting is supported, one where evidence is missing.
- **Unseen assessment:** MC: pick the decision a new packet supports and the fact that would falsify it.
- **Tier/accessibility:** S2 [S2-STMT, S2-VAL]; S3 optional enrichment; structured template.

### P16 - Core capstone
- **Objective:** Transfer the shared process to unseen portfolio, claim and company cases.
- **Prerequisites:** P6, P11, P13, P14, A5
- **Lessons:** P16.1 Case method and hidden future; P16.2 How the gate works: one best answer, and "need more information" only when data is missing; P16.3 Portfolio practice case; P16.4 Claim practice case; P16.5 Company practice case; P16.6 When the evidence is enough to act; P16.7 Recovery and retest.
- **Tool/practice:** Integrated neutral workspace; every tool has a manual or export route. Practice cases come from families that never appear in gates.
- **Unseen assessment:** PROF-1 Portfolio Decision, PROF-2 Claim Evaluation, PROF-3 Security Decision (automated MC; see gate section).
- **Tier/accessibility:** S0/S2 [S2-PERSONA, S2-PORT, S2-CLAIM, S2-AINOTE, S2-STMT, S2-VAL, S2-IND, S2-EXEC]; calculations separated from judgement.
- **Release preconditions:** LEGAL-IL (items keyed "seek licensed help" and all Israeli tax, licensing and account items).

## Badge: Systematic researcher (PROF-4)

### S1 - Regime channels
- **Objective:** Explain one transmission channel and its forecast limit.
- **Prerequisites:** P3, P8, P10
- **Lessons:** S1.1 Rates; S1.2 Inflation; S1.3 Growth; S1.4 Liquidity; S1.5 Cyclicality; S1.6 Regime-label limits.
- **Tool/practice:** Synthetic dated dashboard.
- **Unseen assessment:** MC: pick the channel direction and the uncertainty statement for a new scenario.
- **Tier/accessibility:** S2 [S2-REGIME]; S3 optional enrichment; table and text.

### S2 - Factor evidence
- **Objective:** Compare factor definitions, implementation costs, diversification and failure modes.
- **Prerequisites:** P5, P10, S1
- **Lessons:** S2.1 Market exposure; S2.2 Value; S2.3 Momentum; S2.4 Quality; S2.5 Size; S2.6 Crowding; S2.7 Turnover; S2.8 Failure modes.
- **Tool/practice:** Vendor-neutral factor sheets.
- **Unseen assessment:** MC: detect definition drift; reject an unsupported persistence claim.
- **Tier/accessibility:** S2 [S2-FACTOR]; S3 optional enrichment; academic source ledger required.

### S3 - Backtest audit
- **Objective:** Detect common false-confidence mechanisms in a test.
- **Prerequisites:** S2, I1
- **Lessons:** S3.1 Historical question; S3.2 In-sample and out-of-sample; S3.3 Survivorship; S3.4 Look-ahead; S3.5 Selection; S3.6 Multiple testing; S3.7 Costs and turnover; S3.8 Benchmark.
- **Tool/practice:** Audit a deliberately flawed worked test.
- **Unseen assessment:** MC: pick the flaw and the sign of the corrected result.
- **Tier/accessibility:** S2 [S2-BT]; no coding required.

### S4 - Test redesign
- **Objective:** Specify a falsifying, cost-aware out-of-sample redesign.
- **Prerequisites:** S3
- **Lessons:** S4.1 Hypothesis; S4.2 Holdout; S4.3 Benchmark; S4.4 Costs; S4.5 Robustness; S4.6 Stop rule.
- **Tool/practice:** Redesign the worked test.
- **Unseen assessment:** PROF-4 Systematic Test (badge; automated MC).
- **Tier/accessibility:** S2 [S2-BT]; TradeSim boundary unresolved.

## Badge: Active implementation

### X1 - Deeper structure
- **Objective:** Compare trend, range and transition across timeframes without predictive claims.
- **Prerequisites:** P15
- **Lessons:** X1.1 Swings; X1.2 Levels and zones; X1.3 Volume; X1.4 Timeframe conflict.
- **Tool/practice:** Multi-timeframe synthetic charts.
- **Unseen assessment:** MC: pick which timeframe disagrees with the others on a new chart.
- **Tier/accessibility:** S1; full data table.

### X2 - Conditional setups
- **Objective:** Define entry, failure and cost conditions for pullback and breakout examples.
- **Prerequisites:** X1, P12, I1
- **Lessons:** X2.1 Pullback; X2.2 Breakout; X2.3 False breakout; X2.4 An indicator rule as one tested condition.
- **Tool/practice:** Build setups on generated series; test each condition's hit rate against its base rate.
- **Unseen assessment:** MC: implement or reject under changed liquidity and cost assumptions.
- **Tier/accessibility:** S1/S2 [S2-IND, S2-EXEC].

### X3 - Execution review
- **Objective:** Review active implementation by process, not realized profit and loss.
- **Prerequisites:** X2, P13
- **Lessons:** X3.1 Scaling assumptions; X3.2 Time exits; X3.3 Journal; X3.4 Outcome-blind review.
- **Tool/practice:** Example journals of paired decisions.
- **Unseen assessment:** Active implementation badge gate (automated MC).
- **Tier/accessibility:** S2 [S2-EXEC, S2-JOURNAL].

## Proficiency gates (MVP: multiple-choice, automated)

### What the credentials require

- **Core certificate:** PROF-1 Portfolio Decision + PROF-2 Claim Evaluation + PROF-3 Security Decision, all hosted in P16.
- **Systematic researcher badge:** PROF-4 Systematic Test, hosted in S4.
- **Active implementation badge:** Active gate, hosted in X3.

### Item rules

1. Every scored item is multiple-choice with exactly one keyed answer and three or four options.
2. The key is computed by the packet generator from the packet data. Distractors come from a named-misconception library (for example: period mismatch, percent versus percentage point, profit read as cash, recent return as rebalance reason, correlation read as cause).
3. Scenario items share one case packet; each case carries several items.
4. Every decision item offers "Need more information before deciding". On a case where the packet is sufficient, that option is keyed wrong and counts as a critical miss (false caution). On an insufficient-evidence case it is the key.
5. Every gate has at least one case where acting is correct and at least one where it is not.
6. No item is keyed on a future price direction or a realized outcome. Hidden post-cut data is shown only after the attempt locks, as reflection.
7. Items keyed "seek licensed help" and all Israeli tax, licensing, account and privacy items carry LEGAL-IL and do not ship before legal sign-off.
8. Authoring QA before release: each template's key is recomputed by an independent checker from the packet data, and each template passes an ambiguity review for a second defensible answer. This is authoring QA, not runtime scoring; learners are scored only by the key.

### Pass rule (proposed; cut numbers stay open under owner decision 9 and pilot calibration)

- at least 80% of items correct in each PROF;
- every critical item correct;
- a false-caution choice on an act-is-correct decision item is a critical miss;
- the attempt covers every case in the gate.

With four options, blind guessing scores about 25%, so an 80% cut with all-critical-correct leaves a wide margin over chance.

### Retry and history

- A retry always draws a new seeded case set from the same families; the learner never sees the same numbers twice.
- Between attempts the remediation ladder runs: hint, worked example, easier parallel case, new unseen attempt.
- First-attempt history is kept separately and never overwritten.
- A retry limit, cooldown and failure-exit path must exist before launch. Proposed default for decision 9: three attempts per seven days, then a guided review of the missed behaviours before the next attempt.

### Item security

- Gate items come from parametric templates, not a fixed bank. Each attempt draws a fresh seed.
- Launch target: at least 30 validated seeds per template, with keys and distractors regenerated per seed.
- Practice and gate case families are disjoint (checked by the validator).
- No seed is reused for the same learner. Seed exposure is logged; a template whose correct rate drifts upward without a content change is retired and replaced.
- The existing deterministic-seed chart engine is core infrastructure: it feeds P15, I1, PROF-2 case 2C, PROF-3 case 3A and both badges.

### Accessibility at the gate

- **Equivalence check per module:** every chart-derived item is generated with a data-table route from the same data, so the table and chart routes share one key. Release check: for each S1 template, the validator of the build pipeline confirms that the key is derivable from the table alone. Items that need visual gestalt that a table cannot carry are not used for scoring.
- **Timing:** MVP gates are untimed. Save and resume are allowed. Speed is not scored.
- **Cognitive:** one item per screen with the case packet one tap away; plain-language stems; no double negatives; "NOT" items avoided, or bold when unavoidable; calculations are separate items from judgement items; glossary on tap; progress shown by case.
- **Language:** Hebrew (right-to-left) and English. Keys are language-independent because they come from packet data. Each template needs a translation parity review, a bidirectional-text check for numbers, tickers and formulas, and the same option order logic in both languages. Fluency is not scored; MC removes writing speed from the score.
- **Sensory and motor:** full table routes for charts, holdings tables instead of pie charts, no colour-only information, no hover, no drag, no slider-only input, keyboard and screen-reader routes, calculator permitted with formulas visible.

### Israel, minors and data

- **Jurisdiction:** investor-protection, licensing, tax and account content follows Israeli rules. Legal review is a hard release precondition on P3 (P3.5), P6 (P6.5), P9, P11 (P11.5), P13 (privacy), P14 (P14.5), P16 and every item flagged legal_il. Public starting points for the review, not legal conclusions: the Regulation of Investment Advice, Investment Marketing and Portfolio Management Law and its licensing regulations (https://www.new.isa.gov.il/images/Fittings/isa/asset_library_pic/IsaFile_7502.pdf), and Amendment 13 to the Privacy Protection Law, in force since 14 August 2025 (https://nblaw.com/news-insights/amendment-13-now-in-force-access-our-practical-guide-and-compliance-self-check).
- **Minors (13-17):** modules touching accounts, real money, scams or the journal carry parent notes; no module prompts a minor to open an account or enter real amounts; consent and parental-involvement wording is confirmed in legal review.
- **Decision journal data minimisation:** the journal can hold goals, amounts and holdings. Under-18s: example-based journals or device-only storage; nothing identifying or financial leaves the device. 18+: minimum fields, amounts optional and in bands, local-first by default, deletion available. Storage design goes to Design as a precondition (DESIGN-DATA) and to legal review under Israeli privacy law.

### Certificate wording (draft, subject to LEGAL-IL)

"Tikerino Core Certificate. [Name] passed Tikerino's automated multiple-choice assessments on unseen synthetic cases covering portfolio construction and maintenance, claim evaluation, and single-company analysis. This certificate shows course-level competence on practice cases. It is not a licence, not investment advice, and not evidence of readiness to invest real money."

Badge wording follows the same pattern and names only the gate it records.

### Later phase: constructed response (documented, not in MVP)

The 0-3 rubric from the 22/9 package is kept for a later phase with open responses: 0 absent/unsafe, 1 partial with consequential error, 2 competent with limits stated, 3 strong and calibrated; critical dimensions constraint fit, calculation integrity, evidence quality, risk control, uncertainty/falsification; pass at least 2 in every critical dimension with no critical fail. Opening it needs a scoring route (human, automated or hybrid) with its accepted error mode, grader calibration, and a stated retry policy. Not built in MVP.

## Gate specifications

### PROF-1 - Portfolio Decision (core certificate; hosted in P16)

3 cases, 20 items, 8 critical, 5 calculation items.

**Case 1A** - New persona with complete facts; one candidate allocation fits every constraint. Keyed decision: act. Packets: S2-PERSONA, S2-FUND.

- 1A.1 Identify the binding constraint
- 1A.2 Calculate the required liquidity reserve _[critical, calculation]_
- 1A.3 Calculate the real value of a goal amount after inflation _[calculation]_
- 1A.4 Calculate fee drag over the horizon _[calculation]_
- 1A.5 Pick the allocation that meets every constraint (need-more-info is a distractor) _[critical, false-caution trap]_
- 1A.6 Identify the holding whose job does not match the goal
- 1A.7 Pick the fund with the lower hidden concentration and cost
- 1A.8 Pick the bond-fund sensitivity direction when rates rise

**Case 1B** - Second persona with an existing plan that breaks its own risk statement. Keyed decision: revise. Packets: S2-PERSONA, S2-PORT.

- 1B.1 Calculate scenario loss for the plan _[critical, calculation]_
- 1B.2 Pick the correct statement about average return versus plausible range
- 1B.3 Pick the withdrawal sequence with more path risk
- 1B.4 Identify the currency exposure of a shekel-based investor holding a dollar fund
- 1B.5 Identify the concentration that contradicts the risk statement _[critical]_
- 1B.6 Pick the revision that restores the constraints (need-more-info is a distractor) _[critical, false-caution trap]_
- 1B.7 Pick the correct handling of an Israeli tax unknown (mark unknown, seek licensed help) _[LEGAL-IL]_

**Case 1C** - Follow-up on 1A: the fund changes its index rule and the goal date moves earlier. Trigger types differ from P11 practice and P11 assessment. Keyed decision: act. Packets: S2-PORT, S2-FUND.

- 1C.1 Pick which change justifies a policy review
- 1C.2 Calculate the trade that restores the new target weights _[critical, calculation]_
- 1C.3 Reject a recent-return-only rebalance reason _[critical]_
- 1C.4 Choose to rebalance now when the facts are sufficient (need-more-info is a distractor) _[critical, false-caution trap]_
- 1C.5 Pick the complete written policy statement

### PROF-2 - Claim Evaluation (core certificate; hosted in P16)

3 cases, 18 items, 7 critical, 1 calculation items.

**Case 2A** - Well-sourced, current claim with a fair benchmark. Proceed-conditionally is correct; blanket rejection fails. Keyed decision: act. Packets: S2-CLAIM.

- 2A.1 Classify statements as fact, estimate or opinion
- 2A.2 Pick the most primary source
- 2A.3 Judge whether the as-of date is current enough
- 2A.4 Pick the fair benchmark
- 2A.5 Choose proceed conditionally with the stated falsifier (reject and need-more-info are distractors) _[critical, false-caution trap]_

**Case 2B** - Promotion with a guarantee, urgency and an undisclosed incentive, citing a correlation as proof. Keyed decision: reject. Packets: S2-CLAIM.

- 2B.1 Pick the full red-flag set _[critical]_
- 2B.2 Identify the hidden incentive
- 2B.3 Pick the correct licensing check in Israel _[LEGAL-IL]_
- 2B.4 Pick the correct reading of the cited correlation _[critical]_
- 2B.5 Pick what must not be shared with the promoter or an AI tool _[critical]_
- 2B.6 Choose reject or seek licensed help _[critical, LEGAL-IL]_

**Case 2C** - AI-assisted note claiming an indicator crossover rule 'wins most of the time', with one fabricated citation and one stale figure. Keyed decision: qualify. Packets: S2-AINOTE, S2-IND.

- 2C.1 Identify the fabricated citation _[critical]_
- 2C.2 Identify the stale figure
- 2C.3 Calculate the rule's hit rate and compare it with the base rate _[calculation]_
- 2C.4 Judge whether the signal count is large enough
- 2C.5 Pick the test that could show the rule does not work
- 2C.6 Pick the manual step that reproduces the note's key number
- 2C.7 Choose the correct verdict on the note _[critical]_

### PROF-3 - Security Decision (core certificate; hosted in P16)

3 cases, 17 items, 7 critical, 4 calculation items.

**Case 3A** - Complete packet where a small position within the risk budget is supported. Keyed decision: act. Packets: S2-STMT, S2-VAL, S2-IND, S2-EXEC, S2-PORT.

- 3A.1 Pick the revenue driver
- 3A.2 Calculate operating margin _[calculation]_
- 3A.3 Pick the bridge item that explains profit above cash _[critical]_
- 3A.4 Calculate free cash flow _[calculation]_
- 3A.5 Calculate the new valuation bounds when the growth input is cut _[calculation]_
- 3A.6 Pick what the current price implies
- 3A.7 Pick the fair benchmark
- 3A.8 Calculate the position size inside the risk budget _[critical, calculation]_
- 3A.9 Pick the supported statement about the RSI and moving-average readings (no direction forecast is keyed)
- 3A.10 Pick the order type given the spread and depth
- 3A.11 Choose to act within the budget (need-more-info is a distractor) _[critical, false-caution trap]_

**Case 3B** - Packet missing a load-bearing figure; a point valuation is offered as certain. Keyed decision: insufficient. Packets: S2-STMT, S2-VAL.

- 3B.1 Identify the missing load-bearing data _[critical]_
- 3B.2 Reject the point valuation presented as certain _[critical]_
- 3B.3 Choose insufficient evidence _[critical]_

**Case 3C** - Complete packet where the thesis falsifier has already triggered through dilution and debt. Keyed decision: reject. Packets: S2-STMT, S2-VAL.

- 3C.1 Identify the dilution and debt effect
- 3C.2 Identify the triggered falsifier _[critical]_
- 3C.3 Choose reject and the monitoring fact to record

### PROF-4 - Systematic Test (badge; hosted in S4)

2 cases, 10 items, 6 critical, 1 calculation items.

**Case 4A** - Test with look-ahead and missing costs; after correction a narrow effect survives and an out-of-sample paper test is the right next step. Keyed decision: act. Packets: S2-BT.

- 4A.1 Identify the look-ahead leak _[critical]_
- 4A.2 Pick the sign of the result after costs _[critical, calculation]_
- 4A.3 Pick the valid holdout design
- 4A.4 Pick the stop rule
- 4A.5 Choose to proceed to an out-of-sample paper test (need-more-info is a distractor) _[critical, false-caution trap]_

**Case 4B** - Test built on survivors after trying many rules, with a drifting factor definition. Keyed decision: reject. Packets: S2-BT, S2-FACTOR.

- 4B.1 Identify survivorship bias _[critical]_
- 4B.2 Identify the multiple-testing problem _[critical]_
- 4B.3 Identify the definition drift
- 4B.4 Reject the claim that the premium must persist _[critical]_
- 4B.5 Pick the benchmark the test should have used

### ACTIVE - Active Implementation (badge; hosted in X3)

2 cases, 7 items, 3 critical, 2 calculation items.

**Case XA** - Liquid synthetic case where a conditional entry is valid within budget. Keyed decision: act. Packets: S2-EXEC, S2-IND.

- XA.1 Identify what the two-timeframe chart does not tell you
- XA.2 Calculate size within budget _[critical, calculation]_
- XA.3 Pick entry, invalidation and review date
- XA.4 Choose to implement (need-more-info is a distractor) _[critical, false-caution trap]_

**Case XB** - Illiquid case with a gap where costs defeat the setup. Keyed decision: reject. Packets: S2-EXEC.

- XB.1 Calculate slippage cost _[calculation]_
- XB.2 Identify the false breakout risk
- XB.3 Choose reject because costs defeat the edge _[critical]_

## Tested-before-taught audit, behaviour by behaviour

Each scored item names the lessons that teach its behaviour. The validator confirms every lesson exists, sits in a module that is a prerequisite ancestor of the gate host (or the badge host itself), and is never a capstone rehearsal lesson. It also confirms that gate case families never appear in practice, and it sweeps gate items against every module practice and assessment for near-duplicate wording (similarity 0.6 or above fails).

| Gate | Case | Item | Behaviour | Taught in lessons | Module(s) | Critical | Calc |
|---|---|---|---|---|---|---|---|
| PROF-1 | 1A | 1A.1 | Identify the binding constraint | P1.3, P1.5 | P1 |  |  |
| PROF-1 | 1A | 1A.2 | Calculate the required liquidity reserve | P7.5, P2.1 | P2, P7 | yes | yes |
| PROF-1 | 1A | 1A.3 | Calculate the real value of a goal amount after inflation | P2.4 | P2 |  | yes |
| PROF-1 | 1A | 1A.4 | Calculate fee drag over the horizon | P2.5, P2.6 | P2 |  | yes |
| PROF-1 | 1A | 1A.5 | Pick the allocation that meets every constraint (need-more-info is a distractor) | P7.2, P7.1 | P7 | yes |  |
| PROF-1 | 1A | 1A.6 | Identify the holding whose job does not match the goal | P7.3 | P7 |  |  |
| PROF-1 | 1A | 1A.7 | Pick the fund with the lower hidden concentration and cost | P5.4, P6.1, P6.4 | P5, P6 |  |  |
| PROF-1 | 1A | 1A.8 | Pick the bond-fund sensitivity direction when rates rise | P4.1, P4.2 | P4 |  |  |
| PROF-1 | 1B | 1B.1 | Calculate scenario loss for the plan | P12.2, P2.8 | P12, P2 | yes | yes |
| PROF-1 | 1B | 1B.2 | Pick the correct statement about average return versus plausible range | P2.8, P10.5 | P10, P2 |  |  |
| PROF-1 | 1B | 1B.3 | Pick the withdrawal sequence with more path risk | P10.6 | P10 |  |  |
| PROF-1 | 1B | 1B.4 | Identify the currency exposure of a shekel-based investor holding a dollar fund | P4.6 | P4 |  |  |
| PROF-1 | 1B | 1B.5 | Identify the concentration that contradicts the risk statement | P7.4, P12.5 | P12, P7 | yes |  |
| PROF-1 | 1B | 1B.6 | Pick the revision that restores the constraints (need-more-info is a distractor) | P7.2, P12.6 | P12, P7 | yes |  |
| PROF-1 | 1B | 1B.7 | Pick the correct handling of an Israeli tax unknown (mark unknown, seek licensed help) | P6.5, P9.6 | P6, P9 |  |  |
| PROF-1 | 1C | 1C.1 | Pick which change justifies a policy review | P11.4, P5.2 | P11, P5 |  |  |
| PROF-1 | 1C | 1C.2 | Calculate the trade that restores the new target weights | P11.1, P2.2 | P11, P2 | yes | yes |
| PROF-1 | 1C | 1C.3 | Reject a recent-return-only rebalance reason | P11.6, P10.8 | P10, P11 | yes |  |
| PROF-1 | 1C | 1C.4 | Choose to rebalance now when the facts are sufficient (need-more-info is a distractor) | P11.3, P11.4 | P11 | yes |  |
| PROF-1 | 1C | 1C.5 | Pick the complete written policy statement | P7.6, P11.6 | P11, P7 |  |  |
| PROF-2 | 2A | 2A.1 | Classify statements as fact, estimate or opinion | P8.1 | P8 |  |  |
| PROF-2 | 2A | 2A.2 | Pick the most primary source | P8.2 | P8 |  |  |
| PROF-2 | 2A | 2A.3 | Judge whether the as-of date is current enough | P8.3 | P8 |  |  |
| PROF-2 | 2A | 2A.4 | Pick the fair benchmark | P8.5 | P8 |  |  |
| PROF-2 | 2A | 2A.5 | Choose proceed conditionally with the stated falsifier (reject and need-more-info are distractors) | P8.6, P10.2 | P10, P8 | yes |  |
| PROF-2 | 2B | 2B.1 | Pick the full red-flag set | P9.1, P9.2 | P9 | yes |  |
| PROF-2 | 2B | 2B.2 | Identify the hidden incentive | P8.4, P9.4 | P8, P9 |  |  |
| PROF-2 | 2B | 2B.3 | Pick the correct licensing check in Israel | P9.3 | P9 |  |  |
| PROF-2 | 2B | 2B.4 | Pick the correct reading of the cited correlation | P8.7 | P8 | yes |  |
| PROF-2 | 2B | 2B.5 | Pick what must not be shared with the promoter or an AI tool | P9.5, P14.5 | P14, P9 | yes |  |
| PROF-2 | 2B | 2B.6 | Choose reject or seek licensed help | P9.6 | P9 | yes |  |
| PROF-2 | 2C | 2C.1 | Identify the fabricated citation | P14.3 | P14 | yes |  |
| PROF-2 | 2C | 2C.2 | Identify the stale figure | P14.4 | P14 |  |  |
| PROF-2 | 2C | 2C.3 | Calculate the rule's hit rate and compare it with the base rate | I1.7, P10.2 | I1, P10 |  | yes |
| PROF-2 | 2C | 2C.4 | Judge whether the signal count is large enough | P10.4 | P10 |  |  |
| PROF-2 | 2C | 2C.5 | Pick the test that could show the rule does not work | I1.8, P8.6 | I1, P8 |  |  |
| PROF-2 | 2C | 2C.6 | Pick the manual step that reproduces the note's key number | P14.6 | P14 |  |  |
| PROF-2 | 2C | 2C.7 | Choose the correct verdict on the note | P14.2, I1.7 | I1, P14 | yes |  |
| PROF-3 | 3A | 3A.1 | Pick the revenue driver | A1.2 | A1 |  |  |
| PROF-3 | 3A | 3A.2 | Calculate operating margin | A2.4 | A2 |  | yes |
| PROF-3 | 3A | 3A.3 | Pick the bridge item that explains profit above cash | A2.5, A3.2 | A2, A3 | yes |  |
| PROF-3 | 3A | 3A.4 | Calculate free cash flow | A3.3 | A3 |  | yes |
| PROF-3 | 3A | 3A.5 | Calculate the new valuation bounds when the growth input is cut | A4.5, A4.4 | A4 |  | yes |
| PROF-3 | 3A | 3A.6 | Pick what the current price implies | A4.6 | A4 |  |  |
| PROF-3 | 3A | 3A.7 | Pick the fair benchmark | A5.2 | A5 |  |  |
| PROF-3 | 3A | 3A.8 | Calculate the position size inside the risk budget | P12.6, P12.2 | P12 | yes | yes |
| PROF-3 | 3A | 3A.9 | Pick the supported statement about the RSI and moving-average readings (no direction forecast is keyed) | I1.2, I1.3, P15.4 | I1, P15 |  |  |
| PROF-3 | 3A | 3A.10 | Pick the order type given the spread and depth | P15.6, P15.7 | P15 |  |  |
| PROF-3 | 3A | 3A.11 | Choose to act within the budget (need-more-info is a distractor) | A5.6, A5.1 | A5 | yes |  |
| PROF-3 | 3B | 3B.1 | Identify the missing load-bearing data | A5.1 | A5 | yes |  |
| PROF-3 | 3B | 3B.2 | Reject the point valuation presented as certain | A4.4, A4.5 | A4 | yes |  |
| PROF-3 | 3B | 3B.3 | Choose insufficient evidence | A5.1, A5.5 | A5 | yes |  |
| PROF-3 | 3C | 3C.1 | Identify the dilution and debt effect | A3.4, A3.5 | A3 |  |  |
| PROF-3 | 3C | 3C.2 | Identify the triggered falsifier | A5.5 | A5 | yes |  |
| PROF-3 | 3C | 3C.3 | Choose reject and the monitoring fact to record | A5.4, A5.7 | A5 |  |  |
| PROF-4 | 4A | 4A.1 | Identify the look-ahead leak | S3.4 | S3 | yes |  |
| PROF-4 | 4A | 4A.2 | Pick the sign of the result after costs | S3.7, S4.4 | S3, S4 | yes | yes |
| PROF-4 | 4A | 4A.3 | Pick the valid holdout design | S4.2, S3.2 | S3, S4 |  |  |
| PROF-4 | 4A | 4A.4 | Pick the stop rule | S4.6 | S4 |  |  |
| PROF-4 | 4A | 4A.5 | Choose to proceed to an out-of-sample paper test (need-more-info is a distractor) | S4.1, S4.5 | S4 | yes |  |
| PROF-4 | 4B | 4B.1 | Identify survivorship bias | S3.3 | S3 | yes |  |
| PROF-4 | 4B | 4B.2 | Identify the multiple-testing problem | S3.6, S3.5 | S3 | yes |  |
| PROF-4 | 4B | 4B.3 | Identify the definition drift | S2.8 | S2 |  |  |
| PROF-4 | 4B | 4B.4 | Reject the claim that the premium must persist | S2.8, S1.6 | S1, S2 | yes |  |
| PROF-4 | 4B | 4B.5 | Pick the benchmark the test should have used | S3.8, S4.3 | S3, S4 |  |  |
| ACTIVE | XA | XA.1 | Identify what the two-timeframe chart does not tell you | X1.2, X1.4 | X1 |  |  |
| ACTIVE | XA | XA.2 | Calculate size within budget | P12.6 | P12 | yes | yes |
| ACTIVE | XA | XA.3 | Pick entry, invalidation and review date | X2.1, P15.8 | P15, X2 |  |  |
| ACTIVE | XA | XA.4 | Choose to implement (need-more-info is a distractor) | X2.4, X3.1 | X2, X3 | yes |  |
| ACTIVE | XB | XB.1 | Calculate slippage cost | P15.7, X3.1 | P15, X3 |  | yes |
| ACTIVE | XB | XB.2 | Identify the false breakout risk | X2.3 | X2 |  |  |
| ACTIVE | XB | XB.3 | Choose reject because costs defeat the edge | X2.2, X3.2 | X2, X3 | yes |  |

## Validation summary

Validator: `validate_map_v2.py` (checks structure, not educational truth). Result file: `validation-results-v2.json`.

- 29 modules: 22 core, 7 badge.
- Lesson titles: 188 total, 148 core, 40 badge. Titles are not a workload measure.
- Learner workload: **unmeasured**. Planning estimate for sequencing only: core 38.8-64.0 hours plus 82-138 minutes of core gates.
- 54 prerequisite edges; maximum 5 direct prerequisites per module; acyclic; no orphan or forward prerequisites; every core module feeds the capstone; no core module depends on a badge module.
- No module requires S3. Every S2 use names one of 13 packet types.
- Issues: 0. Warnings: 1 (transitively redundant prerequisite edges (kept for readability): P2->P6, P1->P7, P2->P10, P8->P13, P8->P14, P3->P15, P10->I1, P2->A2, P12->A5, P8->S1, P10->S2, P12->X2).

## Owner decisions still open

4. Neutral simulator versus named optional tools.
5. Synthetic versus licensed historical transfer library (the map runs fully on synthetic).
8. US-only versus global market examples (legal, tax and account content is Israeli regardless).
9. Final cut score, retry limit and cooldown (proposals above).
10. Tikerino/TradeSim boundary (affects the PROF-4 badge only).
11. Free/premium boundary.

Settled on 23/9: 1 and 2 (core = PROF-1+2+3, company analysis in core), 3 (indicators in core; deeper chart work stays a badge), 6 (13+ with parent notes), 7 (Israel).
