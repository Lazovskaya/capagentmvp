---
skill: production-conversion
title: Production conversion   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Deploy"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [basis]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Production conversion"]

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [deploy-run]               # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
The technical SUM/DMO go-live runbook, executed with a pre-agreed go/no-go
decision-maker and rollback triggers, logs captured at every checkpoint as
evidence rather than reassurance. The highest-risk hours of a brownfield
programme, owned by Basis.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | cloud-alm | requires | delivery/operations surface during the conversion runbook |
| knowledge | operations | produces | logs conversion checkpoints into the runbook/operations history |
| artifact | run-exit-record | produces | feeds the eventual run-exit disposition |
| q-gate | deploy-run | gates-at | exit criteria: cutover executed with go/no-go and rollback triggers evidenced |
