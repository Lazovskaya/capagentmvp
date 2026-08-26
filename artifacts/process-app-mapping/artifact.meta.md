---
artifact: process-app-mapping
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in explore-realize's own Evidence-mapping table
---

## Notes
Source-traceable mapping of in-scope business processes to SAP Fiori app
candidates, from a supplied Fiori Apps Reference Library XLSX export. The
app export is a run input only — never copied into factory knowledge, and a
lexical match is never treated as an approved functional decision.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | fiori-app-mapping | produced-by | TMP — that skill has no `skill.meta.md` yet, so there is no `produces` row to mirror against; remove once the catalog inverts the graph instead |
