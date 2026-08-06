# Incident triage — method (agnostic, module-neutral)

Generic method for classifying, routing and clustering SAP support/AMS incidents, reusable across
**any** domain. The `incident-triage` and `defect-pattern-analysis` engines orchestrate this plus a
**domain sub-process taxonomy** (e.g. `knowledge/domain/order-to-cash/incident-taxonomy.md`). Method
only, no client data.

## Three classification dimensions

**1. Sub-process (domain pack).** *Where* in the process chain the incident sits — supplied by the
domain taxonomy (O2C = order/pricing/atp/credit/delivery/billing/ar/output/returns/interface; other
domains bring their own list). This is the only domain-specific dimension. Match ticket text via the
domain's **signal catalog** when one exists (O2C:
`knowledge/domain/order-to-cash/incident-signal-catalog.md`); see § Signal matching below.

**2. Layer — what has to change to fix it (generic).**

| Code | Layer | How it's fixed | Owner |
|------|-------|----------------|-------|
| `config` | Customizing / config | IMG change + transport | Functional consultant |
| `master-data` | Master/condition data | Correct/create the record | Consultant / data owner |
| `custom` | Custom code (Z) | Dev change request | Developer (consultant scopes it) |
| `data` | Transactional inconsistency | Data fix / reprocess / SAP Note | Consultant + Basis |
| `user` | User error / training | Enablement, no system change | Consultant / OCM |

> Rule of thumb: **rule out master-data and user layers before assuming config or code.** Most
> "bugs" in a stable system are master-data or data-consistency issues, not defects.

**3. Severity (generic).**
- **S1** — process stopped, no workaround (e.g. no billing → no cash; all inbound orders failing).
- **S2** — significant impact, workaround exists (a subset, manual bypass possible).
- **S3** — limited/cosmetic (single document, reporting, non-blocking).

Do **not** copy the ticket tracker's Priority field blindly — map impact with S1/S2/S3, then apply
volume weighting below.

## Severity weighting by business volume

Sort the worklist by **impact behind the symptom**, not by ticket count in a cluster.

### Optional input — volume hints

Consultant may supply a small table (file or chat). Schema:

| Field | Required | Meaning |
|-------|----------|---------|
| `area` | yes | Domain sub-process code **or** a named business slice (e.g. `billing`, `partner:P-EDI07`) |
| `volume_class` | yes | `critical` / `high` / `medium` / `low` |
| `note` | no | Why (e.g. "month-end billing", "top customer EDI") |

If **no hints** are provided, use these **defaults** by sub-process (override per engagement in
`workspace/`):

| volume_class | Default sub-processes (O2C-oriented, still method-usable elsewhere) | Weight |
|--------------|---------------------------------------------------------------------|--------|
| `critical` | `ar`, `billing` (when cash/month-end), `interface` when **all** partners stuck | 1.00 |
| `high` | `order`, `delivery`, `credit`, `atp`, `pricing` (wrong price at scale) | 0.75 |
| `medium` | `output`, `returns`, single-partner `interface` | 0.50 |
| `low` | pure `user`/how-to, cosmetic, single-doc reporting | 0.25 |

### Sort key
1. Severity band: S1 → S2 → S3.
2. Within band: higher volume weight first.
3. Duplicate-group **primary** before linked duplicates.
4. Do not demote **low confidence** S1 — flag ambiguity separately.

Promoting S2→S1 (or S3→S2) is allowed when volume_class is `critical` **and** the symptom hits a
whole channel (all billing, all EDI), not merely many duplicate tickets of one bad master.

## Routing principle (generic)
`sub-process` → owning functional stream (from the domain **routing matrix** when one exists; else
taxonomy notes); `layer=custom` → co-assign a developer; `layer=data` → co-assign Basis when
technical/period/job; `layer=user` → OCM; `interface` errors route by **partner/message type**, not
the module. Domain example: `knowledge/domain/order-to-cash/routing-matrix.md`.

## Dedup / clustering

Group before routing noise multiplies work. Mark one **primary** per group; link the rest. Same-root
clusters are fixed once. (`defect-pattern-analysis` extends this across a whole backlog.)

### Cluster types

| Type | Rule | Action |
|------|------|--------|
| **Same document** | Same order/delivery/billing/IDoc number (or clear doc id) + same symptom family | Merge; primary = earliest or highest severity |
| **Same root cause** | Same failing key (e.g. same VKOA combination, same partner profile, same material ATP plant) even across docs | Merge; primary = highest severity / volume |
| **Related-but-distinct** | Same flow/partner/family but **different** cause signals (e.g. ORDERS 51 customer vs material) | **Do not merge** — link as "related"; diagnose separately |
| **Same user how-to** | Multiple training questions, no system error | Cluster as enablement; layer `user` |

### Matching heuristics (practical)
- Normalize doc ids from short text/description (order, delivery, invoice, IDoc numbers).
- Prefer explicit error tokens (VKOA, status 29, "condition record not found") over vague "failed".
- Cross-dedup against an **open backlog** export when provided (same keys as above).
- When unsure between same-root and related-but-distinct → **related-but-distinct** + note
  (safer than hiding a second defect).

### Output fields per ticket
`dup_group_id`, `dup_role` (`primary` / `duplicate` / `related`), `dup_note` (why grouped).

## Signal matching (generic — domain catalog supplies the rows)

Classify sub-process (and a first layer hint) from ticket short text / description using the
domain's signal catalog when available:

1. **Scan** for signals (phrases, tcodes, message types, document cues). Case-insensitive;
   near-synonyms count as the same signal.
2. **Score** hits by strength (`strong` / `medium` / `weak`) per catalog.
3. **Disambiguate** with the catalog's collision rules when two sub-processes both match.
4. **Assign confidence:** high (≥1 strong, no open collision) · medium (medium-only or residual
   doubt after a rule) · low (thin text / weak-only / unresolved conflict).
5. **Layer hint** from the winning signal is a triage guess only — diagnose confirms. Still apply
   the rule of thumb: rule out `user` / `master-data` before assuming `config` / `custom`.

No catalog for the domain yet → fall back to the taxonomy's short "typical symptoms" column and
flag confidence **low** more readily.

## Ambiguity
Where the ticket text is thin, assign a best-guess classification **plus a confidence flag** — never
drop a ticket silently, and surface low-confidence calls for the consultant to confirm.
