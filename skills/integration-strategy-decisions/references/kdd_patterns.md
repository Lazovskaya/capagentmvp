# Key Design Decision (KDD) Patterns Reference

The recurring architecture decisions a large SAP S/4HANA Brownfield integration program almost always
faces. Use this catalogue two ways: (1) to fill gaps — add any of these the client will clearly face but
hasn't discussed yet, marked `Draft — Pending validation`; and (2) as the structure and the honest
trade-offs for each entry. Never present these defaults as the client's confirmed decisions — only the
workshop minutes can confirm a decision.

Each KDD entry in the strategy uses: **Context → Options (architecture, pros, cons) → EPAM recommendation →
Status (Draft / Confirmed / Open)**.

---

## KDD — Middleware platform selection

**Context:** aging SAP PO/PI (often at or near end-of-maintenance) plus assorted cloud integration tools;
the client must decide the target integration platform.

| Option | Pros | Cons |
|--------|------|------|
| A) Full **SAP Integration Suite** (BTP) | SAP-native, roadmap-aligned, strong S/4HANA connectivity, PO migration tooling exists | BTP cost model; team reskilling; less natural for non-SAP cloud-to-cloud |
| B) **Hybrid**: SAP IS for SAP-to-SAP/on-prem, Azure IS for non-SAP cloud | plays to existing Azure investment; right tool per job | two platforms to govern and staff; risk of overlap/ambiguity; lineage across two tools |
| C) **Azure-only** consolidation | one platform, existing Azure skills/contract | weaker S/4HANA-native fit; loses SAP-specific accelerators; SAP support boundary |

**Typical EPAM lean:** Option B for large hybrid estates, with a hard rule that SAP-native and
Global-Critical integrations run on SAP IS. Decide the split explicitly to avoid governance ambiguity.

---

## KDD — Integration migration roadmap / PO interface target

**Context:** hundreds of PO/PI interfaces must move; when and to what.

| Option | Pros | Cons |
|--------|------|------|
| Early rebuild (before/with S/4 go-live) | clean target from day one; no double-run | large upfront effort competing with the conversion |
| Deferred rebuild (lift interfaces, migrate later) | de-risks go-live; spreads effort | prolongs PO lifespan and dual-run cost; tech debt carries forward |
| Re-platform per wave | aligns interface work to business waves | complex sequencing; partial-state landscapes |

**Typical EPAM lean:** batch interfaces and align rebuild to the S/4HANA wave plan; rebuild
Global-Critical and Finance-first interfaces early, defer low-criticality ones. Pair with an interface
treatment model (keep/adapt/replace/decommission).

---

## KDD — Event streaming platform

**Context:** demand for pub/sub and streaming (decoupling, real-time analytics).

| Option | Pros | Cons |
|--------|------|------|
| **SAP Advanced Event Mesh** | SAP-native events, managed, S/4 Business Events fit | newer footprint; cost; less streaming ecosystem than Kafka |
| **Confluent / Kafka** | mature streaming, ecosystem, stream processing | ops burden or Confluent cost; SAP connectivity via connectors |
| **Azure Event Hubs** | Azure-native, existing skills | weaker SAP-native integration; Kafka-compatible but not Kafka |

**Typical EPAM lean:** driven by existing enterprise contracts — a client already on Confluent usually
keeps it for streaming while using SAP events at the S/4HANA edge.

---

## KDD — B2B / EDI platform future state

**Context:** existing EDI platform (often SEEBURGER) near end-of-maintenance; many active partner
connections.

| Option | Pros | Cons |
|--------|------|------|
| Upgrade SEEBURGER to cloud | low disruption; existing partner configs; existing contract | continues a separate platform; another vendor to govern |
| Migrate to **SAP Integration Suite B2B** | consolidates onto SAP IS; roadmap-aligned | partner re-onboarding effort; B2B maturity vs. dedicated EDI vendor |
| Third-party (e.g. OpenText) | strong EDI capability | new vendor; migration effort |

**Typical EPAM lean:** evaluate SAP IS B2B against a SEEBURGER cloud upgrade; disruption to existing
partner connections usually dominates the decision. Often left `Open` pending a vendor evaluation.

---

## KDD — API management strategy

**Context:** need to expose, secure, and govern APIs.

| Option | Pros | Cons |
|--------|------|------|
| **SAP API Management** (part of Integration Suite) | SAP-native, single suite | another BTP cost line; overlaps if Azure APIM exists |
| **Azure APIM** | existing Azure skills/estate | weaker SAP-native fit |
| Standalone / two-tier | best-of-breed | governance across two API gateways |

**Typical EPAM lean:** avoid two API gateways doing the same job; pick a primary and define when the other
is allowed.

---

## KDD — Master data integration approach

**Context:** distributing master data (business partner, material, etc.) in the target state.

| Option | Pros | Cons |
|--------|------|------|
| **MDG + DRF** | SAP-native governance + replication; delta/filters | MDG program dependency; DRF setup |
| Middleware-mediated MDI | decoupled, flexible routing | reimplements governance middleware-side; risk of divergence |

**Typical EPAM lean:** MDG + DRF where an MDG program exists; otherwise middleware-mediated with a clear
system of record.

---

## KDD — Interface treatment model

**Context:** every existing interface needs a treatment decision as part of the conversion.

**Not a two-option pick — a classification model.** Define the categories and the criteria, then apply per
interface: **New / Keep-as-is / Adapt (minor) / Redesign (significant) / Replace / Decommission.**
Criteria: technical complexity, business criticality, S/4HANA API change impact (from the Readiness Check),
and migration wave timing. This KDD usually pairs with an Interface Classification & Priority scoring model
(a recommended addition to the strategy).

**Typical EPAM lean:** make this a scored model, not a per-interface debate; decommission aggressively
where the Readiness Check shows the underlying process is gone.

---

## KDD — Data delivery from S/4HANA to a streaming/analytics platform

**Context:** getting S/4HANA data to Kafka/analytics (a real CEMEX KDD: Onibex OneConnect vs. SOAP/IDoc +
middleware).

| Option | Pros | Cons |
|--------|------|------|
| Dedicated S/4-to-Kafka connector (e.g. Onibex) | purpose-built, low-code, fast | additional product/cost; another vendor |
| SOAP/IDoc + middleware to broker | uses existing middleware; no new product | more build; middleware in the hot path |
| ODP/CDC + data pipeline | efficient delta at table level | analytics-oriented, not event-semantic |

**Typical EPAM lean:** depends on whether the need is *event* semantics (prefer Business Events/connector)
or *bulk/delta data* (prefer ODP/CDC).

---

## Using this catalogue

- Pull the KDDs the client will clearly face; don't force in ones that don't apply (no streaming demand →
  skip the streaming KDD).
- Keep options honest and few (2–4). The recommendation must be defensible for *this* client — cost
  appetite, existing contracts, in-house skills, and risk tolerance change the answer.
- Default status for anything the client hasn't actually discussed is `Draft — Pending validation`.
