---
skill: integration-strategy
title: Integration strategy orchestrator
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [B]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Integration strategy"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-integration-strategy` skill. Parallel
workstream to the (not yet ported) Brownfield conversion pipeline, not a sequential stage — routes
between the four phase skills and enforces the pipeline's five human review gates. Relationship to
`agents/sad-assembly`/`EPMCSAPAI-283` (Integration architecture strategy domain) flagged as an
open question in this skill's own `SKILL.md`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | integration-strategy-context | routes-to | Phase 1 |
| skill | integration-strategy-hip | routes-to | Phase 2 |
| skill | integration-strategy-decisions | routes-to | Phase 3 |
| skill | integration-strategy-governance | routes-to | Phase 4 |
| skill | readiness-analysis | consumes | optional Phase 2 input |
| skill | adr-log | feeds-into | confirmed KDDs from Phase 3 |
