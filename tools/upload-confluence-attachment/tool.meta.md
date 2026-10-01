---
tool: upload-confluence-attachment
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [explore]
operation: upload-confluence-attachment
permission_scope: read-write
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Dry-run by default; --apply required for any write. Verified live 2026-09-14 against
kb.epam.com (Server/DC). Uses X-Atlassian-Token: no-check (documented Confluence
API requirement for attachment uploads). Stdlib urllib only; no extra dependencies.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | `confluence` | requires | Shares the same credentials file; no live MCP session needed. |
