---
tool: reconcile-brownfield-sad-state
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover, explore]
operation: reconcile-brownfield-sad-state
permission_scope: read-write
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Local-only, deterministic (EPMCSAPAI-323): reads and writes exclusively under the gitignored
`workspace/<engagement_id>/brownfield-sad/`. Declares no Connector dependency -- it never reaches
Confluence or any external system. `permission_scope: read-write` refers to this local workspace
only, not a client system. Verified end to end with a scratch workspace (fresh -> commit -> clean
-> conflict-on-approved-file-edit -> unreadable-artifact); no automated test suite exists on this
branch yet (see EPMCSAPAI-331).

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `brownfield-sad-authoring-state` | produces | Writes the checkpoint/state records this artifact type governs. |
