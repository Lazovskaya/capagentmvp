# SAP Sizing Methodology Guide

Grounded in SAP's own sizing methodology (Quick Sizer, the HANA Sizing
Report `/SDF/HDB_SIZING` per SAP Note 1872170, SAP Expert Sizing) and
SAP's published RISE with SAP Standard/Tailored sizing model. Use this to
turn raw sizing inputs (a Readiness Check's sizing chapter, a Quick Sizer
export, or a user/FUE count) into an actual sizing recommendation — not
just a restatement of "here's the memory number the tool produced."

## 1. Two different things both called "sizing"

- **System/technical sizing** — how much memory, CPU, and disk the target
  HANA database and application servers need, driven by data volume and
  transaction throughput.
- **License sizing (FUE — Full User Equivalents)** — how many licensed
  user-equivalents the deployment supports; this is the actual input to
  RISE with SAP's Standard (T-shirt) sizing model, which is a commercial
  metric, not a technical measurement.

**The most common real-world sizing mismatch**: a technically large
database (lots of data, big tables) paired with a modest user count can
still map to a small RISE Standard T-shirt tier, because that tier is
chosen from FUEs, not from data volume — and then the system doesn't
actually fit once provisioned. Always check both numbers, not just
whichever one the client happened to hand you.

## 2. The methodologies, and which input each one needs

| Method | Input | Typical trigger |
|---|---|---|
| **SAP Quick Sizer** | Expected concurrent users + throughput per business scenario | Greenfield — no real system to measure yet |
| **SAP HANA Sizing Report** (`/SDF/HDB_SIZING`) | Actual table sizes/data volume from a running source system | Brownfield/Bluefield — a real source system exists to measure. This is exactly what the `readiness-analysis` skill's Chapter 6 extracts — reuse that output rather than asking the client to re-run the report. |
| **SAP Expert Sizing** | Full operational review by SAP-certified consultants: growth trajectory, custom code volume, unusual data distribution | Large/complex landscapes where self-service tool assumptions don't hold |
| **RISE Standard (T-shirt) Sizing** | FUE count only | RISE engagements with an unremarkable workload for their FUE tier |
| **RISE Tailored Sizing** | A real technical sizing report (Quick Sizer or HANA Sizing Report output) submitted to SAP | RISE engagements where the workload doesn't cleanly fit a T-shirt tier |

## 3. RISE Standard T-shirt tiers — directional reference, confirm current values with SAP

SAP maps FUE count to a predefined bundle. Published examples (verify
against SAP's current commercial documentation before quoting a specific
number to a client — these bundles are revised over time):

| Tier | Approx. FUE range | Example PAS PRD memory | Example PAS DEV memory | Example DB size |
|---|---|---|---|---|
| XXS | Smallest RISE tier (roughly low hundreds of FUEs) | 64 GiB | 32 GiB | 256 GiB |
| XS-4XL | Scaling up | Scales up | Scales up | Scales up |

Treat this table as illustrative of the *shape* of T-shirt sizing (memory
and DB size scale with the tier, tiers are driven by FUE not raw data
volume) rather than a source of exact numbers to put in a client
deliverable — SAP can always provide memory-extension SKUs on top of a
tier if the technical sizing doesn't fit, which is itself a signal to
consider Tailored sizing instead of stacking extensions onto a mismatched
Standard tier.

## 4. Producing a recommendation, not just a number

A sizing recommendation should state, explicitly:

1. **Which methodology produced the baseline number**, and whether it's a
   real measurement (HANA Sizing Report against actual data) or an
   estimate (Quick Sizer against assumed usage, or a FUE-based T-shirt
   mapping that hasn't been technically validated).
2. **What growth/adjustment has and hasn't been applied.** Raw sizing tool
   output very often leaves "Future Database Growth," "Data Volume
   Reduction," and "New Functionality" at 0 — that means the client hasn't
   supplied better estimates, not that growth is actually zero. Apply a
   reasoned growth buffer (based on the client's stated growth expectations
   — new entities, transaction volume trends) rather than passing along an
   unadjusted baseline as final.
3. **Whether a real archiving/housekeeping opportunity exists** that should
   offset the raw current-state number before sizing the target — check for
   Data Volume Management analysis output if available.
4. **Per-instance breakdown if the target landscape is multi-instance.**
   Never size an aggregate workload once and divide — each production HANA
   instance carries its own baseline memory footprint regardless of how the
   workload is split across instances; size each instance independently.
5. **The T-shirt/methodology mismatch check** (§1) if this is a RISE
   engagement — flag explicitly if FUE-based tier and technically-measured
   data volume point in different directions.

## 5. Output format

Recommend a per-instance table:

| SID | Environment | Memory (GiB) | Storage (GiB) | CPU | Basis |
|---|---|---|---|---|---|
| *(one row per system/environment)* | | | | | *(which methodology + adjustment produced this row)* |

Pair it with a short narrative covering points 1-5 above. This is the same
structure `sad-drafting`'s `sizing_strategy_decision_matrix.md` asks for in
Section 2.1/10 of the SAP SAD — if this analysis feeds a SAD, hand the
table and narrative directly into that section rather than reformatting.

## 6. Common pitfalls

- Quoting a Quick Sizer or T-shirt estimate as if it were a measured
  result — always label which kind of number it is.
- Sizing once in aggregate for a multi-instance target, then dividing —
  produces undersized instances.
- Treating a zeroed-out growth/reduction row as a real zero-growth claim.
- Recommending RISE Standard sizing for a workload with heavy custom
  Z-table volume without flagging that FUE-based tiers don't account for
  that data volume at all — this is exactly the scenario Tailored sizing or
  Expert Sizing exists for.
