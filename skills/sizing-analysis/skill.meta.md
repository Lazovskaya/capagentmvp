---
skill: sizing-analysis
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-sizing` skill (EPMCSAPAI-324). The Tool it
requires is real, stdlib-only, and verified end to end in this environment.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `calculate-s4hana-sizing` | requires | Growth/archiving/per-instance arithmetic. |
| knowledge_source | `sizing-methodology` | consumes | Not yet registered -- see EPMCSAPAI-332. |
| artifact | `sizing-recommendation` | produces | Baseline, assumptions, per-instance calculation, RISE mismatch, caveats, approval state. |
