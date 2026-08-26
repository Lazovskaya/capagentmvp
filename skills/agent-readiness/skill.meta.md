---
skill: agent-readiness
title: Agent-readiness assessment   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [discover-prepare]         # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Scores the client's processes for whether they should be handed to agents:
volume, exception rate, how reversible the decisions are, and whether the
data an agent would need is actually reachable. Output names both the
candidate processes and the ones to leave alone — the bridge from delivery
work into SAP's Autonomous Enterprise, and a consulting deliverable, not a
product.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | signavio | requires | process scope, variants and agent mining |
| connector | knowledge-graph | requires | grounds discovery in the business entity/relationship map |
| artifact | assessment-report | produces | agent-candidate scoring: process, volume, exception rate, reversibility, data reachability, verdict |
| knowledge | process | consumes | scores candidates against known process scope |
| q-gate | discover-prepare | gates-at | exit criteria: scope and readiness accepted |
