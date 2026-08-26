---
artifact: sign-off-record
namespace: "@epam/sap"

category: "SAP Activate / Explore"    # primary phase (the fit-to-standard variant); also produced in Deploy by go-live-readiness/cutover-plan — see Notes
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [explore-realize, deploy-run]
---

## Notes
One current record per scope — a named signer, a stated authority to
accept. Reused across two different variants with the same acceptance
discipline but different source fields underneath, not two separate
artifacts: the Explore variant (`fit-to-standard` — decision-log Row ID
range, deltas accepted/rejected) and the Deploy go-live variant
(`cutover-plan` / `go-live-readiness` — go-live checklist reference,
checklist items closed / open with named risk acceptance, cutover rehearsal
reference). No entry, no gate pass, in either variant.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | fit-to-standard | produced-by | TMP — Explore variant; mirrors this skill's own `produces` row |
| skill | go-live-readiness | produced-by | TMP — Deploy go-live variant; mirrors this skill's own `produces` row |
| skill | cutover-plan | produced-by | TMP — Deploy go-live variant, cutover-rehearsal reference; mirrors this skill's own `produces` row |
| q-gate | explore-realize | gates-at | "fit-to-standard signed, per process" is a named checklist item |
| q-gate | deploy-run | gates-at | "every process area's checklist item closed" and "cutover rehearsed" are both named checklist items |
