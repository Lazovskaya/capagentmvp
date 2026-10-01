---
tool: calculate-s4hana-sizing
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover]
operation: calculate-s4hana-sizing
permission_scope: read-only
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---

## Notes
Ported from `sap-ai-architecture-generator` (EPMCSAPAI-324). stdlib-only Python, no Connector
dependency. Verified end to end in this environment against a synthetic input (see tool.md).

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `sizing-recommendation` | related | Its output feeds the sizing-analysis Skill's authored recommendation -- not written directly by this Tool. |
