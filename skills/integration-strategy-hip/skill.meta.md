---
skill: integration-strategy-hip
title: Integration strategy — HIP / ISA-M
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
Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-hip` skill — the ISA-M
methodological core of the pipeline. Phase 2; invoked by the `integration-strategy` orchestrator.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | integration-strategy | invoked-by | orchestrator routes here for Phase 2 |
| skill | integration-strategy-context | consumes | Phase 1 output, for continuity |
| skill | readiness-analysis | consumes | optional — which S/4HANA APIs change |
| skill | integration-strategy-decisions | feeds | confirmed Target technologies determine Phase 3's mechanisms |
