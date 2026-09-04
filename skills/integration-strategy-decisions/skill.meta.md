---
skill: integration-strategy-decisions
title: Integration strategy — mechanisms & decisions
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
Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-decisions` skill. Phase 3; invoked
by the `integration-strategy` orchestrator. Produces the `## ADR Sync` block every confirmed KDD
should be pushed from into `adr-log`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | integration-strategy | invoked-by | orchestrator routes here for Phase 3 |
| skill | integration-strategy-hip | consumes | Phase 2's confirmed Target technology stack |
| skill | adr-log | feeds-into | every Confirmed KDD, via the `## ADR Sync` block |
| skill | integration-strategy-governance | feeds | Phase 4 reads this phase's output for consistency |
| knowledge | standards | consumes | KDD write-up conventions ahead of the adr-log sync |
