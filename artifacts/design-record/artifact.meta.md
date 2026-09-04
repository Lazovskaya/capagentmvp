---
artifact: design-record
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-test

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [explore-realize]
---

## Notes
One per delta. Status must be `APPROVED` before `backlog-drafting`/Realize
build skills act on it — never silently reset `APPROVED` → `DRAFT`; use
`REOPENED` instead (see `artifacts/explore-chain/handoff.md`). Always
travels paired with `extensibility-record` by the same Row ID — the
design-record says *what* changes, the extensibility-record says *where
it's allowed to live and why*; neither is sufficient alone.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | solution-design | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| artifact | extensibility-record | related | always paired, same decision-log Row ID |
| agent | design-test-reviewer | related | independent reviewer consumes this record before Realize build starts |
| agent | source-conflict-analyst | related | for Mode B (compose/maintain), this agent's output feeds the "Source synthesis" section |
| q-gate | explore-realize | gates-at | design approved is a named checklist item |
