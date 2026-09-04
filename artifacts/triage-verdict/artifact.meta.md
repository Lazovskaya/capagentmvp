---
artifact: triage-verdict
namespace: "@epam/sap"

category: "SAP Activate / Realize"    # primary phase; also produced during Run hypercare — see Notes
sdlc-stage: in-test

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy, run-exit]
---

## Notes
One per item. Classification is a commercial statement (who pays: bug fixed
under the delivery fee vs. spec flaw is a change request), not a technical
one — the technical classification (sub-process/layer/severity) stays a
separate, cited input from `incident-triage` and siblings, never re-derived
here. Produced across two phases: Realize (`activities/realize/defect-triage.md`)
and Run hypercare (`activities/run/hypercare-triage.md`), both driven by the
same `defect-triage` skill and `defect-classifier` agent. `run-exit`'s gate
pulls every open item from this artifact's log for the closing period.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | defect-triage | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| skill | incident-triage | produced-by | TMP — second producer: writes the initial technical classification that `defect-triage`'s commercial verdict is then layered onto; mirrors this skill's own `produces` row |
| agent | defect-classifier | related | supplies the class/confidence/route/recommended_fix a named human confirms into this record |
| artifact | design-record | related | Delta-row comparisons cite the paired design-record |
| q-gate | realize-deploy | gates-at | rising `Untraceable` counts are a specific risk signal for this gate |
| q-gate | run-exit | gates-at | every open item at closure is pulled from this artifact's log |
