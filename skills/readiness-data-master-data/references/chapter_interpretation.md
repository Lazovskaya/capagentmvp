# Data & Master Data Management — Chapter Interpretation (Ch. 6, 8, 9.6)

Extracted from `knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`
(the cross-topic superset reference) for this skill's own chapters only.

## The core principle (applies to every topic, restated briefly)

**Absence of findings is not absence of risk.** Data Volume Management (archiving potential) can
come back as *"there is no document type"* — meaning the analysis wasn't run, not that there's
nothing to archive. Report gaps as their own finding, separate from a genuinely clean result (e.g.
Asset Accounting/Material Ledger explicitly stating "No Inconsistencies were Found" *after*
running a real check is a genuinely clean result and should be reported as such).

## 6. SAP HANA Hardware Size and Data Volume Reduction Potential

- **6.1 Sizing Simulation**: if "Future Database Growth," "Data Volume Reduction," and "New
  Functionality" all show 0 GiB, that means the client hasn't supplied better estimates — a raw,
  unadjusted baseline, not a claim that growth/reduction will actually be zero.
- **6.2 HANA Sizing**: the Top-N-largest-tables table is one of the most concretely useful
  artifacts in the whole report for architecture purposes. If custom Z-tables appear in the top
  20, that's a direct signal for the custom-code (`readiness-extensibility`) and data-archiving
  conversation.
- **6.3 Data Volume Management** (archiving potential): if empty, this is a missed
  pre-conversion cost-reduction lever, not a non-issue — archiving before conversion directly
  shrinks the sizing numbers from 6.1/6.2 and the downtime estimate
  (`readiness-technical-architecture`, Ch. 9.5).

## 8. Financial Data Quality

SAP's own framing: *"Resolving data consistency issues will help you accelerate the conversion
process and avoid unexpected showstoppers."* Three sub-areas (General Ledger, Asset Accounting,
Material Ledger), each split into Inconsistencies / Documents-or-Assets / Facts and Figures.

- **Size effort by number of distinct inconsistency *types*, not raw inconsistency count.** Check
  whether SAP provides a Category A (standard/automatable) vs. B (manual) classification and a
  referenced Note before treating a big raw number as alarming.
- **Clean results are common and genuinely mean clean** — don't manufacture concern where the data
  doesn't support it.
- Watch the by-fiscal-year trend in the Documents table: a recent/current fiscal year with a
  disproportionately high inconsistency rate compared to prior closed years is a live, active risk
  signal, distinct from historical inconsistencies that are effectively frozen.

## 9.3. Business Process Discovery (minor note)

Not this skill's main focus, but reported here per
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`'s chapter
mapping, since it directly affects data volume: SAP's own framing is explicit -- *"will not
prevent you from converting your system (no showstopper) yet is highly recommended to address in
advance."* Covers process automation rate, transactional backlog (old open documents), and
non-standard order type proliferation. Treat as a pre-conversion housekeeping/optimization
opportunity, not a blocker -- but a real one, since backlog documents directly affect
archiving/migration volume (Ch. 6.3) and the downtime estimate
(`readiness-technical-architecture`, Ch. 9.5).

## 9.4/9.7. SAP Innovative Business Solutions / Business AI Capabilities (informational only)

Both are typically informational/roadmap scope with no conversion-risk implication: **9.4** is
frequently just "No SAP Innovative Business Solutions available" -- a normal, uninteresting result
for most on-prem ERP-only landscapes, not a gap. **9.7** is a readiness-status summary against
SAP's Business AI capability catalog -- useful for a future-state roadmap discussion, not a
migration blocker.

## 9.6. Customer Vendor Integration (CVI) Analysis

This is a **hard prerequisite gate**, not an optional data quality note. SAP's own text: *"Only
SAP customers with Customer/Vendor Integration completed can convert an SAP ERP 6.0 system to SAP
S/4HANA."* If CVI isn't already complete, that is a **mandatory pre-conversion project** in its
own right, with its own master-data-quality risk (SAP explicitly recommends running the Master
Data Consistency Check, Note 2743494, well in advance — doing it late is called out by SAP as a
direct cause of project delays). Always check and report CVI status explicitly; never let it get
buried as "just another data quality item."

## Mapping into the SAP SAD

| Chapter | Feeds SAD section | Also feeds |
|---|---|---|
| 6. HANA Sizing / DVM | 2.1 System Landscape (sizing) | `instance_strategy_decision_matrix.md` (size/scalability criterion) |
| 8. Financial Data Quality | 7.1 Data Migration Architecture | 13. ADR (cleanup-before-migrate decisions) |
| 9.3 Business Process Discovery | 6.3 Data Volume Management (archiving lever) | 9.5 Planned Downtime Calculator (`readiness-technical-architecture`) |
| 9.6 CVI Analysis | 7.2 Master Data Management | 13. ADR (mandatory pre-conversion gate), IV.IV Constraints |

If this analysis feeds a `sad-drafting` engagement, say so explicitly and route each finding per
this table. HANA sizing findings also feed `sizing-analysis` directly.
