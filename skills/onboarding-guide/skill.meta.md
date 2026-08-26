---
skill: onboarding-guide
title: Team onboarding   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Prepare"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [delivery]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [prepare-explore]          # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Role-aware path through the knowledge base for a new joiner, ending at a
recorded ready-to-take-a-ticket checkpoint. It is also that knowledge base's
own test harness: if someone cannot reach first-ticket-ready without a human
explaining things verbally, the knowledge base is not real yet.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | jira | requires | work-item context used during onboarding |
| artifact | onboarding-record | produces | ready-to-take-a-ticket evidence |
| knowledge | process, config, custom-code, clean-core, extensibility, data, testing, operations, standards | consumes | reads all nine knowledge buckets as the onboarding path |
| q-gate | prepare-explore | gates-at | exit criteria: team onboarded |
