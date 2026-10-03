<!-- Snapshot of Google Doc "Tikerino Product Bible | Product behavior and features v0.2" (Drive), taken 2026-10-03. Message-ID citations in section 8 omitted. -->

# Tikerino | Product Bible
## Current product behavior and feature rules
Version 0.2 | 25 September 2026 | Private | Owner: Guy Kahansky

# HOW TO READ THIS DOCUMENT
This is the single source for the intended product experience. A decision marked Decided comes from Guy's original conversation; Current describes observed behavior and does not itself approve a future feature. Planned describes intended product behavior not yet shipped; Open needs a decision. An older detailed spec supplies depth only where it does not conflict with a newer decision here. No implementation instructions or business operations belong here.

# 1. PRODUCT PROMISE AND BOUNDARIES
Decided: Tikerino is a game that teaches investing knowledge and decision skills. It teaches how to notice evidence and uncertainty, not certainty, predicted returns or which asset to buy. Practice charts are synthetic, and a graded chart stops before its outcome; feedback and a reveal follow the learner's answer. It does not connect to or track a learner's real portfolio. (D1, D4)

Decided for now: classify the product 18+ until legal advice. Guy also explicitly rejected age declarations for now. This is a classification, not an approved age-check or access mechanism. The earlier 13+ educational goal remains a future possibility, not the present release audience. The exact later-age experience is Open. (D2, D4, D6)

Decided: the current learning language is English. The provisional name in Hebrew is "טיקרינו". Neither the language choice nor the name implies other languages or a final legal brand. (D5)

Out of scope for the MVP: real-money trading, real portfolio tracking, cash or redeemable rewards, open-ended AI coaching, paid Premium, payment, promotional offers and proactive marketing notifications. Future forms of these require their own product decisions. In-game bonus points are game points. (D4)

# 2. LEARNER JOURNEY
Current: a learner enters onboarding and a locked lesson path, reads a principle and a worked example, practises on a chart cut before the outcome, submits an answer, receives a grade and evidence-based feedback, then sees the outcome and returns to the path. Current content includes nine lessons and sixteen exercises across Trading Fundamentals and Candlestick Reading; that shipped inventory is not the whole approved curriculum. Progress currently persists on the device rather than in a Google profile. (S1)

Planned: the Living Chart makes the vertical journey an immersive chart world. Lessons are candles, a current lesson is a forming candle, review gates are resistance lines, module exams are breakouts, and consistency appears as volume. The Knowledge Index is a metaphor for skill, never portfolio value, return, debt, profit or loss. The learner's actions and mastery move it; mistakes may create visual pullbacks but never erase earned XP or cross a locked Safe Floor. This describes the intended experience, not a claim that every screen is shipped. (S2)

Lesson rhythm: teach one observable idea at a time, show at least one worked example, offer close practice followed by varied transfer, then return earlier skills through mixed review. Feedback should say what happened, why, what evidence to notice next and what to do next; a generic "Correct" alone is not enough. After repeated errors, offer a hint, a worked example or easier parallel case, then a retry. After a gap, welcome the learner back without shaming or lost lifetime progress. (S2, S3)

Decided MVP assessment format: multiple-choice questions with predefined correct answers and automatic grading. Open-answer assessment and human review are later possibilities, not MVP behavior. (D6)

# 3. XP, PRACTICE AND REWARD RULES
Decided base awards: completing a lesson +25 XP; daily practice +10 XP; skill mastery +40 XP; module exam +150 XP. Pullbacks are visual only, with zero XP loss. Earned XP never decreases. Mastery must remain worth more than even the maximum daily persistence award. (D7)

Decided daily practice ladder: +2 for each consecutive day starting on day 2, capped at +20 bonus over the +10 base. Thus day 1 is +10, day 2 +12, day 3 +14, day 5 +18 and day 11 onward +30 at most. A missed day resets only the consecutive counter; it does not remove earned XP or lifetime practice days. The exact ladder was reaffirmed in the 25 September decision package. This is an intended rule; do not mistake approval for evidence it has shipped. (D5, D7)

Answers completed offline stay queued and ungraded until an authoritative grade is available. Returning online must reconcile once, without duplicate rewards. Avoid streak pressure, punishment after gaps or financial-loss imagery. (S1, S2)

# 4. COURSE AND CONTENT
Decided: curriculum map v2, delivered on 23 September, is the current course direction as accepted in Guy's 25 September answer. Use existing content as the starting point and correct it when needed. The old 12-module/96-lesson Stage A v1 and its 72-versus-96 question are historical drafts, not current sizing decisions. (D5, D8)

Decided curriculum specifics: technical indicators belong in the core, framed as tools to measure and test rather than signals to trust. The core proficiency path combines PROF-1, PROF-2 and PROF-3. MVP questions are multiple-choice and automatically graded. Preserve the evidence-based, risk-aware decision-learning direction while avoiding claims about future returns. (D6)

Content rules: beginner-first, one observable skill at a time, progressive disclosure, at least one worked example for every fact taught, synthetic charts as the graded default, and later mixed practice instead of near-identical repetition. An exercise should not show candles after the cut before the learner commits an answer. Text is a complete learning route; narration and animation add to it rather than replace it. (S1, S3)

Open: the final free/Premium division of lessons, later multimedia, detailed journal interactions and adult/guardian handling of real accounts or tax examples. The old 24-free/72-premium split is a proposal only. (D8, S3)

## COURSE MAP INDEX | recovered v2 rebuild, 25 September 2026
Behavior-level index of the v2 map delivered 23 September and accepted by Guy on 25 September. Its 13+ and parental-consent notes are historical and DO NOT override today's interim 18+ classification and rejection of declarations. Lesson scripts, final free/Premium division, cut score and retry rules remain open.

Counts: 29 modules, 188 lesson titles: 22 mandatory core modules with 148 titles; 7 optional badge modules with 40 titles. These are scope counts, not a promise about duration, release timing or all content being built.

Core path: P1 Investor setup; P2 Investor numeracy; P3 Asset jobs and market plumbing; P4 Bond, cash and currency risk; P5 Fund and index anatomy; P6 Fund cost, overlap and due diligence; P7 First diversified portfolio; P8 Evidence and source literacy; P9 Investor protection (Israel); P10 Probability and decision quality; P11 Rebalancing and portfolio maintenance; P12 Risk budget and position size; P13 Behaviour, checklist and journal; P14 Responsible AI research; P15 Chart and execution literacy; I1 Technical indicators: tools you measure and test; A1 Business map; A2 Financial statements; A3 Earnings quality and capital allocation; A4 Valuation range; A5 Thesis and security decision; P16 Core capstone.

Systematic badge path: S1 Regime channels; S2 Factor evidence; S3 Backtest audit; S4 Test redesign.
Active badge path: X1 Deeper structure; X2 Conditional setups; X3 Execution review.

Core certificate direction: the core ends in PROF-1 Portfolio Decision, PROF-2 Claim Evaluation and PROF-3 Security Decision. Systematic PROF-4 and Active are separate badges, not prerequisites to the core certificate. All MVP assessments are multiple-choice with automatically determined answers; the proposed 80% cut, critical-item rule and retry cadence in the map are NOT approved.

The content describes simulated investor personas, synthetic practice packets, claim evaluation, responsible use of AI-generated notes, indicators as testable tools and company analysis. A course competency credential would not certify suitability to invest or advise on real money. The journal and its storage experience are not settled; there is no real-portfolio monitoring. Israeli tax/licensing examples and any later under-18 path need legal review before publication.

# 5. PROFILE, PREFERENCES AND CONTINUITY
Decided MVP target: Google sign-in and a user profile that saves theme (light/dark) and narration preferences, learning progress, in-game bonus points and consecutive-practice state. Other common sign-in options may be considered later. This profile is a product target, not a claim that Google sign-in or cross-device sync exists now. (D3, D4)

Decided outside MVP: optional profile name, gender and age. These were initially requested on 25 September and then removed from MVP after Guy reviewed the concerns. Do not silently bring them back. There is no approved age declaration. (D3, D4)

Current-versus-target: current device-local progress and the proposed Google-backed profile are different experiences. Preserve a learner's earned progress and queued answers when moving to the target experience; avoid accidental identity mixing, duplicate bonuses or loss of history. Exact merge, account recovery, deletion and privacy interactions remain Open, not inferred from "Google sign-in." (D3, D4, S1)

Planned update behavior: an app already open may update safely between lessons, with queued answers preserved. Updating mid-answer or silently dropping a pending answer is not the intended experience. (D5)

# 6. VISUAL, VOICE AND ACCESSIBILITY EXPERIENCE
Planned: a dark chart is the primary theme; a complete light version should preserve the same information and interactions. Guy has not finally chosen between them. Growth Green #10B981 and Ink Navy #0F2B46 are the core brand colors. The head-only bull is the primary logo; an upright full-body version is a separate in-game character. The mascot should appear at emotional moments, not occupy persistent navigation or distract from instruction. Its name and full-body direction remain Open. (S2)

Product rule: every animated state has text and reduced-motion equivalents. Use readable and scalable text, non-color cues, screen-reader order, keyboard-operable charts, touch targets suited to mobile, and pause/replay for narrated material. Do not put information only in motion or color. Guy deferred the real-phone screen-reader review to production preparation; that is not a claim that phone accessibility is fully verified. (D5, S2)

Text remains fully usable without audio. Narration is a preference and must not hide essential instruction. (S2, S3)

# 7. FUTURE FEATURE BOUNDARIES
Premium, AI coaching, payment, notifications, promotions, further media, other login methods, and a younger audience are future topics, not silently active MVP features. Any future AI coach must be separately specified for its answers and safeguards. The product still teaches through a game and does not turn into real-portfolio monitoring by default. No pricing, paid tier division or legal suitability is approved here. (D4)

Open product decisions: age-eligibility experience consistent with the current interim 18+ classification and no declaration request; Google-profile continuity and deletion experience; exact mastery and module-exam interactions; final light/dark choice, mascot treatment and title/"+2.4%" labels. An Open item is not permission to fill it by assumption.

# 8. DECISION SOURCES (summary)
- D1 (25 Sep): learning and skills only; no personal portfolio tracking.
- D2 (25 Sep): interim 18+ until legal advice.
- D3 (25 Sep): Google MVP profile, preferences, progress, bonus and streak.
- D4 (25 Sep): no declarations; personal details removed from MVP; in-game points; future features later.
- D5 (25 Sep): ten numbered responses on curriculum, language, ladder, update and profile.
- D6 (23 Sep): indicators, PROF path, multiple-choice/automatic grading, original 13+ aim.
- D7 (19 Sep, reaffirmed 25 Sep): base XP and persistence ladder.
- D8 (23 Sep): curriculum v2 package delivery; ratified by D5 item 1.
- S1: original 19 Sep Bible (shipped-product archive). S2: Living Chart spec (see 02-living-chart-progression-spec.md). S3: historical Full Curriculum Plan (see 03-full-curriculum-plan-historical.md), superseded on structure by v2.
