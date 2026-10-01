---
name: readiness-business-architecture
description: Analyze the Business Architecture topic of a SAP Readiness Check for SAP S/4HANA report -- Simplification Items (Chapter 3) and Compatibility Scope Analysis (Chapter 4) -- into a scoped findings brief and the Simplification-Item-to-business-process mapping, without loading the rest of the report's chapters. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic after new client input arrives.
---

# Readiness Check — Business Architecture

One of 6 topic-scoped skills split out of the former monolithic `readiness-analysis` (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the full
6-folder taxonomy this mirrors). This skill owns Chapters 1 (context), 3, and 4 only -- it does not
load interpretation guidance for Sizing, Integration, Security, or any other topic, which is the
point of the split: a single-topic update costs a fraction of the tokens the old monolithic skill
did.

Act as an experienced SAP technical architect: don't re-type what the report already says --
tell the project team what's a real blocker, what's routine, and what's missing because the
underlying data was never collected.

## When to use

Discover phase, as soon as Readiness Check output exists for a Brownfield S/4HANA conversion --
or any time after, standalone, to re-check just Business Architecture (e.g. after a client
clarifies a Simplification Item's applicability). Does not require `readiness-analysis` to have
run first.

## Inputs (contract)

- **Required:** the Readiness Check export (folder preferred over bare `.docx`, per
  `tools/parse-readiness-check-export/tool.md`).
- **Required:** `engagement_id`, to locate/write the cached extraction.
- **Optional:** a companion "SAP ERP Usage and Data Profiling" report, which can resolve a real
  share of Chapter 3's "Relevance cannot be automatically determined" items (see
  `references/simplification_items_guide.md` §3).

## Steps

1. **Reuse or run the extraction.** Check for
   `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` first. If it doesn't exist,
   run it yourself:
   ```
   python3 tools/parse-readiness-check-export/scripts/extract_readiness_check.py <export_folder/> workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json
   ```
   Any other topic skill invoked later in the same engagement will reuse this same cached file --
   don't write to `/tmp`, which doesn't survive across sessions.
2. **Read only chapters 1, 3, 4** from the extraction (plus `supporting_data.RelevantSimplificationItems`
   and, if present, the `Activities` sidecar) -- skip every other chapter's data entirely.
3. **Interpret using `references/chapter_interpretation.md`** (this topic's own extracted
   guidance) and **`references/simplification_items_guide.md`** (read before triaging Chapter 3
   for real -- the Category taxonomy, Effort Ranking distinction, and ST03N gap pattern all live
   there).
4. **Draft the findings brief** scoped to Chapters 1/3/4 only: executive risk summary, data-
   collection gaps, per-item findings (severity: Blocker/Needs decision/Routine/Clean/Data gap,
   concrete number, SAD-section routing per the mapping table in `references/chapter_interpretation.md`).
5. **Produce `business-process-impact-list`**: Simplification Item to candidate business process
   mapping, explicitly marked client-applicability-unverified -- this skill is its sole owner.
6. **Cite SAP references per the standing rule**: plain text for a Note/KBA number; a real
   hyperlink only when the extracted report data itself contains one (see
   `references/official_resources.md`).
7. Raise every Mandatory+Before-project+Business-Decision Simplification Item, and every
   "(alternative planned)"/"(no alternative planned)" business-critical item, into `adr-log` as
   its own entry -- not optional, and not bundled into one ADR per Simplification Item Analysis
   page (see `../../../knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`'s
   note on ADR granularity: one entry per independent decision).

## References

- `references/chapter_interpretation.md` -- this topic's extracted chapter-by-chapter guidance.
- `references/simplification_items_guide.md` -- Chapter 3 deep-dive: Category taxonomy,
  "(default)" vs "(calculated)" Effort Ranking, ST03N 12-month data-gap pattern, triage priority
  order. Read before triaging Chapter 3 for real -- it's `conversion-scoping`'s direct input.
- `references/official_resources.md` -- stable official SAP resource entry points + curation
  placeholders (never fabricate a specific deep-link URL).

## Output

- **`simplification-impact-report` artifact**, scoped to Chapters 1/3/4 (per-chapter findings with
  severity, blocker status, data gaps, caveats, and SAD-section routing).
- **`business-process-impact-list` artifact**: unverified until `conversion-scoping` confirms it
  against the RBA/RSA catalog.
- Feeds the `discover-prepare` Q-gate for its topic. Feeds `conversion-scoping` directly.
- When publishing to Confluence, this topic's content goes under "01 Business Architecture" per
  `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent, or directly by the user for
a single-topic update).

## Status

In test -- split out of `readiness-analysis` (previously "In test" against a synthetic export; not
yet run against a real client export as a standalone topic skill). See
`tools/parse-readiness-check-export/tool.md` for the shared extraction tool's own verification
status.
