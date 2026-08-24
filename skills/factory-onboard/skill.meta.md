---
skill: factory-onboard
title: Factory onboarding (user entry)   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [delivery]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — meta-skill, no client artifact/gate evidence by itself
---

## Notes
User helper after install: day-0 orientation for a consultant using the
factory on a project, then phase/engagement/domain routing to the first
delivery skill. Not a contributor/platform guide — it is meta for the user,
producing no client artifact and no Q-gate evidence by itself.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| knowledge | standards | consumes | reads delivery conventions while routing |
| knowledge | domain-packs | consumes | reads available domain packs to route by domain |
