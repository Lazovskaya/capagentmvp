---
skill: workshop-scheduling
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [explore]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---
## Notes
Ported from `sap-ai-architecture-generator`'s `sap-workshop-prep` skill. Compared directly against
this factory's existing `workshop-preparation` skill before porting — the two are complementary,
not duplicates: `workshop-preparation` is a generic coverage gate before `fit-to-standard`;
this skill schedules and builds agendas from `conversion-scoping`'s Brownfield-specific output.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `business-process-scope` | consumes | conversion-scoping's Changed/Unchanged/complexity output |
| skill | `adr-log` | consumes | open Proposed decisions surfaced per session |
| skill | `workshop-preparation` | related | complementary — different input shape and pipeline position |
| connector | `jira` | optional | links each session to its tracked workshop-prep ticket; degrades gracefully if absent |
