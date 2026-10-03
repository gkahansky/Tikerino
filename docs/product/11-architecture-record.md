<!-- Snapshot of Google Doc "Tikerino Architecture" (Drive), taken 2026-10-03. Living record dated 12-13 Sep 2026; the repo README and git history may be newer. -->

# TIKERINO ARCHITECTURE (living record, state as of 12-13 Sep 2026)

## 1. What is live
- App on Railway (app service + managed Postgres), custom domain https://tikerino.com (TLS valid; www redirects to apex). Narrated pilot live since 12 Sep.
- Cost: Railway Hobby ~$5/mo. Render rejected (sleeping free services, expiring Postgres); Fly.io rejected (card at signup).

## 2. Deployment shape
- One origin: a single Fastify process serves the built client (client/dist, SPA fallback) and the API.
- Two-endpoint lock: GET /api/exercises/:id/window and POST /api/answers. Readiness check: GET /api/exercises/ex-001/window (no /healthz, deliberately).
- Build: npm ci; build @tikerino/client. Start @tikerino/server with HOST=0.0.0.0 and platform PORT. tsx is a runtime dependency.
- Known gap at the time: two commits existed only in the Railway deploy (Postgres audit log, walkthrough rework); GitHub push permissions were an open question.

## 3. Audit log - managed Postgres
- Table audit_records: id BIGSERIAL PK; subject_id, exercise_id, assignment_snapshot_at (idempotency key, UNIQUE); record JSONB (syntheticSeriesId, scenarioSpecVersion, generatorVersion, curriculumVersion, answer, grading inputs, result).
- Boot rebuilds the in-memory idempotency index from the table; restarts cannot double-count. Inserts awaited before responding; ON CONFLICT DO NOTHING.
- JSONL file backend remains default for local dev and tests; DATABASE_URL selects Postgres.

## 4. Integrity contract
- Deterministic generation (FNV-1a + mulberry32; golden-seed replay pins 30 series).
- Post-cut candles exist only on the server; CI scans every serialized payload for leaks; client gets a sanitised pack (no seeds, no answers).
- Grading is server-side; the client's chart copy is never trusted; offline answers lock and flush idempotently.

## 5. Walkthrough + legal
- Onboarding: 3 cards (read markets one idea at a time; make the call, see the grade; build your streak, climb the path).
- Legal text lives ONLY in Terms of use and Privacy policy (linked from profile). No disclaimer chips on charts; the chart's accessible name still carries the "generated practice data" label for screen readers; e2e asserts this.

## 6. Brand
Guy's hand-drawn bull is the logo (green squircle face, navy horns, white muzzle, Soft Mint tile). Master SVG + PNG set. Growth Green #10B981, Ink Navy #0F2B46, Soft Mint #E7F8F1, Paper #FAFAF7, Sunshine #FFB020. Fonts: Baloo 2 (display), Nunito (body).

## 7. Narrated animated lessons (decided 12 Sep)
- Lesson phase only (principle card + guided example) becomes a narrated walkthrough: the chart draws itself while pre-generated narration explains. Exercise/quiz loop untouched.
- Voice locked: OpenAI "Nova" (gpt-4o-mini-tts), commercial-use clean under OpenAI business terms. ElevenLabs is the fallback.
- Narration doubles the cost of every content edit (edit -> regenerate audio -> resync).
- Constraints: text alternative stays equal; mobile autoplay needs a user gesture; audio precached by the service worker for offline; Hebrew/RTL out of scope.
- Pilot (lesson 1 "Meet the chart"): narration plan derived from the lesson pack (client/src/narration.ts), playback driver (useNarration), drawCount mode on CandleChart. Lesson mode (text vs narrated) is a profile preference, switchable mid-lesson both ways; NARRATED is the default.
- 13 Sep iOS fix: one audio sprite per lesson (walkthrough.mp3), player seeks between ffprobe-measured offsets on one gesture-blessed audio element (iOS blocked play() after src swaps). scripts/build-audio-sprite.mjs; vitest cross-checks offsets. Stall guard + silent fallback; service worker answers Range requests for audio.

## 8. Open (at the time)
Push of deploy commits to GitHub; voice pick then pilot review then go/no-go on all 16 lessons; post-MVP: real-data vendor/license, React Native client, Hebrew/RTL, freemium packaging.
