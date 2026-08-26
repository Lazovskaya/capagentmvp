---
artifact: fit-to-standard-run-summary
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in explore-realize's own Evidence-mapping table
---

## Notes
Accelerator run summary covering workshop preparation, decision log, app
mapping and fit-gap output. An orchestration summary only — it does not
replace its referenced artifacts, claim a workshop sign-off, select an
extensibility tier, or create work items. Produced by an **Agent**, not a
Skill — `fit-to-standard-accelerator` composes the five underlying skills'
outputs without reimplementing their logic.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | fit-to-standard-accelerator | produced-by | TMP — mirrors this agent's own `produces` row; remove once the catalog inverts the graph instead. Produced by an Agent directly, not a Skill — see Notes |
| artifact | workshop-preparation-plan | related | one of the five referenced outputs this summary assembles |
| artifact | process-app-mapping | related | one of the five referenced outputs this summary assembles |
| artifact | fit-gap-analysis | related | one of the five referenced outputs this summary assembles |
| artifact | workshop-candidate-register | related | one of the five referenced outputs this summary assembles |
