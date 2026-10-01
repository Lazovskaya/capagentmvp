---
knowledge_source: standards
namespace: "@epam/sap"
version: 0.1.0
owner: Vitaly_Malyshev@epam.com
project_types: [greenfield, brownfield, bluefield, ams, product-development, discovery, consulting, enterprise-architecture]
sdlc_phases: [discover, prepare, explore, realize, deploy, run]
access: repository
source_location: knowledge/standards/
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Method-agnostic delivery standards: how to build and keep current a structured, source-traced
document from scattered, heterogeneous inputs (`source-synthesis.md`, ported from a
`business-blueprint` skill, with two worked examples in `skills/solution-design/references/`); a
shared gap-disposition taxonomy (`gap-disposition-taxonomy.md`); and a curated SAP
GitHub/documentation reference index (`sap-architecture-references.md`). Method-agnostic, hence
the full applicability span. Consumed by the SAD authoring agent for evidence and handoff
(EPMCSAPAI-332). Content changes require a Knowledge Source version update.

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| `source-synthesis.md` | Source-traced document construction method | Tool-blind; ported from `sap-ai-cons`. |
| `gap-disposition-taxonomy.md` | Gap disposition taxonomy | Curated. |
| `sap-architecture-references.md` | Curated SAP GitHub/resource index | Curated. |
| `README.md` | Bucket scope and provenance | Not a knowledge file itself. |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
