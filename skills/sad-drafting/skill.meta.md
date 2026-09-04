---
skill: sad-drafting
title: SAD drafting
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A]              # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["SAD drafting"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: [explore-realize]
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-sad` skill — the largest single port so far
(3 playbooks, 6 decision-matrix references, EPAM's universal SAD quality rubric, a docx
extract/fill script, and EPAM's real SAP SAD `.docx` template). Its relationship to
`agents/sad-assembly` and `artifacts/technical-sad` (the existing Technical Architecture track
composed from nine not-yet-built domain-strategy agents) is an open question flagged in this
skill's own `SKILL.md` — not yet resolved.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | readiness-analysis | consumes | Readiness Check findings brief pre-answers sizing, Clean Core, CVI, integration, downtime sections |
| skill | conversion-scoping | consumes | once ported; Business Process Scope feeds IV.I, Section 6, Section 5 |
| skill | sizing-analysis | feeds-into | hands off the sizing methodology decision for the actual growth-adjusted calculation |
| skill | adr-log | feeds-into | Instance Strategy, Dual Maintenance/Retrofit, and not-Clean-Core decisions raise entries there |
| agent | sad-assembly | relates-to | overlapping technical-architecture ground; overlap not yet resolved, see SKILL.md |
| artifact | technical-sad | relates-to | same overlap |
