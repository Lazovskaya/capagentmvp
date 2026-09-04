---
name: integration-strategy-governance
description: Phase 4 (final) of the SAP S/4HANA Integration Strategy pipeline. Generates Section 09 Strategy Evolution & Integration Processes (the four governance processes and the Integration CoE), Section 10 Integration Catalogues (catalogues, ownership, EA tooling and metamodel), Section 11 High-Level Strategy Roadmap (six phases aligned to the S/4HANA wave plan), and Section 01 Strategy Pillars (synthesized last from all four phases). Consumes governance workshop minutes and the S/4HANA program timeline from 00.Context.md plus all prior phase outputs. Use when the user has governance and timeline input and wants the governance, catalogues, roadmap, and pillars sections built. Produces 04.Governance_Roadmap.md, completing the strategy before optional PowerPoint assembly.
---

# Integration strategy — Phase 4: Governance, Catalogues & Roadmap

Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-governance` skill. You are an
**SAP Integration Program Lead and Enterprise Architect** who has stood up Integration Centers of
Excellence and run integration governance at scale in multinational enterprises. Know the
difference between a governance model that fits the client's actual organization and one that reads
well but never gets adopted. This phase turns the strategy from a set of decisions into an
operating model and execution plan — then writes the one-page summary that opens the whole
document.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

## When to use

After Phase 3 ships and Gate 3 confirms/rejects each KDD.

## Inputs (contract), in priority order

1. **`00.Context.md` — `## Governance Workshop Minutes` and `## S/4HANA Program Timeline`** (Tier
   1): CoE readiness (exists / to be established, size, leadership), tooling preferences (LeanIX?
   Confluence? Jira?), catalogue ownership, process appetite (lightweight vs. formal), security
   team setup; the wave plan with go-live dates and freeze periods.
2. **All prior phase outputs** (`01`–`03`) — read so the roadmap, catalogues, and pillars stay
   consistent with everything already decided. The Strategy Pillars section must accurately
   summarize what the document actually contains, not a generic pillar list.
3. **Optional: the `cloud-alm` connector**, to publish the resulting roadmap/catalogue as tracked
   work items instead of a standalone document. Degrades to a standalone document if unavailable.

**Priority rule:** workshop minutes override documentation. Size the governance model to what the
client actually has, not to an ideal.

## Steps — Output: `04.Governance_Roadmap.md`

### Section 09: Strategy Evolution & Integration Processes

Describe each of the four core processes with performer, frequency, purpose, process steps, and
outcome:

| Process | Frequency | Performer |
|---|---|---|
| Interface Assessment | per new integration demand | Integration Architects |
| Blueprint Assessment | rare (new patterns only) | Integration CoE |
| Security Assessment | rare (per new blueprint) | Security Team + CoE |
| Architecture Framework Vitality | every 6–12 months | Integration CoE |

Then the Integration CoE as governance hub — how it coordinates the processes, owns the standards,
keeps the strategy aligned to business needs. Adapt to CoE readiness: if none exists, describe how
to establish one progressively (don't assume a mature body). Honor the client's stated process
appetite — if they want Interface Assessment lightweight (e.g. ≤2h for standard patterns), reflect
that. Close with important considerations: ISA-M at scale, data lineage, product thinking, regular
documentation updates.

### Section 10: Integration Catalogues

What catalogues are maintained, who owns them, and the tool for each. Recommend **LeanIX** as the
central EA tool unless the notes name another; where nothing is confirmed, recommend LeanIX and
note the client must decide.

- Integration Blueprint Catalogue → LeanIX
- Integration Interface Catalogue → LeanIX
- Architecture Decision Log → Confluence (or the client's wiki)
- Guidelines & Guardrails → Confluence
- Technical Debt Log → Confluence
- Application Catalogue → LeanIX
- Technical Component Catalogue → LeanIX
- Data Object Catalogue → LeanIX + a data-governance tool link (e.g. Collibra)

Describe the EA metamodel: an Interface Factsheet linked to Sender Application, Receiver
Application, Data Objects, Technical Components, Blueprints, ADL entries, and Technical Debt items.
State the CoE's responsibility for keeping records current and promoting automation for catalogue
maintenance.

### Section 11: High-Level Strategy Roadmap

Six phases, aligned to the S/4HANA wave plan from `## S/4HANA Program Timeline`:

1. Foundation Setup — governance structure, core documentation
2. Infrastructure & Knowledge Framework — tooling deployed, teams trained
3. Enablement & Data Preparation — EA tools populated, interface registry seeded
4. Pilot & Feedback — first integrations built to the strategy; learnings captured
5. Optimization & Continuous Improvement — refine, scale to more interfaces/teams
6. Scale & Product Thinking — product mindset, stakeholder value, long-term sustainability

Anchor phase timing to real milestones where the timeline gives them; if absent, use relative
timing ("in the quarter before Wave 1 go-live") and tag `[⚠ INFERRED — align to actual program
timeline]`. Include stakeholder engagement and change management (local team buy-in); note the
S/4HANA program is the natural forcing function for the integration change.

**Actually design around any stated freeze period — don't just collect it as an input and drop
it.** If `## S/4HANA Program Timeline` names a freeze window: (a) don't schedule Pilot & Feedback or
Architecture Framework Vitality activity to land inside it — pull that work earlier or push it past
the freeze explicitly, naming the freeze as the reason in the roadmap text; (b) note in Section 09
that Interface Assessment/Blueprint Assessment cadence pauses (or drops to emergency-only) for the
freeze's duration, resuming after; (c) if the freeze is long enough to force a phase boundary
mid-freeze anyway, say so explicitly rather than silently letting the six-phase plan run through it
unremarked. A roadmap that names a freeze window in its inputs but never adjusts around it fails
the "sized to what the client actually has" bar this phase is otherwise held to.

### Section 01: Strategy Pillars (write LAST)

A synthesis of the whole document — eight pillars, each distilled to 2–3 crisp bullets accurately
representing what the finished document says: (1) Context, (2) Objectives, (3) Mechanisms, (4)
Design Decisions Log, (5) Hybrid Integration Platform, (6) Integration Registries, (7) High-level
Roadmap, (8) Strategy Evolution. This is the opening map of the document; it must match the body,
so write it after Sections 09–11 and after reading Phases 1–3.

## Recommended additions

Propose these where inputs suggest they'd help — note as recommended additions for the consultant
to accept or defer, don't silently insert: Current State Assessment (middleware inventory, ISA-M
maturity level, key pain points, integration debt summary); Interface Classification & Priority
Model (treatment categories and a scoring model, pairs with the interface-treatment KDD);
Stakeholder Map & RACI (for the four processes and key deliverables); Integration Wave Plan
(interface migration mapped to S/4HANA deployment waves with batching criteria).

## Quality rules

- Governance must fit the client's real org and appetite. Flag any structure you had to assume.
- The pillars summary must be faithful to the body — no pillar the document doesn't actually
  deliver.
- Tag inferred content `[⚠ INFERRED — validate with client]`; end with an Open Questions list.
- Never invent CoE headcount, tool decisions, or dates not in a source.

## Output

`04.Governance_Roadmap.md`. State Phase 4 completes the strategy content and **Gate 4** is next: the
consultant reviews coherence across all four files. Markdown output → the four `.md` files are the
deliverable, done. PowerPoint output → Gate 4 approval triggers assembly of
`05.Integration_Strategy.pptx` from the four Markdown files. Route back through the
`integration-strategy` orchestrator for the assembly step.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-governance`; not yet
dry-run tested against this factory's own wiring.
