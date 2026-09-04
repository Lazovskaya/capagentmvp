---
artifact: test-coverage-matrix
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-test

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy]
---

## Notes
One file per process area / decision-log range. Row ID to test-case
traceability with explicit gaps — a `Workaround`-classified row's unresolved
status is tracked separately from coverage gaps (§"Unresolved
classifications"), never conflated. Regression cases seeded from
`knowledge/testing/defect-history-template.md`'s recurring cause families
are logged separately from decision-log-driven cases.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | test-case-design | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| knowledge | testing | related | regression cases seeded from `defect-history-template.md`'s cause families |
| q-gate | realize-deploy | gates-at | "every decision-log Row ID has test coverage" is a named checklist item; a non-empty Gaps section is a specific risk signal for this gate |
