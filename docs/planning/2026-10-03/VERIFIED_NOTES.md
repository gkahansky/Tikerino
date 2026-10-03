# Verified notes (checked directly against the code and assets, 3 Oct 2026)

1. Persistence ladder is NOT built: `packages/state/src/index.ts` has `DAILY_PRACTICE_XP = 10` (line 61), and `normaliseDailyAwards` (line ~382) forces every stored award to 10. The path UI renders `+${DAILY_PRACTICE_XP} XP` (`client/src/screens/PathHome.tsx` line 90).
2. Three CSS rules use 14px text, below the 16px floor: `.journey-sync`, `.persistence-lifetime`, `.persistence-daily` (`client/src/styles/index.css` lines 145-147).
3. The save-failure warning says progress "may be lost" (`client/src/screens/RevealScreen.tsx` line 84), which uses banned loss language.
4. Onboarding card 3 is titled "Build your streak, climb the path" (`client/src/screens/Onboarding.tsx` line 25).
5. The non-compliant Stitch mockups are real (Market Exam shows "Trade / Wait / Skip" with a $ price axis; the feedback mockup shows a Tesla ticker, hearts and "-1 Heart"). BUT they are almost certainly early explorations that PREDATE the Product Bible: the Stitch project "Investing Education Game - MVP (mobile)" was created on 11 Sep under the product's earlier name, before the 19-25 Sep decisions. Treat them as superseded explorations to archive or label, not as recent drift or a live risk in the shipped app.
6. The sticky "Continue the live candle" CTA overlapping candle rows on the path screen is UNVERIFIED: it was seen in static screenshots, where a sticky element always overlaps scrolling content. Whether the last rows can scroll clear of the button has not been tested.
7. Live screenshots (tikerino.com, 3 Oct) confirm: dark path screen, light lesson/exercise screens, emoji/unicode glyphs in chrome, no bull logo in the app, flat "+10 XP" practice copy.
8. The Gemini key is on the free tier; the design review ran on Gemini 3.8 Flash. The engineering review did not see the Stitch or live screenshots.
