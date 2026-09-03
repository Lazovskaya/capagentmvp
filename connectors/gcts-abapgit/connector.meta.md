---
connector: gcts-abapgit
namespace: "@epam/sap"

connector-type: documented-only
system-type: [onprem, cloud]           # inferred from "Source control for ABAP Cloud, CAP and UI5" description — not yet confirmed by a real server.json
auth-type: [TBD]
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verified-live: false
---

## Notes
`connector.md` is currently a one-line stub ("Source control for ABAP
Cloud, CAP and UI5.") with no wiring, auth, or tool-surface detail yet. All
fields above beyond identity should be treated as provisional until the
connector's own file is written out.

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
