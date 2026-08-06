# Symptom: sales order will not save / incomplete / wrong capture

Sub-process: `order`. User cannot create or save a sales order (VA01/VA02), hits incompletion, wrong
partners/doc type/item category, or item rejection that blocks processing at capture — **before**
delivery/pricing/credit become the main symptom. Walk top-down; stop at the first check that
explains it.

Leave this tree if the order **saves** and the failure is downstream:
- no confirmation → `atp-no-confirmation.md`
- credit block → `credit-block.md`
- no delivery → `delivery-not-created.md`
- wrong price on a saved order → `pricing-incorrect.md`

## 1. Capture the exact stop (layer: `data`) — FIRST
- Hard error on save vs soft incompletion (document saves but status incomplete) vs wrong data that
  "looks saved" but is the wrong type/partner.
- Message class/number; incompletion log (fields/partners listed).
- New document vs change to existing — different determination moments.

## 2. Incompletion procedure (layer: `config` / `master-data` / `user`) — VERY COMMON
- Which incompletion procedure is assigned (header / item / schedule line) for the sales doc type
  and item category.
- Listed fields empty: PO number, pricing date, plant, inco terms, etc. — fill master/user data
  before changing the procedure.
- Status group settings: does incompletion block save, delivery, or billing? Blocking save is
  often intentional; "cannot deliver" with only delivery-status incompleteness belongs to
  `delivery-not-created`, not here.
- User skipped a mandatory partner/field → layer `user`.

## 3. Partner determination (layer: `config` / `master-data`) — VERY COMMON
- Sold-to entered; partner determination procedure for the doc type; mandatory partner functions
  (ship-to, bill-to, payer, etc.) missing or not determined.
- Customer master / BP missing sales-area data or partner functions on the customer.
- Partner function excluded / wrong procedure after a config change — document type vs customer
  mismatch.

## 4. Sales document type & item category (layer: `config` / `user`) — COMMON
- User chose the wrong order type (`user`) vs order-type determination / common-distribution-channel
  issues (`config`).
- Item category determination (doc type + item cat group + usage + high-level item cat) failing or
  yielding a non-allowed category → item reject / cannot save.
- Schedule-line category determination failing (no ATP/delivery relevance when expected) — if the
  order still saves, downstream trees apply; if save/item add fails, stay here.

## 5. Material / customer sales-area readiness (layer: `master-data`)
- Material not maintained for sales org / distribution channel / delivering plant.
- Customer not created for the sales area; blocking sales status on customer or material.
- Product proposal / material listing-exclusion rejecting the material (listing/exclusion
  procedures) — often message-explicit.

## 6. Plant / shipping / business data determination (layer: `config` / `master-data`)
- Delivering plant not determined (customer-material info, material master, or CMIR).
- Shipping conditions / Incoterms defaults missing when mandatory on the doc type.
- Often surfaces as incompletion (step 2) — fix master/determination rather than removing the
  incompletion field blindly.

## 7. Authorization / number range (layer: `config` / `user`)
- Missing authorization for the order type / sales area.
- Number range for the document type exhausted or not assigned — create fails before business
  checks.

## 8. Custom code (layer: `custom`)
- MV45AFZZ / sales BAdIs rejecting save or clearing partners. Suspect after 1–7; scope a developer
  change — do not invent the code fix in prose.

## Output of this tree
Ranked root cause + fix, e.g. "Incompletion: payer missing — partner determination procedure for
OR does not include payer for this sales area; customer has no RG partner — maintain BP + check
procedure", with incompletion log / partner procedure evidence.
