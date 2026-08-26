# Gap Disposition Taxonomy — SAP Activate Fit-to-Standard

*Source: SAP Activate Methodology, cross-referenced with S4H_885 and Fit-Gap analysis practice*

This taxonomy defines how every identified gap is classified in the Fit-to-Standard backlog.
The `fit-gap-analysis` skill applies these dispositions; `solution-design` selects the extensibility tier
for every gap classified as Extension or Custom Dev.

---

## Core Principle: Why Not Standard?

> "Every deviation from SAP standard increases development cost and post-go-live maintenance complexity.
> SAP Activate requires justifying **why the standard does not work** before any Extension or Custom Dev
> is approved. The burden of proof is on the gap, not on the standard."

No gap should be classified as Extension or Custom Dev without a documented business justification
and a confirmed business impact if the gap is not closed. Always check whether a standard or
configuration solution exists before escalating to Extension.

---

## Fit-to-Standard Outcomes (Three Categories)

| Outcome | When it applies | Next step |
|---|---|---|
| **Standard covers** | SAP standard process fully meets the requirement | Document configuration values in backlog |
| **Alternative standard applicable** | A different standard SAP process meets the requirement with a process change | Prototype the alternative; update process scope |
| **Standard does not cover** | No standard or configuration path meets the requirement | Escalate to Delta Design Workshop; enter as Extension or Custom Dev |

---

## Disposition Values

### Standard
The requirement is fully met by the SAP standard process with no configuration change.
No backlog item created. Document confirmation in the decision log.

### Config
The requirement is met through standard SAP customizing (SPRO / SAP Central Business Configuration).
Configuration values are documented in the backlog. No custom development required.
*Examples: document types, number ranges, tolerances, org structure assignments.*

### Extension
The requirement cannot be met through configuration alone but can be addressed with a
**minimal-footprint extension** that does not compromise upgrade safety:
- BAdI / Enhancement Spot (ABAP Cloud — released API)
- Key User Extensibility (in-app: custom fields, custom logic, custom CDS)
- SAP Build Apps / SAP Build Process Automation (side-by-side)

Extension **does not mean full custom development**. An Extension must use a released SAP API
and must pass the clean-core checklist in `knowledge/clean-core/upgrade-safety-checklist.md`.

> Re-classification rule: some gaps initially logged as Extension may be reclassified as
> **Config** if the Delta Design Workshop identifies a standard configuration path. Always
> verify before starting development.

### Custom Dev
The requirement requires **custom ABAP development, a custom integration, or a custom report**
that goes beyond key-user extensibility. This classification:
- Has a direct budget impact
- Requires a Functional Specification (see `artifacts/wricef-*/`)
- Must be approved by the SAP Solution Lead or Architect
- Increases upgrade effort and long-term maintenance cost

*Applies to: complex ABAP enhancements, custom workflows, outbound/inbound interfaces via
SAP Integration Suite CPI, custom forms (Adobe Forms / Smart Forms), custom ABAP reports.*

### Out of Scope
The requirement is not addressed in this implementation phase. Documented in the backlog
with a reason and deferred to a future wave. Must have an explicit owner and decision date.

---

## Gap Types and Documentation Artifacts

Each gap has a **Gap Type** that determines which documentation artifact is required:

| Gap Type | Definition | Documentation artifact |
|---|---|---|
| **Process / Functional** | Standard SAP process does not meet a business requirement | SAP Cloud ALM Requirements Backlog entry |
| **Workflow** | Approval or notification workflow not covered by standard | `artifacts/wricef-workflow/template.md` |
| **Report** | Required business report not available in standard | `artifacts/wricef-report/template.md` |
| **Interface / Integration** | Data exchange with a non-SAP system required | `artifacts/business-scenario-design/template.md` + separate integration spec |
| **Conversion** | Data upload from legacy systems or flat-file exchange | `artifacts/wricef-conversion/template.md` |
| **Legal / Localisation** | Country-specific legal or tax requirement | Separate localisation spec + SAP Localisation Hub / DRC assessment |

---

## Required Fields per Gap Entry

Every gap in the backlog must have:

| Field | Allowed values | Notes |
|---|---|---|
| Gap ID | GAP-001, GAP-002 … | Stable ID assigned at creation; never reused |
| Module | FI / CO / SD / MM / PP / HR / PM / PS / QM / WM | SAP module |
| Process | Text description | Links to scope item or process step |
| Standard Coverage | Full / Partial / None | How much the standard covers |
| Gap Description | Free text | Plain-language description of the delta |
| Gap Type | Process / Workflow / Report / Interface / Conversion / Legal | See table above |
| Priority | High / Medium / Low | Initial assessment; superseded by MoSCoW in DDW |
| Disposition | Standard / Config / Extension / Custom Dev / Out of Scope | See definitions above |
| Effort (days) | Numeric | Development + test estimate |
| Status | Open / In Analysis / Closed | |
| Owner | Name | Business owner who confirmed the requirement |

### Additional fields required for Delta Design Workshop (Extension / Custom Dev)

| Field | Description |
|---|---|
| Business Justification | Why is this requirement necessary? What business rule or obligation drives it? |
| Business Impact | What happens if this gap is not closed? (compliance risk, process failure, financial impact) |
| MoSCoW Priority | Must Have / Should Have / Could Have / Would be nice |
| Value Driver | Link to the business case KPI this gap supports |
| Assumptions | Dependencies and open questions that affect the solution |

---

## MoSCoW Prioritisation

Applied during Delta Design Workshop for all Extension and Custom Dev gaps.

| Priority | Definition | Typical examples |
|---|---|---|
| **Must Have** | Legal, compliance, or contractual obligation — cannot go live without it | Tax filing requirements, SOX controls, mandatory integrations |
| **Should Have** | Important for business operations; workaround exists but is costly | Approval workflow above threshold, critical reports |
| **Could Have** | Desirable; workaround is acceptable | Enhanced output formats, convenience reports |
| **Would be nice** | Low impact; defer to future wave | Minor UI improvements, non-critical automations |

---

## Example Gaps by Module

| Gap ID | Module | Process | Standard Coverage | Disposition | Gap Type | Business Justification |
|---|---|---|---|---|---|---|
| GAP-001 | FI | Period-end closing approval | Partial | Extension | Workflow | Internal SOX policy requires CFO sign-off before period close; standard workflow does not support multi-level approval with delegation |
| GAP-002 | SD | Delivery scheduling with customer-specific lead time | Partial | Config | Process | Customer SLA requires 48-hour lead time buffer; configurable via route determination |
| GAP-003 | MM | Physical inventory with mobile device | Full | Standard | Process | SAP standard MI01/MI07 covers mobile inventory counting via Fiori |
| GAP-004 | PP | MES integration for production confirmation | None | Custom Dev | Interface | Production line uses legacy MES; requires real-time integration via SAP Integration Suite CPI |
| GAP-005 | FI/CO | Custom profitability report by product line | Partial | Custom Dev | Report | Board-mandated P&L format differs from standard CO-PA; requires custom ABAP report |
| GAP-006 | HR | Overtime calculation per regional labour law | Partial | Extension | Legal | Regional Labour Code requires specific overtime calculation rules not covered by standard PCR/CAP schemas |
| GAP-007 | PM | Preventive maintenance plan copied from CMMS | None | Custom Dev | Interface | Existing CMMS holds 10 years of maintenance history; one-time migration + ongoing sync required |
| GAP-008 | SD | Customer-specific output form | None | Custom Dev | Report | Corporate branding standard requires custom invoice layout; implement via Adobe Forms |
| GAP-009 | FI | VAT reporting for tax authority portal | None | Extension | Legal | Local DRC / SAP Localisation Hub covers e-invoicing; assess before commissioning custom development |
| GAP-010 | SD | Credit limit override notification | Partial | Extension | Workflow | Credit manager must be notified in real time when a rep overrides a credit block; configurable via BAdI in credit management |
