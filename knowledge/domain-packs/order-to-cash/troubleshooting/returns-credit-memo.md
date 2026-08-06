# Symptom: returns / credit memo / dispute

Sub-process: `returns`. Return order, return delivery, credit memo request (CMR), credit memo, or
FSCM dispute — creation, determination, or blocking issues in the returns/complaints path. Walk
top-down; stop at the first check that explains it.

## 1. Is it a defect at all? (layer: `user`) — FIRST
- Ticket is "how do I create a return / credit memo" with **no system error** → enablement / OCM;
  document the process steps; **do not** invent a config fix. Stop here.
- Clarify what failed: cannot create return order; return delivery/PGI; cannot create CMR/credit
  memo; wrong value; dispute case not created/updated.

## 2. Document type & process path (layer: `config` / `user`) — COMMON
- Correct returns document type (RE / Z-return) vs credit memo request vs immediate credit memo —
  user often picks the wrong type (`user`) vs missing type in the sales-area menu (`config`).
- Order-related vs delivery-related credit; returns with/without reference to billing document.
- Advanced Returns Management (ARM) in scope? If yes, follow ARM document chain; if no, classic RE
  + credit memo path — do not mix expectations.

## 3. Reference & copy control (layer: `config` / `data`) — VERY COMMON
- With reference to invoice/order: item not copyable (already fully credited, wrong billing type,
  copying control VTFA/VTFL for returns/CMR missing or requirement failing).
- Quantity / value to credit exceeds open reference → system blocks; often `data` / business rule,
  not a bug.
- Pricing type on copy control for returns/credits — wrong price on credit → may hand off to
  `pricing-incorrect.md` once the credit document exists.

## 4. Item category / schedule line for returns (layer: `config`)
- Returns item category determination (doc type + item cat group + usage "returns"); schedule-line
  category for returns (movement type for return delivery, e.g. 651 family — pointer only).
- Credit memo request item category not billing-relevant or blocked.

## 5. Return delivery / PGI of returns (layer: `data` / `config` / `master-data`)
- If the symptom is return **delivery** not created → same structure as `delivery-not-created` but
  with returns doc types; reuse that tree's checks with returns-specific copy control (order→RE
  delivery).
- Return PGI fails → reuse `pgi-fails.md` checks (period, stock, OBYC for return movement).
- Keep sub-process `returns` in the RCA header; cite the shared tree for the walked checks.

## 6. Credit memo billing (layer: `config` / `data`)
- CMR billing block; VF04 selection for credit memo types; copy control CMR→credit memo.
- If credit memo **exists** but FI fails → `billing-no-accounting-document.md` (account keys for
  credits / deductions often differ from revenue — check VKOA for the credit account keys).

## 7. FSCM dispute (layer: `config` / `master-data` / `data`)
- Dispute case not created from billing / customer complaint — dispute reason, category, role
  model, integration from AR open item.
- Wrong disputed amount / status workflow stuck — master data (coordinator) vs config (case type).
- Only enter this branch when the ticket names dispute / FSCM dispute case.

## 8. Custom code (layer: `custom`)
- Returns/credit BAdIs, ARM enhancements, dispute BAdIs. Suspect after the relevant 1–7 branch;
  scope a developer change — do not invent the code fix in prose.

## Output of this tree
Ranked root cause + fix, e.g. "How-to only — no defect; steps: VA01 type RE with reference to
invoice…", or "Copy control billing type F2 → CMR RE not maintained for item cat TAN — add VTFA
entry", with reference doc + copy-control evidence.
