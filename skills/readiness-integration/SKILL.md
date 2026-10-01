---
name: readiness-integration
description: Analyze the Integration topic of a SAP Readiness Check for SAP S/4HANA report -- Required Adjustments for Integration (Chapter 7: IDoc, Web Service, RFC/BAPI, BW Extractors, OData, SLT, Flat File) -- into a scoped findings brief, without loading the rest of the report's chapters. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic.
---

# Readiness Check — Integration

One of 6 topic-scoped skills split out of the former monolithic `readiness-analysis` (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the full
6-folder taxonomy this mirrors). This skill owns Chapter 7 only.

Act as an experienced SAP technical architect: don't re-type what the report already says --
tell the project team what's a real blocker, what's routine, and what's missing because the
underlying data was never collected.

## When to use

Discover phase, as soon as Readiness Check output exists -- or standalone, any time the
integration remediation plan needs revisiting. Does not require `readiness-analysis` to have run
first.

## Inputs (contract)

- **Required:** the Readiness Check export.
- **Required:** `engagement_id`, to locate/write the cached extraction.

## Steps

1. **Reuse or run the extraction.** Check for
   `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` first; run it yourself if
   missing.
2. **Read only chapter 7 and its subsections**, plus the interface-type `supporting_data`/sidecars
   (`InterfaceImpactAnalysis*`) -- skip every other chapter.
3. **Interpret using `references/chapter_interpretation.md`**, applying the two sanity checks
   before reporting any finding at face value: industry-mismatch false positives, and "Not Used"
   as its own decommissioning finding, not just a denominator.
4. **Draft the findings brief** scoped to Chapter 7: report which bucket dominates
   (Functionality Unavailable / Blocked / Serialization Issue) per interface type, concrete
   numbers, SAD-section routing per the mapping table in `references/chapter_interpretation.md`.
5. **Cite SAP references per the standing rule**: plain text for a Note/KBA number; hyperlink only
   when the extracted data itself contains a real URL (see `references/official_resources.md`).
6. Raise any genuine architectural decision (e.g. an SLT reload/archive-handling strategy for a
   high-volume impacted table set) into `adr-log` as its own entry -- most of Chapter 7 is
   redesign/backlog work, not ADR material by default; only escalate when Blocked/Serialization
   Issue dominates or a quantified data-volume/timeline risk is found.

## References

- `references/chapter_interpretation.md` -- this topic's extracted chapter-by-chapter guidance.
- `references/official_resources.md` -- stable official SAP resource entry points + curation
  placeholders (never fabricate a specific deep-link URL).

## Output

- **`simplification-impact-report` artifact**, scoped to Chapter 7.
- Feeds Section 5 (Integration Architecture) and 5.6 (Technical Debt Register) in `sad-drafting`.
- When publishing to Confluence, this topic's content goes under "04 Integration" per
  `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent, or directly by the user for
a single-topic update).

## Status

In test -- split out of `readiness-analysis`. See `tools/parse-readiness-check-export/tool.md` for
the shared extraction tool's own verification status.
