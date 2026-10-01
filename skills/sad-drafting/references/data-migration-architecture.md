# Decision matrix: Data migration architecture

Consultant decision guide for the data migration section of the Brownfield SAD.
In a Brownfield conversion the system history is carried over by default (Shell conversion);
this matrix decides what is actively excluded and how the cutover window is shaped.

## Decision 1 — Conversion approach

| Approach | Description | When to use |
|---|---|---|
| **Full Shell conversion (SUM)** | Entire ERP database converted in-place via SUM; all history migrated by default | Standard Brownfield — all historical data required; no significant data quality issues |
| **Selective data transition (SDT)** | SUM converts the system, but selected business objects are re-loaded selectively post-conversion | Data quality issues in source, or client wants to start with clean open items + limited history |
| **Greenfield with data load** | New S/4HANA instance; data migrated by object type via LTMC/LTMOM or BODS | Not Brownfield — only if conversion path is abandoned for this entity |

For typical Brownfield: Full Shell conversion is the default. Deviate only with documented
justification.

## Decision 2 — Data archiving pre-conversion

| Option | When to use |
|---|---|
| **Archive before conversion** | Reduces SUM runtime and in-memory footprint; recommended when > 5 years of inactive data exists |
| **Archive after conversion** | Simpler project plan; acceptable when data volume is manageable and SUM runtime is within window |
| **No archiving** | Only for small systems (< 1 TB); note impact on sizing |

Archiving before conversion reduces risk and speeds up SUM. If readiness identified high data
volume, this decision directly impacts the sizing-strategy matrix — confirm alignment.

## Decision 3 — Historical data handling

| Option | Notes |
|---|---|
| **Full history in S/4HANA** | All historical documents converted; largest storage requirement |
| **N years of history in S/4HANA + archive** | Define the N-year cutoff; older data archived before SUM; confirm legal/compliance requirement |
| **Open items only + statistical history** | Smallest in-memory footprint; highest risk of business disruption if ad-hoc history access needed |

Legal/compliance retention requirements drive this decision — confirm with client.

## Decision 4 — Cutover strategy

| Option | Typical downtime | When to use |
|---|---|---|
| **Big bang (single cutover weekend)** | 24–72 hrs | Standard; simpler coordination; suitable for most mid-size conversions |
| **Phased cutover (by entity or country)** | Multiple windows | Complex multi-entity landscapes; reduces per-window risk at the cost of parallel-run period |
| **Zero-downtime migration (DMO with uptime)** | < 4 hrs | Available via DMO with uptime; requires HANA target and compatible add-ons; significant pre-work |

For most Brownfield engagements, big bang is the baseline. Phased is justified by multi-entity
scope; zero-downtime requires explicit client approval and technical pre-check.

## Output to SAD

The data migration section of the SAD must state:
- Conversion approach and justification
- Archiving strategy (pre/post/none) and volume estimate
- Historical data cutoff (years) and legal basis
- Cutover strategy and estimated downtime window
- Cutover roles (client vs. EPAM)

## Recording the decision

Confirmed data migration architecture → ADR entry:
- `decision_type: conversion-approach`
- `stage: sad-drafting`
- `title: Data migration architecture — <conversion approach>`
- `description`: conversion approach, archiving decision, history cutoff, cutover strategy
- `rationale`: cite data volume from sizing, legal requirements, readiness findings
