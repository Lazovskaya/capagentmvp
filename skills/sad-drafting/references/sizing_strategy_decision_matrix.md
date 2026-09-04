# Sizing Strategy — Decision Matrix

Covers how to choose and document a sizing approach for the target SAP
S/4HANA landscape. Feeds **Section 2.1 (System Landscape)** and **Section
10 (Infrastructure)** of the SAP SAD for the concrete numbers, and
**Section 13 (ADR)** for the methodology choice itself when it's not
obvious (e.g. RISE Standard vs. Tailored). Interacts directly with two
sibling decision matrices: `instance_strategy_decision_matrix.md` (sizing
must be done *per instance* if the target is multi-instance, not once for
the whole landscape) and, for Conversion engagements, the companion
`readiness-analysis` skill (its Chapter 6 output is the primary sizing
input for Brownfield/Bluefield).

## 1. Two different things both called "sizing" — don't conflate them

- **System/technical sizing**: how much memory, CPU, and disk the target
  HANA database and application servers actually need, based on data
  volume and transaction throughput. This is what Quick Sizer, the SAP HANA
  Sizing Report, and SAP Expert Sizing all produce.
- **License sizing (FUE — Full User Equivalents)**: how many licensed user
  equivalents the deployment supports, which is the actual input to RISE
  with SAP's **Standard (T-shirt) sizing** model. This is a commercial/
  licensing metric, not a technical throughput measurement — a RISE
  Standard T-shirt size is chosen from the customer's FUE count, not from
  their data volume.

Getting these two confused is the most common sizing mistake in a SAD: a
Brownfield client with a large existing database but a modest user count
can still map to a small T-shirt size under RISE Standard sizing, and *then*
need a memory-extension SKU or a move to Tailored sizing once the technical
sizing report shows the database doesn't fit. State explicitly which kind
of sizing produced each number you put in the SAD.

## 2. The methodologies

| Method | Input | Who runs it | Best for |
|---|---|---|---|
| **SAP Quick Sizer** | Concurrent users + throughput per business scenario (self-service web tool) | Customer/architect, self-service | Greenfield — no existing system to measure, so sizing has to be estimated from expected usage |
| **SAP HANA Sizing Report** (`/SDF/HDB_SIZING`, SAP Note 1872170) | Actual table sizes and data volume from the running source system | Run on the source system, output flows into SAP Readiness Check Ch. 6 | Brownfield/Bluefield — the source system already has real data to measure, so use it instead of estimating |
| **SAP Expert Sizing** | Thorough review of operations, environment, and growth trajectory by SAP-certified consultants | SAP or SAP-certified partner | Large, complex, or unusually shaped landscapes where self-service tools' assumptions don't hold — high custom-code volume, unusual data distribution, aggressive growth plans |
| **RISE Standard (T-shirt) Sizing** | **FUE count** (license metric, from named/user-type counts), mapped to a predefined bundle (XXS through 4XL) | SAP, from the customer's FUE position | RISE engagements where the customer's workload is unremarkable for its FUE tier — minimal sizing effort, but coarse-grained and non-negotiable within the tier |
| **RISE Tailored Sizing** | A real technical sizing report (Quick Sizer output for Greenfield, or the HANA Sizing Report for Brownfield/Bluefield) submitted to SAP | Customer/architect produces the input; SAP sizes against it | RISE engagements where the workload doesn't fit a standard T-shirt cleanly — large custom Z-table footprint, unusual growth profile, or a technical sizing result that doesn't map neatly to FUE tiers |

## 3. Decision matrix

| Engagement type | Deployment model | Recommended sizing method |
|---|---|---|
| Greenfield | RISE Standard | Quick Sizer output → mapped to nearest T-shirt size by SAP; treat the mapping as approximate until confirmed |
| Greenfield | RISE Tailored / Customer-managed | Quick Sizer, full output submitted as the technical sizing basis |
| Brownfield | RISE Standard | FUE count from current user base — but **cross-check** against the HANA Sizing Report's data volume result before accepting the T-shirt mapping; a technically large system with a small FUE count is a real mismatch risk |
| Brownfield | RISE Tailored / Customer-managed | HANA Sizing Report (`/SDF/HDB_SIZING`) is mandatory — this is exactly what `readiness-analysis`'s Chapter 6 already extracts; reuse that output directly rather than re-running the report |
| Bluefield | Any | HANA Sizing Report **per source system being consolidated**, then a combined/de-duplicated sizing for the target — don't just sum the source systems' raw sizes, since consolidation typically also reduces duplicate master data and redundant historical data |
| Any type, large/complex/high-custom-code landscape | Any | Escalate to SAP Expert Sizing regardless of the above — self-service tools' assumptions (uniform growth, standard data distribution) break down at this scale |

## 4. Direct handoff from `readiness-analysis`

If a Readiness Check report already exists for this engagement (the normal
case for Brownfield/Bluefield), its Chapter 6 output **is** the HANA Sizing
Report result — don't ask the client to re-run it. Specifically carry
forward:
- Initial Target Size (memory) and Used Size on Disk — the baseline before
  any growth/reduction adjustment.
- Whether "Future Database Growth," "Data Volume Reduction," and "New
  Functionality" were left at 0 GiB (meaning unadjusted baseline, not a
  real zero-growth claim — see the interpretation guide's Chapter 6 note)
  — if so, this SAD's sizing conclusion should say so explicitly and flag
  that the number needs refinement, not present it as final.
- The Top-N-largest-tables list — if custom Z-tables dominate, that's a
  sizing risk this section should name explicitly (it also feeds the
  Extensibility/Clean Core conversation, not just sizing).
- Data Volume Management (archiving potential) — factor realistic archiving
  into the sizing conclusion rather than sizing for 100% of current data
  volume when a real, quantified archiving opportunity exists.

## 5. Interaction with Instance Strategy

If `instance_strategy_decision_matrix.md` concluded a multi-instance
(Harmonized/regional-split, or consolidation) topology, **size each target
instance separately** — don't size the aggregate workload once and divide
by the number of instances; that undercounts overhead that exists per
instance (each production HANA instance carries its own baseline memory
footprint regardless of how the workload is split). For RISE Standard
sizing specifically, each instance's FUE count needs its own T-shirt
mapping — a single combined FUE count across a Harmonized model's regional
instances will produce a wrong (typically oversized-per-instance) picture.

## 6. Output format for the SAD

Document sizing conclusions as a per-instance table (mirrors how this is
actually recorded in real EPAM Technical Architecture Design deliverables):

| SID | Component | Memory (GiB) | Storage (GiB) | CPU |
|---|---|---|---|---|
| *(one row per system per environment — DEV/QA/PROD at minimum)* | | | | |

Pair this table with a short narrative stating: which methodology produced
these numbers (§2), whether growth/archiving adjustments were applied or
are still pending (§4), and — if RISE — whether this is a Standard T-shirt
mapping or a Tailored sizing result, since that materially affects how
negotiable these numbers are with SAP.

## 7. Questions to ask / documents to request

1. Is this a RISE engagement (Standard or Tailored) or customer-managed? If
   RISE, has SAP already proposed a T-shirt size, and on what basis (FUE
   count, or an actual technical sizing report)?
2. For Brownfield/Bluefield: does a SAP Readiness Check or standalone HANA
   Sizing Report already exist? (If yes, reuse it — see §4. If no,
   recommend running `/SDF/HDB_SIZING` before finalizing this section.)
3. For Greenfield: has Quick Sizer been run, and against what assumed
   concurrent-user/throughput inputs? Are those inputs realistic or
   provisional placeholders?
4. What's the client's growth expectation over the next 3-5 years (new
   entities, transaction volume growth, planned new functionality like
   Fiori/embedded analytics that needs separate sizing on top)?
5. Is there a known archiving/housekeeping opportunity that should offset
   the raw current-state sizing number?
6. If multi-instance: has sizing been run per instance, or only in
   aggregate? (If only in aggregate, flag this as incomplete per §5.)
