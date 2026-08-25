# Upgrade-safety checklist

Per-object checklist for `extensibility-assessor` and `custom-code-scan`. Run this for every
custom or modified object before confirming a Tier 4 extensibility decision or closing a
custom-code remediation item. A "no" on any item is a blocker unless explicitly escalated.

## Checklist

### 1. API state of every called object

- [ ] Every function module, class method, BAPI, RFC called by this object has release state
  **C1 (Released)** — verified in ADT Properties or SACM, not assumed from name or longevity.
- [ ] No direct SELECT on SAP tables — data access goes through a released CDS view or a released
  API (BAPI/OData/RAP entity action).
- [ ] No access to HANA system views (`_SYS_`, `_SYS_BIC`) or AMDP on non-released base views.

### 2. Extension point release state

- [ ] If this object implements a BAdI or fills an enhancement spot: the enhancement spot has
  release state **Released** (visible in SE18 → API State, or in ADT).
- [ ] If this object extends a CDS view: the extended view explicitly allows extension (check
  `@ObjectModel.usageType` or `EXTEND VIEW ENTITY` contract in ABAP Doc).
- [ ] No `CALL CUSTOMER-FUNCTION` or classic user-exit entry points — these are not part of
  ABAP Cloud's released extension contract.

### 3. Namespace and object ownership

- [ ] All custom objects are in the customer namespace (`Z*`, `Y*`, or a registered `/CUST/`
  namespace) — no SAP namespace objects modified.
- [ ] No `INCLUDE` of an SAP program include into a customer program.
- [ ] No `TABLES` statement referencing an SAP work area (ABAP Cloud forbids this entirely).

### 4. Language construct restrictions (ABAP Cloud)

These constructs are forbidden in ABAP Cloud and will fail ATC `ABAP_CLOUD_READINESS`:

- [ ] No `CALL TRANSACTION` (use Business Process Automation APIs or Fiori navigation instead).
- [ ] No `SUBMIT` / `CALL PROGRAM` to SAP programs.
- [ ] No `SELECT ... BYPASSING BUFFER` on SAP tables.
- [ ] No `ASSIGN ... TO <field-symbol>` via `FIELD-SYMBOL` tricks to reach non-released data.
- [ ] No access to `SY-` / `SYST-` fields for business logic (allowed for technical use only,
  e.g. `SY-SUBRC` after a released API call).
- [ ] No `OPEN DATASET` / `TRANSFER` / `CLOSE DATASET` (filesystem access not available in cloud).
- [ ] No `CALL FUNCTION ... IN BACKGROUND TASK` on non-released FMs.

### 5. Transportability and lifecycle

- [ ] Object is in a transportable package with a defined software component — not `$TMP`.
- [ ] Soft dependencies (explicit `USING` or `INCLUDE` references to SAP objects) are released —
  checked via package dependency validator in ADT.
- [ ] No hardcoded client, system ID, or hostname.

### 6. ATC clean pass

- [ ] ATC check `ABAP_CLOUD_READINESS` passes with no errors (warnings may be accepted with
  documented rationale; errors are blockers).
- [ ] ATC check `SLIN` (Extended Program Check) passes — catches syntactic patterns that compile
  today but may not compile after a syntax revision.

## How to use this in a remediation

For each finding from `custom-code-scan`:

1. Identify which checklist items fail for that object.
2. Classify: **can be remediated to Tier 4** (released equivalent exists) vs.
   **genuinely Tier 5** (no released API covers the requirement).
3. For Tier 4 remediations: record the target released API and the ATC pass as evidence.
4. For Tier 5 findings: escalation addendum required — record who accepted the upgrade cost and
   what the mitigation plan is (e.g., scheduled review at next S/4HANA release).

## Shorthand severity guide

| Checklist failure | Severity | Typical remediation effort |
|---|---|---|
| Direct table SELECT on core table | High | Replace with released CDS view — usually 1–4h per object |
| Non-released FM call | High–Critical | Find released equivalent (BAPI/OData) or escalate to Tier 5 |
| Non-released BAdI/spot | Critical | No clean-core path — redesign or Tier 5 escalation |
| Forbidden language construct | High | Usually syntactic replacement, low effort if released API exists |
| Missing ATC clean pass | Medium | Fix ATC findings before closing the remediation item |
| `$TMP` package | Low | Transport to correct package — no code change needed |
