---
skill: requirements-intake
title: Requirements intake   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [functional]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — none recorded in factory-data.json for this activity
---

## Notes
Normalizes a free-form ask, ticket, notes pack, or greenfield idea into one
requirements.md with explicit Source and Open questions; never invents
acceptance criteria. Hands off to fit-to-standard or solution-design Mode B —
not a substitute for backlog-drafting, and does not create backlinked backlog
items itself.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | fit-to-standard | chains-to | hands off normalized requirements for the standard-vs-delta decision |
| skill | solution-design | chains-to | hands off to Mode B when no fit-to-standard row covers the ask |
| artifact | requirements-record | produces | normalized requirements.md: source, goal, AC only if present, open questions |
| connector | jira | requires | pulls ticket context for intake |
| connector | cloud-alm | requires | pulls delivery/operations context for intake |
| knowledge | process | consumes | grounds the ask in known process scope |
| knowledge | standards | consumes | applies delivery conventions |
