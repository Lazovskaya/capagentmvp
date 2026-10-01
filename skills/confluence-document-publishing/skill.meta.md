---
skill: confluence-document-publishing
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [explore]
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Built as part of EPMCSAPAI-322. Uses Python REST tools directly (no MCP server).
Enforces a mandatory preview-and-approval gate (§6 of skill-design-conventions.md):
no Confluence write happens without explicit `--apply`. Re-reads after writing to
verify. Falls back gracefully when Confluence is unreachable. All three tools verified
live 2026-09-14 against kb.epam.com (Server/DC).

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `read-confluence-page` | requires | Pre-write version read and post-write verification. |
| tool | `search-confluence-pages` | requires | Duplicate detection before create. |
| tool | `upsert-confluence-page` | requires | Create and update operations; dry-run by default. |
| tool | `upload-confluence-attachment` | requires | File attachment upload; dry-run by default. |
| artifact | `brownfield-sad-authoring-state` | produces | Records publication URL, version, and status after each publish attempt. |
