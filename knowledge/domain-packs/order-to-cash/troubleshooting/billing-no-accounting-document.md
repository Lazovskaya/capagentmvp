# Symptom: billing document created but no accounting (FI) document

Sub-process: `ar` (posting) / `billing`. The billing document exists but the accounting document
was not posted (status "not cleared for accounting" / posting error). Walk top-down.

## 1. Posting block on the billing type (layer: `config` / `user`)
- Billing type may be configured with **"posting block"** — the invoice must be released to
  accounting (VF02 → release). If so, this is by design; the fix is release, not config.

## 2. Account determination — VKOA (layer: `config`) — MOST COMMON REAL DEFECT
- Revenue / deduction / accrual account determination (transaction VKOA) missing an entry for the
  key combination in use (chart of accounts + sales org + account assignment group of customer &
  material + account key from the pricing procedure). See
  `../billing-ar-account-determination.md` for the full key table and failure modes.
- Check the **account assignment group** on the customer (billing view) and material (sales org
  view) — a blank/mismatched group is a frequent trigger.
- Account key on the condition type in the pricing procedure must have a matching VKOA entry.

## 3. Tax determination (layer: `config` / `master-data`)
- Missing/incorrect tax code, tax classification of customer/material, or tax account
  determination. External tax engine (e.g. jurisdiction) not returning a result also blocks posting.

## 4. Document splitting (layer: `config`) — S/4 / New GL
- If document splitting is active, a missing splitting characteristic (e.g. profit center, segment)
  on a line prevents posting. Check the splitting rule and the source of the characteristic.

## 5. Number range / period (layer: `config` / `data`)
- Missing number range for the FI document type; posting period not open (OB52) for the company
  code / account type.

## 6. Master-data consistency (layer: `master-data`)
- Customer reconciliation account, currency / exchange-rate type missing for the posting date,
  cost element for revenue where CO requires it.

## 7. Custom code (layer: `custom`)
- BAdIs/user-exits in billing→accounting interface (e.g. SD-FI interface BAdIs) rejecting or
  altering the posting. Suspect after 1–6; scope a dev change.

## Output of this tree
Ranked root cause + fix, e.g. "VKOA missing entry for account assignment group 03 / account key
ERL — add the entry" with the customer/material account-assignment groups shown as evidence.
