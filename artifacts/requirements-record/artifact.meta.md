---
artifact: requirements-record
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in any gate.md's Evidence-mapping table today
---

## Notes
Normalized requirements from intake — source, goal, AC only if present, open
questions. No FTS/design backlinks yet at this stage; that traceability is
built by `fit-to-standard`/`solution-design` downstream, not here. Client
data stays in `workspace/`; this template holds no client data.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | requirements-intake | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
