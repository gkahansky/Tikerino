<!-- Snapshot of Google Doc "Tikerino - Animated Explainer Video Pipeline" (Drive), taken 2026-10-03. Condensed: tool-survey table and source URLs omitted. -->

# Tikerino - Animated Explainer Video Pipeline (13 Sep 2026, proposal)

## Requirements (Guy)
Consistent visual style, consistent voice, character continuity across videos; input = a textual lesson, output = short animated explainer; only proven, reliable external tools; cost estimate per video.

## Recommendation: Route A - code-driven pipeline (Remotion + LLM script + locked TTS)
Lesson JSON -> Claude writes narration script + storyboard JSON against fixed scene templates (schema-validated, fail-closed) -> OpenAI Nova voice per beat (timings define the timeline) -> Remotion renders scenes using the app's own design tokens, real chart component and a fixed bull SVG pose library -> captions burned in -> MP4 -> Guy reviews (edits change JSON and re-render, never manual video edits).
Continuity is enforced by code: tokens as the Remotion theme, one locked voice, a fixed pose set, the app's real chart component.

Rejected: Route B (AI video generation - Veo/Kling/Runway/etc.) fails chart accuracy and character continuity; Sora 2 shut down (platform churn risk). Route C (manual template tools - Canva/Vyond) has no lesson-in/video-out path and costs hours per video. HeyGen/Synthesia avatars are a possible marketing-only layer. Vyond is the strongest alternative if the code pipeline is deprioritized.

## Cost
Marginal per video $0.15-0.60 (script $0.10-0.30, TTS $0.02-0.05, render $0-0.30, hosting ~$0.01). Setup 3-7 days, $50-150. Program total for 16 videos $75-220 (~$9/video amortized). Remotion free up to 3-person orgs.

## Risks
Animation vocabulary is limited to the templates built; setup before first video (pilot 1 video first); edits regenerate audio and render; Remotion license boundary beyond 3 people; Nova is a stock voice.

## Open decisions for Guy (at the time)
Where videos live (replace/alongside in-app narration, or marketing-only); pilot first; Nova vs cloned voice; captions on by default.
