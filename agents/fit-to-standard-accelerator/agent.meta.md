---
agent: fit-to-standard-accelerator
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [referenced_outputs, overall_status, gaps, next_steps]
human-confirms: false                 # agent.md carries no `## Human-in-the-loop` section

assistant: [TBD]
---

## Notes
Bounded Explore-phase orchestrator (`EPMCSAPAI-243`) that composes existing
`workshop-preparation`, `fit-to-standard`, `fiori-app-mapping`,
`fit-gap-analysis` and `workshop-transcript-intake` outputs into a reviewable
`fit-to-standard-run-summary` — never reimplements their logic, and makes no
FTS decision, sign-off, or extensibility-tier inference itself.

**Not an orphan**, despite being sometimes listed as one: this agent has a
real `factory-data.json` entry (`components[]`, phase Explore, status
`notstarted`) *and* a real `activities[]` reference (the `fit-to-standard`
activity's `uses.agent`). Both fields above are sourced, not guessed.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | workshop-preparation | requires | first sub-skill run, in dependency order |
| skill | fit-to-standard | requires | second sub-skill run, in dependency order |
| skill | fiori-app-mapping | requires | third sub-skill run, when an app export is available |
| skill | fit-gap-analysis | requires | fourth sub-skill run, in dependency order |
| skill | workshop-transcript-intake | requires | fifth sub-skill run, in dependency order |
| artifact | fit-to-standard-run-summary | produces | referenced outputs, overall status, explicit gaps and next steps |
