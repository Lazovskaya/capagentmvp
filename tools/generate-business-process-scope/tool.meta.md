---
tool: generate-business-process-scope
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover]
operation: generate-business-process-scope
permission_scope: read-write
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---

## Notes
Ported from `sap-ai-architecture-generator` (EPMCSAPAI-324): `extract_rba_catalog.py`,
`extract_application_map.py`, `build_scope_workbook.py`. No Connector dependency -- reads/writes
only locally supplied files. `permission_scope: read-write` refers to writing the local `.xlsx`
deliverable, not any external/client system. Verified end to end against synthetic fixtures (see
tool.md).

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `business-process-scope` | produces | The rendered `.xlsx` workbook is this artifact's real deliverable form. |
