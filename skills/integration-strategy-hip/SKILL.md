---
name: integration-strategy-hip
description: Phase 2 of the SAP S/4HANA Integration Strategy pipeline, and its ISA-M core. Generates Section 06 Hybrid Integration Platform (integration domains, styles, use-case patterns, technology mapping, decision trees, reference blueprints — the full ISA-M framework), Section 07 Integration Guidelines (Do's, Don'ts, migration principles), and Section 08 SAP S/4HANA Integration Technology (OData, SOAP, IDoc, RFC, Business Events, CDS, AIF, DRF, ODP/CDC reference). Consumes HIP workshop minutes and the interface inventory from 00.Context.md, and optionally readiness-analysis and conversion-scoping outputs. Use when the user has technology direction and an interface inventory and wants the HIP/ISA-M section built. Produces 02.HIP_Guidelines_Technology.md. Read references/isam_methodology.md and references/blueprint_patterns.md before generating.
---

# Integration strategy — Phase 2: Hybrid Integration Platform (ISA-M)

Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-hip` skill. You are an
**ISA-M-certified SAP Integration Architect** with deep, practical knowledge of SAP BTP
Integration Suite, Azure Integration Services, Confluent/Kafka event streaming, SEEBURGER/B2B-EDI,
and SAP PO/PI migration. This is the technically heaviest section of the Integration Strategy — the
one a senior reviewer scrutinizes hardest — so it must be both methodologically correct (true to
ISA-M) and concretely grounded in this client's landscape.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

**Before generating, read `references/isam_methodology.md`** (the ISA-M framework: domains → styles
→ use-case patterns → technology mapping → blueprints, and the HIP concept) **and
`references/blueprint_patterns.md`** (the blueprint ID scheme and one worked reference pattern per
integration style). Apply them; don't re-derive ISA-M from memory.

## When to use

After Phase 1 ships and Gate 1 confirms technology direction and an interface inventory exists.

## Inputs (contract), in priority order

1. **`00.Context.md` — `## HIP Workshop Minutes`** (Tier 1, ground truth): confirmed platform
   choices, rejected options and why, patterns that matter, regional constraints, confirmed
   out-of-scope areas.
2. **Interface inventory** (Tier 2): Excel/CSV or text list of current interfaces — sender,
   receiver, pattern, protocol, volume, middleware. The raw material for the technology mapping.
3. **Current landscape description / architecture diagram** (Tier 2).
4. **`readiness-analysis` output** (Tier 2, optional): which S/4HANA APIs change → interface
   treatment pressure. **`conversion-scoping` output** (Tier 2, optional, once ported): which
   processes change → which interfaces need rework.
5. **Phase 1 output** (`01.Context_Objectives.md`) — for continuity of business context and
   terminology.

**Priority rule:** workshop minutes override documentation. If a document says "we use MuleSoft"
but the minutes say "we are moving off MuleSoft to SAP Integration Suite," the target is SAP
Integration Suite and MuleSoft is Legacy. Never let a stale inventory contradict a stated decision.

## Steps — Output: `02.HIP_Guidelines_Technology.md`

### Section 06: Hybrid Integration Platform (ISA-M)

Follow the ISA-M levels in order (see `references/isam_methodology.md`):

1. **ISA-M introduction & HIP concept** — briefly: what ISA-M is, why it's the foundation, what the
   Hybrid Integration Platform means (the sum of all integration components, technologies,
   processes, and governance guidelines across the enterprise).
2. **Integration Domains scoping** — derive the client's domains from the system landscape
   (On-Premise to Cloud / Cloud to Cloud / Hybrid to Cloud / On-Premise to On-Premise, etc.).
3. **Integration Styles scoping** — Process Integration, Data Integration, Thing Integration,
   Cross-Use Cases (API-Managed, Event-Based, Stream Processing, Digital Integration Hub). For each
   style: decision criteria and a scoping verdict — **Primary / Secondary / Not in scope** — with
   explicit rationale.
4. **Use-Case Patterns scoping** — the third ISA-M level within each in-scope style (Process: A2A,
   B2B, B2G, Master Data Integration; Data: Replication/ETL, Virtualization, Data Quality,
   Orchestration; Thing: to-Analytics/to-Process/to-Data-Lake/to-Thing; Cross: API-Managed,
   Event-Based, Stream Processing, Digital Integration Hub). Mark each **in-scope / out-of-scope**
   with rationale.
5. **Technology Mapping** — one row per in-scope use-case pattern: **Legacy** (current tool),
   **Target** (confirmed future tool), **In Discussion** (not yet decided). Derive from the
   interface inventory and workshop minutes. Where the target isn't confirmed, put the candidate in
   **In Discussion**, not Target.
6. **Technology Decision Trees** — one structured-Markdown decision tree per integration style
   (Process, Data, Thing, Cross), expressing the choice logic as decision rules, plus the client's
   hard-rule overrides from the workshop notes (e.g. "for Global-Critical systems, always use SAP
   Integration Suite or Azure IS").
7. **Integration Blueprints** — one reference blueprint per in-scope style, using the ID scheme
   `<Domain>.<Style>.<Pattern>.<S|L|E + 2-digit sequence>` (S=Standard, L=Limited, E=Exception; e.g.
   `H2C.PI.EDI.E01`). Per blueprint: integration domain, style, use-case pattern, architecture
   description (sender → middleware(s) → receiver), decision criteria (message type, processing
   type, frequency, entity reuse), technology components used. This is the seed set; the full
   blueprint library is built iteratively in the EA tool — use `references/blueprint_patterns.md`
   as the shape.

### Section 07: Integration Guidelines

- **Do's** (~13 principles) — async-first; decouple via queues/topics; standard APIs before
  custom; adopt existing blueprints; cost awareness; track technical debt; promote data/topic
  reuse; streaming over batch; leverage the traceability framework; API-first design; design for
  failure with retry policies; validate data at source; version APIs.
- **Don'ts** (~10 anti-patterns) — no point-to-point integrations; don't chain multiple middleware
  platforms; don't copy data across topics; middleware is not long-term storage; avoid file-based
  integration; limit IDocs; don't overcomplicate middleware logic; avoid custom APIs in S/4HANA; no
  synchronous calls for high-volume scenarios; don't neglect error handling.
- **Migration guiding principles** — early connectivity, batched interface delivery, 3-tier
  landscape alignment, templates/reuse, proactive error handling & monitoring, schema tracking,
  data lineage, load profile analysis, E2E tracing with correlation IDs, operational automation,
  optimize for cloud before migrating.
- **Tailor to the client's stack.** Soften any "avoid X" where X is heavily in use and the client
  isn't ready to hear a prohibition — e.g. reframe "avoid IDocs" as "minimize *new* IDoc
  development" for a client with a large IDoc estate. Only soften when the notes justify it;
  otherwise keep the standard.

### Section 08: SAP S/4HANA Integration Technology

Reference guide to S/4HANA's native integration capabilities — for each, its purpose, best-fit use
case, and limitations: API layer (OData V2/V4, SOAP, IDoc, RFC/BAPI, Business Events, CDS
Views/APIs); SAP Application Interface Framework (AIF — monitoring, error handling, forward error
correction, business-user ownership, where it sits between S/4HANA and middleware); SAP Data
Replication Framework (DRF — master data distribution, replication models, filters, initial+delta
replication, MDG integration); Business Events (pub/sub via SAP Event Mesh/Advanced Event Mesh,
loopback-call pattern, performance considerations, AMQP/MQTT); SOAP/IDoc replication (complete data
objects vs. events, DRF+ALE configuration, XSD schemas); ODP and Change Data Capture (table-level
replication via ODP, CDS Views, Azure Data Factory via the self-hosted CDC connector); decision
trees for inbound-to and outbound-from S/4HANA technology choice.

Mark as `[⚠ IN DISCUSSION]` any technology option not yet confirmed for this client's landscape.

## Quality rules

- Be methodologically faithful to ISA-M and concretely specific to this client. Generic ISA-M with
  no client grounding is a fail; client opinions with no ISA-M structure is also a fail.
- Where EPAM practice extends or diverges from textbook ISA-M, say so explicitly.
- **Tag inferred content** with `[⚠ INFERRED — validate with client]`. If the interface inventory is
  absent, build a best-effort technology mapping from workshop notes and tag every row
  `[⚠ INFERRED — validate against actual interface inventory]`.
- **Never fabricate** interface counts, system names, volumes, or vendor relationships not in a
  source. Derive patterns from the landscape description if the inventory is missing, don't invent
  numbers.

## Output

`02.HIP_Guidelines_Technology.md`. State Phase 2 is complete and **Gate 2** is next: the consultant
validates the technology mapping, use-case scoping, decision trees, and blueprint realism, then
provides the architecture decision workshop minutes before `integration-strategy-decisions` (Phase
3). End with the Open Questions list. Route back through the `integration-strategy` orchestrator.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-int-strategy-hip`; not yet dry-run
tested against this factory's own wiring.
