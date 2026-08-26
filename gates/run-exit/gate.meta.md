---
gate: run-exit
namespace: "@epam/sap"

gate-type: custom
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: "docs/skill-design-conventions.md"

verified-against-live-cloud-alm: "n/a"   # this gate has no Cloud ALM mechanism at all — see Notes
---

## Notes
The one Q-gate this factory owns end to end, mechanism and evidence both —
Activate's roadmap does not define a formal exit from Run, so unlike the
other five gates there is no SAP Cloud ALM checklist to borrow. Every open
item at closure gets exactly one of four dispositions (`Resolved`, `Carried
over — scheduled`, `Carried over — red flag`, `Escalated — traceability
gap`) — there is no silent fifth option. A skipped final `knowledge-harvest`
cycle is a hard blocker here, not a delay, because there is no next cycle
coming to catch the lesson.

`verified-against-live-cloud-alm` is set to `"n/a"` rather than the usual
`false`/date enum, because this gate has no Cloud ALM mechanism to verify
against in the first place — a deliberate, documented deviation from the
other five gates' field, not an oversight.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | run-exit-record | requires | the closure record itself — open-item disposition, harvest-cycle confirmation, CR-referral dispositions, named approver and date (produced by `knowledge-harvest`) |
| artifact | triage-verdict | requires | every open item for the period, by classification (produced by `defect-triage`) |
