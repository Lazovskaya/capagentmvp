---
skill: config-doc
title: Configuration & documentation   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [functional]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [realize-deploy]           # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Makes the customizing change, records what changed and why, and attaches the
transport, as one unit rather than three tasks that drift apart. This is the
fattest role's daily work, and the activity that generates most of what
triage later reads.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | config-record | produces | what changed in customizing, and why |
| artifact | transport-record | produces | transport ID recorded by construction, not by hand |
| knowledge | config | produces | writes config decisions and rationale |
| knowledge | process | consumes | ties the config change back to the process decision |
| knowledge | standards | consumes | applies delivery conventions |
| q-gate | realize-deploy | gates-at | exit criteria: config documented |
