---
agent: defect-classifier
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [class, confidence, route, recommended_fix, evidence]
human-confirms: true

assistant: [TBD]
---

## Notes
Bounded-worker form of `defect-triage`'s commercial bug-vs-spec-flaw call —
serves both Realize triage and Run hypercare. Refuses to reason through a
verdict on an unverified upstream classification (`blocked — pending intake`)
and never invents a fix for `custom`-layer items, those get scoped for a
developer instead. `class` tokens map 1:1 to `triage-verdict/schema.json`'s
`classification` enum — never introduce a third spelling. The classification
is commercial (delivery fee vs. change request), so a named human always
confirms before the verdict is final; `triage-verdict` records who.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | design-record | consumes | for Delta rows, compares reported behavior against the paired design decision |
| artifact | extensibility-record | consumes | for Delta rows, paired with the design-record comparison |
| artifact | triage-verdict | related | verdict fields map 1:1 to this artifact's schema, but `defect-triage` is what actually writes it |
