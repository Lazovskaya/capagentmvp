---
connector: abap-mcp
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: [explore, realize, deploy, run]
integration_boundary:
  system: sap-abap
  environments: [onprem, cloud, legacy]
  access_path: adt
authentication_model: [basic, jwt, xsuaa]
data_classification: confidential
connector_type: mcp
permission_scope: read-write
readiness: in-progress
provenance:
  source: community
  source_repo: "https://github.com/fr0ster/mcp-abap-adt"
verified_live: "unspecified-date — connector.md confirms a live test against a real sandbox system, but records no ISO date; CLAUDE.md names this as one of the two genuinely live-tested connectors as of writing"
---

## Notes
Chosen as the factory's default ABAP connector: broadest scope (classic
on-prem + BTP ABAP Cloud + legacy) and least setup friction for a single
consultant. `SAP_URL`/`SAP_USERNAME`/etc. are **not** read from `.mcp.json`'s
`env` block despite the upstream `server.json` declaring them —
credentials must come from `--env=<destination>` resolving to
`~/.config/mcp-abap-adt/sessions/<destination>.env`, outside the project
directory. `write_object`/transport/activation calls are mutating; skills
must dry-run/preview unless the user passes `--apply` (the factory's HITL
gate, not a substitute for SAP authorizations). Alternatives documented but
not wired as default: SAP's own ADT MCP server (Cloud ABAP only, no CRUD)
and `arc-1` (enterprise/BTP deploy, safe-by-default write gating).

## Dependency graph
Empty — this connector only reaches out to the external ABAP system; it
does not call anything else in the factory. Callers are never listed here:
that is recorded as a `requires` row on each calling skill's or agent's own
sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
