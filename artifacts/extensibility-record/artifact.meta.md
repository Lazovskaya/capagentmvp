---
artifact: extensibility-record
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [explore-realize]
---

## Notes
One per delta, paired with its `design-record` by the same Row ID — the
clean-core decision that sets the client's upgrade cost. Every rejected
tier needs its own stated reason, not just the winning one. Tier 5 requires
the mandatory escalation block (named escalation owner, addendum Row ID).
`backlog-drafting` cites this record's Row ID and chosen tier directly; it
never re-derives the decision.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | solution-design | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| artifact | design-record | related | always paired, same decision-log Row ID |
| agent | extensibility-assessor | related | recorded recommendation this record either agrees with or explicitly diverges from |
| q-gate | explore-realize | gates-at | "extensibility tier recorded and justified" is a named checklist item |
