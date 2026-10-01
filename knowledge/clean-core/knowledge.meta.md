---
knowledge_source: clean-core
namespace: "@epam/sap"
version: 0.1.0
owner: Vitaly_Malyshev@epam.com
project_types: [greenfield, brownfield, bluefield, ams]
sdlc_phases: [explore, realize, run]
access: repository
source_location: knowledge/clean-core/
provenance:
  source: SAP
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
SAP's clean-core rules applied as an always-on guardrail across extensibility decisions,
custom-code remediation, and solution design. Posture is *adopt* -- distilled from SAP's own
published guidance (ABAP Cloud programming model, SAP Help, BTP documentation), not authored by
EPAM from scratch. Read by `extensibility-assessor`, `custom-code-scan`, `solution-design`, and
`onboarding-guide`. Content changes require a Knowledge Source version update.

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| `clean-core-principles.md` | Clean-core definition, ABAP Cloud API release classification (C1/C2/not-released), in-app vs. side-by-side criteria, released extension-point types, violation pattern catalog | Authoritative reference. |
| `upgrade-safety-checklist.md` | Per-object upgrade-safety checklist: API state, extension-point release, namespace rules, forbidden ABAP Cloud constructs, ATC clean pass, transportability | Used by `extensibility-assessor` and `custom-code-scan`. |
| `README.md` | Bucket scope and consumer map | Not a knowledge file itself. |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
