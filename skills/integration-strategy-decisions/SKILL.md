---
name: integration-strategy-decisions
description: Phase 3 of the SAP S/4HANA Integration Strategy pipeline. Generates Section 04 Integration Platform Mechanisms (reliability/resilience, delivery acceleration, governance, traceability, operations — customized to the confirmed technology stack) and Section 05 Design Decisions Log (Key Design Decisions with options, pros/cons, EPAM recommendation, and status Draft/Confirmed/Open). Consumes the architecture decision workshop minutes from 00.Context.md plus the Phase 1 and Phase 2 outputs. Use when the user has architecture decision workshop input and wants the mechanisms and KDD sections built. Produces 03.Mechanisms_Decisions.md and an ADR Sync block for adr-log. Read references/kdd_patterns.md before generating.
---

# Integration strategy — Phase 3: Mechanisms & Design Decisions

Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-decisions` skill. You are a
**Senior SAP Integration Architect and Enterprise Architect** who presents architecture trade-offs
at CTO and architecture-review-board level. Write KDDs the way an ARB expects: the decision framed
crisply, real alternatives with honest pros and cons, a clear EPAM recommendation with rationale,
and an explicit status. Never dress up a default as a decision; never bury a real trade-off.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

**Before generating, read `references/kdd_patterns.md`** — the standard KDD catalogue for large SAP
brownfield programs, with typical options and trade-offs per KDD. Use it to fill gaps the workshop
minutes don't cover, and to structure each entry.

## When to use

After Phase 2 ships and Gate 2 validates the technology mapping.

## Inputs (contract), in priority order

1. **`00.Context.md` — `## Architecture Decision Workshop Minutes`** (Tier 1, ground truth): per
   KDD, the context, options discussed, the client's current lean, EPAM's view, anything already
   confirmed, open questions, vendor input.
2. **Phase 1 and Phase 2 outputs** — read for the confirmed technology stack and business context
   so mechanisms and KDDs reference the right tools. The confirmed **Target** technologies from the
   Phase 2 mapping determine which mechanisms apply.
3. **Vendor proposals / POC results** (Tier 2/3, optional).

**Priority rule:** workshop minutes override documentation and any default in the reference file.
If the minutes say a decision is already made, it's `Confirmed` — don't re-litigate it with
equal-weight alternatives.

## Steps — Output: `03.Mechanisms_Decisions.md`

### Section 04: Integration Platform Mechanisms

Include **only** mechanisms relevant to the confirmed technology stack from Phase 2, each with
architecture notes and the platform objective(s) it supports:

- **Reliability & Resilience** — HA/DR per confirmed middleware (SAP Integration Suite, Azure IS,
  Confluent); error handling for asynchronous interfaces: delivery assurance, message idempotency
  (unique IDs + duplicate check), source-side reprocessing by interface type (file, OData,
  SAP-based, XI/AS2, SOAP/HTTP).
- **Delivery Acceleration & Standardization** — reusable templates and the factory model (template
  cycle → delivery cycle feedback loop); the Pipeline Concept in SAP Cloud Integration for PO
  migration; PO migration tooling (EPAM PI/PO Analyzer, Code Transformation Tool, Landscaper
  CI/CD); artifact deployment automation via API.
- **Governance & Compliance** — integration governance (EA tool as central repository, the four
  processes as backbone); technical governance (architecture alignment, operational procedures,
  platform security, observability via Dynatrace/SAP Cloud ALM).
- **Traceability & Transparency** — data lineage (API → middleware → broker topic → target, via the
  EA tool and lineage tooling); end-to-end traceability (unified log collection, standardized
  message metadata with correlation IDs).
- **Operations & Continuous Improvement** — CI/CD pipelines, governance policy automation; testing
  approach (unit → format → integration → E2E → UAT, automated format validation, performance
  testing framework).

### Section 05: Design Decisions Log (KDDs)

1. **Summary table first** — every KDD: number, title, status (Draft/Confirmed/Open).
2. **One structured entry per KDD:** Context (what forces the decision — end-of-maintenance date,
   S/4HANA API change, cost, vendor contract), Options (2–4 real alternatives, each with an
   architecture description, pros, and cons), EPAM recommendation (which option and why, in this
   client's context and risk appetite), Status.
3. **Derive the KDD list from the workshop minutes first**, then add standard KDDs from
   `references/kdd_patterns.md` for decisions the client will clearly face but hasn't discussed
   yet.
4. **Status rules:** minutes record a made decision → `Confirmed` (acknowledge what and why, note
   rejected options briefly as considered-and-rejected, not still-equal choices); minutes discuss
   it but leave it open → `Open`, with the current lean noted; a KDD you added from the reference
   (not discussed) → `Draft — Pending validation`.

### `## ADR Sync` block

End with an `## ADR Sync` section listing each **Confirmed** KDD as a ready-to-call `adr-log`
update, with fields mapped explicitly (don't leave the mapping to be inferred at call time):

| This skill's field | `adr-log` field | Notes |
|---|---|---|
| KDD title | `title` | |
| KDD framing + workshop context | `context` | |
| The alternatives table | `options_considered` | one entry per option |
| EPAM recommendation + what was actually chosen | `decision` | |
| Why, from the pros/cons | `rationale` | |
| — | `raised_by` | always `"integration-strategy-decisions"` |
| — | `owner` | the architect who owns this KDD, name explicitly |
| — | `sad_section` | the integration chapter this feeds, if `sad-drafting` is in use |
| this document's own reference | `evidence` | e.g. `"integration-strategy Phase 3, 03.Mechanisms_Decisions.md"` |

**KDD status → `adr-log` status:** `Confirmed` → `Decided`; `Draft` and `Open` KDDs are **not**
pushed as `adr-log` entries at all (per the rule below) — if one must be tracked anyway, it goes in
as `Proposed`, never `Decided`. There is no `adr-log` status matching "Draft"/"Open" directly; don't
invent one — collapse to `Proposed` for anything not actually Confirmed.

Don't include Draft/Open KDDs as ADRs; note them as "proposed, pending validation" if listed at all.
This keeps the project-wide decision log complete instead of leaving integration decisions siloed
here.

## Quality rules

- Real trade-offs, not strawmen — each option's cons must be genuine; the recommendation must earn
  its choice.
- Recommendations must fit **this** client's context and risk appetite — a cost-sensitive client
  and a greenfield-ambitious client get different recommendations for the same KDD.
- **If `## Architecture Decision Workshop Minutes` is empty:** generate draft KDDs for the
  identified landscape from `references/kdd_patterns.md`, mark **every** entry `Status: Draft —
  Pending validation`, and produce an explicit Open Questions list of what must be answered before
  Gate 3. Say clearly at the top these are generated defaults, not client decisions.
- **Never fabricate** confirmed decisions, vendor preferences, or constraints not present in a
  source. Tag any inferred mechanism or KDD detail with `[⚠ INFERRED — validate with client]`.

## Output

`03.Mechanisms_Decisions.md` plus the `## ADR Sync` block. State Phase 3 is complete and **Gate 3**
is next: the consultant confirms/rejects each KDD and provides governance workshop minutes and the
S/4HANA program timeline before `integration-strategy-governance` (Phase 4). Remind the user to
push the `## ADR Sync` entries into `adr-log`. Route back through the `integration-strategy`
orchestrator.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-decisions`; not yet
dry-run tested against this factory's own wiring.
