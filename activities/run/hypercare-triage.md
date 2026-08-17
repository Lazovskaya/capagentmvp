## Hypercare & incident triage

The same pipeline as Realize defect-triage with a different intake: incidents from live users
rather than defects from test cycles. Runs against Cloud ALM and the knowledge base. Ceremony
depth (via `ceremony-routing`) sits after classify/route and before diagnose — it does not replace
O2C diagnostics. This is where triage pays for itself, because the volume is highest and the
pattern is most repetitive.

**Owner:** Functional
**Engagement(s):** AMS & Run
**Status:** In progress — same pipeline as Realize `defect-triage`, real-run tested this session
against a live-incident-shaped scenario (user-reported tickets, not test-cycle defects)

## Uses

- **skill:** incident-triage, ceremony-routing, root-cause-playbook, pricing-diagnostic, billing-ar-error-analyzer, idoc-failure-analyzer, defect-triage, fix-doc-and-regression
- **agent:** defect-classifier
- **mcp:** cloud-alm, jira
- **artifact:** triage-verdict
- **knowledge:** domain-packs, process, config, testing, operations

## Entry requirement

Hypercare intake starts only from a `run-exit-record` with handoff status
`READY` or `READY_WITH_EXCEPTIONS`. The triage team reads the service owner,
on-call path, rollback owner, support window and operational baseline before
classifying the first incident. A blocked handoff is routed back to Deploy.
