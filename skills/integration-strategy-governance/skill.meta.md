---
skill: integration-strategy-governance
title: Integration strategy — governance, catalogues & roadmap
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
Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-governance` skill. Phase 4 (final);
invoked by the `integration-strategy` orchestrator. Its Gate 4 approval, on a PowerPoint-format
engagement, triggers assembly of `05.Integration_Strategy.pptx` — not itself built by this skill.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | integration-strategy | invoked-by | orchestrator routes here for Phase 4, and for Gate 4 assembly |
| skill | integration-strategy-decisions | consumes | all prior phase outputs, for roadmap/catalogue/pillar consistency |
| connector | cloud-alm | consumes | optional — publishes the governance roadmap/catalogue as tracked work items; degrades to a standalone document if absent |
