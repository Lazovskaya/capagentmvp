# System Architecture — Application Server & Connectivity Components

For SAD Section 2.2 (System Architecture: 2.2.1 Application Server
Components, 2.2.2 Connectivity Components), read together with 2.1
(S/4HANA System Landscape — the Instance Strategy decision) and Section
10 (Infrastructure). Grounded in SAP's own publicly documented S/4HANA
technical architecture (NetWeaver AS ABAP application layer, HANA
database layer, Fiori front-end architecture) and the RISE with SAP
service model's specific division of responsibility.

## 1. What 2.2 needs to say beyond boilerplate

A generic component diagram (a box labeled "Application Server," another
labeled "Database") is exactly the kind of filler the quality rubric
marks down. What actually varies per engagement, and needs to be an
explicit decision here, not restated boilerplate:

- **Deployment model** — RISE with SAP (Private Cloud), customer-managed
  on a hyperscaler (IaaS), or on-premise. This changes not just the
  infrastructure section but *who owns which component* in 2.2.1/2.2.2 —
  say this explicitly rather than describing components generically as if
  the architect controls all of them regardless of model.
- **Embedded vs. Hub Fiori Front-End Server** (§3) — a real decision with
  real tradeoffs, not a default.
- **HANA scale-up vs. scale-out** — driven by the sizing outcome
  (`sizing_strategy_decision_matrix.md`), not assumed.
- **High availability architecture for the ABAP/HANA layer** — whether
  enqueue replication, HANA System Replication, or a RISE-managed
  equivalent applies, and at what RTO/RPO (feeds Section 9.5-9.7).

## 2. Application Server Components (2.2.1)

The S/4HANA application layer, using SAP's own architecture terminology:

- **ASCS (ABAP SAP Central Services)** — hosts the message server (load
  balancing across application server instances) and the enqueue server
  (lock management). A single point of failure unless paired with an
  Enqueue Replication Server (ERS) — name the HA approach here explicitly,
  don't leave it implicit.
- **PAS (Primary Application Server)** and **AAS (Additional Application
  Server(s))** — run the actual work processes: dialog (interactive user
  requests), batch (background jobs), update (V1/V2 database update
  processes), spool (print/output), and enqueue (lock requests routed to
  ASCS). State the number of AAS instances and the work-process mix if
  known — this is a real capacity/HA statement, not filler.
- **HANA Database layer** — scale-up (single node, vertical scaling) is
  the default and simpler HA/DR story; scale-out (multiple nodes) only
  applies when the sizing outcome genuinely requires more memory/compute
  than a single node/appliance tier supports. State which applies and
  why, sourced from the sizing decision, not assumed independently.
- **SAP Web Dispatcher** — HTTP(S) load balancer/reverse proxy in front of
  the application servers, terminates SSL, routes Fiori/browser traffic.
  Usually present regardless of deployment model; state whether it's
  customer-managed or part of the RISE-managed perimeter.
- **Fiori Front-End Server** — see §3 for the embedded-vs-hub decision.

## 3. Decision: Embedded vs. Hub Fiori Front-End Server

- **Embedded** (Fiori services run on the S/4HANA system itself, no
  separate Front-End Server): SAP's current recommended default for a
  single S/4HANA system with no other backend systems needing a unified
  Fiori Launchpad. Simpler landscape, one fewer system to patch/maintain.
- **Hub** (a dedicated Fiori Front-End Server, separate system): still
  the right call when a single Fiori Launchpad needs to expose apps from
  **multiple backend systems** (e.g. S/4HANA plus a still-running legacy
  system during a phased Brownfield rollout, or S/4HANA plus SAP BW/4HANA)
  — this is the actual decisive criterion, not company size or "best
  practice" alone. Don't default to Hub out of habit if there's genuinely
  only one backend in scope.

State which applies and why in 2.2.1 — this is exactly the kind of
"decision, not just a diagram label" the rubric rewards.

## 4. Connectivity Components (2.2.2)

- **SAP Web Dispatcher** — see §2 (sits at the boundary between browser/
  Fiori traffic and the application layer).
- **SAProuter** — the traditional secure network relay for SAP GUI/RFC
  traffic to SAP support and between SAP systems across network zones.
  Still relevant for SAP GUI access and support-connection routing even
  in cloud-hosted landscapes.
- **SAP BTP Cloud Connector** — the specific component enabling secure,
  on-premise-style connectivity between BTP-hosted side-by-side
  extensions (per `ricefw_decision_matrix.md`'s tier-4 extensibility) and
  the S/4HANA backend, without exposing the backend directly to the
  internet. Any Section 6 side-by-side extensibility decision has a
  direct 2.2.2 consequence — cross-reference rather than treating these
  as unrelated sections.
- **SAP Gateway (OData)** — embedded in the application layer as of
  S/4HANA (no separate Gateway hub system needed in current releases,
  unlike older SAP_UI-hub patterns) — exposes OData services consumed by
  Fiori apps and external integrations. Relevant to both Section 5
  (Integration) and here.
- **RFC/BAPI connectivity** — for legacy/batch integration patterns; note
  explicitly if these are being phased out in favor of OData/API-based
  integration per the Integration Architecture decision (Section 5), since
  that's a real modernization claim, not a given.
- **Network path for RISE-managed landscapes**: typically a private
  network connection (e.g. hyperscaler private link/VPN) between the
  customer's corporate network and the RISE-managed VPC/landscape — name
  the actual mechanism once confirmed with the RISE contract/AE, don't
  leave this as a generic "secure connectivity" statement.

## 5. RISE with SAP — what the architect actually still decides

Under RISE with SAP (Private Cloud), SAP (or its infrastructure operator)
owns and operates most of the infrastructure layer — this changes what
2.2 is actually documenting:

- **Still the architect's decision**: Embedded vs. Hub Fiori (§3), HA/DR
  tier and RTO/RPO targets within what RISE's service categories offer
  (Section 9.8), Cloud Connector placement and side-by-side extensibility
  architecture, network path design for the customer's own connectivity
  into the RISE landscape.
- **Largely SAP/operator-owned, not a customer architecture decision**:
  the specific HANA scale-up/scale-out hardware topology, patching
  cadence for infrastructure components, low-level HA mechanics (SAP
  manages the ASCS/ERS failover implementation under RISE's SLA).
  Section 2.2 should still *name* these components for completeness, but
  frame them as "operated under the RISE SLA" rather than presenting them
  as open architecture decisions this engagement is making.
- Say explicitly which category each 2.2 component falls into — this
  keeps the section honest about where the real engagement-specific
  decisions are, rather than presenting SAP-operated infrastructure as if
  it were being architected from scratch.

## 6. What to ask the user / feed into 2.2

1. Deployment model — RISE (Private Cloud), customer-managed hyperscaler,
   or on-premise? This gates almost everything else in this section.
2. Does the target landscape need a Hub Fiori Front-End Server (multiple
   backends behind one Launchpad), or is Embedded sufficient (§3)?
3. What did the sizing decision (`sizing_strategy_decision_matrix.md`)
   conclude about HANA scale-up vs. scale-out?
4. Does Section 6 (Extensibility) have any confirmed side-by-side (BTP)
   RICEFW objects yet? If so, the Cloud Connector architecture in 2.2.2
   needs to reflect that concretely, not generically.
5. What HA/DR tier does the RISE contract (or customer-managed design)
   actually commit to — confirm against Section 9.5-9.7 rather than
   assuming a tier.
