# Investing Education Game - Decisions

Updated: 11 September 2026, v0.7

## Current working name

- **Tikerino** (spelled without a `c`) is the provisional working name as of 11 September 2026, 15:22 IDT. It is not locked and may change later.
- `tikerino.com` was available at the time of the decision; domain registration is still pending Guy's separate decision. Availability does not reserve it.
- Retired candidates: Tradisimo!, Tickerino, Bullissimo, and Compundo. Candidate history remains in the architecture change log.

## Locked

- MVP topics: **Trading fundamentals (מושגי יסוד במסחר)** and **Candlestick reading (קריאת נרות)** only.
- MVP chart data: deterministic synthetic generated charts; no third-party market-data license needed for MVP.
- Client stack: MVP is a mobile-first React web PWA. Final product is React Native. Exercise engine, logic, state, localization, analytics, and audit packages are framework-neutral TypeScript and port unchanged; only the screen/navigation/platform layer is rewritten.
- A/B variants are out of MVP. Assignment interfaces and nullable `experimentId`/`variantId` fields stay dormant in the architecture for later activation.
- Post-MVP sequence: friends/family feedback first, then variants, marketing, and more levels.
- Business-model lead: freemium, with basics free and advanced content paid.
- Audience: beginner investor first; absolute beginner later as an expansion track.
- First color experiment pair: original green (`#10B981`) and violet (`#7C3AED`).
- Future experiment dimensions: brand palette, question phrasing, and difficulty. Logo is not an experiment dimension. No variants or phrasing-alternative authoring are needed for MVP.
- MVP language: English only. Hebrew/i18n is deferred; the architecture retains a future Hebrew-readiness checklist.
- Point-in-time and audit integrity remain mandatory for every exercise and experiment.
- Mascot/logo direction must remain non-avian; the working name avoids the `-lingo` suffix.

## Visual proposals for comparison

- Candidate A: Breakout Candle.
- Candidate B: Level Finder.
- Panel notes: Grok preferred Level Finder; Claude suggested a possible third concept, "The Cut".

Guy will pick one logo once. There is no rotating logo or logo A/B test; candidate changes wait for his separate decision.

## Business model directions

- Lead: freemium - basics free, advanced content paid.
- Alternatives: full Duolingo-style subscription; B2B white-label for brokers/banks.
- Business plan and packaging/pricing decisions are pending the panel return.

## Open decisions

- Final product-name lock. Tikerino is provisional and may change. Panel dissent is recorded: Gemini and Claude challenged the name; no rename occurs without Guy's decision.
- Whether to register `tikerino.com`.
- One-time final logo selection between the current candidates; whether to request Claude's proposed "The Cut" as an added candidate.
- Which vendor/license to use if real-ticker data is introduced post-MVP; research must confirm redistribution rights before use.
- Whether to restore the calibration-veto check to MVP.

## Source documents

- Product and architecture v0.6: stored beside this file in the Drive project folder under `Source/`.
- Live page: https://invest-game-design.surge.sh/doc/ (temporarily older than Drive v0.6 until hosting re-authentication is complete).
- Design system: https://invest-game-design.surge.sh/
- Stitch project: https://stitch.withgoogle.com/projects/2752353384096587514


## v0.7 rulings and recorded dissent

- Candlesticks are always green/red, regardless of brand palette. `brand.*` and `data.*` tokens are separate; chart direction also uses hollow/filled non-color encoding for CVD accessibility.
- Friends/family is not an experiment. It is one shared build for UX first impressions and obvious-bug finding, with no assignment, variants, holdout, or experiment gate.
- Palette pair remains original green `#10B981` + violet `#7C3AED` for future brand testing. Claude preferred violet-primary; this is recorded dissent, not a changed lock.
- Experiment assignment is dormant for MVP but the registry/audit contract remains. At most one pedagogy experiment may run later, only after power calculation; 5% global holdout and SRM kill monitoring apply.
- Offline graded answers lock until reconnect; reveal is deferred until server acknowledgement.
- Open architecture questions: within-subject phrasing randomization versus sticky assignment; modular monolith versus separate experiment service.

## 12 September 2026 - build kickoff rulings (approved by Guy)

- **Work split:** Guy's local Claude Code assistant builds the repo and all code. Instinct owns content. (Guy, WhatsApp relay, 12 Sep 2026.)
- **Day-one scope cut (approved):** exercise types are limited to tap/select - `multiple_choice` and `pick_the_candle` only. Drag/line-placement interactions (with their accessible stepper alternative) are deferred to day 2+.
- **Thin-server deviation from v0.7 §8 (approved):** day one runs ONE Fastify server with two endpoints (`GET /api/exercises/:exerciseId/window`, `POST /api/answers`), JSON-file content and JSONL audit storage, instead of the four-service + Postgres + object-storage shape. The locked integrity contract is unchanged: server-side window cutting, no post-T bars in the client, server-side grading, seeded bit-for-bit replay, full audit identity per answer. The service split and Postgres arrive with friends/family hosting.
- **Day-one build deliverables (in the Drive project folder):** `tikerino-content-pack-v0.1.json` (8 lessons, 15 exercises), `tikerino-content-schema-v1.md`, `tikerino-engine-grading-spec-v1.md`, `tikerino-design-tokens-v1.css`, `tikerino-tailwind.config.js`, `tikerino-claude-code-kickoff.md`.
- **Data colors concretized:** bullish `#0E9F6E` / bearish `#DC2626`, hollow vs filled bodies as the non-color encoding. These freeze `data.candle.up` / `data.candle.down` per the 11 Sep 16:14 ruling; they are never retinted by palette changes.
- **Still open (unchanged):** final bull logo selection among the 3 Stitch candidates (build ships with a Tikerino text wordmark placeholder), name lock, domain registration, real-data vendor, calibration veto.

## 12 September 2026 - evening rulings (approved by Guy)

- **Hosting + audit storage:** the app is hosted on Railway (one origin, app + managed Postgres; the v0.7 service split stays deferred). The audit log moved from JSONL to managed Postgres at Guy's call: "the right solution from day one." JSONL remains the local-dev and test backend.
- **Walkthrough vs legal:** onboarding explains what the app DOES; the no-advice and generated-data disclaimers live in client-side Terms of use and Privacy policy (linked from the profile). The small "generated practice data" caption chips inside lessons/exercises were REMOVED later the same evening (Guy, 21:47 IDT: covered by the Terms page, not worth the screen real estate); the reveal-screen disclaimer paragraph was REMOVED minutes later on the same call (Guy, 21:48 IDT: 'Take it down as well') - ALL legal/disclaimer text now lives only in Terms of use and Privacy policy.
- **Narrated animated lessons:** the LESSON phase (principle card + guided example) becomes a narrated animated walkthrough - the chart draws candle by candle while pre-generated TTS audio explains what to look at, in-app, no video files. The exercise/quiz loop is explicitly untouched. Phased: pilot on lesson 1 -> all 16 lessons -> optional Remotion MP4 pipeline only if shareable video is wanted. Voice locked by Guy 12 Sep 21:52 IDT: **Nova** (OpenAI stock TTS voice, gpt-4o-mini-tts, generated with Guy's own API key). Licensing: OpenAI business terms 4.1 - the customer owns all Output and OpenAI assigns its rights; API output is commercial-use clean and carries an IP indemnity. Caveat recorded: ownership covers OpenAI's rights only; cloning a real person's voice would need written consent, and that is not what was done. Lesson-0 audio generated the same evening (intro + 3 steps, mp3) and precached by the service worker.
- **Lesson mode is a user preference (Guy: "audio is not always an option"):** text vs narrated is stored in on-device profile state (default NARRATED since 22:16 IDT - Guy: 'Narration should be default'; users who never picked a mode get narration, an explicit pick always wins), settable on the profile screen and switchable mid-lesson both ways, landing on the equivalent position (principle card <-> intro; step k <-> segment k+1).
- **Standing rule (Guy, permanent):** every app change ships with its spec-documentation update in the same pass - the "Tikerino Architecture" Google Doc (Drive folder "Investing Education Game") plus in-repo docs where relevant.
- **Domain:** `tikerino.com` registered at Porkbun (12 Sep, paid through 2027-09-12, auto-renew on). This closes the "whether to register" open decision above.
- **Brand locked:** Guy's hand-drawn bull (horns up, horseshoe nose-ring) is the logo, vector-traced; fills snapped to brand hexes. This closes the logo-selection open decision.

## 13 September 2026 - narration sprite ruling

- **Narration audio ships as ONE sprite per lesson, not per-segment files.** Guy's live report 13 Sep 15:56 IDT (from his device): "only the first is video, the rest is text and no narration." Investigation: production chains all 4 segments with real playback in Chromium (instrumented probe, every play() resolved), so standard engines are unaffected; the failure shape matches iOS Safari blocking play() after a src swap outside a user gesture (WebKit treats each new src as a new media load requiring a gesture; the intro was blessed by the entry tap, later segments were not). Fix: `walkthrough.mp3` per lesson (segments back to back, sample-accurate concat), the player SEEKS between ffprobe-measured offsets on the one gesture-blessed element - seeking is safe everywhere. Regeneration: `scripts/build-audio-sprite.mjs`; a vitest cross-checks the generated offsets against the real mp3s. Also hardened in the same pass: the intro chart draw no longer waits on audio metadata (measured durations drive it, so a stalled media pipeline can never freeze the lesson), a stall guard keeps the silent estimated-timing fallback, and the service worker answers Range requests for audio (iOS media loader). Ambiguity recorded: Guy's report also admits a scope reading (only lesson 1 is narrated - true by pilot design); if Guy confirms that reading, this fix still stands as iOS hardening. Deploy gated on Guy's word, as usual.
