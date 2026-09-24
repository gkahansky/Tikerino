# Live screen and state inventory

Every learner-visible screen and state in production (client/src/App.tsx routes plus the states each screen can be in). "Audited" means `tests/a11y/audit.mjs` visits it; the result is in [MATRIX.md](MATRIX.md).

| Screen | State | Route / how it is reached | Audited |
|---|---|---|---|
| Onboarding | Steps 1-3 | First launch | yes (`01-onboarding-1..3`) |
| Path home | New learner, lessons locked | After onboarding | yes (`02-path-new`) |
| Path home | After practice (+25/+10, persistence panel) | Back from a finished lesson | yes (`08-path-progress`) |
| Path home | Returning after missed days (recovery copy) | Seeded, clock set 3 days later | yes (`12-return-after-gap`) |
| Path home | Legacy save (pre-award data) | Seeded | yes (`13-legacy-path`) |
| Path home | Answer queued offline | Back from an offline answer | yes (`15b-path-queued`) |
| Lesson card | Principle | Tap a lesson | yes (`03-lesson-card`) |
| Guided example | Narrated (default, audio) | Show me | yes (`04-guided-narrated`) |
| Guided example | Text only, stepped | Switch to text only | yes (`04b-guided-text`) |
| Exercise | Multiple choice | Practise this | yes (`05-exercise-choice`) |
| Exercise | Hint open | Show a hint | yes (`05b-exercise-hint`) |
| Exercise | Answer selected | Tap an option | yes (`05c-exercise-selected`) |
| Exercise | Percent change | Lesson 2 | yes (`14b-exercise-percent`) |
| Exercise | Pick the candle, chart targets (roving tabindex, arrow keys) | Lesson 2 | yes (`14-exercise-pick-candle`) |
| Exercise | Pick the candle, text list open (Select candle buttons) | Read the candles as text | yes (`14c-exercise-pick-candle-text`) |
| Exercise | Loading / window error | Slow or failed window fetch | no (transient) |
| Reveal | Correct, with the daily +10 | Check | yes (`06-reveal-correct`) |
| Reveal | Not this time | Check, wrong answer | yes (`07-reveal-wrong`) |
| Reveal | Save failed (alert) | Storage write fails | yes (`16-save-failed`) |
| Reveal | Answer queued offline | Check while offline | yes (`15-offline-queued`) |
| Profile | Your progress | HUD pill | yes (`09-profile`) |
| Legal | Terms of use | Profile | yes (`10-terms`) |
| Legal | Privacy policy | Profile | yes (`11-privacy`) |
| /ops | Owner board | Private, password | out of learner scope |
