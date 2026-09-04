---
artifact: architecture-package
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-test

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not directly cited as an evidence row in any gate.md's Evidence-mapping table — see Notes
---

## Notes
The client-facing architecture index for one agreed scope — assembles
records produced across Explore, Realize and Deploy; does not replace the
per-delta `design-record`/`extensibility-record`. Despite being
`solution-design`'s headline Explore-phase deliverable and the
explore-realize handoff, no gate's own Evidence-mapping table cites this
artifact by name directly — `explore-realize` instead cites `design-record`,
`extensibility-record` and `sign-off-record` individually. `q-gate: []`
reflects that literal gap, not an assumption this artifact is unimportant to
the gate.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | solution-design | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| artifact | design-record | related | assembled into the package's Source artifact register (§5) and traceability matrix (§6) |
| artifact | extensibility-record | related | assembled into the package's Source artifact register (§5) and traceability matrix (§6) |
