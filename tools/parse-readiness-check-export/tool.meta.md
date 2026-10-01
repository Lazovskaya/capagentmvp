---
tool: parse-readiness-check-export
namespace: "@epam/sap"
version: 0.2.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [discover]
operation: parse-readiness-check-export
permission_scope: read-only
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/esup/sap-ai-architecture-generator
---

## Notes
Ported from `sap-ai-architecture-generator` (EPMCSAPAI-324). No Connector dependency -- operates
only on a locally supplied export file/folder. **Not verified end to end in this environment**:
the script imports `python-docx` unconditionally, which is not installed here, so the module
does not even import; only syntax-checked via `py_compile`. `openpyxl` (used internally for the
supporting-`.xlsx` path) is confirmed available.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `simplification-impact-report` | related | Its output is interpreted by `readiness-analysis` into this artifact -- not produced directly by this Tool. |
