# Decision matrix: RICEFW disposition

Consultant decision guide for the custom code handling section of the Brownfield SAD.
Uses ATC (ABAP Test Cockpit) findings from the readiness artifact and the agreed business
process scope to classify each RICEFW category.

## RICEFW categories

| Code | Category | Typical conversion impact |
|---|---|---|
| **R** | Reports | Usually low — most reports need only repoint to S/4HANA tables/APIs |
| **I** | Interfaces | Medium-high — idocs, BAPIs, RFC destinations; check against S/4HANA API catalog |
| **C** | Conversions (data migration) | Handled separately under data-migration-architecture matrix |
| **E** | Enhancements (user exits, BADIs, implicit enhancements) | Medium — audit for replaced/deprecated enhancement spots |
| **F** | Forms (SAPScript, SmartForms, Adobe Forms) | Low-medium — form rendering unchanged but check data sources |
| **W** | Workflow | Low-medium — classic WS workflow unaffected; SAP Workflow Builder step deprecated in some paths |

## Disposition options per object

| Disposition | Meaning | When to use |
|---|---|---|
| **Keep as-is** | No change needed; object passes ATC without errors or warnings | ATC clean, S/4HANA functional equivalent exists, no simplification impact |
| **Adapt** | Object requires adjustment for S/4HANA compatibility | ATC findings: replaced APIs, removed function modules, changed table structures |
| **Retire** | Object no longer needed in S/4HANA scope | Process retired in scoping, duplicate functionality, superseded by standard |
| **Replace with standard** | Equivalent standard S/4HANA functionality exists | Fiori app or standard process covers the use case; custom object is redundant |

## Decision approach

1. Load the ATC summary from the readiness artifact — group findings by RICEFW category.
2. For each category, present the count of objects and ATC severity distribution.
3. Confirm the default disposition strategy per category (e.g. "all R objects: adapt unless
   ATC-clean; ATC-clean R objects: keep as-is").
4. Flag any objects in the `business-process-scope` that have ATC errors — these need
   individual review, not a blanket category decision.
5. Record the confirmed per-category disposition strategy.

## Recording the decision

Confirmed disposition strategy → ADR entry:
- `decision_type: scope-boundary`
- `stage: sad-drafting`
- `title: RICEFW disposition strategy — <summary>`
- `description`: per-category confirmed disposition, total object count, estimated adapt effort
- `rationale`: cite ATC findings count and scoping decisions that drove retirements
