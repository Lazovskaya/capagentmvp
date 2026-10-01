---
skill: readiness-analysis
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
Ported from `sap-ai-architecture-generator`'s `sap-readiness-check` skill (EPMCSAPAI-324).
Deterministic extraction moved out to `tools/parse-readiness-check-export/` per the plan's Tool
ownership split -- this sidecar's own `references/` keeps only interpretation guidance. Verified
end-to-end against a synthetic export (see the Tool's own `tool.md`) -- see SKILL.md's Status
section. The `standards` knowledge_source row previously here was dropped (2026-09-11): that
bucket's real content (Fit-to-Standard gap-disposition taxonomy) doesn't apply to this Skill's own
different sense of "gap" (readiness-check data-collection gaps) -- it had been substituted in only
because the bucket already existed with real content, not because it's actually relevant. Don't
re-add a knowledge_source here without checking its content actually applies.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `parse-readiness-check-export` | requires | Mechanical chapter/table + supporting-`.xlsx` extraction. |
| knowledge_source | `readiness-check-interpretation` | consumes | Governed at `knowledge/methodology/brownfield-conversion/knowledge.meta.md`, per `knowledge-template-MVP.md` v0.3 (EPMCSAPAI-332). |
| artifact | `simplification-impact-report` | produces | Per-chapter findings, severity, blockers, data gaps, SAD routing. |
| artifact | `business-process-impact-list` | produces | Simplification Item to candidate-process mapping, unverified until conversion-scoping confirms it. |
