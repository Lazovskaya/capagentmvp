# Gap Type → Documentation Artifact Mapping

*Source: SAP Activate Methodology, Fit-Gap analysis practice*

When a gap is confirmed in the Fit-to-Standard decision log, the **Gap Type** determines which
documentation artifact is required before Realize-phase work can start.

## Mapping Table

| Gap Type | Definition | Required Artifact | Factory Template |
|---|---|---|---|
| **Process / Functional** | Standard SAP process does not meet a business requirement; solution via config or extension | SAP Cloud ALM Requirements Backlog entry | `artifacts/fit-gap-analysis/template.md` → route to `solution-design` |
| **Workflow** | Approval or notification workflow not covered by standard SAP workflow | WRICEF Functional Specification — Workflow | `artifacts/wricef-workflow/template.md` |
| **Report** | Required business report not available as a standard Fiori app or ABAP report | WRICEF Functional Specification — Report | `artifacts/wricef-report/template.md` |
| **Interface / Integration** | Data exchange with a non-SAP or legacy system required | Business Scenario Design Document + separate integration spec (not ABAP FS) | `artifacts/business-scenario-design/template.md` |
| **Conversion** | Data upload from legacy systems or flat-file exchange | WRICEF Functional Specification — Conversion | `artifacts/wricef-conversion/template.md` |
| **Enhancement (simple)** | BAdI, CMOD, or BTE — does not change data model or UI | WRICEF Functional Specification — Enhancement (Simple) | `artifacts/wricef-enhancement-simple/template.md` |
| **Enhancement (complex)** | Custom app, new transaction, or major UI change | WRICEF Functional Specification — Enhancement (Complex) | `artifacts/wricef-enhancement-complex/template.md` |
| **Print Form** | Custom output form (invoice, delivery note, order confirmation) | WRICEF Functional Specification — Print Form | `artifacts/wricef-print-form/template.md` |
| **Legal / Localisation** | Country-specific legal, tax, or regulatory requirement | Separate localisation spec + SAP Localisation Hub / DRC assessment | Assess SAP DRC / SAP Localisation Hub before commissioning custom development |

## Decision Logic

```
Gap confirmed (Disposition = Extension or Custom Dev)
  ↓
What is the Gap Type?
  ├── Workflow          → wricef-workflow FS
  ├── Report            → wricef-report FS
  ├── Interface         → business-scenario-design + integration spec
  ├── Conversion        → wricef-conversion FS
  ├── Enhancement       → wricef-enhancement-simple or -complex FS (check UI/data model impact)
  ├── Print Form        → wricef-print-form FS
  ├── Legal/Local       → check SAP DRC / Localisation Hub FIRST; FS only if no standard path
  └── Process/Functional → solution-design (design-record + extensibility-record)
```

## Notes

- **Interface gaps**: The WRICEF FS covers only the ABAP-side development. The integration
  definition and data mapping live in a separate document. Do not conflate the two.
- **Legal/Localisation gaps**: Always assess SAP Localisation Hub and SAP Document and Reporting
  Compliance (DRC) before commissioning custom development. Many country-specific requirements
  are covered by SAP standard localisation content.
- **Re-classification**: A gap initially typed as Enhancement may be re-typed as Config if the
  Delta Design Workshop identifies a standard configuration path. Update the backlog entry before
  creating any FS.
