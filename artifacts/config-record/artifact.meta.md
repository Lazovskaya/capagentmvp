---
artifact: config-record
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy]
---

## Notes
Records *why* a config change was made, not just *what* — cites the
upstream fit-to-standard decision-log Row ID or design-record it implements;
a config change with no upstream decision to point at is itself a finding.
Checked by `realize→deploy` alongside `transport-record`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | config-doc | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| artifact | transport-record | related | referenced, never duplicated — the transport carrying this change |
| knowledge | standards | related | conformance to `config-guidelines.md` is checked, not assumed |
| q-gate | realize-deploy | gates-at | "config documented, with transport" is a named checklist item |
