---
connector: knowledge-graph
namespace: "@epam/sap"

connector-type: mcp
system-type: []
auth-type: [TBD]                      # stub — connector.md carries no wiring detail yet
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verified-live: false
---

## Notes
`connector.md` is currently a one-line stub ("Structured map of business
entities and relationships. Grounds discovery and agent-readiness.") with no
wiring, auth, or tool-surface detail yet. All fields above beyond identity
should be treated as provisional until the connector's own file is written
out.

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
