# Brownfield S/4HANA — Solution Architecture Document

**Engagement:** {{engagement_id}}
**Generated:** {{generated_at}}
**Review status:** {{review_status}}
**Reviewer:** {{reviewer}} | **Review date:** {{review_date}}

---

> **How this document is generated**
> Produced by `sad-drafting` from evidence artifacts collected during readiness, sizing, and
> scoping stages, combined with five consultant-confirmed decision matrices. Every material
> statement cites its source `[S-id]`. Uncovered or unconfirmed items are marked `TBC` and
> listed in the Open Topics section. Do not edit source-cited statements without updating the
> source artifact — edit the evidence, then regenerate.

---

## 1. Executive Summary

<!-- fill_sad_template: section=executive_summary source=decisions,readiness -->

Provide a 3–5 paragraph summary covering:
- Project objective and conversion approach
- System landscape decision
- Key risks and mitigations
- Go-live target and cutover strategy

*Generated from decision matrix confirmations and readiness findings.*

---

## 2. Project Overview

### 2.1 Scope

<!-- fill_sad_template: section=scope source=scoping -->

| Dimension | Decision |
|---|---|
| Conversion approach | {{decisions.data_migration_architecture.conversion_approach}} |
| In-scope company codes | *from business-process-scope artifact* |
| In-scope modules / processes | *from business-process-scope artifact* |
| Out of scope | *documented gaps from scoping stage* |

### 2.2 Constraints and Assumptions

*TBC — populate from readiness open points and scoping constraints.*

---

## 3. System Strategy

<!-- fill_sad_template: section=instance_strategy source=decisions.instance_strategy -->

### 3.1 Instance Landscape

| Decision | Value | ADR |
|---|---|---|
| Production instances | {{decisions.instance_strategy.production_instances}} | {{decisions.instance_strategy.adr_id}} |
| Mandant concept | {{decisions.instance_strategy.mandant_concept}} | — |
| Landscape configuration | {{decisions.instance_strategy.landscape}} | — |
| Confirmed by | {{decisions.instance_strategy.confirmed_by}} | — |

### 3.2 Transport Landscape

*Based on landscape configuration above. Standard CTS domain unless noted.*

---

## 4. Conversion Strategy

<!-- fill_sad_template: section=conversion_strategy source=decisions,readiness -->

### 4.1 Technical Conversion Approach

| Decision | Value | ADR |
|---|---|---|
| Conversion approach | {{decisions.data_migration_architecture.conversion_approach}} | {{decisions.data_migration_architecture.adr_id}} |
| Archiving strategy | {{decisions.data_migration_architecture.archiving_strategy}} | — |
| History retained | {{decisions.data_migration_architecture.history_years}} years | — |
| Confirmed by | {{decisions.data_migration_architecture.confirmed_by}} | — |

### 4.2 Cutover Strategy

| Decision | Value |
|---|---|
| Cutover approach | {{decisions.data_migration_architecture.cutover_strategy}} |
| Estimated downtime | {{decisions.data_migration_architecture.estimated_downtime_hours}} hours |

*Detailed cutover runbook is a separate deliverable (Cutover Planning stage).*

---

## 5. RICEFW Analysis

<!-- fill_sad_template: section=ricefw source=decisions.ricefw_disposition,readiness -->

### 5.1 Disposition Summary

| Category | Count | Strategy | ADR |
|---|---|---|---|
| Reports (R) | *from ATC* | {{decisions.ricefw_disposition.reports}} | {{decisions.ricefw_disposition.adr_id}} |
| Interfaces (I) | *from ATC* | {{decisions.ricefw_disposition.interfaces}} | — |
| Enhancements (E) | *from ATC* | {{decisions.ricefw_disposition.enhancements}} | — |
| Forms (F) | *from ATC* | {{decisions.ricefw_disposition.forms}} | — |
| Workflow (W) | *from ATC* | {{decisions.ricefw_disposition.workflow}} | — |

Confirmed by: {{decisions.ricefw_disposition.confirmed_by}}

Notes: {{decisions.ricefw_disposition.notes}}

---

## 6. Technical Sizing

<!-- fill_sad_template: section=sizing source=sizing_recommendation,decisions.sizing_strategy -->

### 6.1 Sizing Approach

| Decision | Value | ADR |
|---|---|---|
| Infrastructure | {{decisions.sizing_strategy.infrastructure_approach}} | {{decisions.sizing_strategy.adr_id}} |
| Sizing method | {{decisions.sizing_strategy.sizing_method}} | — |
| Growth factor | {{decisions.sizing_strategy.growth_factor_pct_pa}}% p.a. for {{decisions.sizing_strategy.growth_horizon_years}} years | — |
| Confirmed by | {{decisions.sizing_strategy.confirmed_by}} | — |

### 6.2 Key Parameters

*From sizing-recommendation artifact — replicate relevant table here.*

---

## 7. Data Migration Architecture

<!-- fill_sad_template: section=data_migration source=decisions.data_migration_architecture -->

*Section narrative generated from confirmed data migration decisions above (Section 4) plus
any data-quality findings from the readiness stage.*

---

## 8. Integration Architecture

*TBC — integration landscape not yet assessed. Add to Open Topics.*

---

## 9. Dual Maintenance and Retrofit

<!-- fill_sad_template: section=dual_maintenance source=decisions.dual_maintenance_retrofit -->

| Decision | Value | ADR |
|---|---|---|
| Freeze approach | {{decisions.dual_maintenance_retrofit.freeze_approach}} | {{decisions.dual_maintenance_retrofit.adr_id}} |
| Retrofit tooling | {{decisions.dual_maintenance_retrofit.retrofit_tooling}} | — |
| Checkpoint frequency | {{decisions.dual_maintenance_retrofit.checkpoint_frequency}} | — |
| Confirmed by | {{decisions.dual_maintenance_retrofit.confirmed_by}} | — |

---

## 10. Security and Authorization

*TBC — populate from client's authorization concept or role-redesign scope.*

---

## 11. Architecture Decisions

*All ADR entries for this engagement are maintained in the separate Architecture Decision Log
(05 Architecture Decision Log, `workspace/<engagement_id>/brownfield-sad/adr-log.json`).
This section summarises the decisions recorded during SAD drafting.*

| ADR ID | Decision | Stage | Status |
|---|---|---|---|
| *auto-populated from adr-log.json* | | | |

---

## 12. Open Topics

<!-- fill_sad_template: section=open_topics source=open_topics -->

| ID | Title | Source stage | Owner | Due | Status |
|---|---|---|---|---|---|
| *auto-populated* | | | | | |

---

## 13. References

| Source | Document |
|---|---|
| [S-1] | 01 Readiness Assessment — `workspace/<engagement_id>/brownfield-sad/staged/01-readiness-assessment.md` |
| [S-2] | 02 Sizing Recommendation — `workspace/<engagement_id>/brownfield-sad/staged/02-sizing-recommendation.md` |
| [S-3] | 03 Business Process Scope — `workspace/<engagement_id>/brownfield-sad/staged/03-business-process-scope.md` |
| [S-4] | 05 Architecture Decision Log — `workspace/<engagement_id>/brownfield-sad/adr-log.json` |
