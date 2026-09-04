# Sizing recommendation

## Methodology (`methodology`)

- **Source:** Readiness Check Chapter 6 / HANA Sizing Report / Quick Sizer export / RISE FUE count
- **Basis:** measured / estimated / license-tier-derived — label honestly, don't blur an estimate
  into a measurement.

## Assumptions (`assumptions`)

- **Growth:** __% per year, provisioning for __ years
- **Archiving/housekeeping reduction:** __ GiB
- **New functionality (Fiori, embedded analytics, etc.):** __ GiB on top
- **Zero-growth acknowledged?** yes/no — if growth is genuinely 0%, this must be an explicit,
  stated client position, never a silent default.

## Per-instance recommendation (`per_instance`)

| Instance | Baseline memory (GiB) | Baseline disk (GiB) | Growth factor applied | Recommended memory (GiB) | Recommended disk (GiB) |
|---|---|---|---|---|---|
| | | | | | |

**Combined total memory (GiB):**
**Combined total disk (GiB):**

## RISE tier mismatch (`rise_tier_mismatch`, if applicable)

Present only when a RISE FUE tier and the technical data volume disagree — flag as its own
finding, since it changes which contract tier applies.

- **FUE tier:**
- **Technical volume (GiB):**
- **Flag:**
