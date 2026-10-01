---
skill: adr-log
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover, explore]
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Built as part of EPMCSAPAI-325. Cross-cutting Skill -- invoked by the Brownfield SAD Authoring
Agent, not directly by a person. Append-only; writes to local `adr-log.json` with mandatory
preview+apply gate; optionally publishes to Confluence via `confluence-document-publishing`.
Resolves the `adr_sync_status: pending` block that previously capped all SAD stages at `partial`.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `brownfield-adr-log` | produces | Appends entries to the local ADR log; publishes rendered version to Confluence. |
| artifact | `brownfield-sad-authoring-state` | produces | Sets `adr_sync_status` after each write. |
| skill | `confluence-document-publishing` | optional | Publishes `05 Architecture Decision Log`; gated behind its own --apply. Falls back to local-only when Confluence unavailable. |
