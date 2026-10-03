# **Learning-App Pattern Study \- What Successful Apps Share (19 Sep 2026\)**

**Purpose (Guy, 19/9):** inspect 5-10 successful learning apps and record recurring design, journey, interaction, motivation and accessibility patterns before shaping Tikerino's design. **Apps inspected:** Duolingo, Brilliant, Zogo (closest analog \- financial literacy), Elevate, Khan Academy, SoloLearn, Mimo. Sources: product teardowns, design case studies, Duolingo's own method papers, accessibility scans (URLs at the end).

## **Per-app notes**

### **Duolingo (language, \~\$15B, the category benchmark)**

> * One guided path, not a tree. The 2022 redesign killed the branching tree for a single winding path because new users did not know what to do next. Guidance beats choice.  
> * The mascot is a motivation engine: Duo shows up in celebrations, streak reminders and empty states, never inside the exercise itself.  
> * Lessons are 2-4 minutes, one skill per lesson, immediate feedback on every answer.  
> * Layered motivation: XP, streaks, leagues/leaderboards, gems, quests, hearts (loss aversion). Multiple systems so different personalities find one that hooks.  
> * Accessibility is its weak point: public scans score the web app \~55/100 with dozens of contrast violations. Simplicity helps cognitive accessibility, but contrast and alt-text discipline lag. (Tikerino's locked WCAG 2.1 AA is a genuine differentiator.)

### **Brilliant (math/science, closest in pedagogy: learn by doing)**

> * Interactive-first: concepts taught through manipulation (weight-scale puzzles), never video lectures. Matches Tikerino's "make the call on the chart" loop.  
> * Competency-based onboarding: real problems gauge level, personalization feels earned.  
> * Themed loading animations (tangrams) turn dead time into brand.  
> * Wrong answers get interactive explanations, not just text \- explore the solution actively.  
> * Multi-layered motivation: XP, daily streaks, competitive leagues. Celebratory animations \+ XP counters on completion.  
> * Weakness worth avoiding: long onboarding with sign-up \+ paywall before any lesson. Tikerino's modules 1-3 free-first rule already beats this.

### **Zogo (financial literacy \- the direct competitor pattern)**

> * Bite-sized lessons, points redeemable for real rewards (gift cards) \- "get paid to learn."  
> * Redesigned onboarding added MORE setup steps without hurting conversion, because early personalization \+ dropping users straight into their first lesson built momentum. Lesson one before any form.  
> * White-label adaptive interface \- not relevant to Tikerino's own brand, but their proof that purposeful gamification drove \+50% retention YoY and \+36% skill completions is the business case for our journey path work.

### **Elevate (brain training)**

> * Personal daily training program built from stated goals \+ initial assessment.  
> * Short daily games, performance tracking over time, streaks.  
> * Lesson for us: a named daily session ("today's training") frames return visits better than an open course list.

### **Khan Academy (broad learning)**

> * Mastery progress visualization: a grid of skill squares per unit, each coloured by mastery level (not started / attempted / familiar / proficient / mastered). The canonical skills/mastery display Guy approved exploring.  
> * Weakness to avoid: massive library with weak guidance \- users must self-navigate.

### **SoloLearn / Mimo (coding)**

> * The loop: learn one small thing in plain language, use it immediately, instant feedback on the spot. Identical shape to Tikerino's loop \- validation that the core is right.  
> * Structured career paths (Full-Stack, Python) give a named journey with a destination, not just "more content."

## **Recurring patterns (the answer to Guy's question)**

**Design**

> 1. One idea per screen; lessons measured in 2-4 minutes.  
> 2. Friendly, rounded, illustration-led visual language \- but the ones that feel professional (Brilliant, Khan) keep illustration out of the work area and use it at transitions and celebrations.  
> 3. Brand mascots live at moments of emotion (start, win, comeback), never inside the focused task.  
> 4. Dark-on-light, high-legibility type in the learning area; colour budget spent on rewards and wayfinding.

**Journey** 5\. A single guided path beats a tree/library. The path itself is the product: visible progress, visible next step, visible destination. 6\. Named journeys with a destination (career paths, course units) out-retain open content libraries. 7\. First lesson before any form or paywall; personalization after momentum exists.  
**Interaction** 8\. Learn by doing: every concept is immediately applied, never passive. 9\. Instant feedback on every action; wrong answers get interactive, explorable explanations. 10\. Themed micro-animations at waits and transitions keep the brand present without delaying the user.  
**Motivation** 11\. Multiple parallel motivation systems (XP \+ streak \+ league \+ currency), so at least one fits each user. 12\. Streaks are the strongest daily hook; loss framing (hearts, streak freezes) adds urgency. 13\. Celebrations are earned, specific and animated; small wins get small celebrations, exams get the big ones. 14\. Real-world stakes (Zogo's gift cards, Duolingo leagues) outperform pure points where allowed.  
**Accessibility** 15\. The category leader is beatable here: short lessons and simple UI help cognitive accessibility, but contrast and alt text are widely neglected. Locked WCAG 2.1 AA \+ non-colour cues \+ text alternatives put Tikerino ahead if we hold the line.

## **What this means for Tikerino (feeds D3 templates and the two journey concepts)**

> * Journey path is confirmed as the highest-value design surface: single guided winding path, visible destination per module, the bull as journey companion at milestones (matches pattern 3 and Guy's direction exactly).  
> * Mastery grid (Khan pattern 14/11 hybrid): skills as a mastery matrix alongside XP/streak/crowns.  
> * Feedback template must include an interactive-explorable explanation state (Brilliant pattern 9), not just static text.  
> * Onboarding stays short; lesson one before any account wall (Zogo/Brilliant patterns 7).  
> * Daily-session framing ("today's training", Elevate pattern 12\) as a streak support, pending product approval \- noted, not designed in.  
> * Our accessibility locks are a competitive advantage; the visual QA checklist (D6) will test contrast and alt text on every template.

## **Sources**

> * Duolingo method paper: https\://duolingo-papers.s3.amazonaws.com/reports/Duolingo\_whitepaper\_duolingo\_method\_2023.pdf  
> * Duolingo path redesign research: Duolingo Path Meets Expectations for Proficiency Outcomes (2022 redesign study); CEO interview on the tree-to-path change (The Verge)  
> * Duolingo gaming principles teardown: https\://www\.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth  
> * Apple "Behind the Design: Duolingo": https\://developer.apple.com (Discover)  
> * Duolingo accessibility scan: Accessalyze WCAG 2.1 AA report (May 2026), plus simplicity case study  
> * Brilliant UI breakdown: https\://screensdesign.com/showcase/brilliant-learn-by-doing  
> * Brilliant vs Duolingo analysis: https\://thinkableletters.substack.com/p/brilliant-is-brilliant-but-should  
> * Zogo design case study: https\://alexcampdesign.com/zogo.html (+ retention/completion metrics)  
> * Elevate teardowns: https\://screensdesign.com/showcase/elevate-brain-training-games ; https\://trophy.so/blog/elevate-gamification-case-study  
> * Khan Academy mastery visualization: https\://support.khanacademy.org/hc/en-us/articles/18735142028045  
> * SoloLearn method: https\://www\.sololearn.com/en/how-sololearn-teaches  
> * Mimo UI breakdown: https\://screensdesign.com/showcase/mimo-learn-codingprogramming