# Simplification-impact report — readiness-analysis

This is the artifact the `discover→prepare` Q-gate reads to size the conversion before anyone
commits to a date. Split from `assessment-report` (which is agent-readiness's agent-candidate
scoring — a different shape entirely) because the two got conflated under one artifact name despite
answering unrelated questions.

- **Client / engagement:**
- **Assessment date:**
- **Assessor (architect):**
- **Source exports covered:** <name what was actually triaged, e.g. "Readiness Check export
  2026-08-01, SI-Check export 2026-08-01, scope: FI/CO/SD">

## Executive risk summary (`executive_risk_summary`)

Only when the full Readiness Check report (not just an SI-Check export) was analyzed. The handful
of items that are genuine blockers or need a business decision *before* the conversion project can
be properly scoped (CVI not complete, custom code analysis never run, an incompatible add-on, a
Mandatory/Before-project Simplification Item).

- <item>

## Data collection gaps (`data_collection_gaps`)

Every chapter/subsection that came back empty due to missing analysis — listed explicitly as
"impact unknown," never silently dropped or conflated with a genuinely clean result. Custom Code,
Data Volume Management, and Add-On Compatibility routinely come back empty because the check was
never run, not because there's nothing to find.

| Chapter | Reason data is missing |
|---|---|

## Per-chapter findings (`chapter_findings`)

Only when the full Readiness Check report was analyzed. Covers all eight chapters —
Simplification Items, Custom Code, HANA Sizing, Integration, Financial Data Quality,
Fiori/Business Process Discovery, Planned Downtime, Customer Vendor Integration.

| Chapter | Severity | Summary (cite the concrete number) | SAD section it feeds |
|---|---|---|---|
| | blocker / needs_decision / routine / clean | | |

## Per-module findings (Simplification Items detail, `findings`)

Every row gets a stable `id` (e.g. `SI-014`) at the time it's first written — a re-run, an
`adr-log` entry, or `sad-drafting` cites this id rather than re-describing the item in prose.

| ID | Module | Simplification item | SAP Note(s) | Custom code hit | Genuinely blocks? | Effort implication | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | Blocks / Appears only / Assessment required | | <why it does or doesn't actually block, or — for Assessment required — exactly what evidence is missing to decide either way> |

## Items that merely appear in the report

<Findings the export flagged that don't actually apply to this client's usage — named here so
nobody re-raises them later as "didn't we miss this?" without a documented answer.>

| Module | Simplification item | Why it doesn't apply here |
|---|---|---|

## Validity checklist before this report is considered complete

- [ ] Every finding has a stable `id`, and every finding is marked Blocks, Appears-only, or
      Assessment-required — none left unclassified to "keep the report moving," and none forced
      into Blocks/Appears-only when the evidence is genuinely inconclusive
- [ ] Every "Blocks" row names the custom code or config it actually hits, not just the SAP Note number
- [ ] Every "Appears only" row states the specific reason it doesn't apply, not "not relevant"
- [ ] This report states which exports it covers and their date — a stale export is a silent risk
