---
knowledge_source: readiness-check-interpretation
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover, explore]
access: repository
source_location: knowledge/methodology/brownfield-conversion/
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---

## Notes
Chapter-by-chapter interpretation guidance for a SAP Readiness Check for SAP S/4HANA report,
calibrated against real client exports, plus the SAD section-routing table. Ported from
`sap-ai-architecture-generator`'s `sap-readiness-check` skill (EPMCSAPAI-324); moved out of
`skills/readiness-analysis/references/` since it is genuinely reusable, not skill-private.
Consumed by `skills/readiness-analysis`. Content changes require a Knowledge Source version
update.

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| `readiness-check-interpretation.md` | Chapter-by-chapter Readiness Check interpretation + SAD section-routing table | Ported, hand-curated. |
| `_index.md` | Bucket index and provenance | Not a knowledge file itself. |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
