# Billing → AR posting — account determination reference (agnostic)

Reference for `billing-ar-error-analyzer` and the trees
`troubleshooting/billing-document-not-created.md` /
`troubleshooting/billing-no-accounting-document.md`. How SD billing posts to FI-AR and where it
fails. Method only — pointers to transactions/tables, no client data, no copied SAP text.

## Two failure points (do not conflate)

| Point | Symptom | Sub-process | Primary tree |
|-------|---------|-------------|--------------|
| **A. Billing create** | No billing document; VF04 empty/error; billing block | `billing` | `billing-document-not-created` |
| **B. FI release / posting** | Billing doc exists; no accounting doc; "not cleared for accounting"; VKOA/tax/splitting error | `ar` | `billing-no-accounting-document` |

This reference deep-dives **point B** (and the account-determination keys that also abort create in
some landscapes). For point A, use the billing-create tree; only jump here when the error text is
clearly account determination / tax / FI on create.

## The SD→FI posting chain (trace in this order)

1. **Billing document exists** and is relevant for accounting (not a pro-forma / non-posting type
   unless misconfigured).
2. **Posting block on billing type** — if set, release to accounting is a separate step (VF02).
   Blocked-by-design ≠ VKOA defect.
3. **Pricing conditions on the billing doc** carry **account keys** (from the pricing procedure
   assignment of each condition type). Revenue, discounts, surcharges, freights, taxes — each key
   that should post needs a G/L.
4. **Account determination (VKOA)** resolves G/L accounts from those keys + organizational /
   master-data dimensions.
5. **Tax** resolves tax codes / tax accounts (and may call an external engine).
6. **FI document** is created (customer reconciliation + revenue/deduction/tax lines), subject to
   **document splitting**, **period**, and **number range**.
7. **CO / PA** side effects (cost elements, profitability segment) can still reject the posting
   after G/Ls look fine.

## VKOA — revenue account determination

Transaction pointer: **VKOA** (Sales/Billing → Account Assignment → Revenue Account Determination).

### Keys typically in play

Exact tables/procedures vary by chart-of-accounts procedure; always read **which access/table** the
error or account-determination analysis used. Common dimensions:

| Dimension | Source |
|-----------|--------|
| Chart of accounts | Company code |
| Sales organization | Billing document |
| Account key | Pricing procedure → condition type (e.g. ERL revenue, ERS sales deductions, ERF freight — client-specific keys) |
| Account assignment group — **customer** | Customer master, billing view (or BP sales-area equivalent) |
| Account assignment group — **material** | Material master, sales org view |
| Account assignment group — **sales** (optional tables) | Depending on the procedure |

Missing **customer or material account assignment group** (blank) is one of the most frequent
triggers of "account determination" errors after a master-data cutover or new material/customer.

### How to diagnose VKOA

1. From the billing item, list condition types that should post and their **account keys**.
2. Read customer + material **account assignment groups** on the document (or masters as of billing
   date).
3. In VKOA, find the procedure/table for that chart of accounts and the access that matches those
   keys — confirm a G/L is assigned and valid (not blocked, correct company-code chart).
4. Credit memos / returns often use **different account keys** (deductions) — do not reuse only the
   F2 invoice VKOA row as proof that credits are covered.

### Failure modes → layer

| Failure | Layer | Tell-tale |
|---------|-------|-----------|
| No VKOA entry for the key combination in use | `config` | Account determination error naming sales org / groups / account key |
| Customer or material AcctAssgmt group blank / wrong | `master-data` | Same error; groups empty or unexpected on master |
| Account key missing on condition in pricing procedure | `config` | Condition values on billing but nothing to determine; or only some lines post |
| G/L missing in company code / blocked / wrong type | `config` / `master-data` | Account does not exist in CoCd; reconciliation vs P&L mismatch |
| Wrong chart / sales org on document | `data` / `config` | Looking up VKOA in the wrong org |
| Credit/rebate keys not maintained | `config` | Invoices OK, credit memos fail (or vice versa) |

## Tax at posting time

- Tax condition on the billing document must yield a **tax code** (and jurisdiction where used).
- Customer / material **tax classification** + departure/destination country (and region) drive
  determination; external tax engines can return an error that blocks FI.
- Tax **account** determination (separate from VKOA revenue) must cover the tax code.
- Layer: often `master-data` (classification) or `config` (tax procedure / accounts); external
  engine outage → treat as interface/ops with functional confirmation of tax data.

Wrong tax **on the order only** (before billing) is still a `pricing` concern — use
`pricing-incorrect` / `pricing-diagnostic`. Tax that **blocks FI** after billing exists → this
reference / `ar` tree.

## Document splitting (S/4 / New GL)

- When splitting is active, every FI line needs required characteristics (e.g. profit center,
  segment, functional area — per splitting rule).
- Characteristics come from material, cost center, PA segment, profitability segment, or
  substitution — a blank profit center on a revenue line is a classic block.
- Layer: usually `config` (splitting rules / assignment) or `master-data` (PC on material /
  account assignment). Diagnose with the splitting error text, not by widening VKOA.

## Period, number range, reconciliation account

| Check | Layer | Pointer |
|-------|-------|---------|
| FI posting period closed for CoCd / account type | `config` / `data` | OB52; or wrong posting date on billing |
| Billing type FI document type number range | `config` | Number range object for the FI doc type |
| Customer reconciliation account missing / not created in CoCd | `master-data` | Customer company-code view |
| Exchange rate missing for posting date | `master-data` / `data` | Rate type on document vs table |

## Copy control (context for create vs value)

Copy control order/delivery → billing (VTFA / VTFL) belongs mainly to **point A** (create). For
**point B**, the relevant copy-control detail is usually already applied (billing exists). Exception:
pricing type caused wrong/missing conditions → missing account keys on the invoice — then fix
pricing/copy control (`pricing` / `billing`), then re-release to accounting.

## Custom code

SD-FI interface BAdIs / user-exits can reject or rewrite account assignment after VKOA succeeds.
Suspect only when VKOA, tax, splitting, period, and masters are clean. Scope a developer change;
never invent the code fix in prose.

## Minimal evidence pack (ask the consultant)

For an "accounting document not created" ticket, prefer:
1. Billing document number + item; screenshot/export of **header/item status** (accounting).
2. Exact error message (VF02 release / VFX3 / application log).
3. Customer + material **account assignment groups**; pricing procedure account keys on the item.
4. Optional: VKOA excerpt for that sales org / groups / account key; OB52 if period suspected.

## Related skills / trees

- Prefer this deep-dive (`billing-ar-error-analyzer`) when the defect is clearly SD-FI posting /
  VKOA / tax-at-posting / splitting.
- Generic `root-cause-playbook` can walk the same trees when the analyzer is not selected.
- Billing **not created** → `billing-document-not-created` first.
