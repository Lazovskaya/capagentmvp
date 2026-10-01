---
artifact: brownfield-sad-authoring-state
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover, explore]
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Not a deliverable artifact -- durable per-engagement resume/reconciliation state
(`workspace/<engagement_id>/brownfield-sad/state.json`, gitignored), required before any stage
Skill can be invoked (EPMCSAPAI-323). `schema.json` currently only requires the two fields the
`reconcile-brownfield-sad-state` Tool actually populates (`engagement_id`,
`last_valid_checkpoint`); the rest of the plan's full field list is present as optional,
forward-declared properties until EPMCSAPAI-322/327 populate them -- see template.md.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `reconcile-brownfield-sad-state` | related | Tool that reads/writes this artifact's instances and their paired checkpoints. |
