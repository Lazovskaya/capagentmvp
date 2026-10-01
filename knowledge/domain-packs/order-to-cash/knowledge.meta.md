---
knowledge_source: order-to-cash-domain-pack
namespace: "@epam/sap"
version: 0.1.0
owner: Vitaly_Malyshev@epam.com
project_types: [greenfield, brownfield, bluefield, ams]
sdlc_phases: [explore, realize, run]
access: repository
source_location: knowledge/domain-packs/order-to-cash/
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Swappable Order-to-Cash domain expertise: taxonomy, signal catalog, and 10 troubleshooting
decision trees. Ported from `sap-ai-cons`; reference-don't-copy SAP IP; no client data ever.
Content changes require a Knowledge Source version update.

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| `incident-taxonomy.md` | O2C incident sub-process taxonomy | Curated. |
| `incident-signal-catalog.md` | O2C incident signal catalog | Curated. |
| `subprocess-adjacency.md` | O2C sub-process adjacency map | Curated. |
| `routing-matrix.md` | O2C incident routing matrix | Curated. |
| `pricing-condition-technique.md` | Pricing condition technique | Curated. |
| `billing-ar-account-determination.md` | Billing/AR account determination | Curated. |
| `idoc-orders-invoic.md` | ORDERS/INVOIC IDoc reference | Curated. |
| `troubleshooting/` | 10 symptom-to-cause troubleshooting decision trees | See `troubleshooting/README.md` for the trees table. |
| `README.md` | Pack scope, provenance, and fill policy | Not a knowledge file itself. |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
