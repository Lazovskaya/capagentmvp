# Chapter 9.5 Deep-Dive — Planned Downtime Calculator

Grounded in an internal EPAM analysis of downtime-reduction options and
real SAP/partner case data. Read alongside
`readiness_check_interpretation_guide.md`'s Chapter 9.5 note — that note
says the estimate is a direct input to cutover planning; this file is
what to actually do once that number turns out too big for the business
to accept.

## 1. What the calculator actually gives you — and what it doesn't

The Readiness Check's Planned Downtime Calculator estimate (real example:
332 GiB financial data, 105M records → **39h 30m total**, split into
System Ramp-Down, Downtime Preparations, Technical Downtime (SUM),
Technical Postprocessing/Data Conversion Prep, Finance and Material
Ledger Data Conversion, Application Postprocessing) is a **standard-DMO
baseline**. It does not model any of the downtime-reduction techniques
below — it's the number you get if you do nothing special. Treat it as
the starting point for a negotiation, not the answer.

## 2. The three tiers of downtime-reduction technique

All of them work on the same underlying idea — capture database changes
during an "uptime" phase (via triggers/replication) so the actual cutover
window only has to apply a short final delta, instead of doing the whole
migration inside the downtime window. They differ in cost, complexity,
and which phases they actually shrink.

| Technique | What it mechanically does | Cost | Downtime achieved |
|---|---|---|---|
| **Do nothing (standard DMO)** | Full migration inside the downtime window | Included in standard SUM | The Readiness Check's raw estimate (real example: ~39.5h; document's own baseline case: **70h**) |
| **nZDM (built into SUM)** | Record-and-replay via DB triggers/logging tables — for routine Support Package/EHP updates, not initial conversion | No separate license fee | Cuts **&gt;10 hours** vs. former standard tools, at the cost of a longer *overall* technical runtime |
| **DoDMO — Downtime-Optimized DMO (SUM 2.0 SP18+)** | Same trigger-based replication, but specifically for the S/4HANA conversion's data conversion and DB migration steps | No separate license fee, but real added test effort | **Single-digit hours** of technical downtime under the right prerequisites |
| **Full NZDT service** | Clones production, continuously replicates changes via SLT (DMIS AddOn) while conversion work happens on the clone during uptime; cutover = final delta sync + switchover | Real money — "a million-dollar bill for a weekend" is a cited estimate; needs NZDT-certified experts, dedicated clone hardware, extended test cycles | **6–60 hours**, more precisely **8–16 hours** for most systems, dropping to **"a couple of hours"** for databases **&gt;10 TB** |
| **Third-party (e.g. SNP Bluefield/CrystalBridge)** | Similar record-and-replay on a clone, differentiator is *selective* data transition (some legacy data retained as-is, some redesigned) | Varies by vendor/integration complexity | Real case: Coop migrated two ERP systems (56 TB + 8 TB) in one weekend at **15 hours** downtime |
| **In-house-built NZDT** | Same mechanics, built and run by the customer's own team | Estimated **under $50K** vs. the service's ~$1M figure | Same order of magnitude as the service, if the team has the skill to pull it off |

## 3. Mapping techniques to the Readiness Check's own phases

The source material describes these techniques mechanically, not in the
Readiness Check's phase language — this mapping is a reasoned inference,
not something SAP states directly, and should be validated against the
actual phase-by-phase numbers on a real report before being presented as
fact:

- **Technical Downtime (SUM)** and **Technical Postprocessing/Data
  Conversion Preparation** are the phases DoDMO and full NZDT directly
  attack — both move the DB migration/data-conversion work that normally
  happens inside the downtime window into the uptime phase instead.
- **Finance and Material Ledger Data Conversion** is implicitly addressed
  too, since NZDT/DoDMO handle "data conversion" broadly — but
  Finance-specific customizing is explicitly called out elsewhere as a
  shared SAP/partner activity that still needs real attention, not
  something that disappears just because the tooling shrank the window.
- **System Ramp-Down** and **Downtime Preparations** are **not**
  meaningfully shortened by any of these techniques — NZDT's own short
  downtime window is spent creating the clone and activating data-capture
  tooling, which is functionally similar prep work, just wrapped around
  the clone instead of eliminated.
- **Application Postprocessing stays entirely with the customer** —
  explicitly called out as retained customer responsibility (application-
  related settings, non-technical post-installation tasks). No downtime
  technique touches this phase; budget real elapsed time for it
  regardless of which option is chosen.

## 4. Deciding whether the extra cost/complexity is worth it

Ground the recommendation in these factors, in this order of practical
weight:

1. **What does an hour of downtime actually cost this business?** General
   benchmarks: **$5,600–$9,000/minute** broadly; up to **$1M/hour** for a
   Fortune 1000 company; **&gt;$5M/hour** in banking/finance/manufacturing/
   retail specifically. Per Ponemon Institute, **35%** of downtime cost is
   *indirect* (reputational damage, customer churn) — don't let the
   business case stop at direct revenue loss. If the Readiness Check's raw
   estimate, multiplied by this business's real cost-per-hour, dwarfs the
   ~$1M NZDT service estimate, that's the strongest possible argument for
   NZDT regardless of any other factor.
2. **Data volume** — the **&gt;10 TB** threshold is where full NZDT's
   payoff becomes dramatic (dropping to "a couple of hours"); below that,
   the 8–16 hour range is more typical, and the gap between "worth it" and
   "not worth it" narrows.
3. **Budget tolerance and in-house skill** — if $1M for the SAP-delivered
   service isn't viable, DoDMO/nZDM (free, SUM-native) or an in-house
   build (~$50K, but real technical risk) are the fallback tiers — not
   "accept the long downtime" as the only alternative.
4. **RISE contract status matters concretely**: NZDT for a conversion is
   **not included** in standard RISE with SAP S/4HANA Cloud, Private
   Edition — it's an "Additional Service" requiring its own change
   request/commercial agreement. (Routine HANA DB software updates on HA
   nodes *do* get NZDT/Downtime Minimization as standard — don't conflate
   the two.) If the client is RISE and assumes NZDT is already covered,
   correct that assumption early; it changes both the timeline and the
   commercial conversation.
5. **Strategic shape of the conversion** — a pure lift-and-shift favors
   Brownfield + NZDT; if there's already appetite for selective
   re-engineering, a Bluefield-style tool (SNP CrystalBridge) may be worth
   evaluating alongside pure downtime reduction, since it buys process
   redesign headroom at a similar mechanical cost.

## 5. Real prerequisites and risks — don't present NZDT as free

- **Technical prerequisites** for the clone approach: minimum 256 GB RAM,
  1 TB storage on the target, HANA DB, 10 Gb/s network for app/source/
  internode/replication/backup links, network latency **&lt;20 ms**.
  Source migration paths commonly cited: Oracle 12+ or MS SQL 2012+.
- **Expert scarcity is a real, worsening constraint** — NZDT-certified
  consulting capacity is tightening ahead of the **2027 ECC support
  deadline**, pushing rates up; factor this into both cost and lead-time
  planning, don't assume experts are available on demand.
- **Testing burden increases, it doesn't decrease** — multiple mock
  migrations/"dress rehearsals" are described as non-negotiable; the
  *cutover* window shrinks, but the *overall project* timeline and testing
  effort both grow.
- **New risk surface**: replication-induced data integrity risk (master
  data misalignment, duplicate/stale records) needs its own reconciliation
  framework; cloud migration also reopens ITGC/GRC review and custom-code
  security review, and the hypercare period (typically **1–2 weeks** post
  go-live) carries its own elevated access-risk profile.
- **RISE responsibility split**: even with a managed service, the
  customer retains roughly **40%** of Basis-adjacent work post-go-live —
  don't assume NZDT or RISE together eliminate the customer's operational
  role.

## 6. Housekeeping/archiving — do this regardless of which tier you pick

This is not a competing option to NZDT/DoDMO/nZDM — it's a **foundational
prerequisite that makes every one of them work better and reduces their
risk**. Concretely: identify and archive/cleanse large tables (IDoc tables
are explicitly named as a common offender) *before* migration — this
shrinks the data footprint, directly reduces performance strain during
replication (the exact risk that makes uptime-phase replication a real
operational concern), and should be scheduled alongside custom code
remediation, ahead of partner engagement and the first mock migration —
not treated as optional cleanup squeezed in wherever there's spare time.

This is the same lever `sizing-analysis`'s methodology guide and
`readiness_check_interpretation_guide.md`'s Chapter 6 note already
flag for the sizing conclusion — cite it once, consistently, rather than
re-deriving it separately for sizing vs. downtime.

## 7. Feeding this into the rest of the pipeline

- **Section 9 (Operations & Continuity)** — state which tier was chosen
  (standard DMO / nZDM / DoDMO / full NZDT / third-party) and why, using
  §4's criteria explicitly rather than a bare number.
- **V. Key Quality Attributes (Availability)** — the business's real
  tolerance for a cutover window, weighed against §4's cost-per-hour
  framing, is exactly the kind of quantified target this section needs;
  don't leave "availability" as a qualitative aspiration when a real
  downtime-cost number is available to ground it.
- **Section 13 (ADR)** — the downtime-tier decision is a real architectural
  decision with a commercial dimension (especially the RISE Additional
  Service contracting point in §4.4) — raise it into `adr-log` the
  same way other gating decisions (CVI, Instance Strategy) already get
  tracked, as soon as the tier is chosen, not just at Section 13 drafting.
- **`sizing-analysis`** — the housekeeping/archiving lever (§6) is the same one
  that offsets the raw sizing baseline; keep the two conversations
  connected rather than treating them as separate workstreams.

## 8. Questions to ask if not already known

1. What's this business's real cost of an hour of unplanned/planned
   downtime — is there an existing SLA-breach or business-continuity cost
   model to anchor the conversation, or does one need to be built?
2. Is this a RISE engagement, and if so, has NZDT/downtime-optimization
   been explicitly scoped (and priced) as an Additional Service, or is it
   being silently assumed as included?
3. What's the actual database size — is it above or below the ~10 TB
   threshold where full NZDT's payoff changes character?
4. Does the client have (or have access to) NZDT-certified expertise, or
   would this require sourcing external SAP Consulting/partner capacity —
   and on what timeline, given the tightening pre-2027 market?
5. Has a housekeeping/archiving pass been scoped as a project activity
   yet, or is the raw current-state data volume being carried forward
   unexamined into the downtime estimate?
