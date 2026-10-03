# **Tikerino Product Bible**

**Version:** 0.1  
**Status:** Living single source of truth  
**Owner:** Guy Kahansky, CEO/financier  
**Operating owner:** CTO/COO workstream  
**Effective date:** 19 September 2026  
**Access:** Private  
This Bible is the canonical cross-pillar product definition. Linked documents remain evidence and detailed appendices. A line marked **Approved** is binding product direction or verified current-state fact. **Proposed** is design or operating intent that has not been approved. **Unresolved** is a conflict, missing decision or unverified state. A newer trusted owner decision supersedes an older proposal, but the change remains visible in the decision register.

## **1\. Executive product definition**

Tikerino is a mobile-first investing-education product. Its validated test proposition is short instruction plus point-in-time chart practice, server-side grading and reveal. The learner studies one observable idea, sees a worked example, practises on a chart cut before the outcome, explains a choice, receives evidence-based feedback and then sees what happened.  
**Approved principles**

> * Learning evidence outranks attendance. Mastery must remain more valuable than persistence alone.  
> * Graded charts are synthetic and cut before the outcome. The client never receives post-cut candles before grading.  
> * The product teaches evidence, not certainty, returns or what to buy.  
> * Text is a complete learning route. Narration and animation are additive.  
> * Mistakes and missed days never erase XP. Recovery is dignified and tied to learning evidence.  
> * Accessibility is part of the product contract, not a later layer.  
> * Current commercial posture is **TEST, not scale**. Spend, recruitment and marketing require their specific later approvals.

**Unresolved audience:** Guy described the audience as “young investors, mostly 18-45, at least that’s my guess” on 19 September 2026 at 13:28:47 IDT. The range is a working hypothesis, not a locked segment.

## **2\. Complete user journey and functionality**

### **Current implemented loop**

**Approved current fact:** onboarding → locked lesson path → principle/guided example → chart exercise cut at T → authoritative submit/grade → XP and evidence-based feedback → post-cut reveal → return to path. The PWA supports installability, progress state and an offline answer queue with idempotent reconciliation. Current shipped inventory is 9 lessons and 16 exercises across two topics.

### **Intended production-grade journey**

> 1. **Onboarding:** explain the learning loop and mode choice without putting legal copy inside instruction.  
> 2. **Living Chart home:** the vertical journey is an immersive candlestick world. Lessons are candles, review gates are resistance lines, module exams are breakouts and persistence appears as volume.  
> 3. **Lesson:** one small principle, at least one worked example, close practice and later varied transfer.  
> 4. **Assessment:** unseen data where appropriate; explanation and reasoning matter alongside recognition.  
> 5. **Feedback:** what happened, why, what evidence to notice next and the next useful action.  
> 6. **Recovery:** misconception → worked example or easier parallel case → retry → evidence-backed recovery.  
> 7. **Progression:** server-confirmed semantic learning events update the Knowledge Index and XP.  
> 8. **Review and exam:** earlier skills return through mixed review; module exams summarize tested skills.  
> 9. **Return after gap:** welcoming restart, zero XP loss and lifetime practice history preserved.  
> 10. **Profile/settings:** text/narrated mode, accessibility preferences and legal links. Learner accounts, Google sign-in and administration remain future scope.

## **3\. Canonical learning, XP and Living Chart rules**

**Authoritative component spec:** [Tikerino \- The Living Chart: Progression Design Spec v1.0](https://docs.google.com/document/d/1J4Ox10Eb9h4yij53b3OTlgsHnddqowhMSw4OBaZwfXc/edit?usp=drivesdk&authuser=gkahansky@gmail.com)  
**Ruleset ID:** prog-rules-v1.0

### **Approved constants**

* Lesson completed: \+25 XP  
* Daily practice: \+10 XP base  
* Skill mastery: \+40 XP  
* Module exam completed: \+150 XP  
* Pullback: visual only; 0 XP loss

Owner provenance: Guy’s trusted WhatsApp response on 19 September 2026 at 14:38:07 IDT approved the base weights and requested a progressive persistence bonus (wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E1RjdBOUI1ODA1MkQ1NjUxRUQA).

### **Approved persistence ladder**

Daily practice award \= 10 \+ min(20, 2 × (consecutive days \- 1)).

> * Day 1: \+10  
> * Day 2: \+12  
> * Day 3: \+14  
> * Day 5: \+18  
> * Day 11 onward: \+30 maximum  
> * A missed day removes nothing, restarts only the consecutive counter and preserves lifetime practice days.

Owner provenance: Guy replied 👍 on 19 September 2026 at 14:50:57 IDT to the exact ladder (wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E5OUJCOUNENUUwODM1RjQwODYA). This supersedes the Content snapshot line that still called the exact ladder unresolved; that stale conflict is preserved here explicitly.

### **Locked guardrails**

> * XP never decreases.  
> * Pullbacks are presentation only and cannot cross the locked Safe Floor.  
> * Knowledge Index means capability, never money, portfolio value, return or prediction.  
> * No negative balance, liquidation, debt, profit or loss framing.  
> * Mastery (+40) remains more valuable than maximum daily persistence (+30).  
> * No fragile streak pressure or punishment after a gap.  
> * Offline answers remain neutral/queued until authoritative grading and reconcile idempotently.  
> * Every animated state has a text and reduced-motion equivalent.

## **4\. Content structure and progression**

**Approved process:** define the entire course structure before scripts. Every stage follows draft → four-model panel review → agreements/disagreements/gaps → revision → follow-up review. The current production pass is text-only; audio and video wait until the complete text layer is approved.  
**Proposed baseline:** 12 modules × 8 lessons \= 96 titles, with modules 1–3 as a 24-lesson free tier and modules 4–12 as a 72-lesson premium tier. Unified Stage A v1 is ready for critique, not approved.  
**Unresolved:** 96 versus 72 lessons; market-history placement; exact adult/guardian treatment of real accounts, taxes and next steps; later media route; the Claude panel count discrepancy (91 in Bobby’s summary versus 94 in Claude’s file).  
Every taught fact requires at least one worked example. Examples use US-market references. Synthetic charts remain the graded default. Later lessons mix earlier skills rather than repeating near-identical items.

## **5\. Design system, mascot and accessibility**

### **Approved design direction**

> * The Living Chart is the journey screen and challenge mechanic.  
> * Dark chart is primary. A complete light variant with identical information architecture exists for A/B testing.  
> * The head-only bull is the primary logo. A full-body upright character is a separate in-game asset.  
> * The mascot appears at emotional moments, not as persistent navigation or instructional clutter.  
> * Production uses the original approved bull anatomy or a supplied variant, not regenerated dog-like art.  
> * Growth Green \#10B981 and Ink Navy \#0F2B46 are core brand colors. Repo token files are the technical source.

### **Approved accessibility contract**

WCAG 2.1 AA; color plus icon/label; minimum 48px touch targets; readable/scalable text; keyboard-operable charts; screen-reader order; pause/replay and adjustable pacing; reduced-motion and text parity; hollow/filled candle shape cues; no information available only through animation.

### **Unresolved design decisions**

> * Panel-backed dark-versus-light ratification and the A/B measurement plan.  
> * Full-body character direction: Modern Fintech versus Smart Editorial.  
> * Mascot name “Pippie”.  
> * Reward coins, with default no.  
> * “+2.4% this week” definition and mastery-level title system.  
> * Deletion of rejected Stitch journey frames.  
> * Progression-data storage and retention, subject to privacy review.

## **6\. Accounts, data, privacy, legal and administration**

### **Current state**

**Approved current fact:** there are no learner accounts, authentication, admin console, analytics, personal-data collection, payments or subscriptions in the released scope. Google authentication is backlog-only.  
Graded answers preserve exercise/content/generator identity and use server-authoritative grading, point-in-time cuts and idempotent reconciliation. Production uses managed Postgres; local development can use JSONL. Any release touching existing audit data requires a restore-verified backup and tested migration.  
Legal copy belongs in Terms and Privacy, not lessons or the walkthrough. Synthetic-chart and educational framing must not imply financial advice or real performance.

### **Production gates**

The following capability sets each require design, implementation, tests and release criteria before production readiness: user management/administration, legal compliance, accessibility testing, notifications, and promotions/rewards.  
**Unresolved:** identity model, admin roles, analytics/event retention, privacy/storage rules, payment/subscription mechanics, refund terms, notification consent and legal review for affiliates, personalized recommendations or public paid promotion.

## **7\. Architecture, quality and release gates**

### **Approved architecture**

React/TypeScript PWA; framework-neutral engine/content/grading/state packages; one Fastify process serving client and two API endpoints; deterministic seeded generation; server cutting/grading; full audit identity; independently versioned content schema; immutable released IDs and seeds.

### **Proposed architecture**

Schema v2 adds modules, objectives, prerequisites, misconceptions, worked-example beats, typed annotations, transfer cases, exams/mixed review, semantic media segments, transcripts, review lifecycle and explicit historical/non-graded versus synthetic/graded provenance. It must preserve v1 compatibility and ship with validators, types, fixtures and regression tests.  
Living Chart state should be a deterministic projection of versioned semantic events. Presentation animation stays separate from authoritative learning state.

### **Approved quality/release gates**

> * Repository-pinned typecheck/tests and green CI.  
> * Technical docs match the reviewed behavior.  
> * Visual evidence for visual behavior; 390×844 screenshots for the narrated/legal slice.  
> * Hosted staging from the reviewed commit.  
> * Real iPhone/Safari verification for audio and PWA behavior.  
> * Restore-tested data preservation.  
> * Resolved reviews, documented merge order, release tag and explicit deployment approval.  
> * Post-deploy product, health and data checks.

### **Visible conflicts**

> * Repo main is not provably the deployed source. Do not infer parity.  
> * Production-baseline documentation includes unrecovered production-only work and remains historical evidence rather than verified source code.  
> * Repo v1 scope and future modular course/Living Chart/authentication direction differ materially.  
> * Earlier specs/DECISIONS.md excludes A/B variants and contains obsolete palette/logo statements; it must be versioned, not silently overwritten.

## **8\. Business model and validation gates**

### **Approved posture**

> * Freemium direction: fundamentals free, advanced content paid. Exact free boundary, price and paywall timing remain open.  
> * **TEST, not scale.** The 61/100 validation memo sets the current investment posture.  
> * Marketing is not yet an active pillar. Business Development may prepare evidence and tests but may not activate marketing or spend.

### **Proposed models**

> * Consumer subscription price-test cells: \$3.99 / \$6.99 / \$9.99 monthly and \$29 / \$49 / \$69 annual.  
> * Four-week paid cohort test: \$19–39.  
> * B2B2C licensing and affiliate revenue are later options, not the base case.

### **Ordered gates**

> 1. **Evidence hygiene:** trace sources; lock event definitions, denominators and queries.  
> 2. **Problem/wedge clarity:** 12–15 cold interviews plus observed first session. Thresholds remain proposed.  
> 3. **12-day RAT:** 30 cold users; pass at 18 starts, 12 lesson-three completions, 8 day-eight returns, 6 day-twelve returns and 3 deposits; fail below 4 day-twelve returns or zero deposits. Offer, refunds and any spend remain Guy-owned.  
> 4. **Four-week retention:** D30 minimum 5%, target 10%+; at least half of D30 returners complete unseen practice.  
> 5. **Price/payment:** at least 8% start checkout and 3% pay or leave a refundable deposit.  
> 6. **Low-cost distribution:** proposed repeatability and referral-quality thresholds need Guy’s approval.  
> 7. **Controlled paid acquisition:** only after prior gates; proposed 12-month gross-margin LTV ≥ 3× CAC and payback ≤ 12 months; any campaign requires explicit approval.  
> 8. **Scale decision:** only after reproducible earlier gates, legal clearance and measured production cost. Guy decides scale, narrow, pivot or stop.

**Evidence register:** [Tikerino Business Development \- Evidence Register and Validation Gates](https://docs.google.com/document/d/1sY5iqyxfhT4FeqWo_qy2zfHRdLgyeHQMgIUcWzQ9VH8/edit?usp=drivesdk&authuser=gkahansky@gmail.com)

## **9\. Decision register**

* Product wedge \- Approved: Point-in-time chart practice with graded reveal is the current test proposition.  
* Audience \- Unresolved: 18–45 is a working hypothesis, not a locked segment.  
* Living Chart \- Approved: Immersive chart-world journey driven by learning success and persistence.  
* Theme \- Approved / Unresolved: Dark is primary; light exists for A/B; final ratification and measurement plan are open.  
* Base XP \- Approved: Lesson 25; daily 10; mastery 40; exam 150; pullbacks lose 0\.  
* Persistence \- Approved: \+2 per consecutive day from day 2; \+20 bonus cap; max \+30/day; no clawback.  
* Curriculum size \- Proposed / Unresolved: 12×8=96 baseline; 72 remains open.  
* Stage A \- Proposed: Unified 12-module/96-title draft awaits panel critique and revision.  
* Schema v2 \- Proposed: Required before full-catalog serialization; semantics not frozen.  
* Mascot \- Approved / Unresolved: Head-only logo and bull cameo approved; body direction and name open.  
* Accounts \- Unresolved: Google sign-in is backlog; identity/admin/privacy scope not decided.  
* Analytics/data retention \- Unresolved: No collection change without owner decision and privacy review.  
* Business model \- Approved / Unresolved: Freemium direction approved; pricing, free boundary and first paid test open.  
* Marketing \- Approved: Not active yet; no spend or activation.  
* Scale \- Approved: Test gates first; Guy owns scale/narrow/pivot/stop.

## **10\. Change control**

> 1. Every change carries a version number, date, owner, status and provenance.  
> 2. Approved constants change only through a new trusted owner decision and version bump.  
> 3. Component specs may add detail but cannot contradict this Bible. If they do, mark the conflict here before implementation.  
> 4. Pillar owners propose section updates; the operating owner integrates them and preserves the history.  
> 5. Current-state facts must cite live source evidence where available. Historical documents never prove deployment parity.

## **11\. Source and appendix index**

> * [Current product](https://tikerino.com)  
> * [GitHub repository](https://github.com/gkahansky/Tikerino)  
> * [Tikerino Architecture](https://docs.google.com/document/d/1AwUXcmDN4RTffWoWZc5666RZcU12Ceu1VYOgBQnGJaU/edit?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [Full Curriculum Plan](https://docs.google.com/document/d/1ga660ClK9bAluYSDrM-GBwSB-fJ0cRibEtM6ijXDMfE/edit?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [Game Design Playbook](https://docs.google.com/document/d/19ZM-ONtfAuD0BnhjlqgZCtBhjXHlxqK1_YPjKswaPI8/edit?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [Content schema v1](https://drive.google.com/file/d/1Ny1ewSLuLkRFW0_9oiWyhoB6j5hozQwS/view?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [Content pack v0.2](https://drive.google.com/file/d/1xYin2XpMqN-W0_9oiWyhoB6j5hozQwS/view?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [Living Chart Progression Design Spec v1.0](https://docs.google.com/document/d/1J4Ox10Eb9h4yij53b3OTlgsHnddqowhMSw4OBaZwfXc/edit?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [Stitch design project](https://stitch.google.com/projects/2752353384096587514)  
> * [Validation memo](https://tikerino-validation-2026.surge.sh/)  
> * [Evidence Register and Validation Gates](https://docs.google.com/document/d/1sY5iqyxfhT4FeqWo_qy2zfHRdLgyeHQMgIUcWzQ9VH8/edit?usp=drivesdk&authuser=gkahansky@gmail.com)  
> * [10-minute validation-video storyboard, appendix only](https://docs.google.com/document/d/1eUo-r58wsULCfRQEEj2hsDquP-T82jj4B6upSoKUU8E/edit?usp=drivesdk&authuser=gkahansky@gmail.com)

# **Appendix A \- Exact Development pillar snapshot**

## **Development**

### **Architecture**

> * **Approved** \- Mobile-first React/TypeScript PWA with a framework-neutral deterministic chart engine, content, grading and state packages; one Fastify service serves the client and two API endpoints. Server-side cutting/grading, seeded replay and full answer audit identity are integrity requirements. Source: [main README](https://github.com/gkahansky/Tikerino/blob/main/README.md), [specs/DECISIONS.md](https://github.com/gkahansky/Tikerino/blob/main/specs/DECISIONS.md), [engine/grading spec](https://github.com/gkahansky/Tikerino/blob/main/specs/tikerino-engine-grading-spec-v1.md).  
> * **Approved** \- Current content schema v1 is independently versioned; released IDs/seeds are immutable and fixes require a curriculum version bump. Source: [content schema v1](https://github.com/gkahansky/Tikerino/blob/main/specs/tikerino-content-schema-v1.md).  
> * **Proposed** \- Schema v2 will add modules, objectives/prerequisites/misconceptions, multiple worked-example beats, typed annotation targets, transfer cases, exams/mixed review, semantic media segments, captions/transcripts, review lifecycle, extensible skills and explicit historical/non-graded versus synthetic/graded provenance. It must include v1 compatibility/migration, validators/types, fixtures and integrity regression tests. Source: Content workstream contract supplied Sep 19; not frozen because Stage A and reserved product decisions remain open.  
> * **Proposed** \- The Living Chart should consume versioned semantic learning events and derive a deterministic, replayable projection. Presentation animation state must remain separate from authoritative learning state. Source: Guy's Sep 19 14:38 WhatsApp approval of base progression and persistence direction, message wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E1RjdBOUI1ODA1MkQ1NjUxRUQA; complete Design/Product state contract is pending.

### **Implemented functionality**

> * **Approved** \- main at 0616db6 implements onboarding, locked lesson path, principle/guided-example cards, deterministic synthetic charts, multiple\_choice and pick\_the\_candle, authoritative submit/grade/reveal, XP/progress/streak state, offline answer queue/recovery, profile, installable PWA and Postgres-backed audit storage. Source: [main](https://github.com/gkahansky/Tikerino/tree/0616db6c03788d0f845018eafe586a3386d50310), [green main CI](https://github.com/gkahansky/Tikerino/actions/runs/34711335699).  
> * **Proposed** \- PR \#2 adds local deployment-shaped staging, deferred offline reveal, production-baseline documentation and a guarded audit\_records to audit\_answers migration with tests. It is green but intentionally unmerged. Source: [PR \#2](https://github.com/gkahansky/Tikerino/pull/2), [green CI](https://github.com/gkahansky/Tikerino/actions/runs/35103717161).  
> * **Proposed** \- Separate branch claude/tikerino-narrated-lessons-legal-ui at 3607356b implements only foundations: nullable lesson-mode choice, lesson-derived narration plan and seek-based non-blocking sprite player. Mode UI, walkthrough UI, legal routes, generated sprite/assets, screenshots, clean full CI and a PR are not yet present. Source: [commit b56785f](https://github.com/gkahansky/Tikerino/commit/b56785f17fc89f8435146e9fe8b09cb31e7d0859), [commit 40ae159](https://github.com/gkahansky/Tikerino/commit/40ae159a6334036d996cba9c78ebcfd9d647e238), [commit 3607356](https://github.com/gkahansky/Tikerino/commit/3607356bb3df3baf2244eba8672e876e3740c6d8).

### **Current constraints and cross-stream interfaces**

> * **Approved** \- Engineering owns code, tests, CI, technical documentation, release mechanics and data preservation. Content owns curriculum/copy/media specifications; Design owns states, behavior, layout and assets. Engineering must not invent content structure, scoring, UI behavior or product decisions. Source: Guy's three-workstream direction relayed Sep 19 and the Content workstream contract.  
> * **Unresolved** \- Full Stage C serialization waits for frozen schema v2 semantics. Content can continue architecture and briefs independently; Engineering can continue v1-compatible narration/player/state work.  
> * **Unresolved** \- The Living Chart base weights are approved: lesson \+25 XP, daily practice \+10, mastery \+40, exam \+150; visual pullbacks lose zero XP. Persistence is also approved: daily base \+10, \+2 per consecutive day from day 2, \+20 bonus cap at day 11+, maximum \+30/day; missed days remove no XP, restart only the consecutive counter and preserve lifetime practice. Exact implementation still waits for the complete versioned event/state contract. Owner provenance: Sep 19 14:38 message above plus Guy's 👍 approval at 14:50:57, wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E5OUJCOUNENUUwODM1RjQwODYA, replying to the exact proposed ladder.  
> * **Unresolved** \- Numeric audience age, 96 versus 72 lessons, history placement, real-account/tax path and media route remain reserved for Guy; they cannot be encoded as defaults.

### **Accounts, data and admin**

> * **Approved** \- Current released scope has no learner accounts, authentication, admin console, analytics, personal-data collection, payments or subscriptions. Source: [main README, “What is deliberately not here”](https://github.com/gkahansky/Tikerino/blob/main/README.md#what-is-deliberately-not-here).  
> * **Proposed** \- Google authentication/onboarding is backlog-only and requires separate scope/privacy/security decisions before implementation. Owner request: Sep 18 07:27 WhatsApp, wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgWM0VCMDZGMjJDQTY1MTVGNzQ1MzY5RAA=; parent explicitly kept it outside the active slice.  
> * **Approved** \- Graded answers must preserve exact content/generator identity, server-authoritative grading, point-in-time cuts, no post-cut leaks and idempotent offline reconciliation. Source: README integrity contract and Content workstream contract.  
> * **Unresolved** \- Production previously showed 12 rows in audit\_records, while main writes audit\_answers. Any release touching that database needs a restore-verified backup and tested preservation/migration. Source: [PR \#2 production baseline](https://github.com/gkahansky/Tikerino/blob/claude/tikerino-github-coordination-d3v1uf/PRODUCTION-BASELINE.md) plus Sep 17 Railway screenshot evidence.

### **Legal, accessibility and safety**

> * **Approved** \- Legal copy belongs in Terms/Privacy, not lesson scripts; synthetic graded charts must not imply financial advice or real-market performance. Source: Content workstream contract and repo integrity/spec documents.  
> * **Proposed** \- Legal routes/profile links are part of the active narrated/legal Engineering slice but are not implemented on the branch yet. Source: [current Engineering plan](https://github.com/gkahansky/Tikerino/issues/1#issuecomment-5740453617).  
> * **Approved** \- Mobile accessibility requires readable/scalable text, large targets, keyboard-operable charts, non-colour cues, text alternatives, adjustable pacing, pause/replay and reduced-motion parity. Source: README accessibility decisions and Content/Design interface contracts.  
> * **Approved** \- Living Chart guardrails: it represents capability, never money, returns, prediction, loss or debt; wrong answers and missed days cannot crash value or erase XP. Source: Guy's Sep 19 approvals above and Content interface requirements.

### **Quality and release gates**

> * **Approved** \- Every Engineering PR requires repository-pinned typecheck/tests, green CI, matching technical docs and evidence for visual behavior. The narrated/legal slice additionally requires 390x844 screenshots and audio-failure fallback coverage. Source: [Engineering plan](https://github.com/gkahansky/Tikerino/issues/1#issuecomment-5740453617) and Guy's standing GitHub grant, Sep 16 12:18:27, wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E5ODk3RTNGNzBDQTM5NDFGRDcA.  
> * **Approved** \- Before release: hosted staging from the reviewed commit, real iPhone/Safari verification for audio/PWA behavior, restore-tested data preservation, resolved reviews, documented merge order, tag, approved deployment, post-deploy health/product/data checks.  
> * **Unresolved** \- No GitHub Deployment or Environment currently exists; narrated branch has no CI run or PR; no release tag exists. PR \#2 remains open and must not be merged on green CI alone.

### **Conflicts that must remain visible**

> * **Unresolved** \- Repo main is not provably the deployed source. Production is reachable, but Railway has no GitHub deployment record or commit SHA. Do not infer parity.  
> * **Unresolved** \- PR \#2's production-baseline document describes production-only narration, legal, walkthrough and logo work, while current public bundle inspection did not expose reliable evidence for those features and the source was never recovered. Treat that document as historical evidence, not verified source code.  
> * **Unresolved** \- Repo v1 locks two topics, tap/select exercise types and no accounts; current Product/Content direction includes a much larger modular course, schema v2, Living Chart and later authentication backlog. Those are approved/proposed future direction, not implemented release state.  
> * **Unresolved** \- specs/DECISIONS.md says A/B variants are out of MVP and lists green/violet as the first palette pair, while Guy approved a complete dark-primary/light-theme A/B concept on Sep 19 (wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E1RjdBOUI1ODA1MkQ1NjUxRUQA). The spec must be versioned rather than silently overwritten.  
> * **Unresolved** \- The same decisions file says the bull logo is not an experiment and final logo selection was open; Guy has since directed use of the original bull or one of his supplied variants in the Living Chart mock. This narrows Design exploration but does not by itself identify a production asset/version.

# **Appendix B \- Exact Design pillar snapshot**

DESIGN SECTION \- Tikerino Product Bible (prog-rules-v1.0 era, 2026-09-19)  
Authoritative progression spec (created today, visually verified): "Tikerino \- The Living Chart: Progression Design Spec v1.0" \- https\://docs.google.com/document/d/1J4Ox10Eb9h4yij53b3OTlgsHnddqowhMSw4OBaZwfXc/edit?usp=drivesdk\&authuser=gkahansky%40gmail.com (Drive \> AI Projects/Tikerino). Supporting: Stitch project https\://stitch.google.com/projects/2752353384096587514; bull/mascot brief doc 1sqBjNYvDrgEO0ZRigXMlMcliPiwMbNJaMFthyOmuum4; token ground truth \= repo specs/tikerino-design-tokens-v1.css \+ specs/tikerino-tailwind.config.js.  
USER JOURNEY / LIVING CHART

> * APPROVED: journey screen \= "The Living Chart": the whole 390x844 vertical screen is an immersive candlestick world; lessons are candles, current lesson is a forming LIVE candle, review gates are resistance lines, module exams are breakouts, mistakes cause small visual pullbacks that never drop below the locked Safe Floor, persistence builds a streak-volume panel. Source: Guy, WhatsApp, 2026-09-19 14:27-14:28 IDT ("make me feel like I'm in an actual chart... raise the price by completing my tasks"; "they can affect the price by succeeding... showing up and persist every day"). Concept ratified by Guy's 14:38 follow-ups; dark frame 67406ecb \+ light frame 0e8081c0 in Stitch, both pixel-verified.  
> * APPROVED: challenge mechanic \- the user influences their own Knowledge Index through success and daily persistence; goal is building/sustaining an uptrend through skill and persistence. Same source.  
> * APPROVED: dark chart is the primary theme; a complete light variant exists for A/B with identical IA/states/behavior so the test isolates theme only. Source: Guy, 14:38 IDT ("Yes but let's prepare a light chart for A/B testing").  
> * UNRESOLVED: final dark-vs-light ratification \- four-model panel review of the light variant requested 14:49 IDT via the Bobby/Agent-Mail route, reply pending; Guy decides after the panel.

XP / PERSISTENCE CONTRACT

> * APPROVED: lesson \+25 XP, daily practice \+10, skill mastery \+40, module exam \+150; pullbacks visual only, zero XP loss ever. Source: Guy, WhatsApp, 2026-09-19 14:38 IDT.  
> * APPROVED: persistence ladder \- \+2 XP per consecutive day from day 2 on top of the \+10 base, bonus capped at \+20 (day 1 \= \+10, day 2 \= \+12, day 5 \= \+18, day 11+ \= \+30 max). Missed day removes nothing; consecutive counter restarts; lifetime practice days preserved. Source: Guy thumbs-up to the exact ladder message, 2026-09-19 14:50 IDT; documented in the spec with worked examples.  
> * APPROVED guardrails: mastery \> attendance; no loss language; no money/profit/prediction framing (index \= capability); recovery only through learning evidence; no money-symbol imagery in ordinary rewards (long-standing brand rule).  
> * PROPOSED (pending Guy): "+2.4% this week" definition as week-over-week Knowledge Index change; "Mastery level" title naming system (current "Bullish Reversal Specialist" is a placeholder).

MASCOT / BRAND RULES

> * APPROVED: primary Tikerino logo is head-only; the upright full-body character is a separate in-game asset for animations, milestones, onboarding, empty states \- never the logo. Source: Guy, WhatsApp, 2026-09-19 13:03 IDT. Propagated to the brief doc and all three Stitch DESIGN.md docs (retitled "Tikerino \- Design System", token-synced to Growth Green \#10B981).  
> * APPROVED: bull placement grammar \- companion at emotional moments (start/win/milestone/comeback); never persistent nav, lesson content, or videos (locked earlier, recorded in the bull brief doc).  
> * APPROVED: Living Chart mascot cameo stays, using the original bull anatomy or Guy's supplied variants \- the dog-like generated form was rejected. Source: Guy, 14:38 IDT. Dark frame corrected (rounded-square green head, large navy horns, mint muzzle); production must use the pixel-exact approved head-only bull asset, not regenerated art.  
> * UNRESOLVED: full-body character direction \- both v2 variants rejected by Guy 13:28 ("head and body connected, not too fat/thin, inviting but not toddler-TV"); v3 board offers Direction A "Modern Fintech" and Direction B "Smart Editorial", both connected-silhouette \~3 heads; awaiting Guy's pick.  
> * UNRESOLVED: mascot name "Pippie" \- pending Guy.  
> * UNRESOLVED: coins in rewards \- default no, never formally confirmed.

ACCESSIBILITY (APPROVED, long-standing): WCAG 2.1 AA; every state pairs color with icon+label; 48px touch targets; body \>=18px, floor 16px; data-viz colors frozen (hollow bull / filled bear candles); text \+ reduced-motion equivalents for every animated state (mapped per event in the spec); screen-reader order defined; synthetic charts for graded exercises; mobile-first PWA; English only; green palette only (no purple).  
OTHER UNRESOLVED / HOUSEKEEPING

> * Rejected "Tikerino Ascent" and "Candlestick Ridge" journey frames still on the Stitch canvas \- deletion decision pending.  
> * "Mastery score 82%" stat from the rejected Ascent \- dead with that concept; not carried into The Living Chart (noted so nobody revives it silently).  
> * A/B measurement plan (metric, duration, guardrails) \- undefined; required before the theme test starts.  
> * Analytics/privacy: progression-data storage, location and retention need Guy's decision \+ Engineering privacy review (spec section 9).  
> * Astra design-critic access: Gkahansky org has gpt-6-astra but zero credits; billing is Guy's call \- panel route (Bobby via Agent Mail) is the active critique path meanwhile.

No conflicts were silently resolved: every Approved item carries its owner-message provenance above; anything without one is labeled Proposed or Unresolved.

# **Appendix C \- Exact Content pillar snapshot**

# **Content**

## **Curriculum structure**

> * **Approved** \- Stage A must define the full course from beginning to end: ordered modules/chapters plus every lesson title, before scripts begin. Owner provenance: WhatsApp wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0EzREQ5MTY3RjI4NjYwMEU1RkQA, 2026-09-18 08:28 IDT.  
> * **Proposed** \- Current full-plan baseline is 12 modules x 8 lessons \= 96 lessons; modules 1-3 are the 24-lesson free tier, modules 4-12 the 72-lesson premium tier. Source: [Full Curriculum Plan](https://docs.google.com/document/d/1ga660ClK9bAluYSDrM-GBwSB-fJ0cRibEtM6ijXDMfE/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Proposed** \- Unified Stage A v1 retains 12 modules and 96 candidate titles across four arcs: foundations; market structure/supporting evidence; risk-aware practice decisions; transfer/psychology/integration. It is in panel critique, not approved.  
> * **Unresolved** \- 96 lessons vs a compressed 72-lesson version. The approved planning record explicitly leaves both open. No lessons have been silently cut.  
> * **Unresolved** \- Market history as one late transfer module, earlier recurring micro-cases, or both.

## **Lesson progression**

> * **Approved** \- Core loop: teach one small principle, show a worked example, practise on a chart cut before the outcome, explain the choice, receive immediate feedback, then reveal. Source: [Tikerino project record](https://tikerino.com) and [Game Design Playbook](https://docs.google.com/document/d/19ZM-ONtfAuD0BnhjlqgZCtBhjXHlxqK1_YPjKswaPI8/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Approved** \- Every fact taught needs at least one worked example; later examples use the US market only. Owner provenance is recorded in the Tikerino project record from the 2026-09-13 lesson-video review.  
> * **Approved** \- Module/market exams use unseen data and test explanation as well as recognition. Source: [Game Design Playbook](https://docs.google.com/document/d/19ZM-ONtfAuD0BnhjlqgZCtBhjXHlxqK1_YPjKswaPI8/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Proposed** \- Each approved lesson will later receive a design brief with: observable objective, prerequisites, misconception, worked example, close practice, varied transfer, feedback intent, accessibility notes, factual sources and safety/uncertainty note.

## **Pedagogy and copy rules**

> * **Approved** \- Beginner-first; do not assume investing knowledge or game literacy. Teach one observable skill at a time and use progressive disclosure. Source: [Game Design Playbook](https://docs.google.com/document/d/19ZM-ONtfAuD0BnhjlqgZCtBhjXHlxqK1_YPjKswaPI8/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Approved** \- Feedback states what happened, why, and what evidence to notice next; a score or generic "Correct" is insufficient. Repeated failure triggers a hint, worked example, easier parallel case and retry.  
> * **Approved** \- Use retrieval and spacing; later lessons mix earlier skills instead of repeating near-identical items.  
> * **Approved** \- Candles, patterns and indicators describe evidence, not certainty or a future prediction. Synthetic charts remain the graded-exercise default.  
> * **Approved** \- English only for the current product scope; text remains a complete learning route, with narration additive rather than required. Source: [Tikerino Architecture](https://docs.google.com/document/d/1AwUXcmDN4RTffWoWZc5666RZcU12Ceu1VYOgBQnGJaU/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Approved** \- Legal copy stays in Terms and Privacy, not in walkthrough or lesson scripts. Source: [Tikerino Architecture](https://docs.google.com/document/d/1AwUXcmDN4RTffWoWZc5666RZcU12Ceu1VYOgBQnGJaU/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Approved** \- Living Chart copy preserves mastery over attendance and non-punitive recovery. Base weights: lesson \+25 XP, daily practice \+10, mastery \+40, exam \+150; pullbacks are visual only with zero XP loss. Parent-relayed owner decision, 2026-09-19 14:38 IDT; the originating trusted-channel words should be cited in the Bible's decision ledger.  
> * **Approved** \- The personal uptrend represents growing capability, never money, returns or prediction. Wrong answers do not cause financial-loss language, erased progress or punitive crashes.

## **Content schema and lifecycle**

> * **Approved** \- Current schema v1 is the code/content contract: versioned pack and curriculum, stable lesson/exercise/series IDs, server-side grading, deterministic synthetic charts and immutable shipped IDs. Source: [Content Schema v1](https://drive.google.com/file/d/1Ny1ewSLuLkRFW0_9oiWyhoB6j5hozQwS/view?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Approved** \- Text-only now. Audio/video production begins only after the complete text layer has been written, reviewed and approved. No paid content service is authorized in the current phase. Owner provenance: WhatsApp wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0EyMzQ2OTE2MEI0QzZCQzNCOUMA, 2026-09-18 08:25 IDT.  
> * **Approved** \- Every stage follows: draft \-\> full Bobby panel review \-\> agreements/dissent/gaps \-\> revision \-\> follow-up review. No next stage before feedback is incorporated and the revision passes. Owner provenance: WhatsApp wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0EyRTUxNEQyRTYyQUE4NzQwQjAA, 2026-09-18 08:26 IDT.  
> * **Proposed** \- Schema v2 is required before full-catalog serialization. Needed additions: modules; objectives/prerequisites/misconceptions/sources/review state; worked-example beats; close and transfer practice; module exams; semantic narration/video segments; richer annotations; and an explicit distinction between historical/non-graded examples and synthetic graded charts.  
> * **Proposed** \- Lifecycle states: Draft, Ready for review, Approved and Retired. Stable IDs survive release; corrections create a new content version.

## **Existing shipped inventory**

> * **Approved** \- Current source pack v0.2 contains 2 topics, 9 lessons and 16 exercises. Source: [content pack v0.2](https://drive.google.com/file/d/1xYin2XpMqN-W0Jz4zKA3cJWTEQn89qJ2/view?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Approved** \- Shipped lesson coverage: 6 Trading Fundamentals lessons and 3 Candlestick Reading lessons. The live product includes principle cards, guided examples and graded exercises.  
> * **Approved** \- Lesson 1 has a narrated pilot in production; narrated mode is the default for new profiles, with equivalent text mode and an iOS-safe one-audio-sprite-per-lesson implementation. Source: [Tikerino Architecture](https://docs.google.com/document/d/1AwUXcmDN4RTffWoWZc5666RZcU12Ceu1VYOgBQnGJaU/edit?usp=drivesdk&authuser=gkahansky@gmail.com).  
> * **Unresolved** \- The Full Curriculum Plan says 9 live lessons, while its earlier architecture wording refers to a 16-lesson plan. Nine are shipped; the remaining seven are planned, not shipped.

## **Review status**

> * **Approved** \- Four independent Stage A generation outputs were received: Gemini 7 chapters/84 lessons; ChatGPT 8/36; Claude 14 chapters with a file note of 94 lessons; Grok 10/40.  
> * **Unresolved** \- Bobby's summary said Claude had 91 lessons, while Claude's file says 94\. Preserve the discrepancy; do not use either as the canonical curriculum count.  
> * **Approved** \- Content independently critiqued all four outputs and produced unified Stage A v1 with 12 modules and 96 candidate lesson titles.  
> * **Proposed** \- Unified Stage A v1 is waiting for the required four-model critique round. It is Ready for critique, not Approved. Revision and mandatory follow-up review have not started.  
> * **Unresolved** \- The original panel ZIP's synthesis.md failed CRC. The four model files were valid and preserved; a clean synthesis was requested but has not arrived. Content's own synthesis does not rely on the corrupt file.

## **Unresolved course/product choices**

> * **Unresolved** \- Numeric target age vs adult-general audience.  
> * **Unresolved** \- 96 vs 72 lessons after prerequisite/progression review.  
> * **Unresolved** \- History placement: late module, recurring micro-cases, or both.  
> * **Unresolved** \- Whether real accounts/taxes/next steps remain in the core course or move to an adult/guardian-gated path.  
> * **Unresolved** \- Exact capped consecutive-day persistence bonus ladder. The progressive bonus is approved in principle; values are not.  
> * **Unresolved** \- Later media route and any paid service. The code pipeline vs generative route remains a later decision after text approval.

# **Appendix D \- Exact Business Development pillar snapshot**

## **Business Development**

### **Vision, audience and positioning**

> * **Approved** \- Tikerino is a mobile-first investing-education product built around short lessons, interactive chart practice, XP, streaks and a guided learning path. Owner context: Guy established the product direction and approved the MVP scope; current product: https\://tikerino.com.  
> * **Approved** \- The product-level positioning wedge for validation is point-in-time chart practice with graded reveal, not generic financial literacy. Evidence: 61/100 validation memo, https\://tikerino-validation-2026.surge.sh/. This is approved as the current test proposition, not proof of a durable moat.  
> * **Proposed** \- “Duolingo for investing” is a useful category shorthand, not final positioning copy. It appears in Guy’s commissioned PlanB research prompt and the product concept; it still requires comprehension and preference testing.  
> * **Unresolved** \- Primary audience. Guy’s exact owner words: “Our target audience is young investors, mostly 18-45, at least that’s my guess” (WhatsApp, 19 Sep 2026 13:28:47 IDT, message wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E2MDcxQ0M5MTdBRjk3RjNDMjcA). Treat 18–45 as a working hypothesis, not a locked segment. Earlier PlanB prompt used retail-investing beginners 18–40 in English-speaking markets with possible Israel expansion (agent message wamid.HBgMOTcyNTQ3NzgyNDM0FQIAERgSMzNGRjdEQjhBMEQwRjIwQzc4AA==, 12 Sep 22:49:39); this is research scope, not owner approval.  
> * **Unresolved** \- Market size, search demand and pricing claims. PlanB’s \~\$800M SAM, \$16–24M five-year SOM, 490–530k monthly searches and \$7–10/month are hypotheses, not forecasting inputs. Evidence register: https\://docs.google.com/document/d/1sY5iqyxfhT4FeqWo\_qy2zfHRdLgyeHQMgIUcWzQ9VH8/edit?usp=drivesdk\&authuser=gkahansky%40gmail.com.

### **Business model**

> * **Approved** \- Freemium direction: fundamentals free, advanced content paid. This is recorded in the approved MVP scope. It does not settle the exact free-path length, paywall timing or price.  
> * **Proposed** \- Consumer subscription price cells for testing: \$3.99/\$6.99/\$9.99 monthly and \$29/\$49/\$69 annual. These come from the validation memo and are test cells, not chosen prices.  
> * **Proposed** \- A four-week paid cohort at \$19–39 is an alternate willingness-to-pay test; not a committed product model.  
> * **Unresolved** \- Monthly versus annual emphasis, free-path boundary, refund policy and consumer subscription versus paid cohort first. These are Guy-owned decisions at Gate 4\.  
> * **Proposed** \- B2B2C licensing to schools, banks or brokers and affiliate revenue are later options only. They are not the base case and require separate buyer evidence and legal review.  
> * **Approved** \- Marketing remains outside the active four pillars for now. Guy’s exact owner instruction: “Eventually we will add marketing to the mix” and the accepted operating reply states, “Marketing stays outside the active pillars until you add it” (WhatsApp, 19 Sep 2026 13:50:24 IDT, wamid.HBgMOTcyNTQ3NzgyNDM0FQIAEhgUM0E4MjEzNThBNTdCMkY3OTkzMzYA; reply at 13:50:54, wamid.HBgMOTcyNTQ3NzgyNDM0FQIAERgSRTI4OEVGMTQ5NDlDQzVENTc0AA==). Business Development may prepare GTM evidence and tests but cannot activate marketing or spend.

### **Validation evidence**

> * **Approved** \- Current decision status is **TEST, not scale**. Tikerino scored 61/100; retention is the multiplicative floor. Source: https\://tikerino-validation-2026.surge.sh/ and the evidence register above.  
> * **Approved** \- Working product and synthetic charts reduce feasibility and market-data licensing risk.  
> * **Proposed** \- The product wedge is plausible, but user preference, return behavior and payment are unproven.  
> * **Unresolved** \- Retention, willingness to pay, low-cost distribution, scalable lesson economics and legally safe affiliate/B2B2C routes.  
> * **Unresolved conflict** \- PlanB is optimistic about market size, pricing and channel economics; the validation memo finds insufficient product-specific evidence. Preserve both: PlanB supplies hypotheses; the 61/100 memo sets the current investment posture.

### **Ordered gates**

> 1. **Approved** \- Gate 0, evidence hygiene: source-audit PlanB claims; lock activation, cohort rules, events, denominators and queries before recruiting.  
> 2. **Proposed** \- Gate 1, problem/wedge clarity: 12–15 cold interviews plus first-session observation. Proposed pass: 8/12 report the recurring problem, 8/12 explain the cut-and-reveal loop, 6/12 ask to continue; proposed fail: fewer than 5/12 report the problem. Guy must approve these operating thresholds.  
> 3. **Approved** \- Gate 2, 12-day RAT thresholds from the validation memo: 30 cold users; pass at 18 starts, 12 lesson-three completions, 8 day-eight returns, 6 day-twelve returns and 3 deposits; fail below 4 day-twelve returns or zero deposits. Exact offer, refund terms and any spend remain unresolved and Guy-owned.  
> 4. **Approved** \- Gate 3, four-week retention: minimum D30 5%, target 10%+, with at least half of D30 returners completing an unseen exam/challenge. D30 below 5% is a severe failure signal.  
> 5. **Approved** \- Gate 4 payment thresholds from the memo: at least 8% checkout starts and 3% pay or refundable deposit. Price, packaging and free boundary remain unresolved.  
> 6. **Proposed** \- Gate 5, repeatable low-cost distribution: one unpaid source recruits 30 qualified cold users twice; referral K-factor at least 0.15; downstream quality within 20% relative of the direct cohort. Guy must approve these thresholds and select the first organic route.  
> 7. **Proposed** \- Gate 6, controlled paid acquisition only after prior gates: conservative 12-month gross-margin LTV at least 3× CAC and payback within 12 months. Requires explicit Guy approval of channel, creative, audience and budget before any spend.  
> 8. **Approved** \- Gate 7, scale decision: only after Gates 0–6 pass with reproducible data, legal blockers are cleared and small-batch lesson production cost is measured. Guy decides scale, narrow, pivot or stop.

### **Dependencies and appendices**

> * **Approved** \- Engineering supplies instrumentation and cohort reporting; Content supplies a stable five-lesson path, unseen exams and a small challenge bank; Design supplies neutral recruitment, comprehension and offer materials; Business Development owns questions, thresholds and synthesis. None of this silently expands another pillar’s scope.  
> * **Appendix only, Proposed** \- 10-minute animated executive explainer storyboard and narration: https\://docs.google.com/document/d/1eUo-r58wsULCfRQEEj2hsDquP-T82jj4B6upSoKUU8E/edit?usp=drivesdk\&authuser=gkahansky%40gmail.com. It summarizes the source document and creates no new policy.  
> * Appendix E \- Proposed validation-preparation evidence  
> *   
> * Status: Proposed, review-ready drafts only. These documents do not authorize analytics, accounts, recruitment, deposits, marketing or spend and do not change approved policy.  
> *   
> * Gate 0 \- Source Audit and Event Dictionary: https\://docs.google.com/document/d/1jO2x6tgBWQzRI9xpiupZCioFqfmaUkl07EK7i-ukyKE/edit?usp=drivesdk\&authuser=gkahansky%40gmail.com  
> *   
> * Gate 1 \- Cold Interview and First-Session Usability Script: https\://docs.google.com/document/d/1UBYup8IsBw89tKXhYnBqAvmkwsRujtkvtWVfaVyRTbM/edit?usp=drivesdk\&authuser=gkahansky%40gmail.com  
> * 

> * # **Decision register update \- 19 September 2026**

> * ## **DR-008 \- Evidence-based curriculum direction; replacement curriculum pending review**

> * Status: Approved strategic direction; revised curriculum not approved  
> * Owner evidence: Guy accepted that technical analysis should no longer be the central methodology for finding profitable trades. It becomes one execution and risk-definition layer inside a broader evidence-based investing and trading framework.  
> *   
> * Approved direction  
> * • Reframe the core learning promise around making testable, risk-controlled investing and trading decisions.  
> * • Cover fundamentals and regime selection, evidence-backed systematic factors, risk management, probabilistic testing, transaction costs/taxes/biases, technical execution and market structure, and behavioral discipline.  
> * • Keep chart reading because it is useful and engaging, but do not present patterns as causal proof or reliable prediction by themselves.  
> *   
> * Explicitly not approved  
> * • No replacement module hierarchy, lesson sequence, simulator scope, assessment model or production plan has been approved.  
> * • The existing Stage A 12-module / 96-title curriculum remains evidence only. Its approval path is paused pending a structured impact assessment and Guy's review.  
> * • Do not start new lesson briefs, scripts, narration or video against either the old plan or a proposed replacement while this gate is open.  
> *   
> * Required structured delta  
> * The Content assessment must state what survives unchanged, what is reframed or demoted, what is removed, what is missing, and a proposed revised hierarchy. It must preserve meaningful dissent and separate evidence-backed methods from engaging but weaker predictive claims.  
> *   
> * Cross-pillar dependencies  
> * • Content \- map the old plan to the new framework; identify prerequisites, evidence standards and failure modes; propose the revised hierarchy for Guy's review.  
> * • Development \- assess simulator, data and assessment requirements for expected value, costs, out-of-sample testing, risk, correlation, rebalancing and falsification. Do not implement until requirements are approved.  
> * • Design \- review learning flows and visual language so charts support comparison, uncertainty, market structure and invalidation rather than prediction claims. Reassess the Living Chart against the revised teaching role without discarding approved work prematurely.  
> * • Business Development \- revisit positioning, validation scripts, claims and target-user evidence. Existing Gate 0/Gate 1 drafts remain review-only; no external activation follows from this decision.  
> *   
> * Release and governance effect  
> * This decision changes curriculum governance, not current shipped functionality. Product Bible and dashboard must display the pause and dependency map. The revised curriculum becomes authoritative only after Guy reviews and approves the structured delta.  
> * 