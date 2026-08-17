---
name: readiness-analysis
description: Triage an SAP Readiness Check, Simplification Item (SI) Check export and the relevant SAP Notes into one scoped, plain-language, per-module functional impact view — separating what genuinely blocks the conversion from what merely appears in the report. Use in Discover, as soon as Readiness Check output exists for a brownfield S/4HANA conversion.
---

# Readiness & Simplification Analysis

Contract merged from two independently-sketched stubs (this factory's own, and `sap-ai-cons`'s
`prepare/readiness-analysis`) — neither side had implemented logic, so this is a contract merge, not
a ported skill: `sap-ai-cons`'s stub named the SI-Check export specifically and scoped itself to
Prepare; this factory's own stub named SAP Notes and scoped itself to Discover per
`activities/discover/readiness-analysis.md`. Kept in **Discover**, per this factory's phase model —
Readiness Check/SI-Check triage has to happen before Prepare is even scoped, not during it.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Discover phase, as soon as the consultant has SAP Readiness Check and/or Simplification Item (SI)
Check output for a brownfield S/4HANA conversion, before committing to a conversion date. Matches
this factory's `readiness-analysis` activity.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the Readiness Check export and/or SI-Check export — a file the consultant already
  holds, not something this skill generates.
- **Optional:** in-scope modules to focus the report; a prior custom-code baseline (from
  `custom-code-scan`, if one has already been run) to join findings against actual usage rather than
  the export's generic "this Note might apply" flag.

## Knowledge this skill orchestrates

- `knowledge/custom-code/` — to check whether a flagged simplification item actually hits code this
  client runs, versus a Note that technically applies to the module but touches nothing in use.
- `knowledge/standards/` — delivery conventions for how a scoped finding gets written up.

## Steps

1. **Validate inputs.** If neither a Readiness Check nor an SI-Check export is available, say so —
   this skill triages exports, it does not perform the SAP-side Readiness Check itself.
2. **Parse the export(s)** into one list of findings: module, simplification item, the SAP Note(s)
   behind it, and whatever the export claims about custom-code impact.
3. **Check each finding against actual usage**, not the export's generic applicability flag. If a
   custom-code baseline exists, join against it directly. If not, ask whether the flagged
   transaction/object is actually in productive use before accepting the export's claim at face
   value — an export says a Note *could* apply; usage says whether it *does*.
4. **Classify every finding `Blocks` or `Appears only` — never leave one unclassified to keep the
   report moving.** This is the one judgment call the whole skill exists for: a finding "appearing"
   in the export because the module is in scope is not the same as it actually blocking the
   conversion for this client's specific configuration and usage.
5. **State a reason for every classification**, not just the label. "Blocks" without naming which
   custom code or config it hits is a claim nobody downstream can verify; "Appears only" without
   naming why it doesn't apply reads as an oversight later, not a deliberate call.
6. **Write the report** per module, sized by effort implication — see
   `../../../artifacts/simplification-impact-report/template.md`.

## Output

- **`simplification-impact-report` artifact** (`../../../artifacts/simplification-impact-report/template.md`):
  per-module findings table (Blocks/Appears-only, reason, effort implication), plus a dedicated
  "items that merely appear" section so a re-raised question later has a documented answer already
  on file.
- Feeds the `discover→prepare` Q-gate — this report is what sizes the conversion before Prepare is
  scoped or a date is committed.
- If a `readiness-analyst` agent is wired, it gives an independent `complete`/`gaps`/`blocking`
  verdict on the report before the gate — a check, not a required gate step while the agent itself
  is still `notstarted`.

## Judgment calls worth stating out loud

- **An export flag is not a verdict.** "Genuinely blocks" is a client-specific usage question, not a
  property of the SAP Note itself — the same Note blocks one client and is noise for another.
- **Don't let "appears in a scary-looking export" pressure a finding into `Blocks` without a stated
  reason.** Volume in the export is not evidence of impact.
- **A finding with no custom-code baseline to check against is a known-unknown, not a silent
  assumption** — say explicitly that usage wasn't verified rather than guessing from the Note's
  general description.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Contract and workflow written and merged from both stubs' scoping; not yet dry-run tested
against a real Readiness Check / SI-Check export.
