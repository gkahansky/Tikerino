<!-- Snapshot of Google Doc "Tikerino Bull - Character and Animation Brief v0.1 (DRAFT)" (Drive), taken 2026-10-03. -->

# Tikerino Bull - Character and Animation Brief v0.1 (DRAFT, 19 Sep 2026)

**Direction (Guy, 19/9):** showcase the bull logo; explore giving the bull a body and making him an animated journey companion between milestones and lessons. Locked placement: onboarding, empty states, milestone moments, journey path. Never in persistent navigation, lesson content, graded chart frames, or videos. Focused learning stays clear of him.

## Identity baseline
- Face: the approved app-icon image (green rounded-square face, navy horns/ears/brows/muzzle, mint field) is the current visual baseline (Guy, 19/9: "This is good for now").
- Earlier asset: the pose set derived pixel-exact from Guy's original drawing remains the proportion reference; the new flat, rounded face style is what the body must match.
- Palette: body brand green (#10B981), horns/hooves/brows ink navy (#0F2B46), muzzle cream/white. No other colours. Flat fills, 2px navy outline optional at small sizes.

## Body design rules
- (Superseded - see last section: four-legged rig dropped.) Big head-to-body ratio (the face is the brand); reads at 48px.
- Friendly, not childish.
- Built as a small rig so animation is transform-based (rotate/translate), cheap to render as SVG/Lottie, consistent with the pixel-exact rule.

## Animation set (journey companion)
All transform-based, all with reduced-motion static poses.
1. Idle (current node): breathing 2s scale 1.00-1.02, occasional ear flick every 6-9s. Reduced motion: static pose.
2. Walk-ahead (lesson completed): 600-800ms trot to next node. Reduced motion: fade to next node.
3. Celebrate (exam pass only): jump + head toss, 1200ms, confetti. Reduced motion: flag pose.
4. Flag-plant (module milestone): 800ms. Reduced motion: flag already planted.
5. Welcome (onboarding): waves once, 800ms.
6. Empty/comeback state: sitting, one sympathetic head tilt. No guilt-tripping loops.
7. Review slide (Concept B only): slides down the retracement dip once, 800ms.

## Voice and tone
- The bull never talks in lessons. Speech bubbles only in onboarding/empty states, <= 8 words, encouraging, zero shame.
- Companion, not coach: never grades you.

## Production notes
- Master as SVG (pixel-exact from the approved face); Lottie export for app; PNG sprite fallback.
- Stitch is the exploration surface for body concepts; final assets get pixel-exact discipline (no AI drift in shipped assets).
- Guy reviews body concept (2-3 options) before any animation is built.

## Mascot state system (Guy's sheets, 19/9)
Canonical face states: neutral, correct (closed-eye joy + gold rays), nice (wink), awesome (sunglasses + sparkle), love-it (heart eyes), retry (worried frown), think (side-eye + "?"), level-up (surprised O-mouth + gold rays; alt: wink + navy arrow), missed (sad + sweat drop), away (sleeping Zzz), frustrated (anger mark; rare, never first response), reward (sparkle-star eyes; NO coins), almost (nervous), got-it (wink + confetti), good-vibes (relaxed + music note).

Canonical full-body poses: neutral-stance, success-win, level-up-point, retry-slump, away-offline, victory-pose, try-again-think, away-sit.

Journey mapping: onboarding welcome = correct/nice; between nodes = neutral-stance/good-vibes; correct answer = correct; wrong answer = retry + think (frustrated only after 3+ fails); level-up = level-up face + level-up-point pose; module milestone/exam = success-win or victory-pose; reward/badge = reward (no coins); empty/streak broken = missed or retry-slump; offline = away; comeback = love-it or got-it.

Anatomy: head rounded-square brand green; navy horns + center tuft; lighter mint muzzle; navy dot/line eyes; readable at 48px. Accents: gold for rays/sparkles; red only for frustration marks and heart-eyes.

Deviations flagged for Guy: coins removed from all reward/advance states (needs explicit yes to use coins anywhere); sheet errors unified.

## Brand rule: logo vs character + body decision (Guy, 19/9)
1. The primary Tikerino logo is the bull HEAD ONLY. The upright full-body mascot is a separate in-game character asset for animations, milestones, onboarding and empty states - never a replacement for the logo. Names: 'Tikerino logo (head)' and 'Tikerino character (full body)'.
2. Body direction: Guy rejected both the early upright execution and the four-legged body; kept the upright anthropomorphic direction for refinement. The four-legged rig is dropped. Two refined upright variants (V1 Athletic Guide ~3.5 heads tall, navy track jacket; V2 Compact Spark ~2.5 heads, varsity hoodie) are on the Stitch board 'Mascot Refinement - Upright Variants' awaiting Guy's pick.
