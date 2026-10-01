---
connector: signavio
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: [discover, prepare, explore]
integration_boundary:
  system: sap-signavio
  environments: []
  access_path: rest-api                # no MCP wrapper exists for Signavio's basic-auth API
authentication_model: [basic]          # plain username/password against /p/login — no OAuth2, no service keys, no API tokens
data_classification: confidential
connector_type: script
permission_scope: read-only
readiness: in-progress
provenance:
  source: internal
  source_repo:
verified_live: "2026-08-24"
---

## Notes
Confirmed against a real Signavio Process Manager tenant, 2026-08-24. Uses a
dedicated technical/integration user, never a personal account (personal
logins can trigger suspicious-login detection and lockouts). All-read-only;
no write operation is exposed at all (`write_controls: none`). Only the
SAP-delivered `Copy from SAP Signavio Process Explorer` subtree (602
scope-item folders) is in scope — client-engagement folders in the same
tenant are strictly off-limits, never read or referenced.

## Dependency graph
Empty — a connector reaches out to its external system and calls nothing
else in the factory. Callers are never listed here: skills `fit-to-standard`
and `agent-readiness` both call this connector and record it as
`| connector | signavio | requires |` on their own `skill.meta.md`, rather
than duplicating the edge here. The three script-pattern Python
tools (`tools/enrich_sap_best_practices_signavio.py`,
`tools/fetch_bpmn_signavio.py`, `tools/test_signavio_bpmn_download.py`) also
call it directly, outside any registered Skill component — no Dependency-
graph row exists for that path today.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
