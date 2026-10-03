# **Tikerino Game Design Playbook**

## **Executive summary**

A strong learning game must succeed as both a game and a learning system. The design chain is: intended player experience \-\> observable behavior \-\> mechanics and content \-\> measurable learning outcome. Tikerino already has a strong instructional loop: short lesson, worked example, point-in-time exercise, immediate feedback, XP, and reveal. The next design work should focus on mastery progression, failure recovery, assessment moments, accessibility, player research, and social motivation. Retention should come from growing competence and meaningful return value, not pressure.

## **Ten operating principles**

> 1. Start with the player experience, not a feature list. Define the intended feeling and behavior before mechanics. Use MDA backward: choose aesthetics/experience, predict dynamics, then build mechanics.  
> 2. Make learning the core play. The action used to win should exercise the exact target skill. Avoid trivia or rewards detached from chart reading.  
> 3. Protect autonomy, competence, and relatedness. Give meaningful choices, make progress legible, and add social features that help learning rather than ranking players by raw time or spending.  
> 4. Keep challenge at the edge of current skill. Diagnose rather than punish failure. Add hints, worked examples, easier parallel items, and later retries while preserving a path to mastery.  
> 5. Teach in context through action. Prime the goal, demonstrate one move, let the player try, observe, then add complexity. Use progressive disclosure instead of front-loading rules.  
> 6. Use fast, explanatory feedback. Say what happened, why it happened, and what the player should notice next. A red X, score, or animation alone is not instruction.  
> 7. Use retrieval and spacing. Bring earlier concepts back in varied situations. Mix recognition, prediction, explanation, and transfer instead of repeating near-identical items.  
> 8. Make progress meaningful. Levels, streaks, XP, and badges should mark growing capability. Never let the reward economy become the main reason to perform empty actions.  
> 9. Design access as a core constraint. Support readable text, captions, text alternatives, large targets, non-color cues, speed control, reduced motion, and multiple ways to receive instruction.  
> 10. Test behavior, not opinions. Watch first-time players, measure where they hesitate and fail, test learning after delay, and iterate against a stated risk.

## **Designer do's and don'ts**

### **Learning goals and core loop**

**DO**

> * Write one observable learning objective per lesson.  
> * Make every exercise require the target skill.  
> * Define success, common misconception, feedback, and transfer case before producing content.  
> * Use synthetic charts consistently so the game teaches interpretation rather than ticker memorization.

> **DON'T**

> * Add a mechanic because it is fashionable.  
> * reward tapping, watching, or grinding when mastery is the claimed goal.  
> * hide the learning objective behind narrative or UI.  
> * confuse recall of a prior example with transfer to a new chart.

### **Onboarding and tutorials**

**DO**

> * Let the player perform the core action in the first minute.  
> * Teach one decision at a time: prime, demonstrate, practice, observe.  
> * Use familiar mobile patterns and progressive disclosure.  
> * Allow skip, replay, captions, and text mode.

> **DON'T**

> * open with a long explanation, carousel, or lore dump.  
> * teach advanced features before the player needs them.  
> * block progress for an instruction already understood.  
> * assume game literacy or investing knowledge.

### **Challenge, failure, and mastery**

**DO**

> * Separate novice scaffolding from final performance standards.  
> * Give a worked example, then a closely related problem, then a varied transfer problem.  
> * Treat repeated errors as a signal to intervene.  
> * Add low-stakes retries and a recovery route that preserves dignity.  
> * Use periodic "market exams" on unseen cases as summative checks.

> **DON'T**

> * use streak loss as the main response to struggle.  
> * make difficulty spikes without preparing the underlying skill.  
> * let luck or unreadable charts dominate assessment.  
> * make hints cost scarce currency when the purpose is learning.

### **Feedback and rewards**

**DO**

> * Give immediate outcome feedback and concise explanatory feedback.  
> * Point to the exact chart evidence that supports the answer.  
> * Celebrate mastery milestones, good reasoning, recovery, and consistent practice.  
> * show progress toward skills, not only cumulative XP.

> **DON'T**

> * use generic "Correct\!" feedback when the reason matters.  
> * reward speed when careful judgment is the learning objective.  
> * flood the screen with points, badges, and currencies.  
> * let extrinsic rewards crowd out curiosity and competence.

### **Motivation and retention**

**DO**

> * Build return reasons around unfinished mastery, fresh transfer cases, and useful goals.  
> * offer meaningful choice where outcomes differ: practice focus, difficulty, mode, or next skill.  
> * support relatedness with cooperative goals, peer explanation, or friend comparisons among comparable learners.  
> * make reminders optional, specific, and easy to turn off.

> **DON'T**

> * use guilt, fear of loss, fake urgency, or confusing currencies.  
> * optimize daily activity without checking learning and well-being.  
> * turn every feature into competition.  
> * rank beginners against experts or heavy users.

### **Narrative and theme**

**DO**

> * Use the Tikerino bull and market journey to make abstract concepts relatable.  
> * make every narrative beat support a decision, lesson, or progress milestone.  
> * keep tone encouraging and financially responsible.

> **DON'T**

> * bolt a story onto unrelated interactions.  
> * imply that chart-reading creates certainty or guaranteed returns.  
> * use a character if its execution looks less professional than the rest of the product.

### **Social design**

**DO**

> * Start with learning-safe social features: optional friend groups, collaborative challenges, shareable explanations, and comparison to one's own past performance.  
> * design moderation, privacy, and opt-out before launch.  
> * reward helpful explanations and group completion.

> **DON'T**

> * launch open chat as the first social feature.  
> * expose minors or vulnerable learners to unmoderated contact.  
> * use public leaderboards that reward play volume more than mastery.  
> * assume social means competitive.

### **Accessibility and inclusion**

**DO**

> * Never rely on color alone; pair it with labels, shapes, and patterns.  
> * provide captions/transcripts, text alternatives, readable contrast and scalable text.  
> * use large, spaced touch targets and alternatives to precise gestures.  
> * offer reduced motion, adjustable pacing, and pause/replay.  
> * test with players who have different sensory, motor, cognitive, language, and game-literacy needs.

> **DON'T**

> * treat accessibility as post-launch polish.  
> * lock instruction into audio or animation alone.  
> * use time pressure unless it is essential to the learning goal.  
> * assume an accessible platform makes the content accessible.

### **Economy and ethics**

**DO**

> * display real prices plainly and make cancellation straightforward.  
> * separate payment from performance and learning progression.  
> * state clearly that exercises are educational and not financial advice.  
> * minimize data collection and explain why each data point is needed.

> **DON'T**

> * sell random rewards, power, or mistake recovery.  
> * obscure prices behind multiple currencies.  
> * use default opt-ins, disguised ads, or pressure around streaks.  
> * personalize pressure using sensitive behavior data.

### **Research, playtesting, and analytics**

**DO**

> * Begin each test with one decision and one risk.  
> * observe players without coaching before asking what they thought.  
> * combine behavior, qualitative explanation, and learning measures.  
> * test comprehension immediately and transfer/retention later.  
> * segment by prior investing knowledge, game literacy, age, device, and accessibility needs.  
> * record design hypotheses and what evidence would falsify them.

> **DON'T**

> * ask only "Did you like it?"  
> * use friends or the product team as the sole test pool.  
> * ship based only on completion rate or session length.  
> * interpret more time in app as automatically better.  
> * change several variables and claim the winning cause is known.

## **A practical design workflow**

> 1. Frame: player, context, learning outcome, target experience, constraint, risk.  
> 2. Specify: core action, success evidence, misconceptions, feedback, difficulty curve.  
> 3. Prototype: smallest playable loop with placeholder art and content.  
> 4. Internal check: learning alignment, accessibility, ethics, technical feasibility.  
> 5. First-time-user test: 5-8 target players, no coaching; observe the first session.  
> 6. Learning test: immediate performance, novel transfer item, delayed retrieval.  
> 7. Iterate: fix the biggest observed barrier, not the loudest requested feature.  
> 8. Instrument: lesson start/finish, attempt path, hint use, error type, retry, skill mastery, return reason.  
> 9. Gate: ship only when both player experience and learning evidence meet the threshold.  
> 10. Review after launch: cohorts, qualitative follow-up, accessibility issues, unintended incentives.

## **Design-review checklist**

Before approving a feature, answer yes to all:

> * Is the target player and their context explicit?  
> * Does the mechanic produce the intended player behavior?  
> * Does that behavior practice or assess the intended skill?  
> * Is the goal clear without extra explanation?  
> * Can failure teach the player what to do next?  
> * Is difficulty fair for a first-time player and meaningful for a returning player?  
> * Are progress and mastery visible?  
> * Can the experience work without sound, color distinction, precise gesture, or fast response?  
> * Are rewards aligned with mastery rather than compulsion?  
> * Is the commercial and data design transparent?  
> * Is there a test plan with a decision, risk, target players, and success threshold?

## **Tikerino priorities**

P0 \- Validate before scaling content

> * Run a cold-cohort first-session test and delayed learning check.  
> * Establish a skill-mastery model alongside XP.  
> * Add error taxonomy and track which misconception each wrong answer represents.

P1 \- Strengthen the learning game

> * Ship a first summative "market exam" using unseen charts.  
> * Add recovery after repeated failure: tailored hint, worked example, easier parallel case, retry.  
> * Add spaced mixed review across prior skills.  
> * Make explanatory feedback point to specific visual evidence.

P2 \- Improve retention without pressure

> * Replace streak fragility with streak protection or a recovery path.  
> * Add meaningful return goals and optional reminders.  
> * Test a small social-learning feature, such as comparing reasoning with a friend or a cooperative weekly challenge, before a global leaderboard.

P3 \- Accessibility and production discipline

> * Audit every lesson for captions, text alternative, contrast, target size, motion, pacing, and non-color cues.  
> * Maintain a content design brief per lesson: objective, misconception, example, practice, transfer item, feedback, accessibility notes.

## **Metrics that matter**

Learning: first-attempt accuracy by skill; transfer accuracy; delayed retention; misconception rate; hint-to-success rate; mastery time.  
Experience: onboarding completion; time to first meaningful action; voluntary return; frustration exits; replay/review use.  
Fairness/access: completion and error gaps by device, prior knowledge, mode and accessibility setting; blocked interaction rate.  
Guardrails: notification opt-out; streak-related churn; excessive session behavior; support complaints; payment confusion.

## **Sources**

See the linked primary and practitioner sources at the end of the Google Doc. The central research base is MDA, self-determination theory, retrieval practice and learning-game reviews, UDL/accessibility guidance, game user research practice, regulatory consumer-protection guidance, and Dave Eng's learning-game talk.

# **Source ledger**

> 1. Hunicke, LeBlanc & Zubek, MDA: A Formal Approach to Game Design and Game Research (AAAI, 2004\) \- https\://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/ \- primary framework \- mechanics/dynamics/aesthetics, designer-player perspective.  
> 2. Przybylski, Rigby & Ryan, A Motivational Model of Video Game Engagement \- https\://selfdeterminationtheory.org/wp-content/uploads/2014/04/2010\_PrzybylskiRigbyRyan\_ROGP.pdf \- peer-reviewed research \- autonomy, competence, relatedness and engagement.  
> 3. Ryan, Rigby & Przybylski, The Motivational Pull of Video Games \- https\://selfdeterminationtheory.org/SDT/documents/2006\_RyanRigbyPrzybylski\_MandE.pdf \- peer-reviewed research \- need satisfaction and enjoyment.  
> 4. Digital Games, Design, and Learning \- https\://pmc.ncbi.nlm.nih.gov/articles/PMC4748544/ \- academic review \- learning-game design, assessment, feedback and integration.  
> 5. Karpicke & Blunt, Retrieval Practice Produces More Learning... (Science) \- https\://www\.science.org/doi/10.1126/science.1199327 \- experimental research \- active recall beats passive restudy.  
> 6. CAST UDL Guidelines 3.0 \- https\://udlguidelines.cast.org/ \- nonprofit research-based framework \- multiple means of engagement, representation, and action/expression.  
> 7. Game Accessibility Guidelines \- https\://gameaccessibilityguidelines.com/full-list/ \- industry guidance \- motor, cognitive, vision, hearing, speech/access basics.  
> 8. Xbox Accessibility Guidelines \- https\://learn.microsoft.com/en-us/gaming/accessibility/guidelines \- platform guidance \- inclusive design, input, text, audio, difficulty.  
> 9. Accessible Player Experiences \- https\://accessible.games/accessible-player-experiences/ \- industry framework \- challenge, control, feedback and access patterns.  
> 10. Roblox onboarding techniques \- https\://create.roblox.com/docs/production/game-design/onboarding-techniques \- official practitioner guide \- contextual teaching, focused onboarding, progressive disclosure.  
> 11. Games User Research, testing from concept to release \- https\://gamesuserresearch.com/how-to-build-user-testing-into-your-development-process-from-concept-to-release/ \- practitioner body \- continuous, question-led research.  
> 12. Games User Research, Playtest Maturity Model \- https\://gamesuserresearch.com/the-playtest-maturity-model-what-does-good-playtesting-look-like/ \- practitioner framework \- operationalizing repeatable playtesting.  
> 13. UK OFT Principles for online and app-based games \- https\://assets.publishing.service.gov.uk/media/5a7c6a29e5274a5590059b52/oft1519.pdf \- regulator \- transparent, non-coercive commercial design.  
> 14. EU key principles on in-game virtual currencies \- https\://commission.europa.eu/document/download/8af13e88-6540-436c-b137-9853e7fe866a\_en?filename=Key+principles+on+in-game+virtual+currencies.pdf \- regulator \- price transparency and consumer protection.  
> 15. Dave Eng, Designing learning games with players in mind \- https\://www\.youtube.com/watch?v=fQdMhhYZoaE \- practitioner talk from original request \- player diversity, goals, feedback, onboarding, challenge, social learning and iteration.