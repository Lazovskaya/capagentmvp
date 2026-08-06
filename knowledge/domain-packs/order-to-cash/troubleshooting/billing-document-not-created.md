# Symptom: billing document not created

Sub-process: `billing`. Delivery and/or order is complete enough that business expects an invoice,
but no billing document appears (VF01/VF04 empty or errors; document flow stops before billing).
Walk top-down; stop at the first check that explains it.

**Not** this tree if a billing document **exists** but FI posting fails → use
`billing-no-accounting-document.md` (`ar`).  
**Not** this tree if the only issue is wrong price/discount on an invoice that did create →
`pricing-incorrect.md`.

## 1. Confirm predecessor status (layer: `data`) — FIRST
- Document flow on the order/delivery: PGI done if the billing type requires it (delivery-related
  billing); order fully delivered / rejected residuals cleared as needed.
- Open quantity to bill = 0 because already billed, credited, or rejected → not a creation defect.
- Intercompany / order-related vs delivery-related billing mismatch — wrong expectation of which
  predecessor bills.

## 2. Billing block (layer: `config` / `data`) — VERY COMMON
- Header or item **billing block** on the order and/or delivery. Reason code and whether it blocks
  the due list.
- Blocks set by credit, manual user, or default from document type. Credit-origin → also note
  `credit-block.md`; clearing the billing block without fixing credit may bounce back.
- Remove/clear block only when legitimate; do not treat a deliberate block as a defect.

## 3. Billing due list selection (layer: `user` / `data`) — COMMON
- VF04 selection: billing date / billing document date vs proposed billing date on the item;
  sales org, shipping point, sold-to filters excluding the document.
- "Billable" date in the future → not selected (often `user` / process timing, not config).
- Collective billing criteria splitting docs unexpectedly — check before assuming copy-control
  failure.

## 4. Copying control to billing (layer: `config`) — COMMON
- Order → billing (VTFA) and/or delivery → billing (VTFL): billing type allowed for the
  order/delivery type; item category relevant for billing; copying requirements (routines) that
  return false (e.g. PGI not complete, reference status).
- Billing quantity / positive-negative quantity settings causing zero billable qty.
- If the symptom is "invoice created but price wrong" only → leave this tree for
  `pricing-incorrect` (pricing type in copy control).

## 5. Invoice list / billing type determination (layer: `config` / `master-data`)
- Billing type determination (document pricing procedure / customer / sales area) yielding an
  unexpected or inactive billing type.
- Partner functions required on the billing document missing on the predecessor (bill-to, payer).
- Output-only confusion: business says "no invoice" but means no PDF — if billing doc exists in
  document flow, reclassify to `output` (`output-not-issued` when authored).

## 6. Accounting / enrichment blockers before save (layer: `config` / `master-data`)
- Some landscapes abort billing **create** (not only FI release) when tax/account assignment data
  is incomplete — read the VF01/VF04 error. If the error is clearly account determination /
  "accounting document" on an already-created billing doc → switch to
  `billing-no-accounting-document.md`.
- Number range for the billing type exhausted or missing.

## 7. Incompletion & business data (layer: `master-data` / `data`)
- Incompletion procedures on order/delivery still open for billing-relevant fields.
- Missing tax classification, payment terms, or inco terms when required for billing.

## 8. Custom code (layer: `custom`)
- Copying requirement routines (VOFM), billing BAdIs / user-exits rejecting creation. Suspect after
  1–7; scope a developer change — do not invent the code fix in prose.

## Output of this tree
Ranked root cause + fix, e.g. "Item billing block 01 on delivery 8000… — clear block after credit
release; VTFL and due-list selection OK", with document flow + block + copy-control evidence.
If billing then fails to post to FI → continue with `billing-no-accounting-document.md`.
