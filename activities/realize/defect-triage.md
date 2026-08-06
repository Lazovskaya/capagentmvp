## Defect triage

The full defect-handling pipeline for a test-cycle queue: intake and classify by
sub-process/layer/severity, diagnose to a root cause, decide bug vs functional spec flaw, then
document the fix and its regression scope. The bug/spec-flaw classification is commercial rather
than technical: a bug is fixed under the fee, a spec flaw is a change request. So the agent
recommends and a named human confirms, and the verdict records who. This only works if the
traceability chain upstream is complete.

**Owner:** Tester
**Engagement(s):** Greenfield / Brownfield conversion / Build and Extend / AMS & Run
**Status:** In progress

## Uses

- **skill:** incident-triage, root-cause-playbook, pricing-diagnostic, billing-ar-error-analyzer, idoc-failure-analyzer, defect-triage, fix-doc-and-regression
- **agent:** defect-classifier
- **mcp:** jira
- **artifact:** triage-verdict
- **knowledge:** domain-packs, process, config, custom-code, testing
