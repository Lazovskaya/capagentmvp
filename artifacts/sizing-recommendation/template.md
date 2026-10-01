# Sizing recommendation

Produced by `skills/sizing-analysis` from `tools/calculate-s4hana-sizing`'s arithmetic. Mirrors
this artifact's `schema.json` (kept in the factory source; not shipped in a lean client package), which mirrors that Tool's actual output shape (`per_instance`,
`combined_total_memory_gib`, `combined_total_disk_gib`, `assumptions`) plus the narrative fields
the Skill adds on top.

- **`methodology`** -- state which methodology produced the baseline (`quick-sizer` /
 `hana-sizing-report` / `sap-expert-sizing` / `rise-fue-tshirt`) -- never leave this implicit.
- **`rise_tier_mismatch`** -- `true` when a RISE FUE-tier estimate materially disagrees with a
 technical measurement for the same system; flag this explicitly, it can change which contract
 tier applies.

| Instance | Baseline memory (GiB) | Growth factor | Archiving reduction | New functionality | Recommended memory (GiB) | Recommended disk (GiB) |
|---|---|---|---|---|---|---|

- **`assumptions.growth_pct_per_year` / `years_of_growth_to_provision`** -- if both are 0, say so
 explicitly in the narrative: this is an unadjusted baseline, not a provisioned target.
- **`caveats`** -- e.g. a growth assumption the client pushed back on, or a methodology mismatch.
- If the methodology choice or resulting target is materially disputed or commercially
 significant, raise it into `adr-log` -- don't just record it here.
