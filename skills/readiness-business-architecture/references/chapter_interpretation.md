# Business Architecture — Chapter Interpretation (Ch. 1, 3, 4)

Extracted from `knowledge/methodology/brownfield-conversion/readiness-check-interpretation.md`
(the cross-topic superset reference) for this skill's own chapters only, so this skill doesn't
need to load the full 10-chapter guide. See that file if you need the other chapters' framing.

## The core principle (applies to every topic, restated briefly)

SAP's own Readiness Check export does **not** synthesize a recommendation for you — Chapter 10 is
just a link to `me.sap.com/readinesscheck`. **Absence of findings is not absence of risk**: a whole
chapter/subsection can come back empty because the analysis was never run, not because there's
nothing to find. Every gap phrase the extraction tool surfaces must be reported as its own finding
("data collection gap — impact unknown"), never merged into genuinely clean "no issues found"
results that came from a real check.

## 1. Introduction

Boilerplate + the Analysis Scope table (source system SID/release/DB, target SAP S/4HANA version,
analysis date). Extract this table first — it's the header context every other chapter's numbers
need to be read against. An analysis run more than ~6-12 months ago on a fast-moving system should
be flagged as potentially stale.

## 3. Required Solution Adjustments (Simplification Items) — usually the largest chapter

This is where most of the real decision content lives. **Read
`references/simplification_items_guide.md` before triaging this chapter for real** — the Category
taxonomy, the "(default)" vs "(calculated)" Effort Ranking distinction, the ST03N 12-month
data-gap pattern, and the correct triage priority order all live there. This chapter is the direct
input `conversion-scoping` consumes.

- **General statistics** give you the shape of the problem: total items checked vs. "Relevant" vs.
  "Relevance to be checked" (can't be auto-determined). The ~17 "cannot be automatically
  determined" items are not optional — someone has to manually work through each one.
- **3.1.1 Relevant Simplification Items** table's `Relevance` column is SAP's audit trail for
  *why* it's relevant (e.g. a hit count of "1" against a ">0" threshold is a very different risk
  profile than "101" against ">100", even though both trigger the same item).
- **3.1.3 Activities Related to Simplification Items** — the `Condition` column (Mandatory /
  Optional / Conditional) combined with `Phase` (Before / During / After conversion project) is
  the actual prioritization scheme — build the project workplan from this. A "Mandatory" +
  "Before conversion project" activity also categorized as a "Business Decision" is a genuine
  planning blocker.
- **3.2 Effort Drivers** only appears for items ranked "Potentially High" — treat its presence at
  all as a signal to look closely.

## 4. Compatibility Scope Analysis

Items tied to SAP's Compatibility Packages (functionality being sunset/replaced). SAP's own
framing: these "do not necessarily need to be addressed before or during an upgrade" — treat as
**lower urgency than Chapter 3** by default, but still name in the SAD as known future-state
migrations. Note whether each item's alternative "Exists" today vs. "Exists With Roadmap" — the
latter is a real timeline dependency the client can't act on yet.

## Mapping into the SAP SAD

| Chapter | Feeds SAD section | Also feeds |
|---|---|---|
| 3. Simplification Items & Activities | 3.6 Upgrade Strategy, 6. Extensibility | 13. ADR (Mandatory/Before-project decisions) |

If this analysis feeds a `sad-drafting` engagement, say so explicitly and route each finding per
this table.
