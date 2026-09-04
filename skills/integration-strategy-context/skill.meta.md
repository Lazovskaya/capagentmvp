---
skill: integration-strategy-context
title: Integration strategy — context & objectives
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress
target-role: [architect]
engagement: [B]
use-case: ["Integration strategy"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-context` skill. Phase 1 of the
`integration-strategy` pipeline; invoked by that orchestrator, not called standalone.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | integration-strategy | invoked-by | orchestrator routes here for Phase 1 |
| skill | integration-strategy-hip | feeds | Phase 2 reads this phase's output for continuity |
| connector | leanix | consumes | optional — current-state application/interface landscape for context-gathering; degrades to client-supplied inventory if absent |
