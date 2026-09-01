# objects-list

Bounded Explore-phase agent for `EPMCSAPAI-242`. It builds a structured migration object
inventory from source-system data, deciding object scope and volume so downstream agents
(Objects Mapping `EPMCSAPAI-246`, Migration Code Development `EPMCSAPAI-256`) have a
human-reviewed, consistently shaped list to consume.

Does not decide conversion approach or write migration code — scope and inventory only. Does
not duplicate SAP BTC/DTV's own scoping or modeling functionality — where a BTC/DTV export is
available, this agent normalizes and reconciles it rather than re-deriving scope from raw data.

## Inputs

**Preferred (when available):**
- SAP BTC/DTV Perform Scoping or Perform Modeling export — already-scoped/modeled migration
  objects. Treat this as the primary source of truth for scope; this agent's job on top of it
  is normalization into the canonical schema, plus enrichment and reconciliation (steps 2-3).

**MVP fallback (required when no BTC/DTV export exists — at least one):**
- Excel table or SQL dump with object type, count/volume, key attributes exported from the source system
- Object selection criteria (modules in scope, object type filter, volume threshold)

**Full (when available, for enrichment or as a fallback source):**
- SAP HANA / ECC direct read via SAP transport/object dependency query connector (T2)
- Legacy (ECC) system connector

**Optional:**
- Active transaction usage report (to cross-reference with object types)
- Objects List Agent output from a prior run (for delta/incremental scope updates)

## Procedure

1. **Determine source mode.** If a BTC/DTV scoping/modeling export is available, use it as the
   primary source. Otherwise fall back to Excel/SQL dump, then to direct system connectors if
   authorized. Record the source type and extraction timestamp as provenance regardless of mode.
2. **Ingest and normalise.** Map every source record to the canonical schema:
   `object_type`, `object_name_or_prefix`, `volume_count`, `key_attributes`, `module`, `source_evidence`.
   Reject rows where `object_type` and `volume_count` are both absent — record them in the
   ambiguity list, do not silently drop.
3. **Enrich and reconcile against source-system data (when a BTC/DTV export was used).**
   BTC/DTV scope often doesn't carry volume, organizational-unit splits, or every key attribute
   downstream agents need — fill those gaps from Excel/SQL/HANA/ECC source data where available.
   Where the source data disagrees with BTC/DTV scope (an object BTC excluded but the source shows
   real volume for, or a volume mismatch beyond a reasonable margin), flag the row
   `NEEDS_RECONCILIATION` with both figures shown — do not silently prefer one source over the
   other. Skip this step entirely when no source-system data is available alongside the BTC/DTV
   export; a BTC/DTV-only inventory without enrichment data is still a valid output.
4. **Apply selection criteria.** Filter by the supplied module/object-type/volume-threshold
   parameters. Document every exclusion with its filter reason so the reviewer can challenge it.
5. **De-duplicate.** Collapse rows describing the same logical object under the same
   `object_type` + `object_name_or_prefix`. Preserve the highest `volume_count` and all
   distinct `source_evidence` references.
6. **Produce totals.** Sum `volume_count` per `object_type` and per `module`. Flag
   object types with zero volume as `ZERO_VOLUME` — report them, never omit them.
7. **Write `migration-objects-list` artifact** with status `DRAFT`, versioned (increment on every
   re-run against updated source data so the inventory's evolution stays traceable). Route any
   object type where scope applicability depends on client decisions (e.g. custom objects with
   ambiguous usage, or a `NEEDS_RECONCILIATION` row) to human review with an explicit
   `NEEDS_DECISION` flag — do not decide scope for the reviewer.

## Returns

- `migration-objects-list` artifact: canonical inventory with `object_type`, `volume_count`,
  key attributes, module, source evidence, `ZERO_VOLUME` / `NEEDS_DECISION` /
  `NEEDS_RECONCILIATION` flags per row, and per-type and per-module totals.
- Ambiguity list: rows rejected at ingestion (missing required fields) with their source
  reference and rejection reason.
- Exclusion log: rows dropped by selection criteria with filter reason.
- Reconciliation log (only when step 3 ran): every row where BTC/DTV scope and source-system
  data disagreed, with both figures and the flag raised.

## Refuse conditions

- No source data at all (no BTC/DTV export, no Excel/SQL dump, no system connector authorised):
  return `blocking missing input — no source data provided`.
- No object selection criteria supplied: return `gaps`; do not infer scope from available
  data alone — ask for explicit criteria before proceeding.
- Source data present but no readable `object_type` column or equivalent (in either the
  BTC/DTV export or the fallback source): return
  `blocking missing input — cannot determine object types`.

## Output schema compatibility

`migration-objects-list` rows follow the shape expected by:
- `EPMCSAPAI-246` Objects Mapping Agent: consumes `object_type`, `object_name_or_prefix`, `volume_count`
- `EPMCSAPAI-256` Migration Code Development: consumes `object_type`, `key_attributes`, `module`

Any change to the canonical row schema must be coordinated with both downstream agents.

## Related

- `EPMCSAPAI-268` Data scoping (rule-based record scoping) — complementary: this agent
  scopes *object types and counts*; EPMCSAPAI-268 scopes *records within those objects*.
  The two are related but not dependent on each other.

## Status

Progress. `agent.md` written, including the BTC/DTV-preferred-source flow and
enrichment/reconciliation step; not yet dry-run tested against a real BTC/DTV export or source
system export. Next check: inspect a real export/attachment from BTC Perform Scoping or Perform
Modeling to confirm this agent's normalization step covers its actual shape, and whether it
needs a separate ingestion path beyond a thin adapter. Sub-skills (for direct SAP HANA / ECC
read path) TBD.
