# **Tikerino Bull \- Character and Animation Brief v0.1 (DRAFT, 19 Sep 2026\)**

**Direction (Guy, 19/9):** showcase the bull logo; explore giving the bull a body and making him an animated journey companion between milestones and lessons. Locked placement: onboarding, empty states, milestone moments, journey path. Never in persistent navigation, lesson content, graded chart frames, or videos. Focused learning stays clear of him.

## **Identity baseline**

> * Face: the approved app-icon image (green rounded-square face, navy horns/ears/brows/muzzle, mint field) is the current visual baseline (Guy, 19/9: "This is good for now").  
> * Earlier asset: the pose set derived pixel-exact from Guy's original drawing (pointing, thinking, celebrating, four-legged slim body) remains the proportion reference for the body; the new face style (flat, rounded) is what the body must match.  
> * Palette: body in brand green (\#10B981), horns/hooves/brows in ink navy (\#0F2B46), muzzle cream/white. No other colours. Flat fills, 2px navy outline optional at small sizes for separation on mint/paper.

## **Body design rules**

> * Four-legged, slim, compact \- reads at 48px. Big head-to-body ratio (the face is the brand).  
> * Friendly, not childish: upright confident posture, no exaggerated cartoon proportions beyond the head.  
> * Built as a small rig (head, body, 4 legs, tail, horn pair) so animation is transform-based (rotate/translate), cheap to render as SVG/Lottie, and consistent with the pixel-exact rule.

## **Animation set (journey companion)**

All transform-based, all with reduced-motion static poses. Max durations from the motion spec.

> 1. **Idle** (on the path at the current node): breathing (2s ease in/out scale 1.00-1.02), occasional ear flick every 6-9s. Reduced motion: static standing pose.  
> 2. **Walk-ahead** (lesson completed, bull moves to the next node): 600-800ms trot along the path, slight head bob, ends facing the user. Reduced motion: fades to the next node.  
> 3. **Celebrate** (exam pass only): the big one \- jump \+ head toss, 1200ms, confetti burst per the celebration rule. Reduced motion: flag pose, no jump.  
> 4. **Flag-plant** (module milestone): plants a small flag on the landmark, 800ms. Reduced motion: shown with flag already planted.  
> 5. **Welcome** (onboarding): waves once, 800ms, then static.  
> 6. **Empty/comeback state** (streak broken or empty screen): sitting, looking at the user, one sympathetic head tilt. No guilt-tripping animation loops.  
> 7. **Review slide** (returning for mixed review \- Concept B only): slides down the retracement dip once, 800ms, lands ready.

## **Voice and tone**

> * The bull never talks in lessons. Speech bubbles only in onboarding/empty states, \<= 8 words, encouraging, zero shame ("Ready when you are.", "One lesson back and the streak is yours.").  
> * He is a companion, not a coach: he marks where you are and where you are going; he never grades you.

## **Production notes**

> * Master as SVG (pixel-exact from the approved face); Lottie export for app; PNG sprite fallback.  
> * Stitch is the exploration surface for body concepts; final assets get the same pixel-exact discipline as the logo (no AI drift in shipped assets).  
> * Guy reviews: body concept (2-3 options) before any animation is built.

> * ## **Mascot state system (Guy's sheets, 19/9)**

> * Source: two approved sheets from Guy (19/9) \- a 20-state expression grid and a face/poseline sheet. Labels unified below; the sheets disagree on several names.  
> * Canonical face states (sheet mapping):  
> * \- neutral \- gentle smile (sheet1 "Happy / Neutral", sheet2 "BASELINE (Neutral)")  
> * \- correct \- closed-eye joy \+ gold rays ("Correct\! / Well done\!", "CORRECT (Joy)")  
> * \- nice \- wink \+ smile (small acknowledgment)  
> * \- awesome \- sunglasses \+ sparkle (big-win flavor)  
> * \- love-it \- heart eyes (delight moments)  
> * \- retry \- worried frown ("Wrong / Try again")  
> * \- think \- side-eye \+ "?" ("Think about it")  
> * \- level-up \- surprised O-mouth \+ gold rays (canonical; sheet2 alt: confident wink \+ navy arrow)  
> * \- missed \- sad \+ sweat drop (empty/failed moments)  
> * \- away \- sleeping Zzz ("Away / Not playing", "IDLE (Sleepy)")  
> * \- frustrated \- anger mark (rare; never the default on a wrong answer)  
> * \- reward \- sparkle-star eyes \+ open smile (sheet1 "Reward\!"; sheet2's "REWARD (Rich)" face is a plain smile \= sheet error, ignored)  
> * \- almost \- nervous gritted mouth (close-call)  
> * \- got-it \- wink \+ confetti  
> * \- good-vibes \- relaxed smile \+ music note  
> * Canonical full-body poses:  
> * \- neutral-stance, success-win (arms up \+ rays), level-up-point (pointing \+ rays), retry-slump (head down), away-offline (curled up, Zzz), victory-pose (fist pump \+ trophy), try-again-think (hand on chin), away-sit (slumped \+ "wait" sign)  
> * Journey mapping (locked placements: onboarding, empty states, milestones; never in lesson content, persistent nav, or videos; never inside a graded chart):  
> * \- Onboarding welcome: correct or nice  
> * \- Between nodes on the learning path: neutral-stance or good-vibes  
> * \- Correct answer feedback: correct (already on exercise screens)  
> * \- Wrong answer feedback: retry \+ think; frustrated only after repeated fails (3+), never as first response  
> * \- Level-up moment: level-up face \+ level-up-point pose  
> * \- Module milestone / exam pass: success-win or victory-pose  
> * \- Reward chest / badge unlock: reward (sparkle eyes, NO coins \- see deviations)  
> * \- Empty states / streak broken: missed or retry-slump  
> * \- Offline / away: away or away-offline  
> * \- Comeback (returning user): love-it or got-it  
> * Anatomy and color grammar (from sheets):  
> * \- Head: rounded-square, brand green fill; navy horns \+ navy center tuft; lighter mint muzzle plate; navy dot/line eyes; expressions must read at 48px.  
> * \- Body: compact upright humanoid with arms, green torso; sheet2 dresses it in white tee \+ green shorts \+ navy limbs (see open conflict D1).  
> * \- Accents: gold/yellow for rays, sparkles, stars; red only for frustration marks and heart-eyes; navy up-arrow for the level-up alt.  
> * Deviations and resolutions applied (flagged for Guy):  
> * 1\. Coins removed: sheet2 "ADVANCE/LEVEL UP (Excited/Rich)" shows gold coins. Per the standing rule (no money-symbol imagery in ordinary learning rewards without explicit approval) coins are excluded from all reward/advance states; sparkles and rays carry the excitement instead. Needs Guy's explicit yes if he wants coins anywhere.  
> * 2\. sheet2 "REWARD (Rich)" face is a plain baseline smile (sheet error); canonical reward uses sheet1's sparkle-eyes face.  
> * 3\. Level-up face: sheet1 surprised \+ rays is canonical; sheet2 wink \+ arrow kept as approved alternate.  
> * 4\. Duplicate labels unified: "Wrong / Try again" \= retry; "Away / Not playing" \= away; "Level up\!" \= level-up.  
> * OPEN CONFLICT \- needs Guy (decision D1): the body rules above describe a four-legged bull rig; Guy's approved sheets show an upright two-legged character with arms (sheet2 adds tee \+ shorts). Options: adopt the sheets' anthropo body as canonical, or keep the quadruped rig and port only the face-expression grammar onto it. Held for Guy before any animation work; the face-state map above is body-agnostic and safe either way.  
> * 

> * ## **Brand rule: logo vs character \+ body decision (Guy, 19/9)**

> * ## **1\. Asset roles (Guy, 19/9 13:03): the primary Tikerino logo is the bull HEAD ONLY. The upright full-body mascot is a separate in-game character asset for animations, milestone moments, onboarding and empty states \- never a replacement for the main logo. Asset naming: 'Tikerino logo (head)' for the mark; 'Tikerino character (full body)' for the mascot rig.**

> * 2\. Body direction (Guy, 19/9 13:01): D1 above is resolved in direction \- Guy rejected BOTH the early upright execution and the four-legged body, and kept the upright anthropomorphic direction for refinement ('I don't like either but A is in the right direction'). The four-legged rig is dropped. Two refined upright variants (V1 Athletic Guide \~3.5 heads tall, navy track jacket; V2 Compact Spark \~2.5 heads, varsity hoodie) are on the Stitch board 'Mascot Refinement \- Upright Variants' awaiting Guy's pick; the chosen variant becomes the canonical body rig for the face-state map above, which stays valid as designed.  
> * 