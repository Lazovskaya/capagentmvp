# ISA-M Methodology Reference

SAP's **Integration Solution Advisory Methodology (ISA-M)** is the framework this Integration Strategy is
built on. It gives a structured, technology-agnostic way to define an enterprise's integration architecture
and then map it to concrete technology. This file is the working reference for the HIP section — apply it;
don't paraphrase a half-remembered version.

## 1. The Hybrid Integration Platform (HIP)

ISA-M frames the target state as a **Hybrid Integration Platform** — not a single product, but the *sum of
all integration components, technologies, processes, and governance guidelines* an enterprise uses to
connect its applications, data, and things across on-premise and cloud. "Hybrid" because a real enterprise
never runs on one integration tool: it has SAP-native integration, cloud iPaaS, event streaming, B2B/EDI,
API management, and file transfer, and the strategy's job is to make that heterogeneity deliberate and
governed rather than accidental.

The HIP is defined top-down through four ISA-M levels, then made real through blueprints and governance:

```
Integration Domains   → where integration happens (which environments connect)
  Integration Styles  → what kind of integration it is (process / data / thing / cross)
    Use-Case Patterns → the specific recurring shape within a style
      Technology Map  → which product realizes each in-scope pattern
        Blueprints    → the reusable, decided reference architecture per pattern
```

## 2. Level 1 — Integration Domains

Technology-agnostic building blocks describing *where* integration happens. The standard domains:

| Domain | Code | Meaning |
|--------|------|---------|
| On-Premise to On-Premise | O2O | Two on-premise systems (e.g. S/4HANA ↔ legacy MES) |
| On-Premise to Cloud | O2C | On-premise system ↔ a cloud/SaaS application |
| Cloud to Cloud | C2C | Two cloud/SaaS applications |
| Hybrid to Cloud | H2C | A hybrid estate (mixed on-prem + cloud) integrating to cloud/partners |
| Cloud to On-Premise | C2O | Cloud application reaching back into on-premise systems |
| Business-to-Business | B2B | Cross-company (trading partners), often via EDI/AS2 |
| Business-to-Government | B2G | Regulatory/e-invoicing/customs to government platforms |

**How to scope domains for a client:** read the system landscape. Which environments actually exchange
data, and at what scale? Name the domains that apply and describe the client-specific domain landscape —
e.g. "predominantly H2C and C2C as the estate moves to SaaS, with a shrinking O2O footprint as legacy
on-premise systems are retired wave by wave."

## 3. Level 2 — Integration Styles

*What kind* of integration each connection is. Four styles:

- **Process Integration** — application-to-application exchange of business documents/messages to execute
  an end-to-end process (orders, invoices, deliveries). Synchronous or asynchronous.
- **Data Integration** — moving or federating data for analytics, migration, or consolidation, typically
  in bulk or on a schedule rather than per business transaction.
- **Thing Integration** — connecting IoT devices/equipment (telemetry, commands) to business processes,
  analytics, or data lakes.
- **Cross-Use Cases** — capabilities that cut across the other three: **API-Managed Integration** (govern,
  secure, and monetize APIs), **Event-Based Integration** (pub/sub), **Stream Processing** (continuous
  processing of event streams), **Digital Integration Hub** (a high-performance data access layer decoupled
  from systems of record).

**Style decision criteria** (use these to place a connection): Is a business document/transaction being
exchanged to run a process? → Process. Is data being moved/federated for analytics or consolidation? →
Data. Is a physical device the source/target? → Thing. Is the need to expose/govern APIs, react to events,
process streams, or serve cached data at scale? → the matching Cross-Use Case.

**Scoping verdict per style:** mark each **Primary** (central to this client's integration), **Secondary**
(present but not dominant), or **Not in scope** (e.g. Thing Integration for a client with no IoT estate),
each with a one-line rationale grounded in the workshop notes.

## 4. Level 3 — Use-Case Patterns

The recurring shapes within each style. Scope each **in-scope / out-of-scope** for the client:

- **Process Integration:** A2A (application-to-application inside the enterprise), B2B (trading-partner
  EDI), B2G (government/regulatory), Master Data Integration (distributing master data as part of a
  process).
- **Data Integration:** Data Replication (ETL/bulk load), Data Virtualization (federated query without
  copying), Data Quality Management, Data Orchestration (multi-step data pipelines).
- **Thing Integration:** Thing-to-Analytics, Thing-to-Process, Thing-to-Data-Lake, Thing-to-Thing.
- **Cross-Use Cases:** API-Managed Integration, Event-Based Integration, Stream Processing, Digital
  Integration Hub.

## 5. Level 4 — Technology Mapping

Map each in-scope use-case pattern to the actual product(s) that realize it, in three explicit states so
the reader can see what's decided vs. open:

| State | Meaning |
|-------|---------|
| **Legacy** | The tool doing it today, to be replaced or wound down |
| **Target** | The confirmed future tool (only if genuinely confirmed in the minutes) |
| **Coexisting** | Legacy and Target both run in production during a planned transition/retirement window — not a placeholder state, an explicit statement that both are live and for how long. Use this whenever the client's own intent is phased retirement (common in Brownfield conversions), rather than folding the transition period into "In Discussion," which implies the choice itself is still open. |
| **In Discussion** | A candidate not yet decided — do not present as Target |

Typical SAP-centric technology landscape to map against (adapt to the client's actual stack):

| Pattern | Common Legacy | Common Target | Often In Discussion |
|---------|---------------|---------------|---------------------|
| A2A process integration | SAP PO/PI | SAP Integration Suite (Cloud Integration) | Azure Integration Services split |
| B2B/EDI | SEEBURGER BIS on-prem | SEEBURGER Cloud / SAP IS B2B | third-party (OpenText) |
| API management | none / custom | SAP API Management / Azure APIM | which is primary |
| Event-based | none / custom | SAP Advanced Event Mesh / Confluent | Azure Event Hubs |
| Stream processing | none | Confluent / Kafka Streams | Flink adoption |
| Data replication | SAP Data Services / custom | Azure Data Factory + ODP/CDC / SAP Datasphere | SLT vs CDC |
| Master data integration | ALE/IDoc | MDG + DRF | middleware-mediated MDI |

## 6. Level 5 — Technology Decision Trees

For each integration style, express the choice of technology as a **decision tree in structured Markdown** —
a sequence of conditions leading to a recommended component. Example shape for Process Integration:

```
Is the receiver an external trading partner?
  ├─ Yes → B2B pattern → SEEBURGER (Legacy) / SAP IS B2B (Target)
  └─ No  → Is the message volume high and latency-tolerant?
            ├─ Yes → asynchronous A2A → SAP Integration Suite (queue-based)
            └─ No  → Is a real-time query/response required?
                      ├─ Yes → synchronous A2A via API-managed integration
                      └─ No  → event-based integration (publish domain event)
```

Then add the client's **hard-rule overrides** from the workshop notes — e.g. "for Global-Critical systems
always use SAP Integration Suite or Azure IS (never direct point-to-point), regardless of the above."

## 7. Level 6 — Integration Blueprints

A blueprint is a *decided, reusable reference architecture* for a use-case pattern, so teams stop
re-deciding the same thing. See `blueprint_patterns.md` for the ID scheme and worked examples. In the
strategy, produce one reference blueprint per in-scope style as a seed; the full library is built
iteratively in the EA tool (LeanIX or equivalent) as real interfaces are assessed.

## 8. ISA-M maturity (for the optional Current State Assessment)

ISA-M describes an integration-maturity progression the client can be placed on: **Ad-hoc → Managed →
Defined → Optimized**. Ad-hoc = point-to-point, undocumented, per-project decisions. Managed = some shared
middleware, informal standards. Defined = documented styles/patterns, a governing body, a catalogue.
Optimized = self-service, automated governance, product thinking. Use this scale if the strategy includes
a current-state baseline.

## 9. EPAM extensions to note

Where the strategy goes beyond textbook ISA-M, say so — e.g. the three-state technology mapping
(Legacy/Target/In Discussion) as an explicit column set, the blueprint ID scheme with S/L/E classes, and
the four governance processes (Interface Assessment, Blueprint Assessment, Security Assessment, Architecture
Framework Vitality). These are EPAM's operationalization of ISA-M, not SAP canon — flag them as such so the
client understands what's method vs. what's EPAM practice.
