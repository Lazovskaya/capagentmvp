---
artifact: onboarding-record
namespace: "@epam/sap"

category: "SAP Activate / Prepare"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [prepare-explore]
---

## Notes
One per joiner. Person-readiness and knowledge-base defects are tracked as
independent verdicts — a joiner can be `Ready` while defects were found and
logged; neither status is inferred from the other. A `Validated` bucket
that fails its understanding check or the end-to-end ticket test routes to
`knowledge-discovery` as a **reopen**, distinct from a bucket merely never
validated in the first place.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | onboarding-guide | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| q-gate | prepare-explore | gates-at | "team onboarded, ready-to-take-a-ticket evidenced" is a named checklist item |
