# **Tikerino \- Animated Explainer Video Pipeline**

*Design \+ cost estimate. Drafted 2026-09-13. Status: proposal, awaiting Guy's decisions (section 7).*

## **1\. Purpose and requirements**

Guy wants Tikerino lessons delivered as short animated explainer videos. His stated requirements:

> 1. Consistent visual style across all videos.  
> 2. Consistent voiceover voice across all videos.  
> 3. Character / liveliness continuity from video to video.  
> 4. Input \= a textual Tikerino lesson; output \= a short animated explainer.  
> 5. External tools only if genuinely proven effective and reliable \- no experimental or unproven tooling (Guy, 2026-09-13).  
> 6. Cost estimate must include the average production cost per video.

## **2\. What exists today (grounding)**

> * **Lessons:** 9 lessons live in content pack v0.2 (topic: trading fundamentals \+ start of candlesticks); the architecture doc plans narration for **all 16 lessons**. Working assumption for this doc: **16 videos**.  
> * **Lesson size:** estimatedMinutes \= 2 per lesson; a lesson is a principle card (\~60-80 words) plus a guided example (3-6 short steps). Lesson 1's live narration is \~32 seconds of audio. Expect **45-90 seconds per finished video**, some up to \~2 minutes.  
> * **Voice already locked:** the in-app narrated lessons use **OpenAI TTS, voice "Nova"**, on Guy's own API key, at roughly \$0.03 per lesson of audio. Nova is the voice Tikerino users already hear.  
> * **Design system of record exists:** design tokens v1 (green palette, typography), and the bull mascot \- Guy's own drawing, vector-traced, with a master SVG and PNG set.  
> * **The app is React.** Its candlestick chart component can render identically inside a code-driven video pipeline.  
> * **Build split stays as agreed:** Claude Code owns repo/code, Instinct owns content, design, docs and deploys.

## **3\. Route evaluation**

Three realistic end-to-end routes, each scored against Guy's requirements and his proven-and-reliable constraint.

### **Route A \- Code-driven animation pipeline (Remotion \+ LLM script \+ locked TTS). RECOMMENDED**

Lesson JSON goes in; an LLM writes a narration script and a storyboard JSON against a fixed set of scene templates; OpenAI Nova renders the voice; Remotion (React-based programmatic video) renders the scenes to MP4 using the app's own design tokens, chart component, and a fixed bull pose library.

> * **Style continuity:** enforced by code \- design tokens as the Remotion theme. No generation step can drift.  
> * **Voice continuity:** one locked stock voice (Nova), the same voice already live in the app.  
> * **Character continuity:** the bull exists as a fixed SVG pose set (5-8 poses: idle, point, think, celebrate...), animated by code (blinks, bounces). The character is never re-generated, so it can never change.  
> * **Chart accuracy:** the app's real chart component renders in-video \- the video chart is pixel-identical to what users practise on.  
> * **Reliability:** Remotion is a mature, widely used production library; OpenAI TTS and Claude already run Tikerino in production. Every step is deterministic except the script draft, which a schema validation gate (fail-closed, same discipline as the TradeSim parser) keeps inside the template vocabulary.

### **Route B \- AI video generation (Runway / HeyGen class). Rejected**

> * **Continuity fails:** generative video cannot hold a character, palette, or exact chart shape across 16 videos; every clip is a fresh roll. This directly violates requirements 1 and 3\.  
> * **Educational accuracy fails:** candlestick charts must be exact. AI video cannot be trusted to render a specific series of candles without distortion.  
> * **Reliability constraint fails:** this is exactly the category Guy excluded \- impressive demos, unproven for repeatable branded production.  
> * **Cost:** Runway's \$12-15/mo plan covers \~52 seconds of Gen-4.5 video \- one 2-minute explainer would burn roughly \$14+ in generation credits, before fixing bad takes. HeyGen avatar plans run \$29/mo for \~30 avatar-minutes (\~\$1/min), but an avatar talking head is the wrong format for chart teaching.

### **Route C \- Manual template tools (Canva / Animaker class). Rejected**

> * Breaks the core requirement: there is no lesson-text-in, video-out path. Each video is 1-3 hours of manual assembly \- 16-48 hours across the catalog, and every content edit costs the same again.  
> * Style consistency depends on a human's discipline, not on the system.  
> * Subscription cost itself is small (Canva Pro \~\$13/mo); the cost is time and inconsistency.

### **Comparison**

|  | A: Code pipeline (Remotion) | B: AI video gen | C: Manual templates |
| :---- | :---- | :---- | :---- |
| Style / character continuity | Enforced by code, zero drift | Drifts every clip | Human discipline only |
| Chart accuracy | App's own chart component | Cannot be trusted | Manual rebuild |
| Lesson text as input | Yes, automated | Partial (prompt only) | No |
| Proven \+ reliable | Yes \- all components in production use today | No | Yes, but manual |
| Marginal cost / video | \$0.15-0.60 | \$1-15+ | \~\$0 \+ 1-3 h labor |
| Setup cost | 3-7 days one-time build | None | None |

Manim was considered inside Route A and set aside: it is a math-lecture animation engine with its own visual idiom, Python-based, and cannot reuse Tikerino's React components. Remotion reuses the app's code, which is where the continuity guarantee comes from.

## **4\. Recommended pipeline (Route A) \- design**

### **4.1 Per-video workflow**

> 1. **Input:** the lesson JSON that already exists (principle card \+ guided steps \+ chart seeds).  
> 2. **Script \+ storyboard (Claude):** generates a narration script (\~60-90 words per scene) and a storyboard JSON: for each beat, which scene template, which chart seed, which bull pose, on-screen text. Output must validate against a storyboard schema; invalid output is rejected and regenerated (fail-closed).  
> 3. **Voice (OpenAI TTS, Nova):** one audio segment per beat; segment timings define the video timeline.  
> 4. **Render (Remotion):** fixed scene templates \- title card, chart draw-in, candle spotlight, mascot reaction, recap card \- rendered at 1080p with the design-token theme.  
> 5. **Assembly:** audio muxed, captions burned in from the script's word timings, MP4 out.  
> 6. **Review gate:** Guy watches the cut. An edit \= change script/storyboard JSON and re-render steps 3-5 \- never a manual video edit.

### **4.2 Who does what**

> * Instinct: lesson content, script prompts, storyboard review, cost accounting, deploys.  
> * Claude Code: the Remotion project, scene templates, storyboard schema, render script (lives in the Tikerino repo it already owns).  
> * Guy: final watch and approve per video, roughly 5-10 minutes per video.

### **4.3 Continuity mechanisms, summarized**

| What must stay consistent | Mechanism |
| :---- | :---- |
| Visual style | Design tokens v1 as the Remotion theme \- same source as the app |
| Voice | OpenAI Nova, one locked stock voice, already live in-app |
| Character | Fixed bull SVG pose library (Guy's drawing), code-animated only |
| Charts | App's React chart component rendered inside the video |
| Structure | Storyboard schema \+ scene template vocabulary, fail-closed validation |

## **5\. Cost estimate**

FX: 1 USD \= 3.03 ILS (Google Finance, Sep 2026).

### **5.1 Marginal cost per video (after setup)**

| Item | USD | ILS | Basis |
| :---- | :---- | :---- | :---- |
| Script \+ storyboard (Claude API) | \$0.10-0.30 | ₪0.30-0.90 | A few thousand tokens in/out per video (estimate) |
| Voiceover (OpenAI TTS, Nova) | \$0.02-0.05 | ₪0.06-0.15 | \$15 per 1M characters; 45-90s narration is 700-1,800 chars; matches the \~\$0.03/lesson already observed in production |
| Rendering | \$0-0.30 | ₪0-0.90 | Free on a local dev machine; optional cloud render (Remotion Lambda) estimated at dimes per 2-min 1080p video |
| Hosting/storage | \~\$0.01 | \~₪0.03 | Cents per month for 16 short MP4s |
| **Total marginal per video** | **\$0.15-0.60** | **₪0.45-1.80** |  |

Guy's review time: 5-10 minutes per video, not a dollar cost.

### **5.2 One-time setup**

> * Remotion project, 5-8 scene templates, bull pose library, storyboard schema, render pipeline: **3-7 focused days** of Instinct \+ Claude Code work. Estimated API spend \$50-150 (₪150-450). The architecture doc's earlier estimate for a Remotion pipeline was "\~a week" \- consistent.  
> * Licenses: **\$0**. Remotion is free for individuals and organizations up to 3 people; OpenAI TTS and Claude are usage-billed, no subscription.

### **5.3 Program total \- all 16 videos**

|  | USD | ILS |
| :---- | :---- | :---- |
| One-time setup | \$50-150 | ₪150-450 |
| 16 videos x marginal | \$3-10 | ₪9-30 |
| Revision reserve (2-3 re-renders on early videos while templates settle) | \$20-60 | ₪60-180 |
| **Program total** | **\$75-220 (midpoint \~\$150)** | **₪230-670 (midpoint \~₪450)** |

### **5.4 Average production cost per video (setup amortized over 16\)**

**\$5-14 per video (₪15-42), midpoint \~\$9 (\~₪27)** \- program total divided by 16\. If the catalog later grows (32+ videos), the average falls toward the marginal cost, under \$2 per video.  
Optional upgrade path, not in the baseline: a cloned voice via ElevenLabs (Creator \$11/mo, first month half price) if Nova's stock voice ever feels too generic. Not recommended now \- Nova is already the product's voice.

## **6\. Honest downsides and risks**

> 1. **Animation vocabulary is what we build.** The pipeline produces template-based motion \- draw-ins, spotlights, mascot reactions, captions. It will not produce free-form cinematic animation; anything outside the template vocabulary means new template work, not a re-roll.  
> 2. **Setup before first video.** Nothing ships until the \~week of build lands. A 1-video pilot is the right first milestone.  
> 3. **Edits regenerate.** Changing lesson text means re-voicing and re-rendering that video (\~\$0.15-0.60 each). Already accepted for in-app narration; fine at 16 lessons, real friction at 200\.  
> 4. **Remotion license boundary.** Free up to a 3-person organization; a larger company using it commercially needs a paid company license.  
> 5. **Nova is a stock voice.** Other products can sound identical. The fix exists (voice cloning) at \$11/mo whenever it matters.  
> 6. **Where AI video still breaks, and why it stays out:** character persistence across shots, exact text and chart rendering, and repeatable branded output. If any of those get solved later, Route B can be revisited for marketing teasers \- not for lesson content.

## **7\. Open decisions for Guy**

> 1. **Where the videos live:** replace the in-app narrated walkthrough, sit alongside it, or marketing-only MP4s (YouTube/social)? Default assumption: in-app first, same render doubles as the marketing asset.  
> 2. **Pilot first?** Recommend: build the pipeline, render lesson 1, Guy approves the format, then batch the remaining 15\.  
> 3. **Voice:** keep Nova (baseline) or clone a voice (+\$11/mo)?  
> 4. **Captions:** burned-in subtitles default on (recommended \- sound-off viewing)?

## **8\. Sources**

> * Remotion free-license eligibility (individuals / orgs up to 3 people): https\://www\.remotion.dev/docs/license/faq  
> * OpenAI TTS pricing (\$15 per 1M characters): https\://developers.openai.com/api/docs/models/tts-1 and https\://texttolab.com/blog/openai-tts-pricing  
> * Runway pricing (\$12-15/mo, 625 credits, \~52s Gen-4.5): https\://runway.com/pricing  
> * HeyGen pricing (Free / \$29 / \$49 plans, credit-based): https\://www\.heygen.com/en-gb/faq and https\://toolproven.com/blog/heygen-pricing  
> * ElevenLabs pricing (Creator \$11/mo): https\://elevenlabs.io/pricing/api  
> * USD/ILS 3.03: https\://www\.google.com/finance/quote/USD-ILS  
> * Internal: Tikerino Architecture doc (16-lesson plan, narrated-lessons section), content pack v0.2 (9 lessons, 2-min lessons), tikerino-narrated-lessons decision (Nova, \~\$0.03/lesson).

## **9\. Addendum (2026-09-13): AI video tool survey, answering Guy's challenge**

Guy's pushback: there are tools purpose-built for text-in, explainer-out. Fresh survey of what is actually shipped and current in September 2026, each tool checked against his exact requirements: lesson text as input, short animated explainer out, style consistency across a series, voiceover continuity, character continuity, proven reliability, per-video cost.  
Verdict up front: Guy is right that the category exists and matured \- Vyond, HeyGen and Synthesia are proven products, and generative models improved a lot. Route A still stands for lesson videos, because two requirements remain uncovered by every surveyed tool: the charts in the video must be Tikerino's exact synthetic charts, and the character must be Guy's bull in Tikerino's design system. The survey changes one thing: a proven avatar layer now exists as an optional marketing add-on (section 9.3).  
Survey summary table:

| Tool | Status (Sep 2026\) | Cost basis | Verdict vs Guy's requirements |
| :---- | :---- | :---- | :---- |
| Sora 2 (OpenAI) | Discontinued: app closed Apr 2026, API closes Sep 24, 2026 | n/a | Out; platform-churn evidence |
| Veo 3.1 (Google) | Live; top cinematic quality, native audio | \~\$0.10-0.25 per finished second after retakes | Fails exact charts and persistent branded character |
| Kling 3.0 (Kuaishou) | Live; best character consistency in the clip class | Cheapest per clip in class | Same chart/character limits; 5-10s clips need stitching |
| Higgsfield | Live; multi-model workspace, strongest consistency claims | Free tier, then \$19-129/mo, credit-metered | Same class limits; inherits engine churn (Sora 2 shutdown) |
| Runway Gen-4.5 | Live | \$12-15/mo for \~52s of Gen-4.5 | Same class limits |
| Pika / Luma / Hailuo | Live | Credit-based, similar | Same class limits |
| HeyGen | Live; proven for marketing and training | \$29/mo; \~\$1 per avatar-minute (Avatar IV/V) | Consistent avatar and voice; wrong format for chart lessons; optional marketing host layer |
| Synthesia | Live; enterprise training standard | \$29/mo for 10 finished minutes | Same as HeyGen |
| Vyond | Live; purpose-built animated explainers | \$58-99/mo | Strongest alternative; fails brand, real charts, lesson-JSON automation; manual Studio time |
| Animaker / Steve.ai | Live | \~\$10-30/mo | Same category as Vyond, less proven |
| invideo AI / Pictory / Fliki | Live; script-to-video | \~\$20-25/mo | Stock-footage output; no character, no real charts |

### **9.1 Generative clip models (Veo, Sora, Kling, Runway, Pika, Luma, Hailuo)**

These are clip generators, not explainer pipelines: 5-25 second clips, no lesson structure, no persistent branded character guarantee, and no reliable rendering of exact charts or on-screen text. Sora 2 is the cautionary data point: OpenAI shut the app in April 2026 and the API closes September 24, 2026 \- platform churn is a real risk in this class. Kling 3.0 currently leads the class on character consistency; Veo 3.1 leads on cinematic quality with native audio. Neither solves chart fidelity. Finished footage costs roughly \$0.10-0.25 per second after retakes, so a 60-90 second explainer runs about \$6-22 in generation alone, delivered as stitched clips with drift between them. Rejected for lessons; revisit only for marketing teasers. Higgsfield, added to the survey at Guy's request, is the strongest character-consistency offer in this class: a multi-model workspace (Veo 3.1, Kling 3.0, Seedance 2.0 and others behind one login, free tier then \$19-129/mo, credit-metered) with 70+ camera presets and voice cloning. It is still a clip generator at heart: no lesson structure, no exact charts, per-credit output costs, and it inherits engine churn \- one of its headline engines, Sora 2, is being shut down this month.

### **9.2 Avatar presenters (HeyGen, Synthesia)**

Both proven and reliable for their format: a consistent stock-human avatar with consistent voice, \$29/mo entry (HeyGen Creator 600 credits, \~\$1 per minute on Avatar IV/V; Synthesia Starter 10 finished minutes/mo). The format is a talking human over slides \- wrong for teaching chart reading, and the presenter is a stock person, not Tikerino's brand.

### **9.3 What the survey changes**

1\. Route A (Remotion code pipeline) stands for lesson videos \- unchanged, now evidenced per tool.  
2\. New optional layer: if Guy wants a human host for marketing clips, HeyGen or Synthesia at \$29/mo is a proven way to add it. Marketing only, not lesson content.  
3\. Vyond is recorded as the strongest credible alternative if the code pipeline ever gets deprioritized: consistent characters and styles are its core product, but charts would be manual rebuilds, the look is generic-corporate rather than Tikerino, and lesson-JSON automation would still need custom work on top of \$58-99/mo plus 1-2 hours of Studio time per video.

### **9.4 Sources for this survey**

Comparisons current to Aug-Sep 2026: ugccopilot.ai/blog/sora-vs-veo-vs-kling-comparison-2026, frameliq.com/blog/kling-vs-veo-vs-sora, versely.studio/blog/sora-2-vs-veo-3-1-vs-kling-3-comparison-2026 (Sora 2 shutdown dates), usekineo.com/vs/heygen-vs-synthesia (credit math), heygen.com and synthesia.io pricing, vyond.com/plans and knowlify.com/articles/vyond-pricing, pictory.ai/pricing, fliki.ai/pricing, softhunterpro.com/invideo-vs-fliki-vs-pictory.  
