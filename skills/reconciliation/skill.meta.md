---
skill: reconciliation
title: Data migration & reconciliation   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [data]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [realize→deploy]           # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Loads the migration objects, then proves the load: before-and-after counts
and balances against an agreed tolerance. Produces a reconciliation report
that either sits inside tolerance or blocks the phase. The cleanest evidence
in the whole factory, because the answer is a number rather than an opinion.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | reconciliation-report | produces | before-and-after delta against the agreed tolerance |
| knowledge | data | consumes | reads migration objects and cleansing rules |
| knowledge | standards | consumes | applies delivery conventions |
| q-gate | realize→deploy | gates-at | exit criteria: data reconciled |
