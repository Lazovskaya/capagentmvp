# Decision matrix: Sizing strategy

Consultant decision guide for the technical sizing section of the Brownfield SAD.
Uses the `sizing-recommendation` artifact as its primary evidence base.

## Decision 1 — Infrastructure approach

| Option | When to recommend |
|---|---|
| **SAP RISE / BTP (hyperscaler)** | Client is moving to RISE with SAP; sizing is SAP-managed via T-shirt sizing |
| **Hyperscaler IaaS (Azure / AWS / GCP)** | Client self-manages infrastructure on cloud; use SAP Quick Sizer output and hyperscaler sizing guides |
| **On-premise** | Client owns hardware; use SAP Quick Sizer and vendor sizing guides |
| **Hybrid** | PRD on-premise, non-PRD on cloud — or vice versa |

## Decision 2 — Sizing method

| Method | When to use |
|---|---|
| **SAP Quick Sizer (SAPS-based)** | Standard for net-new or significantly changed landscapes; requires workload parameters from client |
| **Measured values from existing ERP** | When client's existing ERP has SM66/SM50 profiling data; more accurate for Brownfield since workload is known |
| **T-shirt sizing (RISE)** | Only for RISE engagements; SAP defines the package |
| **Vendor reference sizing** | When a comparable reference customer configuration exists |

For Brownfield conversions, measured values from the existing ERP are preferred where available —
the workload profile is stable and known. Quick Sizer is required where measured data is absent.

## Decision 3 — S/4HANA in-memory sizing considerations

Key differences from ECC on traditional RDBMS:

| Factor | Decision needed |
|---|---|
| **Column store compression** | Estimate compression ratio for client's data volume (typical 3–7×); confirm with SAP Memory Sizing Guide |
| **Hot vs. warm data** | Decide which data ages out to ILM/archiving vs. stays in-memory — directly affects RAM sizing |
| **Non-production instance sizing** | Confirm whether QA is sized at 100% PRD (for performance testing) or reduced (e.g., 50%) |

## Decision 4 — Growth factor

| Option | Notes |
|---|---|
| **SAP default (5% p.a. for 5 years)** | Conservative baseline; use when client cannot provide business forecast |
| **Client-provided forecast** | Preferred when client has a volume projection from business planning |
| **No growth reserve** | Only for pilot or short-horizon engagements (< 2 years) |

## Output to SAD

The sizing section of the SAD must state:
- Chosen infrastructure approach and justification
- Sizing method used and data sources
- Key parameters: SAPS (PRD/QA/DEV), RAM, storage
- Growth assumption and horizon
- Non-production sizing rationale

## Recording the decision

Confirmed sizing strategy → ADR entry:
- `decision_type: sizing-assumption`
- `stage: sad-drafting`
- `title: Sizing strategy — <infrastructure approach>`
- `description`: method chosen, key parameters, growth assumption
- `rationale`: cite sizing-recommendation artifact findings and client input
