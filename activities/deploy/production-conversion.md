## Production conversion

Execute the conversion runbook in production, with logs captured as evidence rather than reassurance. The highest-risk hours of a brownfield programme, owned by Basis. Output goes to the operations bucket so the next conversion starts from what actually happened rather than what was planned.

**Owner:** Basis
**Engagement(s):** Greenfield / Brownfield conversion
**Status:** In progress

## Uses

- **skill:** production-conversion
- **mcp:** cloud-alm
- **knowledge:** operations
- **artifact:** run-exit-record
- **q-gate:** deploy→run

## Evidence requirement

Capture the production run ID, timestamps, logs, failed/retried steps, final
disposition and rollback decision in the Deploy → Run handoff. Do not treat a
successful command exit as production evidence without the referenced logs.
