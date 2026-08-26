---
skill: cutover-plan
title: Cutover planning & go-live readiness   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Deploy"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [delivery]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [deploy-run]               # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Sequences every cutover task against the clock and rehearses it end to end,
producing a sign-off record naming who accepted the go/no-go call. The
rehearsal is the point — a plan that has never been run is an estimate.
Shares its activity (and the same `uses` block in `factory-data.json`) with
`go-live-readiness`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | go-live-readiness | related | shares the per-process-area readiness checklist that feeds go/no-go |
| agent | cutover-risk-assessor | requires | bounded go-live risk verdict from this skill's rehearsal record |
| connector | cloud-alm | requires | delivery/operations surface for cutover tasks |
| artifact | sign-off-record | produces | names who accepted the go/no-go call |
| knowledge | operations | consumes | reads runbook and cutover history baselines |
| q-gate | deploy-run | gates-at | exit criteria: cutover rehearsed |
