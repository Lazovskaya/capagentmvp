---
skill: sad-drafting
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [explore]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes

Drafts the Brownfield SAD from evidence collected across readiness, sizing, and scoping stages,
combined with five consultant-confirmed decision matrices. Delegates mechanical template filling
to `fill-brownfield-sad-template`; this Skill owns the decision-matrix workflow, evidence
validation, and ADR logging. Sad-drafting is the final authoring stage before review and
Confluence publication.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `fill-brownfield-sad-template` | requires | Fills the SAD template from confirmed inputs; produces the staged SAD markdown. |
| skill | `adr-log` | requires | Records each decision-matrix confirmation as an ADR entry before the SAD draft is finalized. |
| skill | `confluence-document-publishing` | optional | Publishes the approved SAD as `06 Brownfield SAD` once review is complete. |
| artifact | `simplification-impact-report` | consumes | Readiness findings and Simplification Item blockers — primary evidence for conversion approach and RICEFW decisions. |
| artifact | `sizing-recommendation` | consumes | Sizing decisions and hardware/cloud approach — source for the sizing-strategy matrix. |
| artifact | `business-process-scope` | consumes | Agreed process scope — source for the RICEFW scope and data-migration perimeter. |
| artifact | `brownfield-adr-log` | consumes | Prior decisions recorded during earlier stages — referenced in the SAD's decision summary. |
| artifact | `brownfield-sad` | produces | The drafted Brownfield S/4HANA Solution Architecture Document. |
| artifact | `brownfield-sad-authoring-state` | produces | Updated with `sad-drafting` stage entry and confirmed decisions. |
| knowledge_source | `brownfield-sad-authoring-methodology` | consumes | Forward-declared — no knowledge_source describing SAD drafting methodology exists yet. |
