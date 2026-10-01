# Chapter 3 Deep-Dive — Simplification Items (S4TWL)

Grounded in SAP's own Simplification Item Catalog mechanics and real
client report patterns (Sunbelt Beverage, SNOP). Read alongside
`../../../../knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`'s Chapter 3 section — this file
is what actually drives correct triage and, critically, is the direct
input `sap-conversion-scoping` consumes, so getting this taxonomy right
here compounds into better scoping accuracy downstream.

## 1. The Category taxonomy — what each value actually implies

**Important honesty check first**: SAP does not publish a single formal
table mapping Category → remediation type/effort. The six values below
are a classification scheme, not a remediation instruction — the
authoritative "what do I actually do" text is each item's **Business
Impact Note**, which lives in the standalone Simplification Item Catalog
app (§5), not in the Readiness Check report itself. Treat the inferences
below as strong defaults to reason from, not as a substitute for reading
the actual Business Impact Note on anything that matters.

Two families:

- **"Functionality unavailable"** — the old function/transaction/table
  logic is *removed* in S/4HANA.
  - *(alternative exists)*: a standard substitute is available (new
    Fiori app, new t-code). Usually **process/UI retraining +
    configuration/authorization rework** — moderate, not usually a
    redesign, since SAP already engineered the replacement path.
  - *(alternative planned)*: SAP intends a replacement in a *future*
    release, not available in the current target. **The highest-risk
    variant for scoping** — genuinely open-ended: wait/upgrade later,
    build an interim workaround, or accept the gap. Treat as
    assessment/redesign-tier work, not routine.
  - *(no alternative planned)*: gone, with **no SAP-provided path
    forward at all**. Most likely to force real **business-process
    redesign or custom development** — there's no standard fallback.
- **"Functionality deprecated"** — still runs today, on a sunset path.
  - *(alternative exists)*: successor already live; a **planned
    cutover/config change**, lower urgency than "unavailable."
  - *(alternative exists with roadmap)*: SAP has published a timeline for
    the eventual sunset — mainly a **future-proofing/timing decision**,
    not an immediate conversion blocker.
- **"Change of existing functionality"** — the function stays, but its
  behavior/data model changed (new field, changed table, new mandatory
  step). Usually the **most technical/config-only** category — custom
  code adjustment or config delta, rarely a process redesign.

## 1a. Mechanical source: read `supporting_data.RelevantSimplificationItems`, don't re-parse docx table text

When the extractor was run against the full export folder (not just the
`.docx`), `rc_data.json`'s `supporting_data.RelevantSimplificationItems`
carries this exact data as clean structured columns — confirmed columns in
a real export: `Title`, `Effort Ranking` (already includes the
"(default)"/"(calculated)" suffix as plain text — see §2), `Category`,
`Relevance`, `LoB/Technology`, `Business Area`, `Consistency Status`,
`Manual Status`, `Business Impact Note`, `Relevance Summary`, `ID`, `GUID`,
`Simplification Item Detail`, `AI Summary`, `Comments`. Two things worth
noting from this column set specifically:

- **`Consistency Status` is a direct, per-item field** — use it to
  identify §4's priority-tier-1 "must-fix regardless of Category" items
  mechanically (filter for a non-clean status) rather than scanning docx
  table cell text for "error"/"warning" counts.
- **A `Business Impact Note` column is present directly in this export** —
  when it's populated with real narrative text, it may already give the
  §5 Catalog-level detail this guide otherwise says to look up separately;
  check it before assuming a separate Simplification Item Catalog lookup
  is required. It won't always be this complete across every SAP
  Readiness Check tool version, so still fall back to the Catalog app when
  this column is thin or missing.

## 2. "(default)" vs "(calculated)" Effort Ranking

- **"(default)"**: a static estimate SAP assigns to the S4TWL item based
  on *generic past-project experience* — the same value regardless of
  this specific client's system. Most items carry this.
- **"(calculated)"**: the Readiness Check's data collector pulled **real
  client-specific volume/usage data** for that item (table row counts,
  active business functions, usage frequency) and sized the estimate
  against it — this is the "DB table 'MARD' based check... number found
  is 1" mechanism already seen in the Relevance column, extended into the
  effort estimate itself.
- Only a subset of S4TWL items have a calculated-effort check wired up at
  all — there's no single canonical published list of which ones; in
  practice, an item shows "(calculated)" or populates **§3.2 Effort
  Drivers** (limited to **"Potentially High"**-ranked items specifically)
  when SAP has built that sizing logic for it. Enabling this analysis
  requires specific supplementary notes layered on top of the main
  Readiness Check note (2913617) — one cited enabler is **Note 2903677**.
- **Practical rule**: a "(calculated)" ranking is evidence-backed for
  *this* client; a "(default)" ranking is a generic placeholder. Weight
  them differently when prioritizing — don't treat both as equally
  reliable just because they show the same word (Low/Medium/etc.).

## 3. The ST03N data gap — mechanics and what to actually do

**ST03N** is SAP's Workload Monitor, reading historical usage statistics
(transaction/program/Fiori-OData consumption). The Readiness Check's
usage-dependent checks (notably App Availability, and any
transaction-usage-based Relevance check) require **12+ months** of ST03N
history specifically to cover a full seasonal business cycle
(month-end/quarter-end/year-end peaks) before concluding something is
genuinely unused.

When you see *"Relevance cannot be determined... not enough ST03N data
(12 months)"*:
- **This is inconclusive, not negative.** It does not mean the item is
  irrelevant — automation simply couldn't confirm either way. Common
  causes: a newly built or recently refreshed system (sandbox, test copy
  post-refresh), or a Basis-level statistics reorganization that purged
  older records.
- **Workarounds, in order of practicality**: (a) **if a companion "SAP ERP
  Usage and Data Profiling" report exists for the same system, use it
  first** — its own usage-profile section (e.g. "Existing SAP ERP Solution
  Usage Profile") lists which SAP components are actively used in this
  specific system, independent of the 12-month ST03N window the
  Simplification Items check itself needs. Cross-reference each
  ST03N-gap item's underlying component/functionality against that active
  list: if nothing in the active-component list plausibly relates to the
  item (e.g. no PLM component active at all for an "Enterprise Search in
  SAP PLM" item, or no MDM/Catalog component among the active MM
  sub-components for an "MDM Catalog" item), that's real evidence toward
  "likely not relevant" — resolved this way on a real client report for 3
  of 17 gap items. This doesn't replace a proper 12-month ST03N read
  (it's a coarser signal — presence/absence of a component, not actual
  transaction volume), so still flag anything resolved this way as
  "resolved by usage-profile cross-reference," not "confirmed by ST03N,"
  when reporting it. **Match on functional area, never on the SI's
  internal ID string against the usage profile's component code** — the
  two use overlapping abbreviations for unrelated things. A real example:
  Simplification Item "SI11: SD_IS" is Web Channel/Internet Sales, but the
  usage profile's `SD-IS` component is "Information System" (SD's
  reporting sub-module) — a naive code match would wrongly read Internet
  Sales as confirmed-active off an unrelated reporting component; read
  the item's actual title/Business Impact Note and the component's plain-
  language label, not just the codes, before concluding either way;
  (b) point the analysis at a longer-lived system in
  the same landscape with a comparable usage profile (e.g. run against
  Production instead of a recently-refreshed QA/Sandbox copy); (c) check
  whether ST03N retention settings are configured shorter than needed and
  extend them for the *next* check cycle (per KBA 3110798 and 1843151) —
  this doesn't fix today's gap but prevents repeating it; (d) fall back to
  manual analysis — SM20 security audit logs, table change logs, or direct
  business-user interviews as a substitute signal; (e) accept it as a
  genuine unknown and schedule SME time to assess.
- **For scoping purposes: treat every ST03N-gap item as de facto
  "Assessment Required," even though the report doesn't label it that
  way.** Don't silently drop it from scope, and don't conflate it with a
  genuinely negative/clean finding.

## 4. Triage sequencing across SAP Activate phases

SAP doesn't publish one single "Simplification Item Triage Methodology"
document, but the pattern across SAP's own guidance and real project
practice is consistent:

1. **Prepare**: run the check for **relevance and technical consistency
   only** — inventory and rough-cut sizing, not resolution yet.
   **Consistency errors block the technical conversion itself,
   independent of business scope** — start fixing these immediately,
   regardless of what else is prioritized.
2. **Explore**: the real triage happens here — each relevant item gets a
   functional/business owner, gets reviewed in Fit-to-Standard workshops,
   and is resolved into a disposition (accept standard / custom build /
   defer / accept the gap). This is exactly where `sap-conversion-scoping`'s
   output and `sap-workshop-prep` (planned) plug in.
3. **Realize**: actual remediation execution proceeds against the
   prioritized backlog established in Explore.

**Priority order within triage** (apply this, not a flat Effort-Ranking
sort):
1. Technical/data **consistency errors** — must-fix regardless of Category.
2. **"Functionality unavailable (no alternative planned)"** and
   **"(alternative planned)"** — highest business-decision risk, longest
   lead time; these are the ones most likely to need a genuine ADR entry.
3. **"Potentially High"** and **"Assessment Required"** — need SME
   assessment early (Explore), even if actual remediation happens later
   in Realize; don't defer the *assessment* just because they lack a
   clean numeric score yet.
4. **"Change of existing functionality"** and lower-effort deprecated
   items — schedulable into Realize sprints without much upfront debate.

## 5. The Simplification Item Catalog app — the source the report doesn't reproduce

The standalone **Simplification Item Catalog** (SAP ONE Support
Launchpad, or the embedded Fiori app from S/4HANA 1709+) is the **master
reference catalog** — system-independent, browsable ahead of any
Readiness Check. Per item it carries the full **Business Impact Note**
(the actual "what changes and why" narrative) plus the governing SAP Note
and further guidance — materially more detail than the Readiness Check
report's short technical Relevance text.

- **Readiness Check report** = system-specific filtering (which items are
  relevant to *this* client's data) + effort sizing.
- **Simplification Item Catalog app** = the full narrative/reference
  content, independent of any one system.
- **Simplification Item Check** (run in-system, SAP Note 2399707) = the
  operational tool for iteratively fixing consistency errors, distinct
  from both of the above.

**Practical instruction**: for any item that matters to the scope or
timeline (anything in priority tiers 1-2 of §4), cross-reference the
Catalog's Business Impact Note rather than relying on the Readiness
Check's short Relevance text alone — the report deliberately doesn't
reproduce the full narrative.

## 6. Common triage mistakes to avoid

1. **Over-trusting Effort Ranking as a standalone priority signal.**
   SAP's own framing is explicit: "(default)" rankings reflect *generic*
   past-project experience, not this client's system. A "Low (default)"
   item touching a core process can matter more than a "Potentially High"
   item on a barely-used function. Use Category + the actual
   Relevance/Business-Impact text as the primary signal; Effort Ranking
   is a secondary sizing input, never the sole criterion.
2. **Treating "Assessment Required" as low priority because it has no
   numeric score.** It means the opposite — SAP is saying it *can't*
   generalize, so it needs SME time budgeted early, not deferred to the
   end because it "looks unscored."
3. **Conflating an inconclusive ST03N-gap relevance with a genuinely
   negative finding** (§3) — the single most common real-world mistake
   seen across the reports checked while building this skill.
4. **Running only one of Readiness Check or Simplification Item Check,
   not both.** They serve different purposes — planning/estimation vs.
   iterative in-system consistency-error cleanup — and skipping one
   leaves a real gap in either the plan or the execution.
5. **Scoping effort from the Category label alone, without consulting
   the Business Impact Note.** The label under-specifies whether
   remediation is config, custom code, or a genuine process redesign —
   especially for "no alternative planned" items, where SME judgment
   (not the label) makes that call.
6. **Cross-referencing a Simplification Item against the ERP Usage
   Profile by matching ID/code strings instead of functional meaning**
   (§3) — SAP's component codes and Simplification Item IDs reuse the
   same short abbreviations for unrelated things (e.g. `SD_IS` = Web
   Channel/Internet Sales as a Simplification Item, but `SD-IS` = SD's
   Information System reporting component in the usage profile).

## 7. Feeding this into the rest of the pipeline

- **`sap-conversion-scoping`**: weight Category over raw Effort Ranking
  when deciding Changed-vs-Unchanged and complexity (§1, §6 above) — a
  "Functionality unavailable (no alternative planned)" item should push
  toward High complexity and a Business-Decision flag almost regardless
  of its Effort Ranking label. Flag every ST03N-gap item explicitly as
  "To Assess," never silently folded into either Changed or Unchanged.
- **`sap-adr-log`**: any "(alternative planned)" or "(no alternative
  planned)" item that's business-critical is a real architectural
  decision (accept the gap / build a workaround / wait for the roadmap
  item) — raise it as its own entry, don't leave it as a scoping-sheet
  row.
- **Section 3.6 (Upgrade Strategy) / Section 6 (Extensibility)** — the
  priority-tier-2 items (no-alternative/alternative-planned) are exactly
  the ones that should drive the project's Clean Core and custom-code
  remediation scope conversation, not the raw item count.
