# Investing Education Game

Current project package, 11 September 2026.

## Files
- `source/product-and-architecture-v0.7.html` - full product and architecture specification, including experiment architecture, Hebrew/English localization and RTL, palette decision, and logo candidates.
- `source/design-system.html` - mobile-first design-system companion page.
- `previews/product-and-architecture-v0.6-mobile.png` - verified 390 x 844 mobile render.

## Live links
- Product/architecture page: https://invest-game-design.surge.sh/doc/ (deployment currently awaiting hosting re-authentication; the Drive source is newer than the live page until redeployed).
- Design system: https://invest-game-design.surge.sh/
- Private Stitch project: https://stitch.withgoogle.com/projects/2752353384096587514

## Current decisions
- Working name: Tikerino (provisional, not locked); tikerino.com was available, registration pending.
- Audience: beginner investor first; absolute beginner later.
- First palette experiment pair: original green (#10B981) and violet (#7C3AED).
- Launch languages: Hebrew (full RTL) and English.
- MVP topics: trading fundamentals and candlestick reading.
- MVP uses synthetic charts and a mobile-first React web PWA; final client is React Native, reusing the framework-neutral TypeScript engine/logic/state while rewriting only screens and platform adapters. A/B infrastructure remains dormant until after friends/family feedback.
- Business-model lead: freemium (basics free, advanced content paid).
- Final name lock, domain registration, post-MVP real-data vendor/license, business packaging, and calibration veto remain open.


## v0.7 rulings
- MVP is English only; Hebrew/i18n is deferred with a future-readiness checklist.
- One logo is selected once; logo is not an A/B dimension.
- Candles remain green/red independently of brand palette, with hollow/filled accessibility encoding.
- Friends/family receives one shared build for UX impressions and obvious-bug finding, not an experiment.
- Experiment infrastructure remains dormant but hardened with stable subject assignment, audit identity, power/holdout/SRM controls, offline deferred reveal, sealed difficulty exams, privacy, and accessibility checks.
