---
artifact: reconciliation-report
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy]
---

## Notes
Before-and-after delta against a tolerance agreed *before* the load ran, not
chosen after seeing the result. The cleanest evidence in the factory — the
answer is a number against a tolerance, not an opinion. First concrete
instance is finance/DTV (Universal Journal, Asset Accounting, Material
Ledger); other migration domains follow the same shape once ported.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | reconciliation | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| knowledge | data | related | `data-transition-validation.md` candidate documents the first domain-pack instance (finance/DTV) |
| q-gate | realize-deploy | gates-at | "data reconciled within tolerance" is a named checklist item |
