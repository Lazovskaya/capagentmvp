# Simplification impact report

Findings brief from a SAP Readiness Check export, produced by `skills/readiness-analysis`.
Mirrors this artifact's `schema.json` (kept in the factory source; not shipped in a lean client
package).

- **`executive_risk_summary`** -- the handful of items that are genuine blockers or need a
 business decision before the conversion project can be properly scoped.
- **`data_collection_gaps`** -- every chapter/subsection that came back empty due to missing
 analysis, listed explicitly as "impact unknown" -- never silently dropped or conflated with a
 genuinely clean result.
- **`chapters`** -- one entry per report chapter/subchapter actually analyzed:

| Number | Heading | Severity | Finding | Supporting number | SAD section |
|---|---|---|---|---|---|
| | | Blocker / Needs decision / Routine / Clean | | | |

- **`severity`** -- an export flag is not itself a verdict; state the reason a finding is
 `Blocker` rather than letting volume in the export imply impact.
- **`supporting_number`** -- cite the concrete figure (company codes, findings count, downtime
 hours), never just "high effort" with no number behind it.
- **`sad_section`** -- names which SAP SAD template section this finding feeds, per
 `../../knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`'s mapping table, so the brief is directly
 usable as `sad-drafting`'s input rather than needing manual re-triage later.
- **`review_status`** -- distinct from `severity`; a `Blocker` finding can still be `unreviewed`.
