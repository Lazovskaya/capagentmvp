---
name: readiness-extensibility
description: Analyze the Extensibility topic of a SAP Readiness Check for SAP S/4HANA report -- Required Custom Code Adjustments (Chapter 5) -- into a scoped findings brief, plus forward-looking Clean-Core and Extensibility framework content the report itself doesn't cover. Use in Discover as soon as Readiness Check output exists, or standalone to re-check custom code readiness after ATC results land.
---

# Readiness Check — Extensibility

One of 6 topic-scoped skills split out of the former monolithic `readiness-analysis` (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the full
6-folder taxonomy this mirrors). This skill owns Chapter 5 only. Clean Core and Extensibility
Strategy content has **no source chapter in the Readiness Check** -- write it as forward-looking
framework material and say so explicitly.

Act as an experienced SAP technical architect: don't re-type what the report already says --
tell the project team what's a real blocker, what's routine, and what's missing because the
underlying data was never collected.

## When to use

Discover phase, as soon as Readiness Check output exists -- or standalone, most usefully re-run
once ABAP Test Cockpit (ATC) results actually land, since Chapter 5 is very often empty on first
pass (no custom code analysis ever uploaded). Does not require `readiness-analysis` to have run
first.

## Inputs (contract)

- **Required:** the Readiness Check export.
- **Required:** `engagement_id`, to locate/write the cached extraction.
- **Optional:** a prior custom-code baseline (ATC export) if the Readiness Check's own Chapter 5
  is empty, to join findings against actual usage.

## Steps

1. **Reuse or run the extraction.** Check for
   `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` first; run it yourself if
   missing.
2. **Read only chapter 5** -- skip every other chapter's data.
3. **Interpret using `references/chapter_interpretation.md`.** If Chapter 5 is empty (no ATC data
   uploaded), report custom code impact as **unknown, not low** -- a real project risk, not a
   clean result.
4. **If ATC data is present**, size the remediation workstream by Remediation Type and Priority
   breakdown, not raw finding count -- see `references/chapter_interpretation.md` for the
   distinction between "Technical Code Adaptation (Automated)" and "Functional Changes (Manual)."
5. **Draft the Clean-Core and Extensibility Strategy content as an explicit framework**, not a
   report-derived finding -- state clearly it has no source chapter, and that it should be
   revisited once real ATC data exists.
6. **Cite SAP references per the standing rule**: plain text for a Note/KBA number; hyperlink only
   when the extracted data itself contains a real URL (see `references/official_resources.md`).
7. If no ATC data exists, raise "mandate ATC execution before scoping finalizes" into `adr-log` as
   a real project risk -- not optional.

## References

- `references/chapter_interpretation.md` -- this topic's extracted chapter-by-chapter guidance.
- `references/official_resources.md` -- stable official SAP resource entry points + curation
  placeholders (never fabricate a specific deep-link URL).

## Output

- **`simplification-impact-report` artifact**, scoped to Chapter 5.
- Custom-code findings size the Dual Maintenance/Retrofit conversation in `sad-drafting` and the
  Clean Core Level Targets section directly.
- When publishing to Confluence, this topic's content goes under "03 Extensibility" per
  `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent, or directly by the user for
a single-topic update).

## Status

In test -- split out of `readiness-analysis`. See `tools/parse-readiness-check-export/tool.md` for
the shared extraction tool's own verification status.
