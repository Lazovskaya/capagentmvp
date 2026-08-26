# Fit-to-Standard Workshop Execution Model

*Source: SAP Activate Methodology Accelerator S4H_885 (May 2023)*

## Per-Scope-Item 6-Step Model

Repeat this cycle for **every scope item** in the workshop. Iterate through all process variations within each scope item before moving to the next.

### Step 1 — Review Best Practices process flow
The Configuration Expert explains the scope item using the **SAP Best Practices process flow** and responses from the Business Driven Configuration Questionnaire (BDCQ). This sets shared vocabulary before the demo.

### Step 2 — Demonstrate scope item and concepts
The Configuration Expert **demos the scope item in the Starter System** using delivered master data. The process flow is used as a point of reference when navigating through the system. Highlight areas that require configuration decisions.

> For S/4HANA Cloud public edition three-system landscape customers, use the **Customizing Tenant** of the Starter System (not the Quality or Production tenant).

### Step 3 — Discuss how the processes fit customer requirements
Foster discussion to understand business requirements. Reference the BDCQ. Provide understanding of how the standard solution meets (or does not meet) those requirements. This is the main delta-discovery step.

### Step 4 — Identify required configuration
Leverage the BDCQ to arrive at **critical configuration decisions**. Document all configuration values and any in-app extensions required. Add to the backlog immediately.

> The customer is responsible for providing value lists (e.g., product group definitions). Configuration Expert does not invent them.

### Step 5 — Enable customer execution
The Configuration Expert enables the Business Process Expert to **execute the process themselves** in the Starter System. This is a learning checkpoint, not a sign-off.

### Step 6 — Identify delta requirements
Identify and catalog **delta requirements** in the backlog — business requirements that cannot be satisfied with the standard scenarios. Each delta gets an owner and a disposition (to be resolved in solution-design).

**Outputs per scope item:** Backlog entries (config values + deltas), updated process flow annotations.

---

## Workshop Track Schedule Reference

Workshops can run in parallel and in any sequence with these exceptions:

| Rule | Rationale |
|---|---|
| **Chart of Accounts first** | Drives financial org structure decisions everything else depends on |
| **Organizational Structure second** | Org units must be defined before any transactional scope item |
| **Finance last** | Finance validates and consolidates decisions made in all other tracks |

### Typical track durations

| Business Area | Duration (days) |
|---|---|
| Chart of Accounts | 1 |
| Organizational Structure | 1 |
| Human Resources | 2 |
| Sales | 3 |
| Sourcing and Procurement | 2 |
| Manufacturing | 3 |
| Project Services | 2 |
| R&D / Engineering | 1 |
| Supply Chain | 2 |
| Asset Management | 1 |
| Finance | 3 |
| Service | 1 |

Full two-week FTS block = ~22 workshop-days. Parallelisation typically compresses wall-clock time to 2 calendar weeks.

---

## Scope Item Planning Table (Example: Professional Services)

| Workshop | Scope Item IDs | In/Out Scope | Key Participants |
|---|---|---|---|
| Contract to Cash | J11, 1IL, 16T, J14, 1P0 | I, I, O, O, O | PM Commercial Services, Purchaser, Internal Sales Rep, Billing Clerk, GL Accountant, Controller |
| Time & Expense Management | 1M1, J11, J12 | O, I, I | PM Internal Services, Purchaser, GL Accountant, Controller, Internal Sales Rep, Billing Clerk |
| Project Management | 1KC, 2MV, BGI, J11, 1IL, 1A8, J13, BGJ, 1P0 | I, I, O, I, I, I, O, O, O | PM Internal Services, Purchaser, GL Accountant, Controller, Internal Sales Rep, Billing Clerk |

I = In scope for this workshop. O = Out of scope (covered elsewhere or excluded).

---

## Phase Gate: Explore → Realize

Before closing the Explore phase:

1. **All backlog items reviewed and consolidated** into a single prioritised backlog.
2. **Scope for first implementation phase determined**; descoped items documented for future phases.
3. **Handover to expert teams** — requirements and process flows transferred; delta requirements converted to backlog items.
4. **Formal sign-off of key decisions** and required configuration obtained before Realize starts.
5. **Customer has executed standard scenarios** in Starter System independently (Step 5 evidence).
