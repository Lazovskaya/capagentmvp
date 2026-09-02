---
agent: readiness-analyst
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress
use-case: ["Readiness & simplification analysis"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [verdict, checked_against]
human-confirms: false                 # agent.md carries no `## Human-in-the-loop` section

assistant: [TBD]
---

## Notes
Isolated reviewer for `readiness-analysis`'s own `simplification-impact-report`
completeness check — runs the report's own validity checklist as a checkable
procedure, not a re-diagnosis. Ported (contract only) from sap-ai-cons's
`readiness-analyst`, which was itself an unbuilt `TARGET STUB` there; the
actual procedure here is this factory's own. Not yet wired as a standalone
bounded agent or dry-run tested.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | simplification-impact-report | consumes | reviews the draft against its own validity checklist |
