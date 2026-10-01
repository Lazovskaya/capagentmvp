# Extensibility — Chapter Interpretation (Ch. 5)

Extracted from `knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`
(the cross-topic superset reference) for this skill's own chapter only. Clean Core and
Extensibility Strategy content beyond Chapter 5 has **no source chapter in the Readiness Check** —
write that content as forward-looking framework material and say so explicitly, never implying
it's report-derived.

## The core principle (applies to every topic, restated briefly)

**Absence of findings is not absence of risk.** Custom Code (Chapter 5) can be entirely empty:
*"No custom code analysis results have been uploaded. Please follow the steps in SAP Note
2913617."* When this happens, custom code impact is **unknown, not low** — flag it as a planning
gap and a real project risk (you cannot size a conversion workstream you have no data on), never
as "no custom code issues found."

## 5. Required Custom Code Adjustments

Two very different real states have both been observed here, and this skill needs to distinguish
them clearly:

- **No ATC data uploaded**: report explicitly says so. Custom code impact is unknown — flag as a
  project risk requiring immediate action (run ABAP Test Cockpit / SAP Note 2913617) before the
  conversion project can be realistically scoped or estimated.
- **ATC data present**: read the summary table (Total Findings, In-Scope vs. Not-in-Scope,
  breakdowns by Remediation Type, Priority, Usage, Application Component). "Technical Code
  Adaptation (Automated with Quick Fixes)" findings are largely mechanical/lower risk; "Functional
  Changes (Manual Efforts)" findings are the real effort driver and should size the
  functional-remediation workstream, not the raw finding count. Priority breakdown
  (Errors/Warnings/Information) further triages: SAP's own guidance is to resolve all Errors and
  Warnings and at minimum review Information findings — don't treat "Information" findings as
  safely ignorable without at least a sampling review.
- If the Usage breakdown (Used/Not Used/Referenced/Unknown) comes back almost entirely "Unknown,"
  say so — it means the client can't yet use this data to identify dead code for decommissioning,
  a missed cost-reduction opportunity worth naming, not a blocker.

## Mapping into the SAP SAD

| Chapter | Feeds SAD section | Also feeds |
|---|---|---|
| 5. Custom Code | 6.4 Clean Core Level Targets, 5.6 Integration Technical Debt Register | `dual_maintenance_retrofit.md` (change volume sizing) |

If this analysis feeds a `sad-drafting` engagement, say so explicitly and route each finding per
this table.
