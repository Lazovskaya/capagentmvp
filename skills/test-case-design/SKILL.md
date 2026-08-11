---
name: test-case-design
description: Derive executable test scripts from every fit-to-standard decision-log row (Standard and Delta alike), pick the right design technique per row's actual shape, seed regression cases from known defect history, and produce a Row ID-to-test-case traceability matrix. Realize-phase activity that currently has no owner in this factory.
---

# Test Case Design

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Written fresh for this factory — no predecessor-repo content existed to port, and a survey of a
Salesforce sibling framework's `sf-testing`/`sf-init-testing` skills found they only cover
*executing and fixing already-written* Apex tests, with no methodology for *deriving* test cases
from requirements. This skill fills that gap using standard, publicly documented test-design
technique names (decision-table, boundary-value, state-transition, equivalence-partitioning,
scenario-based) rather than inventing a bespoke method — see
`references/test-design-techniques.md`.

## The gap this closes

Before this skill, nothing in this factory produced **executable, traceable test cases**. The
closest neighbors both stop short of it: `backlog-drafting` writes coarse, one-sentence acceptance
criteria on a work item, and only for **Delta** rows (Standard rows never get a design-record, so
`backlog-drafting` never touches them at all). `fix-doc-and-regression` derives regression
*scenarios*, but only reactively, after a defect has already happened. Nobody was producing test
coverage for the Standard rows going into Realize, and nobody was proactively testing the boundary/
decision-table shape of Delta rows beyond one seed sentence.

## When to use

Realize phase, once a process area's `fit-to-standard` decision log is closed (or a meaningful
slice of it is) and, for any Delta rows in scope, `solution-design` has produced the paired
design-record. Before the `realize→deploy` Q-gate — that gate's evidence mapping expects a test-
coverage artifact from this skill (see `gates/realize-deploy.md`).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the fit-to-standard decision log for the process area in scope — every Row ID,
  Standard and Delta alike. Testing only the Deltas is not a partial run of this skill, it's the
  wrong scope; say so and ask for the full range.
- **Required, for Delta rows:** the paired `design-record` (its `target_design` and `test_approach`
  fields — the seed, not the finished plan) and `extensibility-record` (tier — affects execution
  environment/owner).
- **Strongly preferred:** the project's own `../../knowledge/testing/defect-history-template.md`
  copy — known recurring cause families become explicit regression test cases here, not left to
  chance.
- **Optional:** `backlog-drafting`'s work items, if already drafted (their acceptance-criteria text
  is a starting point, same caveat as `test_approach`); domain pack adjacency map, for scenarios that
  should span sub-processes.

## Knowledge this skill orchestrates

- `references/test-design-techniques.md` — the technique-selection method, coverage-vs-code-coverage
  distinction, and prioritization test.
- `../../knowledge/testing/test-script-template.md` — the output shape.
- `../../knowledge/testing/defect-history-template.md` — regression-case seeding.
- **Domain adjacency map** — `../../knowledge/domain-packs/order-to-cash/subprocess-adjacency.md`,
  used forward (which sub-processes a scenario should span) rather than `fix-doc-and-regression`'s
  reactive use of the same file.

## Connectivity (agnostic + graceful degradation)

- Default: file mode — read the decision log/design-records as files, write test scripts and the
  coverage matrix as files.
- If a test-management connector is ever wired for a project, the same content can be pushed there;
  until then, state "⚠ no test-management connector — scripts and coverage matrix are file-only."

## Steps

1. **Confirm the Row ID range in scope** — the full decision-log slice, not a Delta-only subset.
   Refuse a Delta-only ask the same way `backlog-drafting` refuses an ungrounded work item: name the
   Standard rows being skipped and ask whether that's actually intended. **A row can be classified
   `Standard`, `Delta`, or `Workaround` (per `fit-to-standard`'s decision log — a row not yet
   resolved to either)** — a `Workaround` row still gets a coverage-matrix entry, but its
   `classification` is recorded as `Workaround` and its Gaps entry says why (unresolved
   classification, not missing effort). **A Draft/`Session status: Draft — pending facilitation`
   decision log can still be run** — the resulting test cases and matrix are provisional, and every
   test-script header and the matrix's own header must say so explicitly (cite the decision log's
   own session status verbatim), the same discipline `fit-to-standard` itself uses for a session
   that hasn't been signed yet. Don't wait for a Live log to start test design, but don't let the
   output look more final than the log it's derived from.
2. **Pick the design technique(s) per row**, using the shape test in
   `references/test-design-techniques.md` — decision-table / boundary-value / state-transition /
   scenario-based. State which and why in the test case's traceability header; never leave it
   implicit. **A row can genuinely have more than one shape** (e.g. a rule table that also drives a
   release-workflow state machine) — when that happens, use every technique the row's shape
   actually supports rather than picking one and dropping the other's coverage; see the reference
   file's explicit tie-break rule.
3. **For Delta rows:** expand the design-record's `test_approach` sentence into a real
   positive/negative/boundary set — the sentence is a seed, not the test plan. **If the Delta row
   has no paired design-record yet** (`solution-design` hasn't run on it), do not skip the row
   silently and do not block the whole run waiting for it — give it a `test-coverage-matrix` entry
   with `classification: Delta`, empty `test_case_ids`, and a Gaps reason of `design-record pending`.
   Once the design-record exists, a later pass fills the row in; the matrix's job is to make that
   dependency visible, not to hide it by omission.
4. **For Standard rows:** derive scenarios from whatever the decision log actually records for that
   row — the table's own Requirement/Decision/Impact cells when they're filled in, or the session's
   prose "talking points"/notes when the table cells are still placeholders (`—`, `Proposed`). **If
   the log is Draft** (see step 1), say explicitly that these are provisional test cases pending
   decision confirmation — don't treat a Draft log's thin table cells as a reason to invent detail
   the session never actually settled.
5. **Seed regression cases from defect history:** for every recurring cause family in
   `defect-history-template.md` that touches this process area, add an explicit boundary/negative
   case for it — a permanent fix with no test proving it stays fixed is half a fix. **If nothing in
   the defect-history file touches this process area, write that down explicitly** ("no matching
   cause family — nothing seeded") in the matrix's "Regression cases seeded" section — the same
   discipline the matrix template already requires for the Gaps section, applied here too; an empty
   section with no stated reason reads as "this step wasn't done," not "there was nothing to find."
6. **Check the domain adjacency map** for any scenario that should span sub-processes, the same
   method `fix-doc-and-regression` applies reactively, applied here proactively.
7. **Prioritize execution order** using the risk test in `references/test-design-techniques.md` —
   cash/compliance/whole-channel impact, every Delta, and wide-adjacency-fan-out Standard rows go
   first; state the call, don't just rank by feel. **When two or more rows tie on that test** (e.g.
   a Standard row with real cash/compliance exposure ties with a Delta row), break the tie by
   decision-log Row ID's own sequence number — lower row number executes first — rather than leaving
   the order arbitrary.
8. **Assign each test case a stable ID** (`TS-<process-slug>-NN`) and write it using
   `test-script-template.md`, with its Row ID/design-record/fix-doc traceability reference filled in
   — a script with no traceability reference doesn't get written (per that template's own rule).
9. **Produce or update the `test-coverage-matrix`**: Row ID → technique(s) used → Test Case ID(s) →
   status. Any Row ID with zero test cases is an explicit, visible gap here, not a silent omission.
10. **Write** test scripts and the coverage matrix to `workspace/test-case-design/` (gitignored).
    Note anything worth generalizing (a technique that worked well, a defect-history pattern that
    needed a case) for `knowledge-harvest`.

## Output

- One test script per case, per `test-script-template.md`.
- One `test-coverage-matrix` artifact per process/decision-log range — the evidence
  `gates/realize-deploy.md` expects.
- Feeds test execution (status updates land back in the coverage matrix and, on defect, into
  `incident-triage`/`defect-triage`) and `defect-history-template.md` (closing the loop once a
  defect-seeded case actually catches something).

## Judgment calls worth stating out loud

- **A Standard row still needs at least one test case.** "Vendor-tested, therefore untested by us"
  is exactly the gap `defect-pattern-analysis` found this session (a recurring, boundary-shaped
  master-data defect nobody was proactively checking) — see the reference file's judgment call.
- **A design-record's `test_approach` is a seed sentence, not a finished test plan** — expanding it
  is this skill's job; treating it as already-sufficient is a rubber stamp, not test design.
- **A Row ID with zero test cases is a visible gap in the coverage matrix, never a silently-skipped
  row.**
- **Don't force a technique onto a row that doesn't have that shape** — a plain scenario is the
  honest choice when there's no rule table, range, or state machine behind the step.

## Driver

Main driver: test (this factory's closest role to a dedicated test lead; adjust per engagement).
Owner role per factory-data.json: **test**.

## Status

Progress. New skill, written this session — grounded in standard, publicly documented test-design
technique names, not ported from any predecessor repo (none had this content) and not adapted from
the Salesforce sibling framework's `sf-testing` (surveyed, found to be execution/fix-loop only, no
transferable design methodology). Dry-run tested once, against a real Draft-status decision log with
a Delta row missing its design-record and a row not yet resolved to Standard/Delta — fixed the gaps
that walkthrough found (the `Workaround` classification, the missing-design-record path in step 3,
Draft-log handling in steps 1/4, the technique/priority tie-break tests, and the matrix's `Caveats`
field). Not yet real-run tested.
