---
name: readiness-data-master-data
description: Analyze the Data & Master Data Management topic of a SAP Readiness Check for SAP S/4HANA report -- HANA Sizing/Data Volume Management (Chapter 6), Financial Data Quality (Chapter 8), and Customer Vendor Integration (Chapter 9.6) -- into a scoped findings brief, without loading the rest of the report's chapters. CVI is very often the single highest-severity finding in the whole report (a hard SAP prerequisite gate); this skill is what surfaces it. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic.
---

# Readiness Check — Data & Master Data Management

One of 6 topic-scoped skills split out of the former monolithic `readiness-analysis` (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the full
6-folder taxonomy this mirrors). This skill owns Chapters 6, 8, and 9.6 only.

Act as an experienced SAP technical architect: don't re-type what the report already says --
tell the project team what's a real blocker, what's routine, and what's missing because the
underlying data was never collected. **Never let CVI status get buried as "just another data
quality item"** -- it is a hard SAP prerequisite, not optional.

## When to use

Discover phase, as soon as Readiness Check output exists -- or standalone, any time master data
readiness, financial data quality, or sizing/archiving needs revisiting. Does not require
`readiness-analysis` to have run first.

## Inputs (contract)

- **Required:** the Readiness Check export.
- **Required:** `engagement_id`, to locate/write the cached extraction.

## Steps

1. **Reuse or run the extraction.** Check for
   `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` first; run it yourself if
   missing.
2. **Read only chapters 6, 8, and 9.6**, plus the relevant `supporting_data`/sidecars
   (`HANATopDatabaseTablesByDiskUsage`, `HANAColumnLoadableDatabaseTables`,
   `FinancialData*`, `GLClearedItemsRatio`, `GLDocumentsAndOpenItems`) -- skip every other chapter.
3. **Interpret using `references/chapter_interpretation.md`.** Always check and report CVI status
   (9.6) explicitly and first -- it is a hard prerequisite gate, not a routine data-quality line.
4. **Size Financial Data Quality effort by number of distinct inconsistency *types*, not raw
   count** -- check for a Category A (automatable) vs. B (manual) classification before treating a
   large raw number as alarming.
5. **Flag an empty Data Volume Management chapter (6.3) as a missed cost-reduction lever**, not a
   "nothing to archive" result -- cross-reference large tables from 6.2 as archiving candidates.
6. **Cite SAP references per the standing rule**: plain text for a Note/KBA number; hyperlink only
   when the extracted data itself contains a real URL (see `references/official_resources.md`).
7. If CVI isn't complete, raise it into `adr-log` as a mandatory, resourced, timelined
   pre-conversion workstream -- the highest-priority ADR this skill can raise. Also raise any
   live (not frozen/historical) Financial Data Quality risk signal and any DVM/archiving decision.

## References

- `references/chapter_interpretation.md` -- this topic's extracted chapter-by-chapter guidance.
- `references/official_resources.md` -- stable official SAP resource entry points + curation
  placeholders (never fabricate a specific deep-link URL).

## Output

- **`simplification-impact-report` artifact**, scoped to Chapters 6/8/9.6.
- HANA sizing findings feed `sizing-analysis` directly. Financial Data Quality and CVI findings
  feed Data Migration Architecture (SAD Section 7) in `sad-drafting`.
- When publishing to Confluence, this topic's content goes under "06 Data & Master Data
  Management" per
  `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent, or directly by the user for
a single-topic update).

## Status

In test -- split out of `readiness-analysis`. See `tools/parse-readiness-check-export/tool.md` for
the shared extraction tool's own verification status.
