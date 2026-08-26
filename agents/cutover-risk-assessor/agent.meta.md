---
agent: cutover-risk-assessor
namespace: "@epam/sap"

category: "SAP Activate / Deploy"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [verdict, unassessed_areas, unnamed_open_items, rehearsal_contradictions]
human-confirms: true

assistant: [TBD]
---

## Notes
Bounded go-live risk verdict for the Delivery Manager — a recommendation,
not the go-live decision itself; the named Delivery Manager (or delegate)
still signs `sign-off-record`'s deploy go-live variant. Silence counts
against the verdict the same as a red status: an unassessed process area,
or an open checklist item with nobody's name on the risk acceptance, both
pull the verdict toward `no-go`/`conditional`, never toward `go`. A
rehearsal with no recorded friction at all is itself flagged as suspicious
rather than automatically reassuring.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | sign-off-record | consumes | reads `cutover-plan`'s rehearsal results and `go-live-readiness`'s per-process-area checklist, both recorded in this artifact |
