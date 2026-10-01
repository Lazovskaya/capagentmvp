---
agent: brownfield-sad-authoring-agent
namespace: "@epam/sap"
version: 0.3.2
owner: katsiaryna_ustsinava@epam.com
use_case_ids: [brownfield-sad-authoring]
project_types: [brownfield]
sdlc_phases: [discover, explore]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
Determines SAD readiness, gathers prerequisite evidence, orchestrates the Skills below, and
returns SAD review status. Orchestration behavior (resume/manual-change/conflict handling, stage
sequencing, human confirmation points) is implemented for real in `agent.md`'s body.
All Skills are now executable. `sad-drafting` built 2026-09-16; `workshop-scheduling` built 2026-09-16 (ported from `sap-ai-architecture-generator`'s `sap-workshop-prep`).
The `knowledge_source` row was briefly repointed at the real `standards` source once Knowledge
Sources were governed, but reverted (2026-09-11): `standards`'s actual content (Fit-to-Standard
gap-disposition taxonomy, source-synthesis methodology, SAP GitHub reference list) doesn't
describe Brownfield SAD authoring methodology -- it was only substituted in because it already
existed with real content, the same mistake found and reverted in
`readiness-analysis/skill.meta.md`. Left forward-declared instead, per the same principle
`solution-architect-role-context` already follows in `lint_dependencies.py`'s
`FORWARD_DECLARED_KNOWLEDGE_SOURCES`: don't repoint at a source whose Notes would then be untrue.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | `readiness-analysis` | requires | Readiness assessment stage. |
| skill | `sizing-analysis` | requires | Sizing stage. |
| skill | `conversion-scoping` | requires | Process scope stage. |
| skill | `workshop-scheduling` | requires | Workshop-preparation stage. |
| skill | `brownfield-sad-state-reconciliation` | requires | Initializes or resumes the durable engagement checkpoint. |
| skill | `confluence-document-publishing` | requires | Publishes approved canonical engagement documents to Confluence. |
| skill | `adr-log` | requires | Cross-cutting decision tracking. |
| skill | `sad-drafting` | requires | Explore-phase SAD drafting. |
| skill | `readiness-business-architecture` | requires | part of readiness assessment |
| skill | `readiness-technical-architecture` | requires | part of readiness assessment |
| skill | `readiness-extensibility` | requires | part of readiness assessment |
| skill | `readiness-integration` | requires | part of readiness assessment |
| skill | `readiness-security` | requires | part of readiness assessment |
| skill | `readiness-data-master-data` | requires | part of readiness assessment |
| knowledge_source | `brownfield-sad-authoring-methodology` | consumes | Forward-declared -- no knowledge_source describing Brownfield SAD authoring methodology exists under `knowledge/` yet (EPMCSAPAI-332 territory). |