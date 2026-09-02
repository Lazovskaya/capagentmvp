---
name: e2e-test-scenario-generation
description: Generate end-to-end test scenarios from an e2e-process-scope flow, one scenario spanning the flow's full included-node boundary, structured for the Test generation agent to consume alongside per-row functional test cases.
---

# E2E test scenario generation

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Realize phase, once `e2e-process-scope` (`EPMCSAPAI-249`) has produced at least one E2E flow.
Called by the Test generation agent (`EPMCSAPAI-259`) alongside `test-case-design` — this skill
covers flow-level, cross-process scenarios; `test-case-design` covers per-decision-log-row
functional cases. Neither substitutes for the other.

## Inputs (contract)

- **Required:** `e2e-process-scope` artifact (`EPMCSAPAI-249`) — at least one flow with its
  included L2/L3 nodes.
- **Optional:** `fit-gap-analysis` items linked to the flow (via `e2e-process-scope`'s
  `linked_fit_gap_rows`) — a `GAP` row inside a flow's boundary becomes a scenario step to
  verify explicitly, not silently assumed to work like the Standard rows around it.

## Steps

1. **One scenario skeleton per flow.** For each flow in `e2e-process-scope`, open one E2E
   scenario named after its `l1_value_stream`. Do not split a flow into multiple scenarios or
   merge two flows into one — the flow boundary from `EPMCSAPAI-249` is the scenario boundary.
2. **Order steps as best as the input allows.** `e2e-process-scope` carries no step sequence
   (see its own agent.md) — order the scenario's steps by the included nodes' `l2_core_process`
   grouping as a reasonable default, and mark the ordering `PROVISIONAL` rather than presenting
   it as a confirmed process sequence. A reviewer with real sequencing knowledge corrects it.
3. **Insert an explicit check at every linked `GAP` row.** Where `linked_fit_gap_rows` names a
   `GAP` classification inside the flow, add a scenario step verifying that gap's disposition
   was actually built as intended — not just that the Standard steps around it still pass.
4. **Flag missing coverage.** A flow with zero included nodes carrying any linked fit-gap
   evidence still gets a scenario (from step 1) but is marked `EVIDENCE_THIN` — don't inflate
   confidence by omission.
5. **Write `e2e-test-scenarios` artifact.** One entry per flow, `DRAFT` status, routed to human
   review — same discipline as `test-case-design`'s matrix: an E2E scenario this factory
   generates is a starting point for a tester, never a finished, unreviewed test.

## Output

`e2e-test-scenarios` artifact: one scenario per E2E flow, ordered (provisional) steps, explicit
gap-verification steps, and an `EVIDENCE_THIN` flag where applicable.

## Judgment calls this skill makes

- Whether a step ordering is confident enough to present as more than `PROVISIONAL` — default
  answer is no, always mark provisional unless the input itself supplied real sequencing data
  (which `e2e-process-scope` currently never does).

## Driver

Called by `EPMCSAPAI-259` (Test generation agent), not run standalone against a bare process
list.

## Status

Progress. Written fresh, spec-only — not yet dry-run tested against a real `e2e-process-scope`
output (itself not yet dry-run tested either, per its own `agent.md`).
