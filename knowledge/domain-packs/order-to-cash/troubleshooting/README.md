# O2C Troubleshooting trees (agnostic)

Per-symptom diagnostic trees — the core reference for `root-cause-playbook`. Each tree lists
what to check, **in order**, from cheapest/most-likely to deepest, mapped to the defect layer
(`config` / `master-data` / `custom` / `data` / `user`, see `../incident-taxonomy.md`).

## How to use a tree

1. Identify the sub-process from the symptom (see taxonomy Dimension 1).
2. Open the matching tree; walk checks top-down — **stop at the first that explains the symptom**.
3. Record which checks passed/failed as evidence, then state the ranked root cause + fix.

## Trees

| File | Sub-process | Symptom |
|------|-------------|---------|
| `order-will-not-save.md` | `order` | Order will not save / incompletion / wrong capture |
| `delivery-not-created.md` | `delivery` | Outbound delivery not created from order |
| `pgi-fails.md` | `delivery` | Post goods issue fails on existing delivery |
| `atp-no-confirmation.md` | `atp` | No / wrong ATP confirmation on the order |
| `credit-block.md` | `credit` | Credit block on order or delivery |
| `billing-document-not-created.md` | `billing` | Invoice / billing document not created |
| `billing-no-accounting-document.md` | `ar` / `billing` | Billing exists, FI accounting doc missing |
| `pricing-incorrect.md` | `pricing` | Price / discount / tax wrong or missing |
| `output-not-issued.md` | `output` | Print / email / output not issued |
| `returns-credit-memo.md` | `returns` | Returns / CMR / credit memo / dispute |

All O2C taxonomy sub-processes used by triage now have at least one tree (`interface` →
`idoc-failure-analyzer` + `idoc-processing.md`, not a troubleshooting/ file).

(Extend per engagement; anonymize before committing — see the domain README fill policy.)

## Conventions

- Reference SAP artefacts as **pointers** (transaction, table/field, Note number) — never copy Note
  text.
- Trees describe method only; **no client data**.
