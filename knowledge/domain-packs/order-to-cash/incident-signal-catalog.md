# O2C incident signal catalog (domain pack)

Maps **ticket text signals** → O2C sub-process (+ layer hint + confidence). Used by
`incident-triage` (and later `defect-pattern-analysis`) together with
`incident-taxonomy.md`. Distilled consultant signals only — no client data, no copied SAP text.

The **generic procedure** for applying a signal catalog lives in
`../../../skills/incident-triage/references/incident-triage-method.md` (§ Signal matching). This
file is the O2C pack.

## How to read a row

| Column | Meaning |
|--------|---------|
| **Signal** | Phrase, pattern, tcode, message type, or document cue in short text / description |
| **Layer hint** | Best first guess of the generic layer (`config` / `master-data` / `custom` / `data` / `user`) — confirm in diagnose; never treat as final |
| **Strength** | `strong` = nearly exclusive → high confidence; `medium` = usual home, check disambiguation; `weak` = supporting only |
| **Notes** | Disambiguate / handoff |

Match case-insensitively; treat near-synonyms (won't / cannot / fails to; invoice / billing doc) as the same signal.

---

## `order` — order capture / sales document

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| order will not save / cannot save sales order | `master-data` / `config` | strong | RCA → `order-will-not-save` |
| incompletion log / incomplete order | `master-data` / `user` | strong | RCA → `order-will-not-save` |
| wrong document type / sales order type | `user` / `config` | medium | User picked wrong type vs type determination |
| partner function missing / sold-to not determined | `master-data` / `config` | strong | Partner determination |
| item rejected / rejection reason | `user` / `data` | medium | Often intentional; check if defect |
| VA01 / VA02 error (no delivery/billing context) | `master-data` / `config` | medium | Prefer more specific signal if present |
| schedule line category / item category wrong | `config` | medium | Determination; may cascade to delivery |

## `pricing` — condition technique

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| wrong / missing / zero price | `master-data` | strong | Default to condition record; handoff `pricing-diagnostic` |
| PR00 / base price / condition record not found | `master-data` | strong | Pricing Analysis |
| discount / surcharge missing or wrong (K007, RA00…) | `master-data` / `config` | strong | Record vs exclusion vs procedure |
| Pricing Analysis / condition access not made | `config` | strong | Requirement / access sequence |
| tax wrong on order (MWST…) — before billing | `master-data` / `config` | medium | Tax on order = pricing; tax blocking FI = `ar` |
| rebate / accrual wrong | `config` / `master-data` | medium | |
| price right on order, wrong on invoice | `config` | strong | Copy-control **pricing type** — still `pricing`, not `billing` |
| V/LD, VK11, VK13 mentioned | `master-data` | medium | Condition maintenance |

## `atp` — availability / aATP

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| no confirmed quantity / confirmation = 0 | `data` / `master-data` | strong | Often root of "no delivery" — classify `atp` if confirmation is the stated cause; else see disambiguation |
| wrong confirmed date / qty | `config` / `data` | strong | |
| backorder / allocation / product allocation | `config` / `data` | strong | aATP / PAL |
| stock available but not confirmed | `config` / `data` | strong | Checking rule / scope of check |
| CO09 / availability overview | `data` | medium | |
| ATP / aATP / PAC / ABC | `config` / `data` | strong | |

## `credit` — credit management (FSCM)

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| credit block / credit check failed | `config` / `data` | strong | Order or delivery blocked by credit |
| credit exposure / limit wrong | `master-data` / `data` | strong | Master vs open docs |
| credit release not working / UKM_BP | `config` / `master-data` | strong | FSCM |
| static/dynamic credit check | `config` | medium | |
| delivery blocked by credit | `config` / `data` | strong | Sub-process `credit`, not `delivery` |

## `delivery` — delivery & shipping (LE)

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| delivery not created / cannot create delivery | `data` | strong | Often ATP underneath — see disambiguation |
| not in VL10 / delivery due list | `data` / `user` | strong | Selection vs block vs confirmation |
| VL01N / VL02N error | `data` / `config` | medium | Read error text |
| PGI / post goods issue fails | `data` / `config` | strong | RCA → `pgi-fails`; period, stock, OBYC — may co-touch FI |
| picking / batch / WM / EWM transfer | `master-data` / `config` | strong | |
| shipping point / route not determined | `config` | strong | |
| delivery block (header/schedule) — no credit wording | `config` / `data` | medium | If credit mentioned → `credit` |
| goods movement / material document on delivery | `data` | medium | |

## `billing` — billing (SD-BIL)

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| invoice / billing document not created | `config` / `data` | strong | Due list / copy control / block → `billing-document-not-created` |
| billing block | `config` / `data` | strong | Header/item block |
| VF04 / billing due list empty or error | `data` / `config` | strong | |
| wrong billing document / wrong billing type | `config` / `user` | medium | |
| copy control order→billing (VTFL) issue | `config` | strong | Still `billing` unless only pricing type → `pricing` |
| cannot release billing doc (process, not FI) | `config` / `user` | medium | If "accounting" / VKOA → `ar` |

## `ar` — AR posting (FI)

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| accounting document not created | `config` | strong | Classic SD-FI; handoff billing-AR analyzer / tree |
| not cleared for accounting / posting status error | `config` | strong | |
| account determination / VKOA / revenue account | `config` | strong | |
| tax account / tax code blocks posting | `config` / `master-data` | medium | Posting-time tax = `ar`; order-only tax = `pricing` |
| document splitting / profit center missing on FI lines | `config` | strong | S/4 New GL |
| OB52 / posting period (from billing→FI) | `config` / `data` | medium | Also common on PGI — see context |
| VF02 release to accounting fails | `config` | strong | |

## `output` — output management

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| output not issued / not triggered | `config` / `master-data` | strong | NACE / BRF+ / OPD → `output-not-issued` |
| customer did not receive invoice PDF / email | `config` / `master-data` | medium | Could be output **or** outbound INVOIC — see disambiguation; if output → `output-not-issued` |
| wrong output type / channel / partner | `config` / `master-data` | strong | |
| order confirmation / delivery note not printed | `master-data` / `config` | strong | |
| NACE / BRF+ / output determination | `config` | strong | |
| spool / email gateway (no EDI/IDoc wording) | `data` / `config` | medium | Basis co-assign if technical send |

## `returns` — returns / credit memo / dispute

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| return order / return delivery | `config` / `user` | strong | RCA → `returns-credit-memo` |
| credit memo request / credit memo | `config` / `user` | medium | Doc type vs dispute → `returns-credit-memo` |
| how do I create a return (no error) | `user` | strong | Training — not a defect; still `returns-credit-memo` step 1 |
| FSCM dispute / dispute case | `config` / `data` | strong | RCA → `returns-credit-memo` (§ dispute) |
| subsequent delivery free of charge | `config` / `user` | medium | |

## `interface` — integration (IDoc / EDI / API)

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| IDoc / EDI / ALE / WE02 / BD87 / partner profile | — (use IDoc layer split) | strong | Handoff `idoc-failure-analyzer`; layer = technical / mapping / application per `idoc-processing.md` |
| ORDERS / ORDRSP / DESADV / INVOIC + status | application or technical | strong | Message type + status text drive layer |
| status 51 / 26 / 29 / 30 stuck / 64 backlog | per status | strong | See generic IDoc status table |
| inbound orders failing (EDI) | application → often `master-data` | strong | Still sub-process `interface` for routing; functional cause may be customer/material |
| outbound invoices stuck (EDI) | technical often | strong | Status 29/02 → Basis; application text → functional |
| API / OData / CPI / Integration Suite failure | mapping / technical | medium | Same three-way split as IDoc where applicable |
| external tax / bank interface error | mapping / `config` | medium | |

> For `interface`, **sub-process stays `interface`** (route by partner/message type). The functional
> root cause (customer not found, material…) is recorded in notes and may name a secondary
> sub-process for the diagnose handoff — do not reclassify away from `interface` when the ticket is
> clearly an integration failure.

---

## Cross-cutting layer signals (any sub-process)

| Signal | Layer hint | Strength | Notes |
|--------|------------|----------|-------|
| Z-program / Z-include / custom BAdI / user-exit dumps | `custom` | strong | Co-assign dev; don't invent the code fix in triage |
| ST22 dump / UPDATE termination | `custom` / `data` | medium | Need dump text |
| "how do I…" / training / process steps, no error | `user` | strong | Enablement — not a defect |
| master data missing / customer/material not maintained | `master-data` | strong | |
| wrong config / customizing / IMG | `config` | weak | Users often mislabel; verify |
| data inconsistency / document flow broken | `data` | medium | |

---

## Disambiguation rules (apply after raw matches)

Use when two sub-processes both hit. Prefer the **more specific / causal** code.

| Collision | Prefer | Rule |
|-----------|--------|------|
| `delivery` vs `atp` | `atp` if confirmation/stock/ATP is named; else `delivery` | "No delivery" alone → `delivery` (tree will redirect to ATP). "No confirmed qty" / "stock but no confirm" → `atp`. |
| `delivery` vs `credit` | `credit` if credit block/check/exposure named | Delivery block without credit wording stays `delivery`. |
| `billing` vs `ar` | `ar` if accounting / VKOA / FI posting / "not cleared for accounting" | Invoice not created / due list / billing block → `billing`. Billing exists, FI missing → `ar`. |
| `pricing` vs `billing` | `pricing` if condition/price/discount/Analysis; `billing` if due list/block/doc creation | "Discount on order missing on invoice" → `pricing` (copy-control pricing type). |
| `pricing` vs `ar` | `ar` if posting/account determination; `pricing` if condition value only | Tax: on-order wrong → `pricing`; blocks FI post → `ar`. |
| `output` vs `interface` | `interface` if IDoc/EDI/INVOIC/ORDERS/status/WE*; else `output` | "Customer didn't get invoice" with no channel → `output` (medium confidence); with EDI/IDoc → `interface`. |
| `order` vs `*` | keep the downstream process if the failure is there | Order saved but delivery/pricing/credit fails → not `order`. |
| `returns` vs `user` | `user` if how-to with no system error | |
| `interface` vs functional | keep `interface`; note secondary process | Status 51 "customer not found" → sub-process `interface`, secondary `order`/`master-data`, layer application/`master-data`. |

---

## Confidence calibration

| Confidence | When |
|------------|------|
| **high** | ≥1 `strong` signal, no open collision (or collision resolved by a rule above) |
| **medium** | Only `medium` signals, or a resolved collision with residual doubt |
| **low** | Thin text, only `weak` signals, or two strong signals still conflicting after rules |

Always assign a best-guess sub-process + layer hint + confidence. Never drop a ticket.
Surface **low** (and unresolved **medium**) in an ambiguity section for consultant confirm.

Ticket **priority** (Critical/High/…) is an input hint only — map severity with the generic S1/S2/S3
rules (business impact), not by copying the tracker priority blindly.

---

## Diagnose handoff (after classification)

| Sub-process | Primary handoff |
|-------------|-----------------|
| `pricing` | `pricing-diagnostic` (or RCA → `troubleshooting/pricing-incorrect`) |
| `order` | RCA → `troubleshooting/order-will-not-save` |
| `delivery` | RCA → `troubleshooting/delivery-not-created` **or** `pgi-fails` if PGI/goods issue is the symptom |
| `atp` | RCA → `troubleshooting/atp-no-confirmation` |
| `credit` | RCA → `troubleshooting/credit-block` |
| `billing` (doc not created) | RCA → `troubleshooting/billing-document-not-created` |
| `ar` / billing→FI | `billing-ar-error-analyzer` (or RCA → `troubleshooting/billing-no-accounting-document`) |
| `output` | RCA → `troubleshooting/output-not-issued` |
| `returns` | RCA → `troubleshooting/returns-credit-memo` |
| `interface` | `idoc-failure-analyzer` (IDoc/EDI); API/CPI — same layer split + partner notes |

---

## Coverage vs sample tickets

Catalog signals cover the fictional set in
`skills/run/bugfix/incident-triage/examples/sample-tickets.csv`
(INC1001–1014): delivery/ATP, pricing, AR/VKOA, credit, output, returns/user, PGI, inbound ORDERS,
outbound INVOIC. Extend this file when new recurring phrases appear from anonymized AMS backlogs
(see domain README fill policy).
