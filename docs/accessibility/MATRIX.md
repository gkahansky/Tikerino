# Accessibility matrix

Generated 2026-09-24T05:42:01.996Z by `tests/a11y/audit.mjs` against http://127.0.0.1:5173 at 390x844. Bar: [RELEASE_BAR.md](RELEASE_BAR.md).

Device screen readers (VoiceOver on iOS, TalkBack on Android) have **not** been run on hardware. "SR labels" is checked from the Chrome accessibility tree, which is what both screen readers are given; see `transcripts/`. Device status: UNVERIFIED.

| Screen / state | Focus on arrival | Keyboard | SR labels (AX tree) | Reading order | Contrast | Reduced motion | 200% text | Reflow 320px | Chart text alt | axe 2.2 AA | VoiceOver / TalkBack device |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Onboarding, step 1 (`01-onboarding-1`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Onboarding, step 2 (`01-onboarding-2`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Onboarding, step 3 (`01-onboarding-3`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Path home, new learner (locked lessons) (`02-path-new`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Lesson card (`03-lesson-card`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Guided example, narrated (default) (`04-guided-narrated`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Guided example, text only (`04b-guided-text`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Exercise, multiple choice (`05-exercise-choice`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Exercise with hint open (`05b-exercise-hint`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Exercise, answer selected (`05c-exercise-selected`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Reveal, correct (+10 daily) (`06-reveal-correct`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Reveal, not this time (`07-reveal-wrong`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Path home after practice (`08-path-progress`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Profile (`09-profile`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Terms of use (`10-terms`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Privacy (`11-privacy`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Path home, returning after missed days (`12-return-after-gap`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Path home, legacy save (`13-legacy-path`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Exercise, percent change (`14b-exercise-percent`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Exercise, pick the candle (`14-exercise-pick-candle`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Exercise, pick the candle, text list open (`14c-exercise-pick-candle-text`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |
| Answer queued offline (`15-offline-queued`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Path home with a queued answer (`15b-path-queued`) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
| Reveal when the save fails (`16-save-failed`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | UNVERIFIED |

## Details

### Onboarding, step 1 (`01-onboarding-1`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 2 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/01-onboarding-1.txt](transcripts/01-onboarding-1.txt)

### Onboarding, step 2 (`01-onboarding-2`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 2 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/01-onboarding-2.txt](transcripts/01-onboarding-2.txt)

### Onboarding, step 3 (`01-onboarding-3`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 1 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/01-onboarding-3.txt](transcripts/01-onboarding-3.txt)

### Path home, new learner (locked lessons) (`02-path-new`)

- Focus on arrival: PASS - focus on h1 "The Living Chart"
- Keyboard: PASS - 3 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/02-path-new.txt](transcripts/02-path-new.txt)

### Lesson card (`03-lesson-card`)

- Focus on arrival: PASS - focus on h1 "A chart is a story of trades"
- Keyboard: PASS - 5 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/03-lesson-card.txt](transcripts/03-lesson-card.txt)

### Guided example, narrated (default) (`04-guided-narrated`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 6 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/04-guided-narrated.txt](transcripts/04-guided-narrated.txt)

### Guided example, text only (`04b-guided-text`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 7 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/04b-guided-text.txt](transcripts/04b-guided-text.txt)

### Exercise, multiple choice (`05-exercise-choice`)

- Focus on arrival: PASS - focus on h1 "Look at this practice chart. What does t"
- Keyboard: PASS - 9 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/05-exercise-choice.txt](transcripts/05-exercise-choice.txt)

### Exercise with hint open (`05b-exercise-hint`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 8 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/05b-exercise-hint.txt](transcripts/05b-exercise-hint.txt)

### Exercise, answer selected (`05c-exercise-selected`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 9 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/05c-exercise-selected.txt](transcripts/05c-exercise-selected.txt)

### Reveal, correct (+10 daily) (`06-reveal-correct`)

- Focus on arrival: PASS - focus on h1 "Correct"
- Keyboard: PASS - 3 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/06-reveal-correct.txt](transcripts/06-reveal-correct.txt)

### Reveal, not this time (`07-reveal-wrong`)

- Focus on arrival: PASS - focus on h1 "Not this time"
- Keyboard: PASS - 1 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/07-reveal-wrong.txt](transcripts/07-reveal-wrong.txt)

### Path home after practice (`08-path-progress`)

- Focus on arrival: PASS - focus on h1 "The Living Chart"
- Keyboard: PASS - 3 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/08-path-progress.txt](transcripts/08-path-progress.txt)

### Profile (`09-profile`)

- Focus on arrival: PASS - focus on h1 "Your progress"
- Keyboard: PASS - 7 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/09-profile.txt](transcripts/09-profile.txt)

### Terms of use (`10-terms`)

- Focus on arrival: PASS - focus on h1 "Terms of use"
- Keyboard: PASS - 2 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/10-terms.txt](transcripts/10-terms.txt)

### Privacy (`11-privacy`)

- Focus on arrival: PASS - focus on h1 "Privacy policy"
- Keyboard: PASS - 2 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/11-privacy.txt](transcripts/11-privacy.txt)

### Path home, returning after missed days (`12-return-after-gap`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 4 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/12-return-after-gap.txt](transcripts/12-return-after-gap.txt)

### Path home, legacy save (`13-legacy-path`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 4 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/13-legacy-path.txt](transcripts/13-legacy-path.txt)

### Exercise, percent change (`14b-exercise-percent`)

- Focus on arrival: PASS - focus on h1 "A share rises from 40 to 44. What is the"
- Keyboard: PASS - 7 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/14b-exercise-percent.txt](transcripts/14b-exercise-percent.txt)

### Exercise, pick the candle (`14-exercise-pick-candle`)

- Focus on arrival: PASS - focus on h1 "Tap the candle with the highest closing "
- Keyboard: PASS - 6 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/14-exercise-pick-candle.txt](transcripts/14-exercise-pick-candle.txt)

### Exercise, pick the candle, text list open (`14c-exercise-pick-candle-text`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 18 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/14c-exercise-pick-candle-text.txt](transcripts/14c-exercise-pick-candle-text.txt)

### Answer queued offline (`15-offline-queued`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 3 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/15-offline-queued.txt](transcripts/15-offline-queued.txt)

### Path home with a queued answer (`15b-path-queued`)

- Focus on arrival: PASS - focus on h1 "The Living Chart"
- Keyboard: PASS - 3 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: n/a - no chart
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/15b-path-queued.txt](transcripts/15b-path-queued.txt)

### Reveal when the save fails (`16-save-failed`)

- Focus on arrival: n/a - same screen
- Keyboard: PASS - 3 controls reached
- SR labels (AX tree): PASS - all named
- Reading order: PASS - DOM order = visual order
- Contrast: PASS - axe color-contrast clean
- Reduced motion: PASS - no running animation
- 200% text: PASS - all text scales, no loss
- Reflow 320px: PASS - reflows at 320px
- Chart text alt: PASS - 1/1 charts named; text route present
- axe 2.2 AA: PASS - clean
- Transcript: [transcripts/16-save-failed.txt](transcripts/16-save-failed.txt)

## Non-text contrast (WCAG 1.4.11, 3:1)

Measured 2026-09-24T05:41:00.509Z by `tests/a11y/contrast.mjs` against http://127.0.0.1:5173. "Required" marks carry meaning a sighted learner needs; the rest are decorative or repeat visible text (reason in the note).

| State | Mark | Colour | Against | Ratio | Required | Result | Note |
|---|---|---|---|---|---|---|---|
| Living Chart path (dark) | path: open lesson candle outline (#7bcab2) | #7bcab2 | #083a39 | 6.53:1 | no | PASS | Decorative (aria-hidden); state is in visible text (LIVE · forming). (sampled pixels) |
| Living Chart path (dark) | path: completed candle body (#4ba98c) | #4ba98c | #0b2833 | 5.38:1 | no | PASS | Decorative; "Complete" is visible text. (sampled pixels) |
| Living Chart path (dark) | path: locked candle mark (#75908b) | #556e6d | #09222e | 3.00:1 | no | PASS | Decorative; "locked" is visible text. (sampled pixels) |
| Living Chart path (dark) | path: forming lesson border (#5ce1b5) | #5ce1b5 | #061725 | 11.14:1 | yes | PASS | Marks the one lesson to continue. (sampled pixels) |
| Living Chart path (dark) | path: persistence bar, active day (#4ba98c) | #4aa88b | #061a28 | 6.12:1 | no | PASS | aria-hidden; "Day N" is visible text. (sampled pixels) |
| Living Chart path (dark) | path: persistence bar, inactive day | #14393e | #061a28 | 1.42:1 | no | n/a (not required) | aria-hidden; the day count is visible text. (sampled pixels) |
| Exercise chart, before reveal | exercise: bullish body border + wick (--data-up) | #0e9f6e | #ffffff | 3.39:1 | yes | PASS |  |
| Exercise chart, before reveal | exercise: bearish body + wick (--data-down) | #dc2626 | #ffffff | 4.83:1 | yes | PASS |  |
| Exercise chart, before reveal | exercise: unchanged (doji) body (--ink-2) | - | - | - | - | not present in this state | |
| Exercise chart, before reveal | exercise: volume bar (--data-volume) | #b3bcc4 | #ffffff | 1.93:1 | no | n/a (not required) | Fill only; the bar's boundary is the 5.06:1 outline. |
| Exercise chart, before reveal | exercise: volume bar outline | #5b7186 | #ffffff | 5.06:1 | yes | PASS |  |
| Exercise chart, before reveal | exercise: gridline (--data-grid) | #edeae3 | #ffffff | 1.20:1 | no | n/a (not required) | Decorative: prices are read from candle positions and the text list; no gridline value is needed to answer. |
| Exercise, keyboard focus | focus ring on an answer (--focus-ring, 3px) vs paper | #2c5677 | #fafaf7 | 7.43:1 | yes | PASS |  |
| Exercise, keyboard focus | focus ring vs white card | #2c5677 | #ffffff | 7.76:1 | yes | PASS |  |
| Reveal chart | reveal: bullish body border + wick (--data-up) | #0e9f6e | #ffffff | 3.39:1 | yes | PASS |  |
| Reveal chart | reveal: bearish body + wick (--data-down) | #dc2626 | #ffffff | 4.83:1 | yes | PASS |  |
| Reveal chart | reveal: unchanged (doji) body (--ink-2) | - | - | - | - | not present in this state | |
| Reveal chart | reveal: volume bar (--data-volume) | #b3bcc4 | #ffffff | 1.93:1 | no | n/a (not required) | Fill only; the bar's boundary is the 5.06:1 outline. |
| Reveal chart | reveal: volume bar outline | #5b7186 | #ffffff | 5.06:1 | yes | PASS |  |
| Reveal chart | reveal: gridline (--data-grid) | #edeae3 | #ffffff | 1.20:1 | no | n/a (not required) | Decorative: prices are read from candle positions and the text list; no gridline value is needed to answer. |
| Reveal chart | reveal: cut-point line (--ink-2, dashed) | #5b7186 | #ffffff | 5.06:1 | yes | PASS |  |
| Pick the candle, keyboard focus | pick: focused candle target outline (--focus-ring, 3px) | #2c5677 | #ffffff | 7.76:1 | yes | PASS |  |
| Pick the candle, selected | pick: selected candle ring (--focus-ring, 3px) | #2c5677 | #ffffff | 7.76:1 | yes | PASS |  |
| Pick the candle, selected | pick: bullish body border + wick (--data-up) | #0e9f6e | #ffffff | 3.39:1 | yes | PASS |  |
| Pick the candle, selected | pick: bearish body + wick (--data-down) | #dc2626 | #ffffff | 4.83:1 | yes | PASS |  |
| Pick the candle, selected | pick: unchanged (doji) body (--ink-2) | - | - | - | - | not present in this state | |
| Pick the candle, selected | pick: volume bar (--data-volume) | #b3bcc4 | #ffffff | 1.93:1 | no | n/a (not required) | Fill only; the bar's boundary is the 5.06:1 outline. |
| Pick the candle, selected | pick: volume bar outline | #5b7186 | #ffffff | 5.06:1 | yes | PASS |  |
| Pick the candle, selected | pick: gridline (--data-grid) | #edeae3 | #ffffff | 1.20:1 | no | n/a (not required) | Decorative: prices are read from candle positions and the text list; no gridline value is needed to answer. |
| Pick the candle, reveal | pick reveal: correct-candle ring (--brand-strong on --brand-soft) | #0b7b5c | #e7f8f1 | 4.77:1 | yes | PASS |  |
| Pick the candle, reveal | pick reveal: correct-candle surface vs card (--brand-soft) | #e7f8f1 | #ffffff | 1.10:1 | no | n/a (not required) | The 3px --brand-strong ring is the boundary that carries the meaning; the mint fill is decoration. |

