# Decision matrix: Dual maintenance / retrofit

Consultant decision guide for handling development work that continues in the source ERP
system during the Brownfield conversion project. Changes made in ECC after the conversion
baseline is taken must be "retrofitted" into the S/4HANA development system before go-live.

## Why this matters

A Brownfield project typically runs 6–18 months. Business processes don't freeze. Custom code,
config, and master data changes in the live ECC system during the project must be applied to
S/4HANA or the go-live will carry gaps. The retrofit strategy decides how systematically this
is managed.

## Decision 1 — Development freeze

| Option | When to use |
|---|---|
| **Hard freeze at conversion baseline** | Low-risk: only emergency fixes permitted in ECC after baseline; all development moves to S/4HANA immediately |
| **Soft freeze (emergency fixes only)** | Balanced: routine development continues in S/4HANA; only break-fix changes in ECC require retrofit |
| **No freeze** | High-effort: all ECC changes require retrofit tracking throughout the project; only viable with strong tooling |

Hard freeze minimises retrofit effort but requires business commitment. Confirm with client
change management.

## Decision 2 — Retrofit tooling

| Option | Description | When to use |
|---|---|---|
| **Manual retrofit tracking** | Change log maintained by developers; each ECC change manually applied to S/4HANA DEV | Low-volume projects; small custom code footprint |
| **SAP Retrofit tool (transaction SPDD/SPAU / SE95)** | Standard SAP tooling for modification adjustments during upgrades; embedded in SUM | Always applicable for ABAP modifications; use as the baseline |
| **SAP Change Impact Analysis (CIA) / ABAP in Eclipse diff** | Identifies delta between ECC and S/4HANA custom code; guides developer prioritisation | Useful when retrofit backlog is large |
| **Transport-based retrofit** | Transports from ECC imported (with adjustments) into S/4HANA DEV | Only for configuration changes; not recommended for code |

## Decision 3 — Transport lane strategy

| Option | Notes |
|---|---|
| **Separate transport lanes (ECC + S/4HANA independent)** | Standard; ECC maintenance lane continues; S/4HANA development lane is new; retrofit is the bridge |
| **Shared CTS domain** | Complex; requires careful transport routing to prevent cross-contamination; rarely recommended |

## Decision 4 — Retrofit checkpoint frequency

| Option | Notes |
|---|---|
| **Continuous (every sprint)** | Minimises retrofit backlog at go-live; highest overhead during project |
| **Monthly** | Balanced; manageable backlog; recommended baseline |
| **Pre-go-live only (single retrofit sprint)** | Simple during project; high-risk at cutover if backlog is large |

## Output to SAD

The dual maintenance section of the SAD must state:
- Development freeze decision and effective date
- Retrofit tooling chosen
- Transport lane setup
- Retrofit checkpoint frequency and ownership
- Who approves retrofit completeness before go-live (part of the go-live readiness gate)

## Recording the decision

Confirmed dual maintenance strategy → ADR entry:
- `decision_type: integration-decision` (when retrofit touches interfaces)
  or `conversion-approach` (for code/config retrofit)
- `stage: sad-drafting`
- `title: Dual maintenance and retrofit strategy`
- `description`: freeze decision, tooling, lane setup, checkpoint frequency
- `rationale`: cite custom code volume from ATC, project timeline, client capacity
