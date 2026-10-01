---
assistant: solution-architect
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
role_scope: solution-architect
use_case_ids: [brownfield-sad-authoring]
project_types: [brownfield]
sdlc_phases: [discover, explore]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Normalized identity (EPMCSAPAI-321): this sidecar previously spread its identity across
`assistants/architect/` (directory), `architect-assistant` (`assistant:` field), and
`solution-architect` (assistant.md's own heading and factory-data.json's generated component
name). All three now agree on `solution-architect`. Only one use case is exposed in this first
release; other Solution Architect responsibilities are not yet covered by an Assistant use case.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | `brownfield-sad-authoring-agent` | routes-to | Implements the Brownfield SAD authoring use case. |
| knowledge_source | `solution-architect-role-context` | consumes | Managed role boundary and routing context (not yet registered -- see EPMCSAPAI-332). |
