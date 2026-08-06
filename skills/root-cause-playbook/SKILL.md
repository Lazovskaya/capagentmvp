---
name: root-cause-playbook
description: Guide structured root-cause analysis of an SAP defect — classify the symptom, walk the matching diagnostic tree top-down, and produce a ranked root cause with evidence and fix. Domain-neutral engine — plugs in a domain's taxonomy + troubleshooting trees (order-to-cash is the current pack).
---

# Root-Cause Playbook

Ported from `sap-ai-cons`'s `skills/run/bugfix/root-cause-playbook` — real, tested content, not a
stub.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Structured root-cause analysis for a defect. Given a symptom and a document reference, classify the
sub-process, walk the matching diagnostic tree top-down, and produce a ranked root cause with the
fix and the evidence checked. **Domain-neutral engine** — the symptom→tree→cause procedure is
generic; the trees come from a domain pack (order-to-cash today). Works in AMS and stabilization.

## When to use

Diagnose stage — the core skill. After `incident-triage` has classified a ticket, or directly when a
consultant brings one defect. Prefer `pricing-diagnostic` for pricing symptoms and
`billing-ar-error-analyzer` for SD-FI billing/AR symptoms — both are specializations of this same
procedure with deeper domain detail. Prefer `idoc-failure-analyzer` for interface/IDoc symptoms.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the symptom (error text or wrong behavior) and the affected document.
- **Required:** which domain pack applies (order-to-cash is the built pack).
- **Optional but valuable:** application/error log, document flow, condition/pricing Analysis,
  config or master-data extracts — as files by default, or fetched live if a connector exists.

## Knowledge this skill orchestrates

- `../incident-triage/references/incident-triage-method.md` — the generic layer order for the
  fallback (rule out `user` → `master-data` → `data` → `config` → `custom`).
- **Domain taxonomy + trees** —
  `../../knowledge/domain-packs/order-to-cash/incident-taxonomy.md` (sub-processes) and
  `../../knowledge/domain-packs/order-to-cash/troubleshooting/` (per-symptom trees:
  `order-will-not-save`, `delivery-not-created`, `pgi-fails`, `atp-no-confirmation`,
  `credit-block`, `billing-document-not-created`, `billing-no-accounting-document`,
  `pricing-incorrect`, `output-not-issued`, `returns-credit-memo`; extend per engagement).

## Connectivity (agnostic + graceful degradation)

- Default: reason over exports the consultant holds (logs, document flow, Analysis, screenshots as
  text).
- If a live-system reader is wired (`abap-mcp` or similar), use it to fetch document flow/config/
  master data live.
- If no connector: proceed in file mode and state "⚠ no live system connector — diagnosis based on
  provided exports only."

## Steps

1. **Classify** the symptom to a sub-process using the domain taxonomy.
2. **Select the tree.** If a matching tree exists under the domain pack's `troubleshooting/`, load
   it. If none exists, fall back to the generic layer order and note that a tree should be authored.
3. **Walk the tree top-down.** For each check, use the exports (or the live connector) to
   confirm/reject; record pass/fail as evidence. Stop at the first check that explains the symptom.
4. **Rank** the probable root cause(s) and tag the layer — this drives routing and fix ownership.
5. **State the fix path.** For `custom`, scope a developer change; never invent code fixes in prose.
6. **Write** the diagnosis to `workspace/bugfix/<ticket-or-doc>-rca.md` (gitignored).

## Output

A root-cause diagnosis: symptom recap, sub-process, ranked probable cause(s) with layer, the checks
walked (evidence), and the proposed fix path. Feeds `fix-doc-and-regression`.

## Judgment calls worth stating out loud

- **Stop at the first check that actually explains the symptom** — don't keep walking the tree past
  the point of a confirmed cause just to be thorough.
- **A symptom with no matching tree is a gap to flag**, not a reason to force-fit the nearest tree.
- **Never invent an ABAP fix in prose** for `custom`-layer causes — scope the change for a developer
  instead.

## Driver

Main driver: test. Owner role per factory-data.json: **test**.

## Status

Progress. Real, tested logic ported from sap-ai-cons; not yet re-verified as part of this factory's
own pipeline wiring.
