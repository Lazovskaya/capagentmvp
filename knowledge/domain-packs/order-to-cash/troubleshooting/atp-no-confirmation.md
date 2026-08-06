# Symptom: no / wrong ATP confirmation on the sales order

Sub-process: `atp`. Schedule line confirmation is missing, zero, or the confirmed date/qty is wrong
despite (claimed) available stock. Walk top-down; stop at the first check that explains it.

Came here from `delivery-not-created` when confirmed qty = 0, or from triage when the ticket names
ATP / aATP / confirmation / backorder / allocation / CO09.

## 1. Read the schedule line & requirements (layer: `data`) — FIRST
- Order item → schedule lines: order qty, confirmed qty, confirmation date, schedule-line category
  (must allow confirmation / delivery relevance).
- Requirements type / class on the item (from item category + MRP strategy) — wrong type can skip
  ATP or post to the wrong planning side.
- If confirmed qty already equals order qty and dates look right → this is **not** an ATP defect;
  return to `delivery-not-created` (block, shipping point, due list, etc.).

## 2. Plant & storage location on the item (layer: `master-data` / `user`) — COMMON
- Delivering plant on the item drives ATP. Wrong plant (manual override or determination) → "no
  stock" in the plant that was checked while stock sits elsewhere.
- Storage-location ATP active? Then SLoc on the item / determination matters; blank or wrong SLoc
  excludes the stock the business is looking at in MMBE.

## 3. Stock vs what ATP actually counts (layer: `data`) — VERY COMMON
- Compare unrestricted stock in the **same plant/(SLoc)** ATP uses (MMBE / stock overview) to the
  confirmation result.
- Special stock (consignment, project, sales-order stock) does **not** confirm a normal order —
  mismatch between business "we have stock" and ATP scope.
- Quality / blocked / restricted stock excluded by the checking rule → looks like "stock exists"
  in the warehouse view but ATP ignores it.
- Open reservations, other sales orders, deliveries already consuming the same material — use the
  availability overview (CO09 or aATP equivalent) to see the cumulative ATP situation, not only
  MMBE on-hand.

## 4. Availability check group & checking rule (layer: `config` / `master-data`) — COMMON
- Material master: **availability check group** (MRP/Sales views). Missing or "no check" group
  explains odd confirmations (always full, or never).
- Checking rule for the sales document (order type / transaction) defines which stock types and
  which inward/outward movements enter ATP (safety stock, quality, blocked, purchase orders,
  production orders, etc.).
- Replenishment lead time / "check without RLT" — with RLT, system may confirm outside total
  replenishment lead time even with zero stock; without it, confirms only against ATP supply.
- Fix: correct group on the material or the checking-rule scope — not "add fake stock".

## 5. Requirements / transfer of requirements (layer: `config`)
- Schedule-line category: availability check on/off; reqs transfer to MRP on/off.
- If check is off → full confirmation without ATP (opposite of this symptom) or no ATP call at all.
- Item category × MRP type combinations that suppress requirements — confirmation behavior then
  diverges from what planners expect in MD04.

## 6. Product allocation / aATP specifics (layer: `config` / `data`)
- If product allocation (PAL) or advanced ATP is in scope: allocation exhausted for the customer /
  region / period → confirmed qty cut even when plant stock is free.
- aATP: supply assignment, alternative-based confirmation (substitution, location substitution) —
  wrong confirmation date can be intentional substitution logic, not a stock bug.
- Confirm whether the client runs classic ATP or aATP before drilling allocation customizing.

## 7. Material status / sales status (layer: `master-data`)
- Plant-specific material status or distribution-chain status blocking procurement/delivery can
  prevent confirmation or delivery relevance.
- Cross-plant status / sales hold on the material — treat as master-data before config.

## 8. Custom code (layer: `custom`)
- User-exits / BAdIs in ATP / sales availability (classic ATP user exits; aATP BAdIs). Suspect only
  after 1–7 are clean; scope a developer change — do not invent the code fix in prose.

## Output of this tree
Ranked root cause + fix, e.g. "Checking rule excludes quality inspection stock — 200 PC in QI at
plant 1000; move to unrestricted or adjust rule if QI should confirm", with CO09/stock evidence.
After confirmation is fixed, re-check delivery creation via `delivery-not-created` if the original
ticket was "no delivery".
