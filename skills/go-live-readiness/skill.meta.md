---
skill: go-live-readiness
title: Cutover planning & go-live readiness   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Deploy"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [delivery]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [deploy→run]               # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Tracks the per-process-area readiness checklist and status, feeding
cutover-plan's go/no-go criteria. Shares its activity (and the same `uses`
block in `factory-data.json`) with `cutover-plan`.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | cutover-plan | related | this skill's checklist feeds that skill's go/no-go criteria |
| agent | cutover-risk-assessor | requires | consumes this skill's checklist as part of its go-live risk verdict |
| mcp-server | cloud-alm | requires | delivery/operations surface for readiness tracking |
| artifact | sign-off-record | produces | names who accepted the go/no-go call |
| knowledge | operations | consumes | reads runbook and cutover history baselines |
| q-gate | deploy→run | gates-at | exit criteria: go-live criteria met |
