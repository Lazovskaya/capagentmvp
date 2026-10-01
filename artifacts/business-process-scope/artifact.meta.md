---
artifact: business-process-scope
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover]
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
`schema.json`/`template.md` carried over unchanged from `main` (EPMCSAPAI-324) -- they already
mirror `tools/generate-business-process-scope/scripts/build_scope_workbook.py`'s actual input
JSON shape exactly. Only this sidecar is new; `main` was missing it (tracked generally in
EPMCSAPAI-312's list of 11 artifacts without an `artifact.meta.md`).

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
