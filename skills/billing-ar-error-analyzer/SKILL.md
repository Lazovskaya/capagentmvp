---
name: billing-ar-error-analyzer
description: Diagnose SD billing due-list failures and "accounting document not created" cases via VKOA revenue account determination, tax-at-posting, document splitting, and period/master-data checks. Domain-specific (SD-FI / order-to-cash) bug-fix skill — the billing/AR specialization of root-cause-playbook.
---

# Billing / AR Error Analyzer (SD-FI)

Ported from `sap-ai-cons`'s `skills/run/bugfix/billing-ar-error-analyzer` — real, tested content,
not a stub.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Deep-dive diagnosis for SD billing create failures and especially **billing → FI-AR posting**
defects (no accounting document, account determination/VKOA, tax at posting, document splitting,
period). Domain-specific (SD-FI/order-to-cash) — the billing/AR specialization of
`root-cause-playbook`.

## When to use

Diagnose stage, when the symptom is:
- billing document **not created** (VF04/billing block/copy control) — use the create tree first; or
- billing **exists** but **accounting document not created**/not cleared for accounting/VKOA/tax/
  splitting error (the main deep-dive).

Prefer this over `root-cause-playbook` when the defect is clearly SD-FI posting or billing due-list
and you want the account-determination detail. For pure pricing-on-invoice issues with a successful
FI post, use `pricing-diagnostic` instead.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the symptom (create vs FI posting) and the document (billing and/or
  order/delivery number).
- **Strongly preferred for FI posting:** exact error text (VF02 release/VFX3/log) + customer &
  material account assignment groups + account keys on the billing item conditions.
- **Optional:** VKOA excerpt for the key combination, OB52 period status, tax classification,
  splitting error detail — file export or live.

## Knowledge this skill orchestrates

- `../../knowledge/domain-packs/order-to-cash/billing-ar-account-determination.md` — SD→FI chain,
  VKOA keys, tax-at-posting, splitting, period, failure-mode table, evidence pack.
- `../../knowledge/domain-packs/order-to-cash/troubleshooting/billing-no-accounting-document.md` —
  ordered tree for FI posting failures.
- `../../knowledge/domain-packs/order-to-cash/troubleshooting/billing-document-not-created.md` —
  ordered tree when no billing document exists yet.

## Connectivity (agnostic + graceful degradation)

- Default: reason over the error export + master-data/VKOA extracts the consultant provides.
- If a live-system reader is wired, fetch billing status, account assignment groups, VKOA, period
  status live.
- If none is connected: work from provided exports and state "⚠ no live system connector —
  diagnosis based on the provided billing/FI exports only."

## Steps

1. **Split the failure point.** Billing missing → load `billing-document-not-created` and walk it.
   Billing exists, FI missing → continue here with `billing-no-accounting-document` + the
   account-determination reference. Never diagnose VKOA until you know a billing document number.
2. **Posting block first.** If the billing type has a posting block, check whether release was
   attempted — by-design block is `config`/`user`, not a missing VKOA row.
3. **Read the error/account-determination analysis.** Identify account key, sales org, customer &
   material account assignment groups, chart of accounts.
4. **Trace VKOA** for that key combination. Distinguish missing VKOA entry (`config`) vs
   blank/wrong account assignment group (`master-data`) vs missing account key on the pricing
   procedure condition (`config`).
5. **Tax at posting** if the error is tax-related — tax code/classification/external engine/tax
   accounts. Do not confuse with order-only tax pricing issues.
6. **Document splitting** if the error names profit center/segment/splitting — fix characteristic
   source before changing VKOA.
7. **Period/number range/reconciliation account** when those messages appear.
8. **Custom code** only after steps 2-7 are clean; scope a developer change — never invent code
   fixes.
9. **State the fix** with layer and owner (functional SD-FI vs master-data owner vs Basis period vs
   dev).
10. **Write** the diagnosis to `workspace/bugfix/<doc>-billing-ar.md` (gitignored).

## Output

A pinpointed billing/AR root cause + fix, citing the error text and key combination as evidence,
with layer and fix owner. Feeds `fix-doc-and-regression`.

## Judgment calls worth stating out loud

- **Never diagnose VKOA before confirming a billing document number exists** — the create-failure
  and FI-posting-failure trees are different problems with different starting points.
- **A posting block is not automatically a VKOA gap** — check whether release was even attempted
  first.
- **Custom code is the last thing checked, not the first** — only after config/master-data/tax/
  splitting/period are all ruled out.

## Driver

Main driver: test. Owner role per factory-data.json: **test**.

## Status

Progress. Real, tested logic ported from sap-ai-cons; not yet re-verified as part of this factory's
own pipeline wiring.
