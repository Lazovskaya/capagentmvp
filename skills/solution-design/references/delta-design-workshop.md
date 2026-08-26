# Delta Design Workshop (DDW) — Process Guide

*Source: SAP Activate Methodology, Fit-Gap analysis practice*

A Delta Design Workshop is a structured session held **after Fit-to-Standard workshops** for every gap
classified as **Extension** or **Custom Dev**. It converts a backlog gap entry into an approved,
scoped design record that `solution-design` and `backlog-drafting` can act on.

## When to run

- Triggered for every gap with Disposition = Extension or Custom Dev
- Held before Realize phase starts (pre-condition for `solution-design`)
- May also re-examine gaps initially classified as Extension where a Config solution may exist

## Participants

| Role | Responsibility |
|---|---|
| Configuration Expert / Solution Architect | Leads session; challenges disposition; proposes solution approach |
| Business Process Expert | Confirms business justification; owns the requirement |
| Technical Lead (if Custom Dev) | Provides effort estimate and technical constraints |
| Project Lead | Ensures decisions are documented and signed off |

## 7-Step DDW Checklist

Run these steps for **every gap** in the DDW session:

### 1. Gap Review
Re-examine the gap with the business users. Confirm the requirement is still valid and has not been
resolved by a configuration decision made in a prior workshop. Verify the original gap description
is accurate.

### 2. Business Justification
Document **why this requirement is necessary**. The justification must be specific:
- What business rule, policy, or obligation drives it?
- Is it a legal/regulatory requirement, a contractual obligation, or a business preference?
- A business preference is not sufficient justification for Custom Dev.

### 3. Solution Design
Propose the technical solution approach. Validate against clean-core principles:
- Can this be solved with a released BAdI / Enhancement Spot?
- Can SAP Build (side-by-side) address it without touching core ABAP?
- Is a custom integration via SAP Integration Suite CPI the right approach?
- Only if none of the above: custom ABAP development.

> Check whether the gap can be re-classified from Extension to Config at this step.
> SAP Activate requires this check before any development is authorised.

### 4. Business Impact
Document **what happens if this gap is not closed**:
- Compliance risk (legal, tax, audit)?
- Process failure (cannot complete a business transaction)?
- Financial impact (revenue loss, penalties, manual rework cost)?

A gap with no documented business impact should be challenged for demotion to *Could Have* or
*Out of Scope*.

### 5. Value Driver
Link the gap to the business case KPI it supports. Every approved gap must trace to a value driver
from the project's business case. Gaps with no value driver are candidates for Out of Scope.

### 6. Backlog Priority (MoSCoW)
Assign MoSCoW priority relative to other gaps **and** standard configuration items:

| Priority | Condition |
|---|---|
| Must Have | Legal / compliance / contractual — cannot go live without |
| Should Have | Important; costly workaround exists |
| Could Have | Desirable; acceptable workaround |
| Would be nice | Low impact; defer to future wave |

### 7. Assumptions and Dependencies
Document all open questions, dependencies, and assumptions that affect the solution:
- Does the solution depend on a third-party system being available?
- Are there master data dependencies?
- Are there open organisational decisions that could change the solution?

## DDW Output

For each gap reviewed in the DDW, produce:
- Updated backlog entry with Business Justification, Business Impact, MoSCoW priority, and Assumptions
- Input to `solution-design` for tier decision and design record creation
- Input to `backlog-drafting` for work item creation (after design record is approved)

If the gap is re-classified to Config during DDW:
- Update disposition to Config in the backlog
- Document the configuration value identified
- No design record or FS required

## Connection to Other Skills

```
fit-gap-analysis → identifies Gap rows, routes to solution-design-required
      ↓
Delta Design Workshop (this guide) → confirms disposition, adds justification + impact
      ↓
solution-design → tier decision, design record + extensibility record
      ↓
backlog-drafting → work items with FTS Row ID backlinks
```
