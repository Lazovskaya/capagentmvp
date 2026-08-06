# Symptom: outbound delivery not created from a sales order

Sub-process: `delivery`. Order exists but no delivery is created (manually via VL01N or in the
delivery due list VL10*). Walk top-down; stop at the first check that explains it.

## 1. Confirmed schedule line quantity (layer: `data` / `master-data`) — MOST COMMON
- A delivery needs a **confirmed** schedule line. Open the order → item → schedule lines.
- No confirmed quantity → ATP found nothing. Route to `atp-no-confirmation.md` (stock, MRP,
  availability check group, checking rule). This is the single most frequent cause.

## 2. Delivery block (layer: `config` / `data`)
- Header delivery block (order type default, or set by credit check) and schedule-line delivery
  block. Check order header and item.
- Credit-triggered block → route to `credit-block.md`.
- Reason for block config: delivery-block reasons and whether they block the delivery due list.

## 3. Delivery due-list selection (layer: `user` / `data`)
- If VL10* returns nothing: selection date vs the item's delivery/goods-issue date; wrong shipping
  point / delivery-creation profile on the selection screen.
- Delivery date in the future beyond the selection horizon → not selected (not a defect).

## 4. Shipping point determination (layer: `config`)
- Shipping point = f(shipping conditions [sold-to/sales doc type] + loading group [material] +
  delivering plant). A missing assignment blocks delivery creation.
- Check the delivering plant on the item is correct first (drives both ShPt and ATP).

## 5. Material / master-data readiness (layer: `master-data`)
- Material sales-org + delivering-plant views; sales status / distribution-chain-specific status
  blocking the item; loading group present (needed for ShPt).
- Batch-managed material without batch determination → route to batch determination config.

## 6. Route determination (layer: `config`)
- If route is mandatory and cannot be determined (departure zone / ship-to transportation zone /
  shipping conditions / transportation group), delivery may be blocked.

## 7. Copying control (layer: `config`)
- Order type → delivery type copying control (VTLA): item category not allowed for delivery, or
  copying requirement routine failing.

## 8. Custom code (layer: `custom`)
- User-exits / BAdIs in delivery creation (e.g. delivery-creation BAdIs, MV50AFZ* includes) adding
  a block or error. Suspect only after 1–7 are clean; scope a dev change, don't patch in prose.

## Output of this tree
Ranked root cause + fix, e.g. "No confirmed qty (ATP): stock shortage in plant X, checking rule
Y — expedite/backorder or adjust availability check", with the checks walked as evidence.
