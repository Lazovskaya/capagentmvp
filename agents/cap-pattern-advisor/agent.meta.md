---
agent: cap-pattern-advisor
namespace: "@epam/sap"
version: 0.1.0
owner: Vera Lazouskaya
use_case_ids: [CAP-AI-11]
project_types: [greenfield, brownfield, bluefield, product-development]
sdlc_phases: [realize]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
First EPAM source baseline, 0.1.0. Thin host-neutral CAP-AI-11 entry point; the shared
skill owns the procedure. Preserves source/snapshot identity and uses tool-computed
decision counts, with provisional needs-review if approved validation is unavailable.
Structural adapter tests do not guarantee model obedience or live-host acceptance.

Owning Developer Assistant routing and controlled-ID approval remain governance
work. Do not attach this Realize development workflow to the Solution Architect's
Brownfield Discover/Explore path. No production library release is implied.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | `cap-suggest-patterns` | requires | Evidence-backed pattern review and proposals. |