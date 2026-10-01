---
connector: confluence
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: [discover, prepare, explore, realize, deploy, run]
integration_boundary:
  system: confluence
  environments: []
  access_path: rest-api
authentication_model: [token, personal-token]
data_classification: confidential
connector_type: script                # connector.md: "no MCP server, no uvx, no .mcp.json wiring needed" — Python stdlib calls the REST API directly
permission_scope: read-write
readiness: in-progress
provenance:
  source: community
  source_repo: "https://github.com/sooperset/mcp-atlassian"
verified_live: "2026-09-14 against kb.epam.com (Server/DC) -- all four Python tools confirmed"
---

## Notes
Scoped to Confluence only. Python REST tools (no MCP required): read-confluence-page,
search-confluence-pages, upsert-confluence-page, upload-confluence-attachment. All
verified live 2026-09-14 against kb.epam.com. Supports Cloud (CONFLUENCE_API_TOKEN)
and Server/DC (CONFLUENCE_PERSONAL_TOKEN); auto-detected from credentials file.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
