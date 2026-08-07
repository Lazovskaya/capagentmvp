# O2C IDoc message catalog — ORDERS / INVOIC / ORDRSP / DESADV (O2C domain pack)

The **O2C-specific** message catalog for `idoc-failure-analyzer`. The generic engine knowledge
(status codes, the technical/mapping/application layer split, status nuances, reprocess paths) lives
in `../../../skills/idoc-failure-analyzer/references/idoc-processing.md` — read that first; this file only adds the O2C message
flows and the application-layer (status 51) catalogs. Method only, no client data, no copied SAP text.

## The O2C IDoc flows

| Message | Dir | Basic type | Purpose | Inbound FM / trigger |
|---------|-----|------------|---------|----------------------|
| `ORDERS` | inbound | ORDERS05 | Customer PO → sales order | IDOC_INPUT_ORDERS |
| `ORDRSP` | outbound | ORDERS05 | Order confirmation → customer | Output type on order |
| `DESADV` | outbound | DELVRY07 | Advanced shipping notification | Output type on delivery |
| `INVOIC` | outbound | INVOIC02 | Invoice → customer/EDI | Output type on billing doc |

## Inbound ORDERS — application failure catalog (status 51)

| Error | Layer | Where to fix |
|-------|-------|--------------|
| Customer/partner not identified | `master-data`/`config` | EDI partner conversion (EDPAR / VOE4), partner profile, KNA1 |
| Material not identified | `master-data` | Customer-material info record (VD51 / KNMT), material conversion |
| Price discrepancy beyond tolerance | `config`/`master-data` | Conditions EDI1/EDI2 + tolerance in customer EDI settings; check the underlying condition record in **VK11/VK13** — a missing/expired sales condition is the usual root cause behind the tolerance mismatch, not the tolerance setting itself |
| Unit of measure not converted | `master-data`/`config` | Material UoM + customer UoM mapping |
| Sales area not derived | `config` | Partner profile / customer master |
| Duplicate PO number | `data`/`user` | Duplicate-PO check setting; genuine resend vs error (see checklist) |
| Requested delivery date in the past | `config`/`data` | Date handling / redetermination |
| Incompletion after creation | `config` | Same as online — incompletion procedure |

### Duplicate PO — decision checklist (don't just reprocess)
A duplicate-PO 51 is a *decision*, not a mechanical retry. Establish which case it is:
1. **Legitimate resend** (partner re-sent the same PO, no order yet created) → process once; ignore
   the earlier failed IDoc.
2. **Order already created** from a prior IDoc → true duplicate → **do not** create a second order;
   mark the IDoc handled.
3. **Partner genuinely reuses a PO number** → business/master-data decision with the partner; may
   need the duplicate-check config relaxed for that partner.
Never force-reprocess a duplicate without deciding 1/2/3 — it risks a double sales order.

## Outbound INVOIC / ORDRSP / DESADV — failure catalog

| Error | Layer | Where to fix |
|-------|-------|--------------|
| IDoc never created (no output) | `config`/`master-data` | Output determination: condition record for the output type (billing/delivery/order) |
| Partner profile missing (status 29) | `config` | WE20 outbound parameters for partner + message type |
| Stuck at 30/03, not dispatched | `technical` | ALE port/RFC (WE21/SM59), subsystem, job RSEOUT00; for SAP-to-SAP ALE also check the **distribution model (BD64)** — a missing message-type assignment between logical systems blocks generation and can look like a partner-profile issue |
| Syntax error (26) | `mapping` | Segment/field mapping, basic type/extension |
| Rejected at receiver (40) | `mapping`/external | Confirm SAP content OK first, then partner's mapping — raise with EDI partner |
| Outbound application error (51 on generation) | `application` | Rare but real: master-data/config gap while *building* the IDoc (e.g. missing partner output data, message/segment determination) → functional |

## Known SAP Note (O2C-specific)
- **DESADV inbound finishing at status 52 instead of 53:** if a DESADV (or WHSCON/SHPCON) inbound
  IDoc raises a warning/error during processing but still completes, the status can end at `52`
  rather than the expected `53` — this is documented behavior, not a hung/broken IDoc. Don't chase
  it as a defect; read the warning/error text that was raised during processing instead.

## Custom-code hooks (O2C-specific) — check before debugging blind
Per the generic engine's "Discovering custom-code hooks": these are the O2C/SD exit families to look
for first. Confirm which is actually implemented in this system (WE41/WE42/SMOD) before assuming one.

| Direction | Enhancement / BAdI | Exit / method | Trigger point |
|-----------|--------------------|--------------|----------------|
| ORDERS inbound (→ sales order) | `VEDB0001` | `EXIT_SAPLVEDB_001` | SD EDI incoming change orders — read additional data from the IDoc (ORDERS/ORDCHG) |
| ORDERS inbound (→ sales order) | `MV45AFZZ` | `EXIT_SAPLVEDA_001` / `_002` | Modify sales order header / item data before save |
| ORDERS inbound (→ sales order) | `MV45AFZZ` | `USEREXIT_MOVE_FIELD_TO_VBAK` / `_VBAP` | Transfer custom fields to order header (VBAK) / item (VBAP) — e.g. material cross-reference, UoM conversion |
| ORDERS inbound (→ sales order) | `BADI_SD_SALES_BAPI` | various | Enhances the sales-order-create BAPI called during ORDERS inbound |
| ORDERS inbound → delivery | `LE_SHP_DELIVERY_PROC` | various | Influences delivery processing triggered downstream of the inbound order |
| ORDERS inbound (general hook) | `ORDERS_BADI` | various | General pre/post-processing hook for ORDERS inbound |
| ORDRSP outbound (order confirmation) | `SDEDI001` | `EXIT_SAPLVEDC_001` / `_003` / `_004` | Outbound confirmation IDoc — `_004` is commonly used to populate custom/statistical pricing segments (e.g. E1EDP05) |
| INVOIC outbound (customer invoice) | `LVEDF001` | `EXIT_SAPLVEDF_001..004` | Control data / segment enhancement / additional-data reading for the outbound invoice IDoc |

> Note: `ORDERS` also carries **procurement-direction** exits (purchase-order confirmation
> processing) in some systems — those belong to a P2P domain pack, not this one. Don't apply them
> to an O2C (sales order) symptom.

## Handoffs
- Status-51 application errors that mirror online failures → the O2C troubleshooting trees
  (`troubleshooting/pricing-incorrect.md`, etc.).
- Suspected custom-code cause → the exit/BAdI table above, then the generic engine's SE37/BD87/SM50
  debug procedure.
