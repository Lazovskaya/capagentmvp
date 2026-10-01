---
skill: brownfield-sad-state-reconciliation
namespace: "@epam/sap"
version: 0.2.0
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
Build new (EPMCSAPAI-323), invoked only by the Brownfield SAD Authoring Agent, never directly by
a person. Its live-Confluence half depends on `read-confluence-page` (built and verified live as
part of EPMCSAPAI-322, 2026-09-14).

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `reconcile-brownfield-sad-state` | requires | Local checkpoint diff/commit -- implemented and verified. |
| tool | `read-confluence-page` | requires | Live linked-page version/hash comparison (EPMCSAPAI-322). |
| artifact | `brownfield-sad-authoring-state` | produces | Writes/advances the engagement's checkpoint and state.json pointer. |
