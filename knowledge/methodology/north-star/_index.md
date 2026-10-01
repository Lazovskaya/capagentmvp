# North Star methodology — index

EPAM's SAP North Star delivery methodology, ported from a Confluence/PowerPoint export. See
`knowledge.meta.md` for the governed source declaration and the distribution caveat covering
`02-rba-and-rsa/`.

## Structure

| Location | Coverage |
|---|---|
| `01-leanix-application-portfolio-assessment.md` | LeanIX application portfolio assessment |
| `02-rba-and-rsa/` | SAP Reference/Solution Business Architecture material — release exports, customer pitch decks, a practitioner's guide, Business Data Objects, Technology Capability Model, and Analytical Table exports. **Contains SAP-sourced content — see the Notes section of `knowledge.meta.md`.** |
| `03-delivery-of-service-modules/01-architecture-vision/` | Architecture Evolution, Scoping and Vision, Transformation Readiness |
| `03-delivery-of-service-modules/02-strategy-and-motivation/` | Business Model Patterns, Strategy Mapping, Value Management |
| `03-delivery-of-service-modules/03-business-architecture/` | Business Capability, Business Process, Template Assessment & Guidelines |
| `03-delivery-of-service-modules/04-application-and-data-architecture/` | Analytics module + Delivery Suitcase |
| `03-delivery-of-service-modules/enablement-and-how-to-deliver.md` | How-to-deliver enablement overview for the whole methodology |

Each ADM-phase module under `03-delivery-of-service-modules/` generally follows an
A/B/C/D shape: `a-one-pager.md` (concept), `b-positioning-and-scoping.md` (scoping), a delivery
guide, and a report template.

## Exclusions

- `01-architecture-vision/transformation-readiness/00. OLD - DO NOT USE/` (2 files) was dropped —
  the source folder marked it stale.
- `02-strategy-and-motivation/value-management/` — the sibling source folder
  `Value Management (Business Case)/` held byte-identical copies of both its files
  (`A - Value Management One Pagers.md`, `B - Value Management Module Collaterals.md`) and was
  dropped as a confirmed duplicate; only `value-management/` is kept.

## Known content gaps

Two "A" one-pagers are unconverted-source placeholders — the original PowerPoint was encrypted and
could not be converted to Markdown:
- `03-delivery-of-service-modules/02-strategy-and-motivation/business-model-patterns/a-one-pager.md`
- `03-delivery-of-service-modules/01-architecture-vision/transformation-readiness/a-transformation-readiness-one-pager.md`

## Disambiguated near-duplicate filenames

These source folders had two similarly-named files that turned out to be genuinely different
content on inspection (`diff`), not simple renames — both are kept, disambiguated:

`03-business-architecture/business-capability/`:
| Kept as | Original filename |
|---|---|
| `a-one-pager.md` | `A- Business Capability One Pagers.md` (generic module one-pager) |
| `a-one-pager-short.md` | `A- Business Capability One Pager.md` (short worked example) |
| `b-positioning-and-scoping.md` | `B - Positioning and Scoping.md` |
| `b-positioning-and-scoping-deck.md` | `B- Business Capability Module- scoping and Positioning.md` |
| `c-delivery-guide.md` | `C- Business Capability- Delivery Guide.md` |
| `c-delivery-guide-q1.md` | `C - Delivery Guide Business capability Q1.md` |
| `d-report-template.md` | `D - Report Template.md` |
| `d-report-template-alt.md` | `D-Business Capability Report Template.md` |
| `data-collection-template-v1.0.md` | `Business Capability Data Collection Template V1.0.md` |
| `data-collection-template-short.md` | `Business Capability  data collection template.md` |
