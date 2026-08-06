# cutover-risk-assessor

Bounded go-live risk verdict for the Delivery Manager — dependencies, rollback readiness, and
unresolved blockers read from `cutover-plan`'s rehearsal record and `go-live-readiness`'s checklist.
A recommendation, not a decision — the named human still signs the `sign-off-record`.

Ported (contract only — this was a `TARGET STUB` in sap-ai-cons too) from `sap-ai-cons`'s
`cutover-risk-assessor` agent.

## Reads

- `cutover-plan`'s rehearsal results
- `go-live-readiness`'s per-process-area checklist
- Open risks/defects at the time of assessment

## Returns

- Risk verdict: `go` | `conditional` | `no-go` (recommendation — a human still decides)

## Status

Not started. Contract only, ported from a stub; not implemented.
