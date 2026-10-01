---
tool: read-confluence-page
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover, explore]
operation: read-confluence-page
permission_scope: read-only
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Read-only; calls the Confluence REST API directly via stdlib urllib (no extra
dependencies). Returns page version, last-modified, and content hash only -- not full
content. Used by `brownfield-sad-state-reconciliation` for live-page version comparison.
Requires the `confluence` connector's credentials file
(~/.config/mcp-atlassian/sessions/<destination>.env) to be set up; does not require a
running MCP server. Verified live 2026-09-14 against kb.epam.com (Server/DC). Requires non-default User-Agent to pass Cloudflare.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | `confluence` | requires | Shares the same credentials file; no live MCP session needed. |
