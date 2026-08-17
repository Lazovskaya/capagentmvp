## Cutover planning & go-live readiness

Sequence every cutover task against the clock, rehearse it end to end, and track the per-process-area readiness checklist that decides whether production opens. Produces a sign-off record naming who accepted the go/no-go call. The rehearsal is the point, a plan that has never been run is an estimate.

**Owner:** Delivery Manager
**Engagement(s):** Greenfield / Brownfield conversion
**Status:** In progress

## Uses

- **skill:** cutover-plan, go-live-readiness
- **agent:** cutover-risk-assessor
- **mcp:** cloud-alm
- **artifact:** sign-off-record, run-exit-record
- **knowledge:** operations
- **q-gate:** deploy→run

## Handoff requirement

Before the `deploy→run` gate, populate the `run-exit-record` Deploy → Run
handoff section with go-live scope, conversion evidence, rehearsal result,
hypercare window, service/on-call owners, rollback owner, entry criteria and
operational baselines. `READY_WITH_EXCEPTIONS` requires named risk acceptance;
`BLOCKED` cannot pass the gate.
