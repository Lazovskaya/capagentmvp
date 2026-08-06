# Symptom: post goods issue (PGI) fails on the outbound delivery

Sub-process: `delivery`. The delivery exists; picking (if used) may be done; **post goods issue**
(VL02N / collective PGI) errors or does not create the material/FI documents. Walk top-down; stop
at the first check that explains it.

Not for "delivery not created" — that is `delivery-not-created.md`. Not for billing/FI after a
successful PGI — that is billing / `ar` trees.

## 1. Read the exact PGI error (layer: `data`) — FIRST
- Capture the message class/number and text from VL02N / VL06G / application log. Many causes are
  named explicitly (period, stock, account, batch, serial).
- Confirm delivery status: picking complete (if required), packs, WM/EWM transfer order confirmed
  where relevant — incomplete logistics often blocks PGI before FI/MM logic runs.

## 2. Posting period / company code calendar (layer: `config` / `data`) — VERY COMMON
- MM posting period for the plant / company code (MMPV / period status) closed for the GI date.
- FI posting period (OB52) closed for the company code / account type on the GI posting date.
- Wrong document date / posting date on the delivery (user entered a closed period) — try the open
  period date before changing period customizing.
- Layer: often `data` (date) or `config`/`data` (period not opened for month-end).

## 3. Stock / batch / serial availability at GI (layer: `data` / `master-data`) — VERY COMMON
- Unrestricted stock in the **storage location** on the delivery insufficient at GI time (picked
  qty vs available — race with another GI).
- Batch determined on the delivery but batch stock short / restricted / in another SLoc.
- Serial-number profile: serials not assigned or already used.
- WM/EWM: stock not in the bin the delivery expects; TO/WT not confirmed.
- Fix stock/batch/serial first; do not "fix" by forcing GI past the message.

## 4. Account determination for goods issue (layer: `config`) — COMMON
- GI from delivery posts MM+FI (movement type, typically 601). Missing/incorrect **automatic account
  determination** (OBYC / valuation class × transaction key BSX/GBB/…).
- Material valuation class blank or unexpected; valuation area (plant/company) inconsistency.
- Error text usually names account determination — follow that, not SD copy control.

## 5. Material / plant readiness (layer: `master-data`)
- Material plant view exists; material status blocking goods movements.
- Quantity/value updating flags; profit center / segment on the material or account assignment if
  required for the GI lines (especially with document splitting).
- Sales-order / project stock mismatch (item is special stock but GI tries unrestricted, or reverse).

## 6. Delivery / item completeness before GI (layer: `data` / `user` / `config`)
- Incomplete packing if packing is mandatory; dangerous-goods / export data incomplete.
- Incompletion on the delivery still open for GI-relevant fields.
- Credit check at GI (if configured) failing → route evidence to `credit-block.md` (secondary), but
  keep sub-process note that the failure point was PGI.

## 7. Movement type / schedule-line / item category (layer: `config`)
- Schedule-line category / item category not goods-movement relevant (should have been caught
  earlier, but mis-config shows up at PGI).
- Wrong movement type determination for the item — rare; check only after 1–6.

## 8. Custom code (layer: `custom`)
- User-exits / BAdIs in goods issue / delivery (e.g. delivery GI BAdIs, MB_DOCUMENT_* related
  enhancements). Suspect only after 1–7; scope a developer change — do not invent the code fix.

## Output of this tree
Ranked root cause + fix, e.g. "MM period for plant 1000 closed for posting date — open period or
repost with open date; stock and OBYC clean", with the message id and period/stock evidence.
After successful PGI, billing issues are a **new** symptom → `billing-document-not-created` or
`billing-no-accounting-document` as appropriate.
