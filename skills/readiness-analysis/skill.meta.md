---
skill: readiness-analysis
title: Readiness & simplification analysis   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [B]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [discover-prepare]         # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Turns the Readiness Check, SI-Check and relevant SAP Notes into one scoped,
per-module impact view: which simplification items actually apply, which
custom code they hit, and what that implies for effort. Output is the
simplification-impact-report that sizes the conversion before anyone commits
to a date. The judgment call this skill makes is separating items that
genuinely block the conversion from items that merely appear in the report.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | readiness-analyst | requires | isolated reviewer checks the simplification-impact-report for completeness and missing evidence |
| agent | simplification-items-to-processes | requires | transforms the SAP Simplification Item Catalog export into the business-process-impact-list |
| mcp-server | readiness-check | requires | source of Readiness Check / SI-Check findings |
| artifact | simplification-impact-report | produces | the Discover-phase deliverable of this skill |
| artifact | business-process-impact-list | produces | evidence-backed candidate business-process impacts |
| knowledge | custom-code | consumes | scopes impact against the existing custom-code inventory |
| knowledge | standards | consumes | applies delivery conventions |
| q-gate | discover-prepare | gates-at | exit criteria: scope and readiness accepted |
