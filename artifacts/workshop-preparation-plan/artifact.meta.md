---
artifact: workshop-preparation-plan
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in explore-realize's own Evidence-mapping table
---

## Notes
Prepares scope for `fit-to-standard` — validated business-process scope and
simplification impacts, grouped into workshop topics. Explicitly not a
workshop decision log and cannot claim a business decision or sign-off.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | workshop-preparation | produced-by | TMP — that skill has no `skill.meta.md` yet, so there is no `produces` row to mirror against; remove once the catalog inverts the graph instead |
| skill | fit-to-standard | related | hands off the coverage-checked plan to this skill |
