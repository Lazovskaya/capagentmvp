---
skill: adr-log
title: Architecture decision record log
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Architecture decision tracking"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []                         # cross-cutting; not itself a gate requirement
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-adr-log` skill (commit `2ae0396`). Cross-cutting
across every SAP Activate phase, not tied to one gate — raised into by any skill/agent that
surfaces a gating decision, from the moment it's first identified.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | adr-log | produces | one cumulative `.xlsx` log per engagement, plus a History sheet |
| knowledge | standards | consumes | delivery write-up conventions |
| skill | readiness-analysis | feeds-from | CVI/licensing/downtime-tier findings raise entries here |
| skill | fit-gap-analysis | feeds-from | `not-Clean-Core` extensibility-tier decisions raise entries here |
| connector | jira | consumes | optional — cross-reference a decision entry to its originating ticket; degrades gracefully if absent |
