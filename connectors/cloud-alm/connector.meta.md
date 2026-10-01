---
connector: cloud-alm
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: [prepare, explore, realize, deploy, run]
integration_boundary:
  system: sap-cloud-alm
  environments: []                     # not ABAP-system-facing — this axis doesn't apply
  access_path: mcp                     # two integration modes exist for this service (mcp + script) — see Notes; template allows one value
authentication_model: [oauth2]
data_classification: confidential
connector_type: mcp                    # two integration modes for the same service — see Notes; template allows one value
permission_scope: read-write
readiness: in-progress
provenance:
  source:                              # the sap-cloud-alm-mcp binary's publisher (SAP-official vs. community) is not stated in connector.md or server.json — do not assume
  source_repo:
verified_live: partial   # script-pattern CALM_TM push: verified 2026-09-01. MCP mode: not yet verified.
---

## Notes
Two integration modes for the same service, not two connectors: the **MCP
pattern** (Claude Code calls Cloud ALM at runtime via `sap-cloud-alm-mcp`,
default read-only, controlled writes require explicit approval) and the
**script pattern** (`tools/ingest_sap_best_practices.py` calls the Process
Content API directly via OAuth2 to regenerate the SAP Best Practices
taxonomy cache — confirmed a **dead end** for L1 hierarchy, 2026-08-24: the
API returns real data but no L1 value-stream field). Credentials for both
modes live outside the repo (`~/.config/sap-cloud-alm-mcp/profiles/` and
`~/.config/cloud-alm/sessions/`, respectively). Delete operations and log
posting are explicitly out of the default factory posture.

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
