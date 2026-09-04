---
skill: integration-strategy-hip
title: Integration strategy — HIP / ISA-M
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-test
target-role: [architect]
engagement: [B]
use-case: ["Integration strategy"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-hip` skill — the ISA-M
methodological core of the pipeline. Phase 2; invoked by the `integration-strategy` orchestrator.
This phase's output is also the interim source `agents/sad-assembly` uses for the `EPMCSAPAI-283`
(Integration) domain row in `technical-sad`, until that domain agent is built — see
`agents/sad-assembly/agent.md`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | integration-strategy | invoked-by | orchestrator routes here for Phase 2 |
| skill | integration-strategy-context | consumes | Phase 1 output, for continuity |
| skill | readiness-analysis | consumes | optional — which S/4HANA APIs change |
| skill | integration-strategy-decisions | feeds | confirmed Target technologies determine Phase 3's mechanisms |
| agent | sad-assembly | feeds-into | interim source for the -283 domain row, until that domain agent exists |
| knowledge | methodology | consumes | ISA-M domain/style/pattern taxonomy grounding |
