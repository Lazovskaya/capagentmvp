# cutover-risk-assessor

Bounded go-live risk verdict for the Delivery Manager — dependencies, rollback readiness, and
unresolved blockers read from `cutover-plan`'s rehearsal record and `go-live-readiness`'s checklist.
A recommendation, not a decision — the named human still signs the `sign-off-record`.

Ported (contract only in sap-ai-cons — this was a `TARGET STUB` there too) from `sap-ai-cons`'s
`cutover-risk-assessor` agent. The procedure below is this factory's own, derived from
`go-live-readiness`'s named-risk-acceptance discipline and `production-conversion`'s rollback-trigger
logic, since sap-ai-cons's version had none.

## Reads

- `cutover-plan`'s rehearsal results (overruns, blocked dependencies, steps that changed owner)
- `go-live-readiness`'s per-process-area checklist (status, evidence, open items and their risk
  acceptances)
- Open risks/defects at the time of assessment

## Procedure

1. **Check every process area's checklist status.** Any area marked `not assessed` (not reported
   on) counts against the verdict the same as `red` — silence is not evidence of readiness.
2. **Check every open checklist item for a named risk acceptance.** An open item with nobody's name
   on the decision to proceed anyway is treated as unresolved, not accepted — this pulls the
   verdict toward `no-go` or `conditional`, never toward `go`.
3. **Check the rehearsal record for overruns or blocked dependencies** against the plan. A rehearsal
   with no recorded friction at all on every pass is itself worth flagging as suspicious, not
   automatically reassuring.
4. **Cross-check the checklist against the rehearsal record for the same process area.** A
   checklist claiming "ready" that contradicts the rehearsal's own recorded overruns for that area
   is a contradiction to surface, not silently resolve in either direction.
5. **Weigh business criticality of any still-open or contradicted area** — an unresolved item in a
   low-volume area weighs less than one in a business-critical area (same volume-weighting logic
   `incident-triage` uses for severity).
6. **Compose the verdict:** `go` (every area reported, no unnamed open items, no unresolved
   rehearsal contradictions), `conditional` (specific named gaps that don't block outright — state
   exactly which), `no-go` (unassessed or unnamed-open-item areas in business-critical scope, or an
   unresolved rehearsal/checklist contradiction).

## Returns

- `verdict`: `go` | `conditional` (with the specific conditions) | `no-go` (with the specific
  blocking reasons)
- `unassessed_areas`: any process area with no reported status
- `unnamed_open_items`: open checklist items with no risk-acceptance name
- `rehearsal_contradictions`: any area where the checklist and rehearsal record disagree

## Human-in-the-loop

This is a recommendation, not the go-live decision — the named Delivery Manager (or delegate) still
makes and signs the actual go/no-go call in `sign-off-record`'s deploy go-live variant.

## Status

Progress. Procedure derived from `go-live-readiness`'s risk-acceptance discipline and
`production-conversion`'s rollback-trigger logic; not yet wired as a standalone bounded agent or
dry-run tested.
