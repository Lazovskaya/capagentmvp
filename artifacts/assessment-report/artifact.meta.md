---
artifact: assessment-report
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [discover-prepare]
---

## Notes
Agent-candidate scoring (process, volume, exception rate, reversibility,
data reachability, verdict) for `agent-readiness` — this is what
`agent-build` should later be scoped against. A process not listed here as a
`Candidate` is not yet an agent-build target. Distinct from
`simplification-impact-report`, which this artifact was deliberately split
from — the two answer unrelated questions (agent-candidacy vs. conversion
sizing) despite sharing a name at one point.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | agent-readiness | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| connector | knowledge-graph | related | data-reachability scoring should be checked against the knowledge-graph, not assumed (per this artifact's own validity checklist) |
| q-gate | discover-prepare | gates-at | "agent-readiness candidates named, if in scope" is a named checklist item |
