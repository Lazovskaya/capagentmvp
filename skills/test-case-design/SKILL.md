---
name: test-case-design
description: Derive executable test scripts from every fit-to-standard decision-log row (Standard and Delta alike), pick the right design technique per row's actual shape, seed regression cases from known defect history, and produce a Row ID-to-test-case traceability matrix. Realize-phase activity that currently has no owner in this factory.
---

# Test Case Design

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

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
- **Strongly preferred:** the project's own `../../../knowledge/testing/defect-history-template.md`
  copy — known recurring cause families become explicit regression test cases here, not left to
  chance.
- **Optional:** `backlog-drafting`'s work items, if already drafted (their acceptance-criteria text
  is a starting point, same caveat as `test_approach`); domain pack adjacency map, for scenarios that
  should span sub-processes.

## Knowledge this skill orchestrates

- `references/test-design-techniques.md` — the technique-selection method, coverage-vs-code-coverage
  distinction, and prioritization test.
- `references/input-quality-check.md` — cheap pass/thin/blocked check on decision-log cells and
  Delta `test_approach` **before** technique selection (adapted from the sdlc-factory
  `qa-case-generator` AC-quality gate; SAP inputs are FTS rows + design-records, not ticket AC alone).
- `references/run-ledger.md` — per-run folder, `meta.json`, append-only `events.jsonl`.
- `../../../knowledge/testing/test-script-template.md` — the output shape.
- `../../../knowledge/testing/defect-history-template.md` — regression-case seeding.
- **Domain adjacency map** — `../../../knowledge/domain-packs/order-to-cash/subprocess-adjacency.md`,
  used forward (which sub-processes a scenario should span) rather than `fix-doc-and-regression`'s
  reactive use of the same file.
- `evals/evals.json` — regression fixtures for Delta-only refuse, thin design-record, and
  review-before-sync. Run or walk through them when changing this skill.

## Run layout

Every run writes under `workspace/test-case-design/<YYYY-MM-DD>-<process-slug>/` (gitignored) —
see `references/run-ledger.md`. Do not dump scripts into a flat folder with no ledger.

## Connectivity (agnostic + graceful degradation)

- Default: file mode — read the decision log/design-records as files, write test scripts and the
  coverage matrix into the run folder.
- **Test-management sync is optional and never automatic.** After the user review gate, ask
  explicitly whether to push. If no connector is wired, record `sync.skipped` and state
  "⚠ no test-management connector — scripts and coverage matrix are file-only."
- If a connector is wired and the user approves, write `sync-receipt.json` in the run folder
  (ids returned, timestamp, who approved). Never invent a successful sync.

## Steps

0. **Open the run ledger** — create the run folder, write initial `meta.json`, append
   `run.started` to `events.jsonl` (`references/run-ledger.md`). If a same-slug folder already
   exists, ask resume vs new `-r2` slug; never silently overwrite.
1. **Confirm the Row ID range in scope** — the full decision-log slice, not a Delta-only subset.
   Refuse a Delta-only ask the same way `backlog-drafting` refuses an ungrounded work item: name the
   Standard rows being skipped and ask whether that's actually intended. Append `scope.confirmed`
   (or halt without writing scripts). **A row can be classified `Standard`, `Delta`, or
   `Workaround` (per `fit-to-standard`'s decision log — a row not yet resolved to either)** —
   design and write test cases for a `Workaround` row exactly as you would any other; its
   unresolved classification is tracked in the matrix's **Unresolved classifications** section,
   never in **Gaps** (Gaps means zero test coverage — a `Workaround` row with real cases is not
   that, and putting it there anyway is a self-contradiction the matrix template used to invite;
   see step 10). **A Draft/`Session status: Draft — pending facilitation` decision log can still
   be run** — the resulting test cases and matrix are provisional, and every test-script header
   and the matrix's own header must say so explicitly (cite the decision log's own session status
   verbatim), the same discipline `fit-to-standard` itself uses for a session that hasn't been
   signed yet. Don't wait for a Live log to start test design, but don't let the output look more
   final than the log it's derived from.
2. **Input quality check** — before picking techniques, run
   `references/input-quality-check.md` across every Row ID in scope. Write `input-quality.md`,
   append `input_quality.completed`. Do not invent measurable outcomes for `blocked` rows; mark
   them for Gaps / deferral. For `thin` Delta rows, ask up to three clarifying questions **or**
   route back to `solution-design` before a full technique pass.
3. **Pick the design technique(s) per row**, using the shape test in
   `references/test-design-techniques.md` — decision-table / boundary-value / state-transition /
   equivalence-partitioning / scenario-based. State which and why in the test case's traceability
   header; never leave it implicit. **A row can genuinely have more than one shape** (e.g. a rule
   table that also drives a release-workflow state machine) — when that happens, use every technique
   the row's shape actually supports, per the reference file's tie-break rule — but that rule is a
   ceiling, not a target: **apply the reference file's anti-padding rule before adding a second or
   third technique.** Name the specific failure each added technique catches that the others don't;
   if you can't, don't add it. A single Standard row collecting three techniques and six cases is
   very likely padding, not coverage — this happened in this factory's own first real run and an
   independent review correctly flagged it.
4. **For Delta rows:** expand the design-record's `test_approach` sentence into a real
   positive/negative/boundary set — the sentence is a seed, not the test plan. **If the Delta row
   has no paired design-record yet** (`solution-design` hasn't run on it), do not skip the row
   silently and do not block the whole run waiting for it — give it a `test-coverage-matrix` entry
   with `classification: Delta`, empty `test_case_ids`, and a **Gaps** reason of
   `design-record pending` — this one genuinely is a Gaps entry (zero coverage), unlike a
   `Workaround` row with cases. Once the design-record exists, a later pass fills the row in; the
   matrix's job is to make that dependency visible, not to hide it by omission.
5. **For Standard rows:** derive scenarios from whatever the decision log actually records for that
   row — the table's own Requirement/Decision/Impact cells when they're filled in, or the session's
   prose "talking points"/notes when the table cells are still placeholders (`—`, `Proposed`). **If
   the log is Draft** (see step 1), say explicitly that these are provisional test cases pending
   decision confirmation — don't treat a Draft log's thin table cells as a reason to invent detail
   the session never actually settled.
6. **Seed regression cases from defect history:** for every recurring cause family in
   `defect-history-template.md` that touches this process area, add an explicit boundary/negative
   case for it — a permanent fix with no test proving it stays fixed is half a fix. **If nothing in
   the defect-history file touches this process area, write that down explicitly** ("no matching
   cause family — nothing seeded") in the matrix's "Regression cases seeded" section — the same
   discipline the matrix template already requires for the Gaps section, applied here too; an empty
   section with no stated reason reads as "this step wasn't done," not "there was nothing to find."
7. **Check the domain adjacency map** for any scenario that should span sub-processes, the same
   method `fix-doc-and-regression` applies reactively, applied here proactively.
8. **Prioritize execution order using the ranked-tier test** in `references/test-design-techniques.md`
   — cash/compliance/whole-channel impact outranks Delta-by-definition, which outranks wide-
   adjacency-fan-out Standard rows, which outranks everything else. This is a ranking, not a binary
   split — don't collapse Tier 1 and Tier 2 into one "execute early" bucket and then decide the order
   between them by row number; a Tier 1 row always executes before a Tier 2 row regardless of Row ID
   number. **Only break a tie by Row ID sequence number within the same tier.**
9. **Assign each test case a stable ID** (`TS-<process-slug>-NN`) and write it under
   `scripts/` using `test-script-template.md`, with its Row ID/design-record/fix-doc
   traceability reference filled in — a script with no traceability reference doesn't get written
   (per that template's own rule).
10. **Produce or update the `test-coverage-matrix`**: Row ID → technique(s) used → Test Case ID(s) →
    status. Any Row ID with zero test cases is an explicit, visible **Gaps** entry, not a silent
    omission. Any `Workaround` row — even with real test cases — gets its own entry in the matrix's
    **Unresolved classifications** section, a distinct section from Gaps; don't conflate "no
    coverage" with "coverage exists, but fit-to-standard hasn't settled what this row actually is."
    Append `scripts.written`.
11. **User review gate** — present the matrix + script list and get explicit approval before
    treating the run as complete or offering sync. Append `review.requested`, then
    `review.approved` or `review.changes_requested` (loop back to steps 3–10 on changes).
12. **Optional test-management sync** — only after approval, and only if the user asks or
    confirms. Otherwise append `sync.skipped`.
    - If a Cloud ALM connector is wired: use `tools/sync_calm_testcases.py` (script pattern,
      CALM_TM API).  **Always dry-run first** (omit `--apply`) — present the preview and get
      explicit confirmation before the live push.  Require `--project-id` (Cloud ALM project UUID
      from the project URL) and `--env-file` (credentials outside the repo).
    - Requires `--project-id` (project UUID) and `--scope-id` (solution scope UUID — read from
      any existing test case in that project: `GET /api/calm-testmanagement/v1/ManualTestCases?$filter=projectId eq <uuid>&$top=1`).
    - Command for dry-run preview:
      ```
      python3 tools/sync_calm_testcases.py \
          --run-folder <path> --scripts-subdir scripts \
          --project-id <uuid> --scope-id <uuid> \
          --config ~/.config/cloud-alm/config.json   # or --env-file
      ```
    - Command for live push (user must confirm this explicitly):
      ```
      python3 tools/sync_calm_testcases.py \
          --run-folder <path> --scripts-subdir scripts \
          --project-id <uuid> --scope-id <uuid> \
          --config ~/.config/cloud-alm/config.json --apply
      ```
    - On push, write `sync-receipt.json` (tool writes it automatically) and append
      `sync.completed` or `sync.failed` to `events.jsonl`.  Record who approved the push in the
      ledger.  Never invent a successful sync.
13. **Close the run** — set `meta.json` status `complete`, append `run.completed`. Note anything
    worth generalizing (a technique that worked well, a defect-history pattern that needed a case)
    for `knowledge-harvest`.

## Output

- Run folder under `workspace/test-case-design/<YYYY-MM-DD>-<process-slug>/` with ledger files.
- One test script per case under `scripts/`, per `test-script-template.md`.
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
- **A Row ID with zero test cases is a visible Gaps entry in the coverage matrix, never a
  silently-skipped row.**
- **A `Workaround` row is never a Gaps entry, even with zero cases written yet** — its gap is an
  unresolved classification, tracked in its own matrix section; conflating the two (as this skill's
  first draft did) makes "Gaps" mean two different things depending on the row, which defeats the
  point of a gate reading that section as one signal.
- **Don't force a technique onto a row that doesn't have that shape** — a plain scenario is the
  honest choice when there's no rule table, range, or state machine behind the step.
- **More techniques is not automatically more coverage** — an independent review of this factory's
  own first real run flagged exactly this: three techniques on one Standard row, with no distinct
  failure named for the third. Apply the reference file's anti-padding rule before stacking
  techniques, not after someone else asks why a row needed six test cases.

## Driver

Main driver: test (this factory's closest role to a dedicated test lead; adjust per engagement).
Owner role per factory-data.json: **test**.

## Status

Progress. New skill, written this session — grounded in standard, publicly documented test-design
technique names, not ported from any predecessor repo (none had this content) and not adapted from
the Salesforce sibling framework's `sf-testing` (surveyed, found to be execution/fix-loop only, no
transferable design methodology).

Tested in two rounds: (1) dry-run against a real Draft-status decision log with a Delta row missing
its design-record and a row not yet resolved to Standard/Delta — fixed the `Workaround`
classification, the missing-design-record path in step 3, Draft-log handling in steps 1/4, and the
matrix's `Caveats` field. (2) A real run on that same scenario, followed by an independent second
real run (a different, Live-status billing/account-determination scenario) and review of both —
found and fixed: the priority test was a binary any-yes/all-no split that let row order override
real risk differences (now a ranked tier test), `Gaps` and a `Workaround` row's own gap were
conflated into one section with contradictory meanings (now split into `Gaps` and `Unresolved
classifications`), the multi-technique tie-break rule had no ceiling and produced technique
inflation on a real row (now an explicit anti-padding rule), `test-script-template.md` had no field
for the technique(s) chosen, and Equivalence Partitioning's own criterion for when to use it alone
was missing from the shape table.

**Still not verified on a live engagement**: the Inputs contract's instruction to refuse a
Delta-only scope ask — neither real run tested this path; `evals/evals.json` #1 now captures it
as a fixture walkthrough. Also new in this pass (2026-08): input-quality gate, per-run ledger,
review-before-sync — dry-run against eval fixtures, not yet live-engagement verified.
