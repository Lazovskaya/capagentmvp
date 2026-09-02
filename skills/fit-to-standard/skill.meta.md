---
skill: fit-to-standard
title: Fit-to-standard workshops   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [functional]
engagement: [G, B]                 # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Fit-to-standard workshops"]

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [explore-realize]          # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Runs each in-scope process against SAP standard, decides standard-versus-delta
per step, and gets it signed. Produces the process bucket and a sign-off
record naming who accepted what. The discipline is recording the delta and
its justification together — a delta with no reason becomes a modification
nobody can defend at the next upgrade.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | requirements-intake | related | consumes normalized requirements as input where one exists |
| connector | signavio | requires | process scope and variants for workshop scoping |
| connector | calendar | requires | finds real availability and drafts (never sends) workshop invites |
| artifact | sign-off-record | produces | names who accepted standard-vs-delta per process step |
| knowledge | process | produces | writes fit-to-standard outcomes |
| knowledge | config | consumes | references config context during workshops |
| knowledge | standards | consumes | applies delivery conventions |
| q-gate | explore-realize | gates-at | exit criteria: fit-to-standard signed |
