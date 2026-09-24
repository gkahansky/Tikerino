# Accessibility matrix

Generated 2026-09-24T05:19:03.552Z by `tests/a11y/audit.mjs` against http://127.0.0.1:5173 at 390x844. Bar: [RELEASE_BAR.md](RELEASE_BAR.md).

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
| Answer queued offline (`15-offline-queued`) | n/a | PASS | PASS | PASS | PASS | PASS | PASS | PASS | n/a | PASS | UNVERIFIED |
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

