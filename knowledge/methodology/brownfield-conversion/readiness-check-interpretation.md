# SAP Readiness Check for SAP S/4HANA — Interpretation Guide

Grounded in the fixed 10-chapter structure of SAP's own Readiness Check
report (confirmed identical, chapter-for-chapter and heading-for-heading,
across two independent real EPAM client exports — a European chemicals
company and a US beverage distributor — so this structure can be treated as
stable, not client-specific) plus the actual content patterns seen in both.

**The single most important thing to know before reading this report**: SAP's
own export does **not** synthesize a recommendation for you. Chapter 10
("Next Steps and Further Information") in the real docx export is just a
link out to `me.sap.com/readinesscheck` — there is no baked-in prioritized
action list. The entire value of this skill is doing the synthesis SAP's
report doesn't do: turning 10 chapters of raw findings into "here's what
actually needs a decision, here's what's routine, here's what's an unknown
because the data wasn't even collected."

## The second most important thing: absence of findings is not absence of risk

Across two real reports, whole chapters/subsections came back **empty**
because the underlying analysis was never run or the data was never
collected — not because there was nothing to find:

- Add-On Compatibility and Active Business Functions can both come back with
  "this check could not be performed" (seen for a client running an older
  analysis toolset) — the fix is a support case under component
  SV-SCS-S4R, not a re-read of the report.
- Custom Code (Chapter 5) can be entirely empty: *"No custom code analysis
  results have been uploaded. Please follow the steps in SAP Note 2913617."*
  When this happens, custom code impact is **unknown, not low** — flag it as
  a planning gap and a real project risk (you cannot size a conversion
  workstream you have no data on), never as "no custom code issues found."
- Data Volume Management (archiving potential) can come back as *"there is
  no document type"* — meaning the analysis wasn't run, not that there's
  nothing to archive.
- Flat File interfaces routinely show *"No data was collected for this
  interface type during the data collection."*

**Rule for this skill: every gap phrase surfaced by `scripts/extract_readiness_check.py`
must be reported as its own finding ("data collection gap — impact unknown"),
separate from and never merged into the "no issues found" findings that
follow real analysis** (e.g. Asset Accounting and Material Ledger explicitly
stating "No Inconsistencies were Found" *after* running a real check — that
is a genuinely clean result, and should be reported as such, not lumped in
with the gaps above just because both "have no findings.")

## Chapter-by-chapter interpretation

### 1. Introduction
Boilerplate + the Analysis Scope table (source system SID/release/DB,
target SAP S/4HANA version, analysis date). Extract this table first — it's
the header context ("what system, what target, when") every other chapter's
numbers need to be read against. An analysis run more than ~6-12 months ago
on a fast-moving system should be flagged as potentially stale.

### 2. Minimum System and Landscape Requirements
Add-On Compatibility and Active Business Functions. If populated: any
add-on flagged incompatible is a **hard blocker** for conversion until
resolved (upgrade/remove the add-on) — treat these as go/no-go items, not
routine housekeeping. If this chapter reports "could not be performed" for
either check (see gap note above), say so explicitly and recommend re-running
the underlying data collection before finalizing a conversion project plan.

**Read `references/addon_compatibility_guide.md` for this chapter's real
depth** — these two sub-checks look like one topic but are structurally
different problems (Add-Ons are a software-logistics/Basis question via
SAINT/SPAM; Active Business Functions are a business-process question via
the Switch Framework), and the full category breakdown (Incompatible /
Uninstallable / Unknown / Entitlement-Required / Certified Third-Party),
the SAP Notes governing each, the licensing-gate nature of "Entitlement
Required," and the commonly under-estimated custom-code-coupled-to-an-
add-on risk all live there, along with the specific KBAs for this
chapter's own recurring data-collection-gap pattern (distinct from the
generic gap phrases in §1 above).

### 3. Required Solution Adjustments (Simplification Items) — usually the largest chapter
This is where most of the real decision content lives.

**Read `references/simplification_items_guide.md` before triaging this
chapter for real** — the Category taxonomy (what each of the six values
actually implies about remediation type), the "(default)" vs
"(calculated)" Effort Ranking distinction, the ST03N 12-month data-gap
pattern (very common, easy to misread as a negative finding), and the
correct triage priority order all live there. This chapter is the direct
input `sap-conversion-scoping` consumes — getting the taxonomy right here
is what makes that skill's Changed/Unchanged/complexity calls accurate,
not just its raw counts.

- **General statistics** give you the shape of the problem: total items
  checked vs. "Relevant" vs. "Relevance to be checked" (can't be
  auto-determined). A real example: 694 items checked, 86 auto-confirmed
  Relevant, 17 needing manual relevance triage, 591 not relevant. The ~17
  "cannot be automatically determined" items are not optional — someone has
  to manually work through each one.
- **3.1.1 Relevant Simplification Items** table includes a `Relevance`
  column that is effectively SAP's audit trail for *why* it's relevant
  (e.g. "DB table 'MARD' based check... number found is 1", or "business
  function EA-SCM is active"). Read this column — a hit count of "1" against
  a ">0" threshold is a very different risk profile from a hit count of
  "101" against a ">100" threshold (both trigger the same simplification
  item, but the second implies materially more remediation surface).
- **3.1.3 Activities Related to Simplification Items** is the real
  "what do I actually do" table: columns are Related Simplification Item /
  Activities / Phase / Condition. **The `Condition` column (Mandatory /
  Optional / Conditional) combined with `Phase` (Before / During / After
  conversion project) is the actual prioritization scheme** — build the
  project workplan from this, don't invent your own bucketing. A "Mandatory"
  + "Before conversion project" activity that is also categorized as a
  "Business Decision" (not a technical task) is a genuine planning blocker:
  e.g. a real example requires deciding *before the project starts* whether
  Business Partner IDs will match existing Customer/Vendor IDs — that
  decision gates downstream data migration design.
- **3.2 Effort Drivers** only appears for items ranked "Potentially High" —
  treat its presence at all as a signal to look closely. Real example: an
  Asset Accounting effort-driver breakdown showing 85 active company codes,
  80 of them with more than one open fiscal year — S/4HANA only permits one
  open fiscal year per company code in the target state, so this is a real,
  sizable multi-entity finance remediation project hiding inside one
  simplification item, not a checkbox task.

### 4. Compatibility Scope Analysis
Items tied to SAP's Compatibility Packages (functionality being
sunset/replaced — e.g. Report Writer/Report Painter → Universal Journal
reporting, classic Transportation/Warehouse → EWM/TM). SAP's own framing:
these "do not necessarily need to be addressed before or during an upgrade"
and can be a follow-up project — treat as **lower urgency than Chapter 3**
by default, but still worth naming in the SAD as known future-state
migrations rather than silently dropping them. Note whether each item's
alternative "Exists" today vs. "Exists With Roadmap" (future) — the latter
is a real timeline dependency, not something the client can act on yet.

### 5. Required Custom Code Adjustments
Two very different real states have both been observed here, and a skill
using this report needs to distinguish them clearly:

- **No ATC data uploaded**: report explicitly says so. Custom code impact is
  unknown — flag as a project risk requiring immediate action (run ABAP Test
  Cockpit / SAP Note 2913617) before the conversion project can be
  realistically scoped or estimated.
- **ATC data present**: read the summary table (Total Findings, In-Scope vs.
  Not-in-Scope, breakdowns by Remediation Type, Priority, Usage, Application
  Component). A real example: 4,971 total findings, of which 3,251 (~65%)
  are "Technical Code Adaptation (Automated with Quick Fixes)" — largely
  mechanical, lower risk — versus 1,196 "Functional Changes (Manual
  Efforts)" — these need an application expert, are the real effort driver,
  and should size the functional-remediation workstream, not the raw
  finding count. Priority breakdown (Errors/Warnings/Information) further
  triages: SAP's own guidance is to resolve all Errors and Warnings and at
  minimum review Information findings — don't treat "Information" findings
  as safely ignorable without at least a sampling review.
- If the Usage breakdown (Used/Not Used/Referenced/Unknown) comes back
  almost entirely "Unknown," say so — it means the client can't yet use this
  data to identify dead code for decommissioning, which is a missed
  cost-reduction opportunity worth naming, not a blocker.

### 6. SAP HANA Hardware Size and Data Volume Reduction Potential
- **6.1 Sizing Simulation**: if "Future Database Growth," "Data Volume
  Reduction," and "New Functionality" all show as 0 GiB, that means the
  client hasn't supplied better estimates — it's a raw, unadjusted baseline,
  not a claim that growth/reduction will actually be zero. Say so; don't
  present a zeroed-out simulation as a real growth forecast.
- **6.2 HANA Sizing**: the Top-N-largest-tables table is one of the most
  concretely useful artifacts in the whole report for architecture purposes
  — it tells you exactly which tables dominate memory footprint. If custom
  Z-tables appear in the top 20 (a real example had three Z-tables among the
  20 largest, one at 57 GiB with 1.9B records), that's a direct signal for
  the custom-code and data-archiving conversation: those tables are both a
  sizing cost and very likely a candidate for review before conversion, not
  after.
- **6.3 Data Volume Management** (archiving potential): if empty ("there is
  no document type"), this is a missed pre-conversion cost-reduction lever,
  not a non-issue — archiving before conversion directly shrinks the sizing
  numbers from 6.1/6.2 and the downtime estimate in 9.5.

### 7. Required Adjustments for Integration
Categorization scheme to use directly: **Functionality Unavailable /
Blocked / Serialization Issue** (plus an Upgrade Toolset flag for RFC/BAPI,
and a Working/Working-with-Restrictions/Obsolete scheme specific to BW
Extractors). These categories imply very different remediation profiles:
- *Blocked* or *Serialization Issue* interfaces need to be fixed before
  cutover — treat as harder blockers.
- *Functionality Unavailable* interfaces need redesign/rebuild against the
  target's replacement functionality — real remediation work, but plannable
  rather than an emergency.
A real example had 335 of 4,384 total interfaces impacted, entirely in the
"Functionality Unavailable" bucket (0 Blocked, 0 Serialization Issues) —
meaning the integration risk profile there was "plan a redesign," not
"emergency triage." Report which bucket dominates; it changes the shape of
the Section 5 (Integration Architecture) remediation plan. Flat File
interfaces frequently show as a data-collection gap (see the gap-handling
rule above) rather than a real "no interfaces" result — don't conflate the
two.

**Two sanity-check patterns worth applying before reporting an interface
finding at face value:**
- **Industry-mismatch false positives**: the impact analysis is generated
  from generic, cross-industry simplification-item logic, so it can flag
  an interface tied to a component the client plausibly never uses (a real
  example: IDoc interfaces flagged as impacted purely because they matched
  *SAP Patient Management (IS-H)* logic, on a beverage-industry client
  with no healthcare footprint at all). A quick industry-plausibility
  check before escalating a small, oddly-specific impacted group can save
  a wasted investigation cycle — but still name the finding in the brief;
  don't silently drop it without noting why it's likely a false positive.
- **"Not Used" as its own finding, not just a denominator**: the RFC/BAPI
  usage breakdown (Used/Not Used/Referenced/Unknown, same categories as
  Chapter 5's custom-code usage field) often shows a large "Not Used"
  share — this is a real decommissioning opportunity in its own right
  (dead integrations carrying zero migration value) and deserves its own
  line in the brief, not just a denominator buried inside the impacted-
  count percentage.

### 8. Financial Data Quality
SAP's own framing for this chapter is explicit risk language: *"Resolving
data consistency issues will help you accelerate the conversion process and
avoid unexpected showstoppers."* Three sub-areas (General Ledger, Asset
Accounting, Material Ledger), each split into Inconsistencies / Documents-
or-Assets / Facts and Figures.

- **Size effort by number of *inconsistency types*, not raw inconsistency
  count.** A real example had 128,153 total GL inconsistencies but only 5
  distinct message types — and most of the volume (112,994 of 128,153,
  ~88%) was one single, well-known, mostly-automatable issue ("missing
  archiving flag" per SAP Note 2956096). A huge raw number does not
  automatically mean a huge remediation effort; check whether SAP provides
  a Category A (standard/automatable) vs. B (manual) classification and a
  referenced Note before treating a big number as alarming.
- **Clean results are common and genuinely mean clean** — Asset Accounting
  and Material Ledger both showing "No Inconsistencies were Found" (after a
  real check ran, with real per-company-code/per-valuation-area breakdowns
  showing zeros) is a legitimately good result, not a placeholder. Report
  it as such — don't manufacture concern where the data doesn't support it.
- Watch the by-fiscal-year trend in the Documents table: a recent/current
  fiscal year with a disproportionately high inconsistency rate compared to
  prior closed years is a live, active risk signal (something in current
  operations is generating bad data right now), distinct from historical
  inconsistencies that are effectively frozen and lower urgency.

### 9. Additional Information
- **9.1 Recommended Fiori Apps**: role-ranked app counts (e.g. Purchaser,
  Cash Management Specialist topping the list) — this is change-management/
  training scope, not a technical risk. Feeds Section 8.4 (Fiori
  Architecture) and the UX/training workstream, not the risk register.
- **9.2 App Availability**: apps that will be Deprecated / Unavailable /
  "Available with Successor" in the target release. Requires 12+ months of
  usage data to populate meaningfully and is client-dependent (must be run
  per production client) — if it comes back empty, check whether that's a
  genuine clean result or a usage-data-window gap before reporting "no
  impacted apps."
- **9.3 Business Process Discovery**: SAP's own framing is explicit —
  *"will not prevent you from converting your system (no showstopper) yet
  is highly recommended to address in advance."* Covers process automation
  rate, transactional backlog (old open documents), and non-standard order
  type proliferation. Treat as a pre-conversion housekeeping/optimization
  opportunity, not a blocker — but a real one, since backlog documents
  directly affect archiving/migration volume and downtime.
- **9.4 SAP Innovative Business Solutions**: frequently just "No SAP
  Innovative Business Solutions available" — a normal, uninteresting result
  for most on-prem ERP-only landscapes, not a gap.
- **9.5 Planned Downtime Calculator**: gives a concrete estimated total
  technical downtime (a real example: 332 GiB financial data, 105M records,
  **39 hours 30 minutes total downtime**). This number is a direct, load-
  bearing input to Section 9 (Operations & Continuity) cutover planning and
  Section V/NFR availability targets — if the business's tolerance for a
  cutover window is smaller than this estimate, that's a real conflict to
  surface now, not discover during cutover rehearsal. SAP's own "What's
  Next" guidance in this section (archiving before conversion, the
  Technical Downtime Optimization app after a first conversion cycle, and
  the downtime-optimized SUM 2.0 SP10+ option for tighter windows) is worth
  carrying into the SAD's migration approach section directly.

  **Read `references/planned_downtime_guide.md` when this number needs to
  be negotiated down** — it covers the real tiers between "accept the raw
  estimate" and "buy the full NZDT service" (nZDM, DoDMO, third-party
  tools, in-house builds), which phases each one actually shrinks, real
  cost-per-hour-of-downtime benchmarks to build the business case, and the
  RISE-specific contracting trap (NZDT for conversion is an Additional
  Service, not included by default).
- **9.6 Customer Vendor Integration (CVI) Analysis**: this is a **hard
  prerequisite gate**, not an optional data quality note. SAP's own text:
  *"Only SAP customers with Customer/Vendor Integration completed can
  convert an SAP ERP 6.0 system to SAP S/4HANA."* If CVI isn't already
  complete, that is a **mandatory pre-conversion project** in its own right,
  with its own master-data-quality risk (SAP explicitly recommends running
  the Master Data Consistency Check, Note 2743494, well in advance — doing
  it late is called out by SAP as a direct cause of project delays). Always
  check and report CVI status explicitly; never let it get buried as "just
  another data quality item."

### 10. Next Steps and Further Information
In the real docx export, this is just a link to
`me.sap.com/readinesscheck` — there is no synthesized content here to
extract. Don't report "no next steps were found" as if that were SAP's
conclusion; it's simply not where SAP puts synthesis. This skill's output
(the findings brief) is what should exist in its place.

## Mapping findings into the SAP SAD (feeds the `sap-sad` skill directly)

| Readiness Check chapter | Feeds SAD section | Also feeds |
|---|---|---|
| 2. Add-On/Business Functions blockers | 3.6 S/4HANA Upgrade Strategy | 13. ADR (go/no-go gate) |
| 3. Simplification Items & Activities | 3.6 Upgrade Strategy, 6. Extensibility | 13. ADR (Mandatory/Before-project decisions) |
| 5. Custom Code | 6.4 Clean Core Level Targets, 5.6 Integration Technical Debt Register | `dual_maintenance_retrofit.md` (change volume sizing) |
| 6. HANA Sizing / DVM | 2.1 System Landscape (sizing) | `instance_strategy_decision_matrix.md` (§5 size/scalability criterion) |
| 7. Integration | 5. Integration Architecture, 5.6 Technical Debt Register | — |
| 8. Financial Data Quality | 7.1 Data Migration Architecture | 13. ADR (cleanup-before-migrate decisions) |
| 9.1/9.2 Fiori & App Availability | 8.4 SAP Fiori Architecture | — |
| 9.5 Planned Downtime Calculator | 9. Operations & Continuity (cutover) | V. Key Quality Attributes (Availability target) |
| 9.6 CVI Analysis | 7.2 Master Data Management | 13. ADR (mandatory pre-conversion gate), IV.IV Constraints |

If this Readiness Check analysis is being used to feed a `sap-sad` engagement,
say so explicitly in the findings brief and use this table to route each
finding to its destination section — that turns this skill's output directly
into the intake material `conversion_intake_matrix.md` asks for in Section
2/3/6/7 of the SAP SAD template.

Any row marked "13. ADR" above is a real decision, not just a line item —
raise it into the `sap-adr-log` skill as soon as it's identified, rather
than letting it wait to be reconstructed when `sap-sad` eventually drafts
Section 13.
