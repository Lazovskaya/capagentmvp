# Test script — template

Standard SAP test-cycle script shape (the same structure used across Solution Manager Test Suite /
Focused Build test cases and most client-authored UAT scripts: step-by-step, expected vs. actual,
a status per step). Written fresh — no predecessor-repo file existed to port; grounded in standard
SAP test-management practice, not client-specific content.

**Populated by `../../skills/test-case-design/SKILL.md`** — that skill derives which test cases to
write (technique, positive/negative/boundary set) and produces the `test-coverage-matrix` this
template's cases are tracked against; this file is the per-case output shape it writes to.

## Why this exists in `knowledge/testing/`, not `artifacts/`

`artifacts/` holds phase-handoff templates produced once per decision/record. A test script is
produced **many times per cycle** (one per scenario) and is closer to a working knowledge asset a
project reuses and extends test-cycle over test-cycle — hence it lives here as a knowledge default,
not as a numbered artifact.

## Traceability — the whole point of writing this down at all

Every test script traces back to the reason the scenario needs testing at all. Cite the source
verbatim (stable-ID convention, `../../docs/skill-design-conventions.md` §1) — never re-describe it:

- **Standard/Delta scope:** the `fit-to-standard` decision-log Row ID (`FTS-<date>-<process>-row-
  NN`).
- **A specific design decision:** the `design-record` ID it came from (Explore-phase Deltas).
- **A regression scenario from a fix:** the `fix-doc-and-regression` file it was instantiated from
  (see that skill's Section 5 — scenarios there should become rows here, not be re-authored).

A test script with no traceability reference is a script nobody can say *why* it exists, or when it
can be retired.

## Header

| Field | Value |
|-------|--------|
| Test case ID | `TS-<process-slug>-<NN>` — stable, assigned once, cited by every execution round |
| Scenario name | |
| Traceability | Row ID / design-record ID / fix-doc reference (see above) |
| Sub-process | domain pack code |
| Depth | smoke / full / negative (same vocabulary as `fix-doc-and-regression`'s regression scenarios) |
| Executor role | functional / SD pricing / SD billing / Basis / etc. — name the specific role, not just "tester" |
| Prerequisite data | master data, config, or a prior step's output this script depends on |

## Script

| Step | Action (tcode/app) | Expected result | Actual result | Status |
|------|---------------------|------------------|----------------|--------|
| 1 | | | | |
| 2 | | | | |

**Status enum:** `Not run` / `Passed` / `Failed` / `Blocked` / `Retest`. `Retest` is the explicit
reopen path (convention §2) for a step that was `Passed` once but must be re-verified after a later
fix touched the same area — don't silently flip a `Passed` step back to `Not run` and lose the
history of when and why it needed a second look.

## Result

| Field | Value |
|-------|--------|
| Overall status | Passed / Failed / Blocked / Retest |
| Defect(s) raised | ticket_id(s), if any — feeds `knowledge/testing/defect-history-template.md` |
| Executed by | named human |
| Execution date | |

## Judgment calls worth stating out loud

- **A script with no traceability reference doesn't get written** — go back and find the Row ID/
  design-record/fix-doc it belongs to first; a scenario that exists "because it seemed worth
  testing" with nothing to point back to is a sign the traceability chain has a gap upstream, not a
  reason to invent a standalone test.
- **Reuse `fix-doc-and-regression`'s scenario table directly** rather than re-authoring — that
  skill already derives depth (smoke/full/negative) and executor from the adjacency walk; this
  template is where that scenario becomes an executable script, not a second design pass.
