---
skill: conversion-scoping
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-conversion-scoping` skill (EPMCSAPAI-324).
All three underlying Tool scripts verified end to end against synthetic `.xlsx` fixtures in this
environment.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `generate-business-process-scope` | requires | RBA/RSA + application-map extraction plus scope workbook rendering. |
| knowledge_source | `conversion-scoping-methodology` | consumes | Not yet registered -- see EPMCSAPAI-332. |
| knowledge_source | `north-star-methodology` | consumes | Governed at `knowledge/methodology/north-star/knowledge.meta.md`. |
| artifact | `business-process-impact-list` | consumes | From readiness-analysis; this Skill verifies applicability against the RBA/RSA catalog. |
| artifact | `business-process-scope` | produces | Stable row IDs, scope status, complexity, applications, technical blocker, caveats. |
