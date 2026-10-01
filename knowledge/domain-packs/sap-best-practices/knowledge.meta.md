---
knowledge_source: sap-best-practices-taxonomy
namespace: "@epam/sap"
version: 0.1.0
owner: Vitaly_Malyshev@epam.com
project_types: [greenfield, brownfield, bluefield, ams, discovery, consulting, enterprise-architecture]
sdlc_phases: [discover, prepare, explore]
access: repository
source_location: knowledge/domain-packs/sap-best-practices/
provenance:
  source: SAP
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Generated taxonomy and BPMN-derived cache of 732 SAP Best Practices scope items, plus 13
value-stream index files. Signavio-derived (EPMCSAPAI-197): the underlying scope-item data was
extracted via SAP Signavio's own reverse-reference APIs, not bulk-scraped. EPMCSAPAI-239 and
ADR 0001 (`docs/adr/0001-knowledge-organization-and-distribution.md`) flag SAP's terms of use on
bulk extraction of SAP content -- this source's extraction method and legal posture should be
reviewed against that ADR before any further scale-up. Regenerated via
`ingest -> enrich -> bpmn -> populate_l1` (see `README.md`). Content changes require a Knowledge
Source version update.

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| `taxonomy-overview.md` | Taxonomy overview across all 732 scope items | Generated. |
| `dependency-map.md` | Scope-item dependency map | Generated. |
| `scope-items/` | 732 per-scope-item JSON records (BPMN flow, value-stream mapping, source metadata) | Generated cache; see `README.md` for regeneration. |
| `value-streams/` | 13 value-stream index files + per-L2-process-group detail files | Generated. |
| `README.md` | Provenance, regeneration commands, known gaps | Not a knowledge file itself. |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
