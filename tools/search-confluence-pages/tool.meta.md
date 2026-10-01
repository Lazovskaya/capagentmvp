---
tool: search-confluence-pages
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [explore]
operation: search-confluence-pages
permission_scope: read-only
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Read-only CQL search. Stdlib urllib only. Verified live 2026-09-14 against kb.epam.com
(Server/DC). Requires non-default User-Agent to pass Cloudflare.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | `confluence` | requires | Shares the same credentials file; no live MCP session needed. |
