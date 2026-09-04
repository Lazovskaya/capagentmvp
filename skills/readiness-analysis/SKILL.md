---
name: readiness-analysis
description: Analyze a SAP Readiness Check for SAP S/4HANA report (the .docx/.zip export a client generates before a system conversion) and/or a Simplification Item (SI) Check export into one scoped, plain-language findings brief — covering every chapter (Simplification Items, Custom Code, HANA Sizing, Integration, Financial Data Quality, Fiori/Business Process Discovery, Planned Downtime, Customer Vendor Integration) when the full report is available, or a focused SI-Check triage when it isn't — separating what genuinely blocks the conversion from what merely appears in the report. Use in Discover, as soon as Readiness Check and/or SI-Check output exists for a brownfield S/4HANA conversion, before committing to a conversion date.
---

# Readiness & Simplification Analysis

Real analysis logic ported from `sap-ai-architecture-generator`'s `sap-readiness-check` skill
(commit `2ae0396`; `own` posture), merged onto this factory's own `readiness-analysis` contract and
artifact names (`simplification-impact-report`, this factory's `discover→prepare` Q-gate,
`readiness-analyst` agent) — replacing the earlier unimplemented stub, which had never had real
extraction/interpretation logic behind it.

Act as an experienced SAP technical architect reviewing a Readiness Check report the way you'd
actually use it on a real conversion project: not by re-typing what the report already says, but by
telling the project team what matters, what's a real blocker versus routine, and what's missing
entirely because the underlying data was never collected. The report's own "Next Steps" chapter is
just a link out — synthesizing an actual recommendation is this skill's whole job.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Discover phase, as soon as the consultant has SAP Readiness Check and/or Simplification Item (SI)
Check output for a brownfield S/4HANA conversion, before committing to a conversion date. Matches
this factory's `readiness-analysis` activity. Calibrated specifically against the "Readiness Check
for SAP S/4HANA" (system conversion) report — not the Cloud ALM, BW/4HANA, or SAP S/4HANA Cloud
variants, which have different structures.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the Readiness Check export and/or SI-Check export — a file the consultant already
  holds, not something this skill generates.
- **Ask for the full export, not just the `.docx`, when a full Readiness Check report is involved.**
  The dashboard's real export is a `.zip` with the `.docx` plus ~20-25 supporting `.xlsx` files
  (Relevant Simplification Items, Technical Properties, Add-On Compatibilities, HANA sizing tables,
  Interface Impact Analysis per protocol, Financial Data tables, etc.) — those carry the real
  underlying numbers as clean structured columns. Proceeding with just the `.docx` still works, but
  say explicitly that findings depending on those numbers are then sourced from less-reliable
  docx-text extraction. If only a PDF is available, ask for a Word re-export — this report's many
  wide tables extract far more reliably from `.docx`.
- **Optional:** in-scope modules to focus the report; a prior custom-code baseline (from
  `custom-code-scan`, if one has already been run) to join findings against actual usage rather than
  the export's generic "this Note might apply" flag; a separate "SAP ERP Usage and Data Profiling"
  report for the same system, which can resolve a real share of Chapter 3's "Relevance cannot be
  automatically determined" items (see `references/simplification_items_guide.md` §3) — don't ask
  for this reflexively, only once Chapter 3 turns out to have real ST03N-gap items to resolve.

## Knowledge this skill orchestrates

- `references/readiness_check_interpretation_guide.md` — chapter-by-chapter interpretation
  guidance, calibrated against real client reports, plus the SAD section-routing table. Read this
  in full before drafting the brief whenever the full Readiness Check report (not just an SI-Check
  export) is in scope.
- `references/addon_compatibility_guide.md` — deep-dive on Chapter 2 (Add-On Compatibility/Active
  Business Functions). Read whenever Chapter 2 has real findings.
- `references/planned_downtime_guide.md` — deep-dive on Chapter 9.5 (Planned Downtime Calculator).
  Read whenever the downtime number needs to be negotiated down, not just reported.
- `references/simplification_items_guide.md` — deep-dive on Chapter 3 (Simplification Items): what
  each Category value implies for remediation type, the "(default)" vs "(calculated)" Effort
  Ranking distinction, the ST03N 12-month data-gap pattern, and correct triage sequencing. Read this
  before triaging Chapter 3 for real — it's the direct input `conversion-scoping` (once ported)
  consumes.
- `knowledge/custom-code/` — to check whether a flagged simplification item actually hits code this
  client runs, versus a Note that technically applies to the module but touches nothing in use.
- `knowledge/standards/` — delivery conventions for how a scoped finding gets written up.

## Steps

1. **Validate inputs.** If neither a Readiness Check nor an SI-Check export is available, say so —
   this skill triages exports, it does not perform the SAP-side Readiness Check itself.
2. **Extract mechanically** with `scripts/extract_readiness_check.py`:
   ```
   # Preferred — a folder (unzipped export) containing the .docx plus its .xlsx files:
   python3 scripts/extract_readiness_check.py <export_folder/> /tmp/rc_data.json

   # Also supported — a single .docx with no supporting data:
   python3 scripts/extract_readiness_check.py <report.docx> /tmp/rc_data.json
   ```
   This walks the document by heading number/level into the report's own chapter/subchapter
   structure, capturing each section's paragraph text and tables as structured JSON; flags any
   paragraph matching a known "no data collected" phrase; and separately flags any chapter with no
   table and no substantive paragraph text as `structurally_empty`, even when no known phrase
   matched — the phrase list can't cover every wording SAP uses across report versions. Check
   `structurally_empty` chapters by hand too, not just the phrase-matched `gap_flags` ones. When run
   against a folder, every `.xlsx` file is also read into the output's `supporting_data` key.

   **A sheet with more than 150 rows is written to its own sidecar JSON file** (path in the sheet's
   `sidecar` key; `row_count` always present) rather than inlined — read `rc_data.json` first (it's
   compact), then open only the specific sidecar file(s) the chapter currently being interpreted
   actually needs. Don't try to re-derive chapter boundaries from the raw docx text yourself — the
   report's heading numbers repeat (once near a table of contents, once at the real section), and
   the script already resolves that correctly.
3. **Check each finding against actual usage**, not the export's generic applicability flag. If a
   custom-code baseline exists, join against it directly. If not, ask whether the flagged
   transaction/object is actually in productive use before accepting the export's claim at face
   value.
4. **Interpret using the reference guides.** For a report with several large sidecars (HANA sizing,
   interface impact analyses, Fiori recommendations commonly run 1,600-3,400 rows), interpret the
   eight chapters as an independent batch rather than one at a time — each chapter's own guide
   section plus its own sidecar data is enough to return a severity tag (`blocker` /
   `needs_decision` / `routine` / `clean`), the concrete numbers backing that call, and any
   `structurally_empty` or gap-flagged subsections, without needing another chapter's result first.
   Skip the batching for a small/mostly-clean report — the coordination overhead only pays off with
   real per-chapter volume.
5. **Classify every Simplification Item finding `Blocks` or `Appears only` — never leave one
   unclassified to keep the report moving.** A finding "appearing" in the export because the module
   is in scope is not the same as it actually blocking the conversion for this client's specific
   configuration and usage.
6. **State a reason for every classification**, not just the label. "Blocks" without naming which
   custom code or config it hits is a claim nobody downstream can verify; "Appears only" without
   naming why it doesn't apply reads as an oversight later, not a deliberate call.
7. **Write the report** — see `../../artifacts/simplification-impact-report/template.md`. When the
   full Readiness Check report was analyzed, also fill the executive risk summary, data-collection
   gaps, and per-chapter findings sections (with SAD routing per the interpretation guide's mapping
   table); when only an SI-Check export was available, the per-module Simplification Items detail
   table alone is the whole report — say explicitly which case this run is.

## Output

- **`simplification-impact-report` artifact** (`../../artifacts/simplification-impact-report/`):
  per-module Simplification Items findings (Blocks/Appears-only, reason, effort implication); when
  the full report was analyzed, also an executive risk summary, data-collection gaps, and
  per-chapter findings with severity and SAD-section routing.
- Feeds the `discover→prepare` Q-gate — this report is what sizes the conversion before Prepare is
  scoped or a date is committed.
- If a `readiness-analyst` agent is wired, it gives an independent `complete`/`gaps`/`blocking`
  verdict on the report before the gate.
- HANA sizing findings feed the (not yet ported) `sizing-analysis`/Instance Strategy decision;
  custom-code findings size the Dual Maintenance/Retrofit conversation and Clean Core targets in
  the (not yet ported) `sad-drafting` skill; Financial Data Quality and CVI findings feed Data
  Migration Architecture; Planned Downtime results are a direct input to cutover planning. Once
  those skills exist, name which of their sections each finding lands in rather than leaving the
  connection implicit — until then, note it as a forward reference in the brief.

## Judgment calls worth stating out loud

- **An export flag is not a verdict.** "Genuinely blocks" is a client-specific usage question, not
  a property of the SAP Note itself — the same Note blocks one client and is noise for another.
- **Don't let "appears in a scary-looking export" pressure a finding into `Blocks` without a stated
  reason.** Volume in the export is not evidence of impact.
- **A finding with no custom-code baseline to check against is a known-unknown, not a silent
  assumption** — say explicitly that usage wasn't verified rather than guessing from the Note's
  general description.
- **A chapter that came back empty is a data-collection gap, not a clean result** — Custom Code,
  Data Volume Management, and Add-On Compatibility routinely come back empty because the check was
  never run, not because there's nothing to find. Report it as "impact unknown," never silently.
- **"Software Entitlement Required" on an Add-On Compatibility finding is a licensing gate, not a
  technical one** — needs an Account Executive conversation immediately, not a remediation plan.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

In test. Real extraction/interpretation logic ported from `sap-ai-architecture-generator`'s
`sap-readiness-check` (calibrated against real client `.docx`/`.zip` exports); not yet re-verified
end to end against this factory's own artifact/gate wiring with a real export run through
`scripts/extract_readiness_check.py`.
