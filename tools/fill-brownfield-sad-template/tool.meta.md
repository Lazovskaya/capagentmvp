---
tool: fill-brownfield-sad-template
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [brownfield]
sdlc_phases: [explore]
operation: fill-brownfield-sad-template
permission_scope: read-write
risk_freedom: low
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Resolves {{decisions.*}} tokens and <!-- fill_sad_template --> markers in the Brownfield SAD
template from confirmed evidence artifacts and the five decision-matrix outputs. Writes the
filled document atomically (temp-rename) to workspace/<engagement_id>/brownfield-sad/staged/06-
brownfield-sad.md. Validates: required decision keys present, no unresolved tokens after fill,
word count > 500. Invoked by sad-drafting skill step 3; see tool.md for the full flag reference
and error table.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | `brownfield-sad` | produces | Staged SAD markdown written to workspace/<engagement_id>/brownfield-sad/staged/. |
| artifact | `brownfield-adr-log` | consumes | ADR entries populate Section 11. |
| artifact | `simplification-impact-report` | consumes | Evidence source for readiness-based sections. |
| artifact | `sizing-recommendation` | consumes | Evidence source for Section 6. |
| artifact | `business-process-scope` | consumes | Evidence source for Sections 2 and 3. |
