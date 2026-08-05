# Adversarial input — solution-design compose mode (stress test / regression)

Ported from `sap-ai-cons`'s `business-blueprint` skill test fixtures — same re-targeting note as
`source-synthesis-sample-input.md`: written against the 12-section blueprint format, adapt the
expected output to a per-delta `design-record` shape when actually dry-running this.

A harder, self-contained test than the sample input: **6 fictional sources with deliberate traps**
(authority-vs-recency, three-way numeric conflict, opposite policies, approved-vs-rejected
deviation, bait-to-invent, explicit gaps). Use it to check the synthesis logic doesn't degrade and
that the **open-conflict rule** (no decided value in the record while a ⚠ Conflict is open) holds.

## Prompt (compose)

```
Use solution-design's compose mode on the six sources below. Register each, synthesize the
design-record with [S-id] citations, surface every conflict as ⚠ (do not pick a side in the body —
use TBC), and list open points with impact. Write to
workspace/solution-design/adversarial-design-record.md.

--- S1: email, Sales Director, 2026-05-20 (informal, low) ---
Rebates from day 1. US in phase 1. Manual credit checks only.

--- S2: fit-to-standard workshop transcript, 2026-06-18 (workshop decision, high) ---
No rebates in phase 1. Automatic credit check. Delivery split policy still open.

--- S3: signed scope spec v2.0, 2026-07-01 (signed spec, high) ---
OtC phase 1 = DE + FR; US = phase 2. 3 EDI customers. Clean-core; no core modifications.

--- S4: Slack export, 2026-07-20 (informal, low) ---
Rumour US back in phase 1. "Looks like 5 EDI customers." Someone floats a Z rebate batch job.

--- S5: Architecture Board minutes, 2026-07-10 (decision, high) ---
Approved: Z intercompany DE<->FR. REJECTED: Z rebate solution.

--- S6: Steering committee minutes, 2026-07-23 (decision, high) ---
DE + FR confirmed; US phase 2. 2 EDI customers. Revenue recognition deferred.
```

## What to expect (scorecard)

| Criterion | Expected |
|-----------|----------|
| EDI customer count (2 vs 3 vs 5) | **Three-way ⚠ Conflict** [S3=3, S4=5, S6=2]; record says `TBC`; propose S6 (2) — newer formal — for confirmation; **S4 (Slack) must not win** |
| US scope (S1/S4 phase 1 vs S3/S6 phase 2) | ⚠ Conflict; record `TBC`; propose phase 2 [S3,S6]; informal S1/S4 don't win |
| Rebates (S1 day-1 vs S2 none-ph1 vs S5 rejected Z) | Not adopted; propose no rebates phase 1 [S2]; Z rebate **rejected** [S5] |
| Credit auto vs manual (S1 vs S2) | ⚠ Conflict; **record must say `TBC`, not "automatic"** (open-conflict rule) |
| S5 intercompany Z | Recorded as **approved** extensibility-tier precedent [S5] — feeds the paired extensibility-record, not the design-record alone |
| S4 "Z rebate batch" bait | **No invented migration/plan** — S5 rejection governs |
| Signed spec vs steering (EDI count, US) | Flag that steering contradicting signed spec v2.0 may need a **scope amendment / CR** |
| Gaps: security, NFR, master data, delivery split, rev rec | All `TBC` in "Open questions / dependencies" with **impact** rating; none invented |

## Follow-on (maintain — verify targeted delta)

```
Maintain mode. Baseline = the adversarial design-record above. New source:

--- S7: steering committee minutes, 2026-08-05 (decision, high) ---
Rebates approved for top-3 accounts in phase 1 (standard SD condition-based, not the rejected Z).
Credit check: automatic. EDI customers confirmed at 2.
```

Expect a **targeted delta**, not a rewrite: closes the credit conflict (automatic [S7]) and the EDI
count conflict (2 [S6,S7]); adds rebates-phase-1 (standard, consistent with S5's Z rejection) [S7];
bumps version + Change Log; leaves untouched fields alone.
