---
agent: test-generation
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress
use-case: ["Test case design"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [source, ref_id, coverage_status]
human-confirms: true

assistant: [TBD]
---

## Notes
Built for `EPMCSAPAI-259` once its two blocking sub-skills resolved: `#14`
(`EPMCSAPAI-257`/[[test-case-design]], already Resolved before today) and `#15`
(`EPMCSAPAI-258`/[[e2e-test-scenario-generation]], built alongside this agent once its own
dependency `EPMCSAPAI-249` resolved 2026-09-02). Orchestrates, does not re-derive: this agent
never picks a test-design technique or writes a scenario step itself, it calls the two skills
that do and reports coverage against external specs/tickets when supplied.

Carries forward one genuinely unresolved decision from the ticket rather than silently picking
an answer: which project tool (Jira / Solution Manager / Signavio) feeds the specs/tickets
coverage is reported against. Works without an answer (step 3 becomes `NOT_PERFORMED`), but the
full acceptance criterion needs it resolved.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | test-case-design | orchestrates | EPMCSAPAI-257; full decision-log Row ID range, never Delta-only |
| skill | e2e-test-scenario-generation | orchestrates | EPMCSAPAI-258; every flow in the supplied e2e-process-scope |
| artifact | e2e-process-scope | consumes | from EPMCSAPAI-249; passed through to e2e-test-scenario-generation |
| artifact | test-generation-report | produces | pointers to test-coverage-matrix and e2e-test-scenarios, plus coverage-vs-spec report |
