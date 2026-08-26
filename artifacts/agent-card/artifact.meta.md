---
artifact: agent-card
namespace: "@epam/sap"

category: "SAP Activate / Run"
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []
---

## Notes
Purpose, owner, data scope, guardrails and eval pack — what AI Agent Hub
registers. `template.md` is currently a one-line stub. Its producing skill,
`agent-build`, is itself only referenced in `activities/run/agent-build.md`
and has no `/skills` folder of its own yet — treat `produced-by` below as
provisional until that skill is actually authored.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | agent-build | produced-by | TMP — provisional; `agent-build` has a `factory-data.json` entry but **no `/skills` folder or `skill.meta.md`** yet, so this edge has no `produces` row to mirror against |
| connector | joule-studio | related | where client-facing agents this card describes are built |
| connector | ai-agent-hub | related | where client-facing agents this card describes are governed |
