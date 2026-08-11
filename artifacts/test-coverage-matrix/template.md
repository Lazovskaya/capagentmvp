# Test coverage matrix — template

One file per process area / decision-log range. Produced by `test-case-design`. Replace
angle-bracket placeholders. Client data stays in `workspace/`; this template holds no client data.

---

# Test coverage matrix — \<process area\>

| Field | Value |
|-------|--------|
| Decision-log Row ID range | \<e.g. FTS-2026-08-04-credit-management-row-01..03\> |
| Process area | |
| Compiled by | |
| Date | |
| Decision-log session status | \<Live / Draft — pending facilitation, cited verbatim from the source decision log — see step 1's note on running against a Draft log\> |

## Coverage

| Row ID | Classification | Technique(s) used | Test Case ID(s) | Status | Caveats | Notes |
|--------|-----------------|--------------------|-----------------|--------|---------|-------|
| | Standard / Delta / Workaround | decision-table / boundary-value / state-transition / scenario-based (more than one is expected when a row genuinely has more than one shape — see the reference file's tie-break test) | `TS-...` | Not run / Passed / Failed / Blocked / Retest | \<a specific provisional/unverified claim, e.g. "seed-only, design-record pending" — separate from Status, per convention §4; leave blank only when there truly is none, not by default\> | |

**Classification** includes `Workaround` for a row fit-to-standard itself hasn't yet resolved to
Standard or Delta — give it a real entry here, don't force-guess which of the other two it "really"
is. Its unresolved status is tracked in "Unresolved classifications" below, not in Gaps.

**Status enum** (same as `test-script-template.md`, explicit reopen path per convention §2):
`Not run` / `Passed` / `Failed` / `Blocked` / `Retest`.

## Gaps

<!-- Zero-coverage rows ONLY. Every Row ID above with zero Test Case IDs lands here, explicitly —
     including a Delta row with no design-record yet (reason: "design-record pending", not left
     off the matrix). An empty table here is a claim that every row has coverage — don't leave it
     empty by omission. A `Workaround` row with real test cases does NOT belong here even though
     its classification is unresolved — see "Unresolved classifications" below; putting it in both
     sections, or in this one instead, makes "Gaps" mean two different things depending on the row. -->

| Row ID | Why it has zero test cases | Owner to close the gap |
|--------|-------------------------------|--------------------------|
| | | |

## Unresolved classifications (not a coverage gap)

<!-- Every `Workaround`-classified row lands here, regardless of how many test cases it has. The
     gap here is that fit-to-standard hasn't resolved the row to Standard or Delta yet — it is
     never a statement about missing test effort. If a Workaround row also happens to have zero
     test cases, it appears in BOTH this section and Gaps, with each section's own distinct reason
     — that's not a duplication, it's two genuinely different open items. -->

| Row ID | Test Case ID(s) (if any) | Why classification is unresolved | Who resolves it |
|--------|----------------------------|-------------------------------------|--------------------|
| | | | |

## Regression cases seeded from defect history

<!-- Per test-case-design step 5 — cases added because of a recurring cause family in
     defect-history-template.md, not because of a decision-log row directly. If nothing in the
     defect-history file touches this process area, say so explicitly here (e.g. "no matching
     cause family — nothing seeded") rather than leaving the table empty with no stated reason;
     an empty table with no explanation reads as "this step was skipped." -->

| Test Case ID | Defect-history cause family | Row ID (if any) it also covers |
|--------------|-------------------------------|-----------------------------------|
| | | |

## Judgment calls made in this run

<!-- Which technique was picked for an ambiguous row and why; any row deliberately deprioritized
     and the risk test applied; any Standard row someone argued didn't need a case, and why it was
     kept or actually dropped. -->
