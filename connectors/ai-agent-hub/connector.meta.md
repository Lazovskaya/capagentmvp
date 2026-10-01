---
connector: ai-agent-hub
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: []
integration_boundary:
  system: ai-agent-hub
  environments: []
  access_path:
authentication_model: []
data_classification: confidential
connector_type: api
permission_scope:
readiness: in-progress
provenance:
  source: SAP
  source_repo:
verified_live: false
---

## Notes
`connector.md` is currently a one-line stub ("Where client-facing agents
are governed. Proposed to Retired lifecycle. GA Q3 2026."). `factory-data.json`
already flags this component as proposed for a Retired lifecycle status —
treat any further investment here as provisional pending that decision.

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
