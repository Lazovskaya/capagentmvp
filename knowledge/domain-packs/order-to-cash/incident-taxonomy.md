# O2C incident sub-process taxonomy (O2C domain pack)

The **O2C-specific** sub-process dimension for `incident-triage` and `defect-pattern-analysis`. The
generic method — the layer and severity dimensions, routing principle, dedup, ambiguity handling —
lives in `knowledge/methodology/incident-triage.md`; this file only supplies the O2C sub-processes.

For **ticket-text → sub-process matching** (phrases, tcodes, message types, disambiguation,
confidence), use `incident-signal-catalog.md` — this taxonomy stays the short code list.

For **who owns the ticket** and diagnose handoff, use `routing-matrix.md`.  
For **regression / related areas**, use `subprocess-adjacency.md`.

## Sub-process — where in the O2C chain

| Code | Sub-process | Typical symptoms |
|------|-------------|------------------|
| `order` | Order capture / sales document | Order won't save, incompletion, wrong doc type / partner, item rejected |
| `pricing` | Pricing (condition technique) | Wrong/missing price, discount, surcharge, tax, rebate accrual |
| `atp` | Availability / aATP | No confirmation, wrong confirmed date/qty, backorder, allocation |
| `credit` | Credit management (FSCM) | Order/delivery blocked, wrong exposure, release not working |
| `delivery` | Delivery & shipping (LE) | Delivery not created, PGI error, picking/batch, route/shipping point |
| `billing` | Billing (SD-BIL) | Billing block, wrong billing doc, due list error, invoice not created |
| `ar` | AR posting (FI) | Accounting doc not created, account determination, tax, doc splitting |
| `output` | Output management | Invoice/order confirmation output not triggered / wrong channel |
| `returns` | Returns / credit memo / dispute | Return order, credit memo request, FSCM dispute |
| `interface` | Integration (IDoc/EDI/API) | ORDERS/ORDRSP/DESADV/INVOIC failures, external tax/bank |

## O2C routing notes
Full matrix: `routing-matrix.md`. Short reminders:
- `pricing` → SD pricing · `billing`/`ar` → SD-FI · `credit` → FSCM · `delivery` → LE/shipping ·
  `interface` → by partner/message type + IDoc layer (`idoc-orders-invoic.md` /
  `idoc-failure-analyzer`).
- Most O2C "bugs" in a stable system are master-data or data-consistency issues — apply the generic
  rule of thumb (rule out master-data/user before config/code).
