---
artifact: business-process-impact-list
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in any gate.md's Evidence-mapping table today, despite being a Discover-phase deliverable — see Notes
---

## Notes
Catalog-derived, evidence-backed candidate business-process impacts from an
SAP Simplification Item Catalog export — client applicability remains
explicitly unverified until `readiness-analysis` checks it against SI-Check,
configuration and productive-usage evidence. Produced by an **Agent**, not
a Skill — `simplification-items-to-processes` is the bounded-worker form of
this catalog-to-process transformation, with no separate skill wrapping it.
`q-gate: []` reflects that `discover-prepare`'s own Evidence-mapping table
cites `assessment-report` and (corrected) `simplification-impact-report`,
but not this artifact directly.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | simplification-items-to-processes | produced-by | TMP — mirrors this agent's own `produces` row; remove once the catalog inverts the graph instead. Produced by an Agent directly, not a Skill — see Notes |
| skill | readiness-analysis | produced-by | TMP — the Discover activity that invokes the agent above also declares `produces` toward this artifact; mirrors that skill's own row |
