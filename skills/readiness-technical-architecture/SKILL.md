---
name: readiness-technical-architecture
description: Analyze the Technical Architecture topic of a SAP Readiness Check for SAP S/4HANA report -- Add-On/Business Function compatibility (Chapter 2) and the Planned Downtime Calculator (Chapter 9.5) -- into a scoped conversion-strategy findings brief, without loading the rest of the report's chapters. Use in Discover as soon as Readiness Check output exists, or standalone to re-check just this topic (e.g. when a downtime-tolerance conversation with the business needs revisiting).
---

# Readiness Check — Technical Architecture

One of 6 topic-scoped skills split out of the former monolithic `readiness-analysis` (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the full
6-folder taxonomy this mirrors). This skill owns Chapters 2 and 9.5 only.

Act as an experienced SAP technical architect: don't re-type what the report already says --
tell the project team what's a real blocker, what's routine, and what's missing because the
underlying data was never collected.

## When to use

Discover phase, as soon as Readiness Check output exists -- or standalone, any time the
conversion-strategy conversation (downtime tolerance, add-on cleanup timing) needs revisiting.
Does not require `readiness-analysis` to have run first.

## Inputs (contract)

- **Required:** the Readiness Check export.
- **Required:** `engagement_id`, to locate/write the cached extraction.
- **Optional:** whether the client is a RISE customer (changes the NZDT commercial analysis in
  `references/planned_downtime_guide.md` §5.4).

## Steps

1. **Reuse or run the extraction.** Check for
   `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` first; run it yourself if
   missing (`python3 tools/parse-readiness-check-export/scripts/extract_readiness_check.py <export_folder/> workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json`).
2. **Read only chapters 2 and 9.5**, plus `supporting_data.AddonCompatibilities` and
   `supporting_data.BusinessFunctions` -- skip every other chapter.
3. **Interpret using `references/chapter_interpretation.md`**, then
   **`references/addon_compatibility_guide.md`** for Chapter 2's real depth (the two sub-checks
   are structurally different problems) and **`references/planned_downtime_guide.md`** when the
   downtime number needs negotiating down.
4. **Draft the findings brief** scoped to Chapters 2/9.5: severity per finding, concrete numbers,
   SAD-section routing per the mapping table in `references/chapter_interpretation.md`.
5. **Cite SAP references per the standing rule**: plain text for a Note/KBA number; hyperlink only
   when the extracted data itself contains a real URL (see `references/official_resources.md`).
6. Raise the downtime-tier decision and any Incompatible/Entitlement-Required add-on into
   `adr-log` as its own entry -- not optional.

## References

- `references/chapter_interpretation.md` -- this topic's extracted chapter-by-chapter guidance.
- `references/addon_compatibility_guide.md` -- Chapter 2 deep-dive: category breakdown
  (Incompatible/Uninstallable/Unknown/Entitlement-Required/Certified Third-Party), the licensing-
  gate nature of "Entitlement Required," the custom-code-coupled-to-an-add-on risk.
- `references/planned_downtime_guide.md` -- Chapter 9.5 deep-dive: the real tiers between
  accepting the raw estimate and buying NZDT service, and the RISE-specific contracting trap.
- `references/official_resources.md` -- stable official SAP resource entry points + curation
  placeholders (never fabricate a specific deep-link URL).

## Output

- **`simplification-impact-report` artifact**, scoped to Chapters 2/9.5.
- Feeds the `discover-prepare` Q-gate for its topic. Downtime results feed cutover planning
  directly in `sad-drafting`.
- When publishing to Confluence, this topic's content goes under "02 Technical Architecture" ->
  Conversion Strategy per
  `knowledge/methodology/brownfield-conversion/confluence-publication-structure.md`.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent, or directly by the user for
a single-topic update).

## Status

In test -- split out of `readiness-analysis`. See `tools/parse-readiness-check-export/tool.md` for
the shared extraction tool's own verification status.
