---
knowledge_source: north-star-methodology
namespace: "@epam/sap"
version: 0.1.0
owner: maksim_siarheichyk@epam.com
project_types: [greenfield, brownfield, bluefield, ams, discovery, consulting, enterprise-architecture]
sdlc_phases: [discover, prepare, explore]
access: repository
source_location: knowledge/methodology/north-star/
provenance:
  source: internal
---

## Notes
EPAM's SAP North Star delivery methodology: architecture-vision, strategy, business-architecture,
and application/data-architecture modules (one-pagers, positioning/scoping guides, delivery
guides, report templates), organized by ADM-like phase under
`03-delivery-of-service-modules/`. Ported from a Confluence/PowerPoint export; two "A" one-pagers
are unconverted-source placeholders (see `_index.md`).

`02-rba-and-rsa/` additionally carries SAP-sourced reference-architecture material (an SAP
"Business Data Objects" export marked "SAP Internal and Customers", an SAP Technology Capability
Model export, SAP customer pitch decks, and Analytical Table exports containing raw SAP DITA-OT
HTML with `(C) Copyright` notices). This conflicts with this repo's own `CONTRIBUTING.md` guidance
and `docs/adr/0001-knowledge-organization-and-distribution.md` against committing bulk SAP
extracts (EPMCSAPAI-239) — included here on explicit instruction from the content owner, not
because the conflict is resolved. Flag for review by whoever owns EPMCSAPAI-239/ADR 0001 before
this source ships into any client-facing project; do not treat its presence here as a precedent
for future SAP-sourced content.

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| `01-leanix-application-portfolio-assessment.md` | LeanIX application portfolio assessment | |
| `02-rba-and-rsa/` | SAP Reference/Solution Business Architecture material | Contains SAP-sourced content — see Notes above |
| `03-delivery-of-service-modules/01-architecture-vision/` | Architecture evolution, scoping & vision, transformation readiness | |
| `03-delivery-of-service-modules/02-strategy-and-motivation/` | Business model patterns, strategy mapping, value management | |
| `03-delivery-of-service-modules/03-business-architecture/` | Business capability, business process, template assessment & guidelines | |
| `03-delivery-of-service-modules/04-application-and-data-architecture/` | Analytics module + delivery suitcase | |
| `03-delivery-of-service-modules/enablement-and-how-to-deliver.md` | How-to-deliver enablement overview | |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
