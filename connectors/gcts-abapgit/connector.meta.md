---
connector: gcts-abapgit
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: []
integration_boundary:
  system: gcts-abapgit
  environments: [onprem, cloud]        # inferred from "Source control for ABAP Cloud, CAP and UI5" description — not yet confirmed by a real server.json
  access_path:
authentication_model: []
data_classification: confidential
connector_type: api
permission_scope:
readiness: in-progress
provenance:
  source: internal
  source_repo:
verified_live: false
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
