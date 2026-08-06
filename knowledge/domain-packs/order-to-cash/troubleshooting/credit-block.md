# Symptom: credit block on sales order or delivery

Sub-process: `credit`. Order and/or delivery is blocked by a credit check (classic SD credit or
FSCM/UKM), or the business disputes the exposure/limit/release. Walk top-down; stop at the first
check that explains it.

Came here from `delivery-not-created` when the delivery block is credit-triggered, or from triage
when the ticket names credit / exposure / UKM / credit release.

## 1. Confirm it is a credit block (layer: `data`) — FIRST
- On the sales order: status / credit status; credit block reason; document currency and net value.
- On the delivery: delivery block reason — credit-origin vs ordinary delivery-block reason (if not
  credit → leave this tree, return to `delivery-not-created`).
- Note **when** the block appeared (order save vs delivery create vs PGI) — different check points
  in the credit procedure.

## 2. Credit master / BP credit segment (layer: `master-data`) — VERY COMMON
- Business partner / customer credit master: credit limit, risk category, credit account, valid-to,
  blocked indicator.
- FSCM: credit segment assignment, check rule on the BP; transaction pointers UKM_BP / BP credit
  profile (names vary by release — use the client's FSCM UI).
- Limit = 0, expired segment, or "blocked" flag → often explains an "unexpected" block without any
  config defect.
- Wrong credit account (payer vs sold-to) → exposure on the wrong BP.

## 3. Open exposure vs limit (layer: `data`) — VERY COMMON
- Compare **credit exposure** (open orders + deliveries + billing + FI open items, per check rule
  horizon) to the **limit**.
- Business says "within limit" but system blocks → usually (a) open docs not released/rejected still
  in exposure, (b) wrong currency/exchange rate, (c) shared credit account pulling sister-company
  exposure, (d) commitment update lag after a recent release/rejection.
- List the documents that make up exposure; one stuck order often is the whole story.

## 4. Credit check procedure & risk category (layer: `config`)
- Which **credit check** runs for this document (static, dynamic, maximum document value, oldest
  open item, payment terms, etc.) — determined via risk category + credit control area / credit
  segment + document credit group.
- Automatic credit control (OVA8 / FSCM equivalent): reaction = error vs warning; which checks are
  active for order / delivery / goods issue.
- Document type or item category excluded from credit → no check (opposite symptom); or unexpectedly
  included after a config change.

## 5. Credit control area / segment determination (layer: `config` / `master-data`)
- Credit control area (or FSCM credit segment) derived from company code / sales area / customer.
- Wrong area/segment → wrong limit and wrong open items. Check derivation before changing limits.

## 6. Release / workflow not working (layer: `config` / `master-data` / `user`)
- Document was released but block returned on next change (recheck on change active).
- Approver / workflow not determined; release authorization missing; release only partial (header vs
  item).
- Manual release forgotten after a one-off exception — layer `user`, not a defect.

## 7. Update / rebuild inconsistencies (layer: `data`)
- After mass changes, migrations, or cancelled docs: exposure figures disagree with document list.
- Pointers: credit info rebuild / update programs for the release in use (classic SD credit info
  structures vs FSCM liability update). Prefer rebuild over manual limit inflation.
- Suspect only after 2–3 show a numeric mismatch you can evidence.

## 8. Custom code (layer: `custom`)
- User-exits / BAdIs in credit check or FSCM check (classic SD credit user exits; FSCM check BAdIs).
- Suspect only after 1–7 are clean; scope a developer change — do not invent the code fix in prose.

## Output of this tree
Ranked root cause + fix, e.g. "Exposure includes open order 45… still at full value after partial
delivery — reject/close residual or release; limit itself is correct", with the checks walked as
evidence. If limit truly too low for agreed policy → `master-data` change on the BP/credit segment,
not an automatic-credit config change, unless the check reaction/type is wrong.
