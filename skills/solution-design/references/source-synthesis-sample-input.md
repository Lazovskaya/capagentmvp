# Sample input — solution-design compose mode (copy-paste to test)

Ported from `sap-ai-cons`'s `business-blueprint` skill test fixtures. Written against the full
Business Blueprint reference format (12 sections) — a future dry-run of `solution-design`'s
compose/maintain mode should re-target the "what to expect" section to a per-delta `design-record`
shape instead, since this skill's target document is one design record per delta, not a whole
blueprint. The synthesis mechanics being tested (provenance, conflict, gap handling) transfer as-is;
only the output shape needs adapting.

A self-contained, zero-client-data test. The three fictional sources below are deliberately
designed to exercise the hard parts: **provenance**, a **conflict** (S1 vs S3 on company codes),
authority/recency weighting, and a **gap** (nothing on integrations → must become `TBC`).

## Prompt (compose)

```
Use solution-design's compose mode on the three sources below for the <delta / process area> named
in the fit-to-standard decision log. Register each source, synthesize the design-record against its
template with [S-id] citations, surface any conflicts, and list open points. Write to
workspace/solution-design/<delta>-design-record.md.

--- S1: email, 2026-06-10, from Finance Lead (informal) ---
Subject: FI scope. We'll run 3 company codes (DE, FR, US). Group currency EUR. New Asset Accounting.

--- S2: fit-to-standard workshop transcript, 2026-06-25 (workshop decision, high reliability) ---
Decision: adopt Universal Journal standard. OtC pricing stays list-price based; no rebates in phase 1.
Open: revenue recognition approach not decided.

--- S3: signed scope spec v1.0, 2026-07-15 (signed spec, high reliability) ---
Enterprise structure: FOUR company codes — DE, FR, US and ES (Spain added after acquisition).
Finance on New Asset Accounting and Universal Journal. Reporting via embedded analytics.
```

## What to expect

- **Source Register** with S1 (email/low), S2 (workshop/high), S3 (signed spec/high).
- **Company codes → ⚠ Conflict:** S1 says 3 (DE/FR/US), S3 says 4 (adds ES). Proposed resolution:
  **4**, because S3 is newer **and** higher authority — but flagged for confirmation, S1 not deleted.
- Universal Journal / New Asset Accounting stated with `[S1,S3]` / `[S2,S3]` citations.
- Pricing (list-price, no phase-1 rebates) cited `[S2]`.
- **Open Points:** revenue recognition approach `TBC [S2]`; **integrations/interfaces** `TBC` (no
  source covers them) — both flow into the design-record's "Open questions / dependencies" field.
- No invented content for uncovered areas (test approach, integration points → `TBC`).

## Prompt (maintain — follow-on)

```
Use solution-design's maintain mode. Baseline: the design-record just produced. New source:

--- S4: steering-committee minutes, 2026-07-22 (decision, high reliability) ---
Revenue recognition will use standard RAR. ES company code confirmed. EDI order intake (ORDERS) with
2 key customers in phase 1.
```

Expect a **reviewable delta**: closes the rev-rec open point (RAR `[S4]`), resolves the company-code
conflict (ES confirmed → 4), adds an integration point (EDI ORDERS `[S4]`), bumps the version and
appends the Change Log — without rewriting untouched fields.
