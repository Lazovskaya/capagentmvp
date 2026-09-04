---
skill: brownfield-conversion-pipeline
title: Brownfield conversion pipeline router
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-test            # not-ready | in-progress | in-test | ready
target-role: [delivery]
engagement: [B]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Brownfield conversion pipeline"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-brownfield-sdlc` skill — a thin router, same
pattern as this factory's own `factory-onboard`, but scoped specifically to the five-stage
Brownfield conversion pipeline. `factory-onboard`'s `phase-routing.md` now points here for
full-conversion requests rather than duplicating the stage logic.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | factory-onboard | invoked-by | routes here for full Brownfield-conversion requests |
| skill | readiness-analysis | routes-to | Stage 1 |
| skill | sizing-analysis | routes-to | Stage 2 |
| skill | conversion-scoping | routes-to | Stage 3 |
| skill | workshop-scheduling | routes-to | Stage 4 |
| skill | sad-drafting | routes-to | consumes Stages 1-3 |
| skill | adr-log | routes-to | cross-cutting, not a numbered stage |
| knowledge | standards | consumes | orientation/routing language stays consistent with delivery conventions |
