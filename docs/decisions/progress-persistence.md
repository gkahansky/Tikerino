# Decision memo: how learners keep progress beyond one device

Status: proposal for controller review. Nothing here has been built. No account, auth provider, spend or schema change was made to write it.
Date: 24 Sep 2026. Todo: todo-01M38ZA5MAPCMPKJ4NRGWRY2K0.

Legal points are LEGAL-IL leads for a lawyer to confirm, not conclusions. Any cost or legal claim without a source is marked UNKNOWN.

## Where we are today (from the repo)

- Progress lives only in the browser: localStorage key `tikerino.progress.v1`, keyed by a random `subjectId` (uuid, key `tikerino.subjectId.v1`). Clear the browser or switch phones and it is gone.
- The server's only persistent store is Postgres `audit_answers` (server/src/audit.ts), unique on (subject_id, exercise_id, assignment_snapshot_at). The 18 legacy `audit_records` rows are copied in with `INSERT ... ON CONFLICT DO NOTHING`, so they survive reruns.
- The client already has `mergeProgress`, a union merge used across tabs. It is the natural tool for any restore or migration.
- The privacy page (client/src/screens/LegalScreen.tsx) promises: progress stays on the device, no accounts, the audit record is tied to a random device id. Options (b) and (c) break that promise and need new copy plus a lawyer's read before launch.
- Award rule stays client-derived from server-confirmed answers. None of the options below adds a server award ledger.

## Option (a): device-only plus export / restore code

What it is: a "Save my progress" button produces a code (or file / QR) that encodes the local progress plus the `subjectId`. Pasting it on a new device runs `mergeProgress` into whatever is there.

- Data stored: no new data. Nothing leaves the device except what already goes to `audit_answers`. No email, name or age.
- Minors / guardian path: nothing to collect, so no age gate. A parent can keep the code for the child.
- LEGAL-IL leads: lowest exposure. No identifiable data beyond a random id. Amendment 13 purpose-binding and security duties still apply to the audit record [1][2]. Database registration now mostly applies to data brokers and public bodies [3] - lead only.
- Migration: none needed; today's progress is the starting point. Restoring the same `subjectId` keeps audit continuity. The 18 legacy rows are untouched.
- Restore on a device that already has its own id: the restored `subjectId` becomes primary, and the device's own id stays as a linked secondary, so its audit rows remain reachable. Nothing in `audit_answers` is rewritten.
- Effort: about 1-2 days (encode/decode, UI, tests, copy). Estimate, not measured.
- Running cost: $0 new. No new service.
- Privacy page: still needs one copy line saying the code is the learner's own secret, that anyone holding it can use their progress, and that we cannot recover a lost code.
- Security: the code is a bearer secret. Anyone holding it can load that progress and submit answers under that `subjectId`. Keep it out of URLs and logs. Losing the code still loses progress. Does not unlock admin, notifications or Google auth - it only fixes the "lost my phone" case.

## Option (b): sign-in (passwordless email or Google) with server-synced progress

What it is: a learner signs in; progress is stored server-side against an account and synced to every device.

- Data stored: new account table (email or Google subject id), a link from account to one or more `subjectId`s, and a server copy of progress. That is new personal data and a schema change (not in scope for this memo, would need its own card).
- Minors / guardian path: this is the hard part.
  - Google lets people manage their own account from 13 in countries not on its list; Israel is not listed, so 13 applies [4]. Under-13s need a parent-managed Family Link account [5].
  - Email sign-in has no age check at all. We would need at least a self-declared age and a guardian step for young users.
  - The PPA's June 2026 draft guidance on age assurance says heavy age checks should be used only where there is a legal duty or real risk, keep minimum data, and may trigger a DPO duty [6] - LEGAL-IL lead.
- LEGAL-IL leads:
  - Consent must be informed and can be withdrawn; the PPA's Feb 2026 consent guidance sets a strict bar [2][7].
  - DPO: mandatory for bodies processing sensitive data on a large scale, including many handling minors' data [2]. Whether Tikerino would fall in scope: UNKNOWN, lawyer to confirm.
  - Serious security incidents must be reported to the PPA right away [2].
  - Fines can reach millions of shekels without court proceedings [2][1].
  - Privacy page must be rewritten before launch.
- Migration (zero-loss): on first sign-in, upload local progress and link the device's `subjectId` to the new account; server merges with the same union rule as `mergeProgress`. Never rewrite `subject_id` in `audit_answers` - link, don't move - so the 18 legacy rows and all current rows keep their keys. Multiple devices become multiple linked ids.
- Effort: about 1.5-3 weeks (auth, account table, sync endpoint, conflict tests, guardian flow, copy, legal review). Estimate.
- Running cost:
  - Google / email auth via Firebase or Identity Platform: no charge up to 50K monthly active users on the listed tiers [8][9].
  - Magic-link email via Resend: free up to 3,000 emails/month, 100/day [10]. Above that: UNKNOWN until volume is known.
  - Hosting: Railway plan minimum is $5 (Hobby) or $20 (Pro) as a usage commitment [11]; extra DB and compute from sync: UNKNOWN until measured.
  - Legal review and a possible DPO: UNKNOWN.
- Security: a real account surface to protect (sessions, token storage, account takeover, email spoofing). Stronger than a bearer code for recovery. Brings the incident-reporting duty into play.

## Option (c): hybrid - ship (a) now, add (b) as opt-in later

What it is: ship the export / restore code now. Keep device-first as the default. Later, once the legal questions are answered, offer an optional "sign in to sync" on top, starting with users 13+ via Google.

- Data stored: same as (a) now; same as (b) only for people who opt in later.
- Minors / guardian path: nothing collected in phase 1. Phase 2 age and guardian design waits on the lawyer and the final PPA age-assurance guidance [6].
- LEGAL-IL leads: phase 1 as (a). Phase 2 as (b), but only for opted-in users, which keeps the personal-data footprint smaller.
- Migration: phase 1 codes carry the `subjectId`, so a later sign-in can link every device id the learner restored. Same link-not-move rule; 18 legacy rows untouched.
- Effort: 1-2 days now; (b) effort later.
- Running cost: $0 now; (b) costs later.
- Security: as (a) now; as (b) later.

## Recommendation

Go with (c): ship the export / restore code now, and hold sign-in until a lawyer has looked at the minors, consent and DPO leads.

Why: it fixes the loss problem this week at no cost, needs no schema change and no privacy-page rewrite, and does not close the door on accounts. It does not unlock admin, Google auth, notifications or an award ledger. Those still need (b), so the controller should decide whether that dependency is worth waiting for legal review.

Open decisions for Guy / controller:
1. Approve phase 1 (export / restore code) as a build card.
2. Approve getting a LEGAL-IL review of the sign-in leads above before any phase 2 card.
3. For phase 2: Google only, email only, or both; and the minimum age.

## Sources

[1] https://iapp.org/news/a/israel-marks-a-new-era-in-privacy-law-amendment-13-ushers-in-sweeping-reform
[2] https://dpoisrael.com/en/amendment-13/
[3] https://presencis.com/regulations/il-ppl/article-database-registration/
[4] https://support.google.com/accounts/answer/1350409?hl=en
[5] https://support.google.com/accounts/answer/7103338?hl=en
[6] https://www.pearlcohen.com/israeli-privacy-protection-authority-publishes-draft-guidance-on-age-assurance/
[7] https://www.linklaters.com/insights/data-protected/data-protected---israel
[8] https://firebase.google.com/pricing
[9] https://cloud.google.com/identity-platform/pricing
[10] https://resend.com/pricing
[11] https://docs.railway.com/pricing/understanding-your-bill

Also consulted: https://nblaw.com/news-insights/amendment-13-now-in-force-access-our-practical-guide-and-compliance-self-check, https://www.dataguidance.com/news/israel-ppa-publishes-faqs-obligations-under-amendment, https://resend.com/docs/knowledge-base/account-quotas-and-limits
