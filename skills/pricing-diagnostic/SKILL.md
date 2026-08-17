---
name: pricing-diagnostic
description: Diagnose SD pricing defects via the condition technique — trace pricing procedure → access sequence → condition record from the document's pricing Analysis, pinpoint the failing link, and propose the fix. Domain-specific (SD/order-to-cash) bug-fix skill for the highest-frequency pricing bug area.
---

# Pricing Diagnostic (SD)

Ported from `sap-ai-cons`'s `skills/run/bugfix/pricing-diagnostic` — real, tested content, not a
stub.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Deep-dive diagnosis for SD pricing defects (wrong/missing price, discount, surcharge, tax, rebate
accrual). Works the condition technique the way a consultant does: start from the document's pricing
**Analysis**, trace the determination chain, and pinpoint the single failing link with its layer and
fix. Domain-specific (SD/order-to-cash) — the pricing specialization of `root-cause-playbook`.

## When to use

Diagnose stage, whenever the symptom is pricing-related. Prefer this over `root-cause-playbook` when
the defect is clearly in pricing and you want the condition-technique detail.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the pricing symptom (which value is wrong/missing, expected vs actual) and the
  document (order/invoice number, item).
- **Strongly preferred:** the document's pricing Analysis (item → Conditions → Analysis) as an
  export/paste — it usually contains the answer.
- **Optional:** condition records, access sequence/pricing procedure config — file or live.

## Knowledge this skill orchestrates

- `../../../knowledge/domain-packs/order-to-cash/pricing-condition-technique.md` — the determination
  chain, the "read the Analysis first" method, and the failure-mode table.
- `../../../knowledge/domain-packs/order-to-cash/troubleshooting/pricing-incorrect.md` — the ordered
  diagnostic tree.

## Connectivity (agnostic + graceful degradation)

- Default: reason over the pricing Analysis export + any condition-record extracts provided.
- If a live-system reader is wired, fetch condition records/access sequence/procedure config live.
- If none is connected: work from the provided Analysis and state "⚠ no live system connector —
  diagnosis based on the provided pricing Analysis only."

## Steps

1. **Read the Analysis first.** Identify the condition type in question and what the Analysis says
   for it (record found / not found / access not made / excluded).
2. **Trace the chain** in order: pricing procedure determination → the condition type is present? →
   access sequence (which access ran, which was skipped and why) → condition record (existence,
   validity date, key combination, scale, status).
3. **Pinpoint the failing link** and tag its layer (master-data/config/user/custom).
4. **Check redetermination** if the value differs order vs invoice — inspect the copying-control
   pricing type (usual cause of "right on order, wrong on invoice").
5. **Diagnose tax separately** from the base price when a tax condition is involved (tax
   classification, country/region, jurisdiction/external engine).
6. **State the fix.** For `custom` (VOFM routines/condition BAdIs), scope a developer change; never
   invent code fixes in prose.
7. **Write** the diagnosis to `workspace/bugfix/<doc>-pricing.md` (gitignored).

## Output

A pinpointed pricing root cause + fix, citing the Analysis line as evidence, with the layer and fix
owner. Feeds `fix-doc-and-regression`.

## Judgment calls worth stating out loud

- **Read the Analysis before forming a hypothesis** — it usually already states which access wasn't
  made or which record wasn't found; don't guess ahead of it.
- **Order-vs-invoice mismatches are usually a copying-control redetermination question**, not a new
  pricing defect — check that before diagnosing further.
- **Diagnose tax separately from base price** — conflating the two produces a fix that solves the
  wrong half.

## Driver

Main driver: test. Owner role per factory-data.json: **test**.

## Status

Progress. Real, tested logic ported from sap-ai-cons; not yet re-verified as part of this factory's
own pipeline wiring.
