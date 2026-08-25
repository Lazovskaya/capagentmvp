# readiness-analyst

Isolated reviewer for Discover-phase quality — checks a `simplification-impact-report`'s
completeness and flags missing evidence, without owning the `readiness-analysis` skill itself.

Ported (contract only in sap-ai-cons — this was a `TARGET STUB` there too) from `sap-ai-cons`'s
`readiness-analyst` agent. The procedure below is this factory's own, derived directly from
`simplification-impact-report`'s own validity checklist, since sap-ai-cons's version had none.

## Reads

- The `simplification-impact-report` draft
- The source Readiness Check / SI-Check export(s) it was built from

## Procedure

Runs the report's own validity checklist as a checkable procedure, not a re-diagnosis:

1. **Every finding classified?** Each row must be marked `Blocks` or `Appears only` — none left
   unclassified. Any unclassified row → `gaps`.
2. **Every classification has a stated reason?** A `Blocks` row must name the specific custom code
   or config it hits, not just restate the SAP Note number. An `Appears only` row must state why it
   doesn't apply, not just "not relevant." Any row with a label but no reason → `gaps`.
3. **Source exports named and dated?** The report must state which exports it covers and when they
   were pulled. Missing or vague sourcing (no date, no scope) → `gaps`.
4. **Custom-code baseline check stated?** If a finding was checked against actual usage
   (`custom-code-scan` output), that should be visible; if usage wasn't verified for a finding, the
   report should say so explicitly rather than silently assuming applicability. Absent and
   unacknowledged → `gaps`.
5. **If the report has no findings at all**, or the source exports are missing entirely → `blocking
   missing evidence`, not `gaps` — there's nothing to review yet.

## Returns

- `verdict`: `complete` | `gaps` (with the specific rows/checks that failed, named) | `blocking
  missing evidence`
- `checked_against`: which checklist items were run

## Status

Progress. Procedure derived from `simplification-impact-report`'s own validity checklist; not yet
wired as a standalone bounded agent or dry-run tested.
