# Tikerino: product-owner decisions (Guy, 3 Oct 2026)

These are binding for every agent. Where they conflict with an older document (Product Bible v0.2, Living Chart spec v1.0, design docs), these win until the documents are updated.

## Process
- **CI (D1):** the Tikerino agent token now has Workflows read/write. Agents change CI only through PRs that Guy merges.
- **Design Tokens v2 (D2):** agents finish the draft (doc 09); Guy signs off before it lands in `specs/`.
- **Legacy exercise score (D3):** remove it from the learner UI (no speed bonus, no "hint costs half"). Keep it in the audit record only. Hints are free.

## Journey: the Exchange Floor (D4)
The agreed journey is the **Exchange Floor**: Stitch project 4394499492415802116, node 8d628d06fa43461bbcb03c3396bf9c80 (daylit trading hall, emerald path through walk-through installations to the ceremonial bell), with the v6b on-object-path UI overlay. It REPLACES the "lessons are candles" journey in Product Bible §2 and Living Chart spec §6 as the journey screen. Adjustments, all approved:
1. Progression mechanics stay (Knowledge Index, XP values, persistence ladder, no-loss rules). The learner's Knowledge Index chart is shown on the hall's big video wall / HUD, so the Living Chart lives on as the progress display, not as the map.
2. Structure: one hall per module; lessons are stations (installations); review gates are the barriers between stations; the module exam is the hall's exit gate; the ceremonial bell appears only at the end of the whole course (P16 capstone). Art is a fixed hall layout with swappable installations per module, not a fresh AI illustration per module.
3. Titles never truncate (wrap or shorten to the template budgets).
4. The illustration is decorative; an accessible station list carries the meaning (Living Chart spec §7 order), solid label plates, 48px targets.
5. **Theme: light.** The journey uses the daylit art without a dark tint. (This changes Product Bible §6, which planned dark as primary.)
6. Remove UI for anything not yet implemented (e.g. "Drills", "Personas" tabs). Add later if and when built.
7. Add the HUD (Knowledge Index, practice volume) and the bull at the current station (approved placement).
8. Ship the art as WebP/AVIF, about 150 KB or less, lazy-load later halls.

## Mastery, module exam and Safe Floor (D5): adopt the team recommendation
- **Mastery (+40 XP):** 3 correct answers without a hint, on at least 2 different charts, including at least 1 transfer item; graded on the server. Never revoked; older skills can show "due for review" and feed mixed review. Five levels: not started / seen / practised / proficient (1–2 correct) / mastered.
- **Module exam (+150 XP, once):** unlocks after all lessons in the module; 10 unseen-chart multiple-choice questions, no hints, answers revealed at the end; pass at 8/10. No critical-item rule in MVP. Unlimited retakes, each with new charts; a fail lists the skills to revisit with links to the lessons. Passing is the exit gate that unlocks the next module (hall).
- **Safe Floor:** locks at each mastery and each exam pass, at the current Knowledge Index. Purely visual: it bounds how far the Knowledge Index chart on the video wall may dip during a pullback. XP itself never decreases.

## Still open
- **Google sign-in (D6):** awaiting Guy's answers on the proposed model (optional after lesson 1, merge on first sign-in, events + preferences only, one-tap delete, legal review before launch).
- Bull body variant (D8), public repo / ops board exposure (D9).
