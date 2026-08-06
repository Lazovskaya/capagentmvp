# O2C sub-process adjacency map (domain pack)

Which O2C areas a change in one sub-process can **break or must re-test**. Used by
`fix-doc-and-regression` (regression scope) and optionally by `incident-triage` (related-area
notes). Method of using adjacency is generic; this file is the O2C pack. No client data.

**How to read a row:** changing something in **From** → include at least the **Must re-test**
sub-processes in regression; **Often adjacent** are conditional (include when the fix touched that
link).

## Adjacency table

| From (changed) | Must re-test | Often adjacent | Why / typical link |
|----------------|--------------|----------------|--------------------|
| `order` | `order`, `delivery`, `pricing` | `credit`, `atp`, `output`, `interface` | Doc type / item cat / partners drive determination downstream; ORDERS IDoc if EDI capture |
| `pricing` | `pricing`, `billing`, `ar` | `order`, `credit`, `output`, `returns` | Procedure/conditions → invoice value → VKOA account keys; credit exposure uses values; copy-control pricing type |
| `atp` | `atp`, `delivery` | `order`, `interface` | Confirmation → delivery creation; ATP in inbound orders |
| `credit` | `credit`, `order`, `delivery` | `billing`, `ar` | Blocks at order/delivery/GI; release; exposure vs open billing/FI |
| `delivery` | `delivery`, `billing` | `atp`, `credit`, `ar`, `output`, `interface` | PGI → billing due; GI accounts (OBYC); DESADV; delivery note output |
| `billing` | `billing`, `ar`, `output` | `pricing`, `returns`, `interface` | Copy control; invoice → FI; RD00/INVOIC; credit memo path |
| `ar` | `ar`, `billing` | `pricing`, `returns` | VKOA / tax / splitting; credit memos use different account keys |
| `output` | `output` | `billing`, `order`, `delivery`, `interface` | Channel vs EDI; do not skip interface if medium is EDI |
| `returns` | `returns`, `billing`, `ar` | `order`, `delivery`, `pricing`, `credit` | RE → return delivery → credit memo → FI; pricing on credits |
| `interface` | `interface` + **secondary** sub-process of the message | partner-specific | ORDERS→`order`/`atp`/`pricing`; DESADV→`delivery`; INVOIC→`billing`/`ar`/`output` |

## Layer-sensitive extras

When the fix **layer** is known, widen or narrow:

| Layer of fix | Extra regression | Skip / narrow |
|--------------|------------------|---------------|
| `master-data` (single customer/material) | Same doc chain for **that** master only | Full stream regression usually overkill |
| `master-data` (mass / condition table) | Full **From** row + adjacent high-volume scenarios | — |
| `config` (procedure, VKOA, copy control, credit procedure) | Full **Must re-test** + **Often adjacent** that share the object | — |
| `custom` | Full Must + adjacent + the specific user-exit document types | Include negative test for the exit's intent |
| `data` (single doc reprocess) | Re-read same document flow; one similar doc | Wide regression usually N/A |
| `user` / training | No system regression | Enablement check only |

## Minimal scenario set (templates)

Suggest concrete cases from adjacency (consultant fills client doc types):

- **Happy path:** order → confirm → delivery → PGI → bill → FI → output.
- **Pricing change:** order with affected condition; invoice; account determination if account key
  changed.
- **Credit change:** order above/below limit; delivery/GI if check points active.
- **Returns change:** return with reference; credit memo; FI.
- **Interface change:** one inbound + one outbound IDoc for the partner; application post +
  technical ACK as relevant.

## Negative adjacency (do not over-scope)

- Pure **output** form change without determination → re-test `output` only (plus one billing doc
  issue).
- Pure **OB52 period** open → spot-check one PGI and one billing release; not full pricing.
- Pure **partner profile WE20** technical → interface technical tests; functional only if status 51
  application path changed.

## Feeds

- `fix-doc-and-regression` — primary consumer for regression scope section.
- `incident-triage` — optional "related streams to watch" on S1 clusters.
- `defect-pattern-analysis` — when clustering cross-sub-process systemic issues.
