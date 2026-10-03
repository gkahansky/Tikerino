<!-- Snapshot of Google Doc "Tikerino Design Spec - Tokens v2, Motion, Annotations (DRAFT v0.1)" (Drive), taken 2026-10-03. -->

# Tikerino Design Spec - Tokens v2, Motion, and Chart Annotation Language (DRAFT v0.1)
**Status:** Draft for Guy review, 19 Sep 2026. Not yet handed to Engineering. **Builds on:** specs/tikerino-design-tokens-v1.css (frozen data colours, WCAG pairings, type scale). Nothing in v1 changes; v2 only extends.

## Part 1 - Design tokens v2 (extensions)
### State colours
- --state-locked: #9AA7B0 - decorative only; lock labels always carry real text ("Finish the lesson before this one to unlock").
- --state-current: var(--brand) - the next available lesson/node.
- --state-done: var(--brand-ink) - always paired with a check icon.
- --state-error-soft: #FDECEC - error surfaces; error text uses --data-down (AA on paper per v1).
- --state-success-soft: var(--brand-soft).
Rule: data colours stay inside the chart canvas with frozen meaning; state colours never appear inside the canvas.

### Caption band and video frame
- --caption-band-bg: #0F2B46 at 92% opacity, or #FFFFFF surface with --line top border in-app. Captions 16-18px body font; both pairings pass AA.
- --caption-band-height: 64px fixed; two lines max at 16px; never overlaps the chart canvas.
- --title-strip-height: 56px - lesson title always on its own fully visible line above the chart.
- --chart-safe-inset: 12px - no label, caption or control enters this inset.
- Z-order: chart canvas (0) < annotation layer (1) < caption band (2) < title strip (2) < controls (3).

### Iconography tokens
Icon grid 24px, stroke 2px, rounded caps; sizes 20/24/32. Icons replace all emoji in app chrome (lock, play, check, streak flame, crown, XP diamond).

## Part 2 - Motion spec
Principles: celebrate progress; spring reveals; haptic tick on correct; confetti reserved for exam passes. Motion teaches - it never decorates for its own sake.

Durations/easings: --dur-instant 0ms (reduced motion); --dur-fast 120ms (controls); --dur-base 200ms (reveals, = v1 --motion-reveal); --dur-slow 350ms (screen transitions, path progression); --ease-standard cubic-bezier(0.2,0,0,1); --ease-spring cubic-bezier(0.34,1.56,0.64,1) (success reveals/XP counts, subtle overshoot).

Choreography (each with reduced-motion mapping):
1. Chart draw-on (narrated): candles left to right, one per beat, 250-400ms each, synced to the naming segment. RM: chart complete; static spotlight.
2. Spotlight: annotation fades in 150ms after its candle; one 2px pulse (not looping). RM: appear without pulse.
3. Reveal (post-cut): cut line holds 400ms, post-cut candles draw at --dur-base, feedback card slides up --dur-base. RM: full chart at once, no slide.
4. XP count-up: max 600ms ease-out; "+12 XP" chip uses --ease-spring. RM: final values immediately.
5. Correct tick: haptic + check icon draw 200ms. RM: static icon, no haptic.
6. Celebration: lesson complete = single confetti burst, max 1200ms, < 20 particles, never inside the chart. Exam pass is the only full-screen celebration. RM: static "Lesson complete".
7. Screen transitions: forward slides up 8px + fades at --dur-slow; back reverses. RM: crossfade only.
Global: any animation > 400ms is interruptible (tap skips to end). Nothing auto-plays on path or progress screens.

## Part 3 - Chart annotation language
One focused annotation per teaching beat. Annotations draw from ink/brand only. Each ships with shape rule, non-colour cue, label placement and a screen-reader sentence pattern.

| Annotation | Shape | Colour | Non-colour cue | Label |
|---|---|---|---|---|
| Candle spotlight | Dashed rounded rect around candle + volume bar | --ink 70% | dashed outline | Below band, names candle index |
| Candle range | Dashed rect spanning first-last candle | --ink 70% | dashed + end ticks | Above range, left |
| Price zone | Horizontal band, full width | --brand 12% fill, --brand-ink 1px edges | horizontal hatching | Right edge, outside plot |
| Trendline | 2px diagonal through anchors | --brand-ink | long-dash + arrowhead | At line end |
| Volume highlight | Bars darken to --ink 45% | neutral | bar pattern change | "Volume" tag left of panel |
| Moving average | 2.5px smooth line | --ink 80% | dotted pattern | Legend chip top-left |
| Indicator panel | Fixed-height strip below volume | --surface bg, --line border | separator + label | Title in strip header |

Rules: max one annotation family per beat (two only when one is the persistent cut line). Labels sit outside the plot area or in the caption band, never over candles. The cut line is the only persistent annotation: dashed vertical --ink 60% with a "cut" tag. Annotations must survive a 390px-wide render with the safe inset; denser content splits into two beats.

## Open questions
- Caption-band dark-ink default vs surface variant for in-app narration.
- Icon set route: drawn set vs an OFL set (Phosphor/Iconoir) adapted to brand.
- Whether the MA legend chip counts as chrome (current call: chrome, outside plot area).
