---
skill: solution-design
title: Solution design, architecture package & extensibility routing   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A]              # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [explore→realize]          # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Turns the complete in-scope fit-to-standard outcome into a coherent solution
architecture. Establishes architecture views and cross-artifact traceability,
then produces one design record and one extensibility record per delta. The
scope-level architecture package is the client-facing output and the
explore→realize handoff. Assembles from scattered sources with full
traceability when no single decision-log row covers the case.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | extensibility-assessor | requires | returns the extensibility tier, its justification, and red flags |
| agent | design-test-reviewer | requires | independent review of the design-record before Realize's transport-heavy work starts |
| agent | source-conflict-analyst | requires | provenance and contradiction analysis across a scattered source pack |
| artifact | architecture-package | produces | client-facing architecture index and explore→realize handoff |
| artifact | design-record | produces | target design, critiqued then approved |
| artifact | extensibility-record | produces | chosen extensibility tier plus its justification |
| knowledge | process | consumes | reads fit-to-standard outcomes |
| knowledge | config | consumes | reads config decisions |
| knowledge | data | consumes | reads migration-object context |
| knowledge | extensibility | produces | writes tier decisions and the modification register |
| knowledge | clean-core | consumes | applies SAP clean-core rules |
| knowledge | standards | consumes | applies delivery conventions |
| q-gate | explore→realize | gates-at | exit criteria: design approved, extensibility tier recorded |
