---
name: incident-triage
description: Classify incoming SAP support/AMS incidents by sub-process, likely layer and severity, dedupe them, and route to the owning stream. Domain-neutral engine — plugs in a domain sub-process taxonomy (order-to-cash is the current pack). Use as the intake step of bug-fixing, including hypercare.
---

# Incident Triage

Ported from `sap-ai-cons`'s `skills/run/bugfix/incident-triage` — real, Jira-tested content, not a
stub. This is the intake step this factory's own `defect-triage` skill already assumed existed
(see `defect-triage`'s "Confirm the item is technically classified before triaging it commercially"
step) but that, until now, nothing in this factory actually supplied.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Sort a batch or stream of tickets before anyone diagnoses: classify each by sub-process, likely
layer and severity, flag duplicates, and route. **Domain-neutral engine** — the layer/severity
method is generic; the sub-process list comes from a domain pack (order-to-cash today, other
domains later). Works in AMS, post-go-live stabilization, and hypercare.

## When to use

Intake stage of bug-fixing/hypercare — whenever there are more tickets than can be eyeballed, or to
produce a clean daily worklist. Matches this factory's `defect-triage` activity (Realize) and
`hypercare-triage` activity (Run) — both share this same intake step.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the incoming tickets — an export file (CSV/XLSX/JSON) by default, or a live ticket
  connector pull (`jira` connector, when wired). Each ticket needs at least: id, short
  text/description, created date.
- **Required:** which domain pack applies (order-to-cash is the one built).
- **Optional:** business-volume hints per area (to weight severity), the existing open backlog (for
  cross-dedup).

## Knowledge this skill orchestrates

- `references/incident-triage-method.md` — the generic method: layer + severity + volume weighting,
  routing principle, dedup heuristics, signal matching, ambiguity handling. Shared with
  `root-cause-playbook` (fallback layer order) and `defect-pattern-analysis` (classification, dedup).
- **Domain sub-process taxonomy** — `../../knowledge/domain-packs/order-to-cash/incident-taxonomy.md`.
- **Domain signal catalog** — `../../knowledge/domain-packs/order-to-cash/incident-signal-catalog.md`
  (ticket phrases/tcodes/message types → sub-process + layer hint + confidence, disambiguation rules).
- **Domain routing matrix** — `../../knowledge/domain-packs/order-to-cash/routing-matrix.md` (stream,
  owner, layer co-assign, diagnose handoff).
- **Domain adjacency** (optional at triage) —
  `../../knowledge/domain-packs/order-to-cash/subprocess-adjacency.md` for related-stream notes on S1
  clusters; primary consumer is `fix-doc-and-regression`.

## Connectivity (agnostic + graceful degradation)

- Default: operate on a file export the consultant holds.
- If the `jira` connector is wired, pull tickets and (after HITL approval) write back the
  classification/routing — preview the exact mutation, preserve existing labels, never change
  status/priority/assignee/workflow fields.
- If none is connected: read the export, write results to a file, and state "⚠ no ticket connector —
  classification not written back to the tracker."

## Steps

1. **Load** tickets from the export (or connector). Accept optional volume hints and an open-backlog
   file for cross-dedup.
2. **Classify** each via the domain signal catalog (fallback: taxonomy typical symptoms):
   sub-process + layer hint + confidence, then severity S1/S2/S3 (do not copy tracker priority
   blindly). Ambiguous text → best guess + confidence flag; never drop a ticket silently.
3. **Dedupe** per the method's heuristics: same document / same root / related-but-distinct; mark
   primary, link the rest (`dup_group_id`, `dup_role`, `dup_note`).
4. **Route** via the domain routing matrix: sub-process → stream/owner; apply layer co-assign
   (`custom`→dev, `data`→Basis when technical, `user`→OCM); `interface`→partner + IDoc layer.
5. **Output** a triaged worklist sorted by severity band, then volume weight, then primary-before-
   duplicate. Optionally note adjacent streams from the adjacency map on S1.
6. **Preview/write back (connector only):** show the exact tracker mutation per ticket and stop for
   approval. Low-confidence items require consultant confirmation before any tracker write.

## Output

A triaged, deduped, routed worklist: per ticket → sub-process, layer, severity, owner, duplicate
group. Written to `workspace/bugfix/triage-<date>.md` (gitignored) and/or back to the tracker if
connected. Feeds `root-cause-playbook`/`pricing-diagnostic`/`billing-ar-error-analyzer`/
`idoc-failure-analyzer` (per ticket), `defect-triage` (commercial verdict), and
`defect-pattern-analysis` (backlog, periodically).

## Judgment calls worth stating out loud

- **Don't copy the tracker's Priority field as severity.** S1/S2/S3 is an impact judgment, not a
  restated tracker field.
- **Rule out `master-data` and `user` layers before assuming `config` or `custom`** — most "bugs" in
  a stable system are master-data or data-consistency issues.
- **A low-confidence S1 never gets silently demoted** — flag the ambiguity separately from the
  severity call.

## Driver

Main driver: test (this factory's closest role to "consultant running triage"; adjust per
engagement). Owner role per factory-data.json: **test**.

## Status

Progress. Real, Jira-tested logic ported from sap-ai-cons; not yet re-verified as part of this
factory's own pipeline wiring (this activity, this repo's artifact/agent names).
