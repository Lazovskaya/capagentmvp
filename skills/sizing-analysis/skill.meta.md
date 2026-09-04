---
skill: sizing-analysis
title: SAP sizing analysis
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-test            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Sizing analysis"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-sizing` skill. Consumes `readiness-analysis`'s
Chapter 6 output as its most common real-world input for Brownfield/Bluefield engagements; feeds
the (not yet ported) `sad-drafting` skill's Sizing Strategy decision matrix.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | simplification-impact-report | consumes | HANA sizing baseline, when sourced from a Readiness Check Chapter 6 |
| artifact | sizing-recommendation | produces | growth/archiving-adjusted, per-instance sizing target |
| skill | adr-log | feeds-into | a disputed/commercially-significant sizing decision raises an entry there |
| knowledge | standards | consumes | applies delivery conventions to the sizing recommendation write-up |
