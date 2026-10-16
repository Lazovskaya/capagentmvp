---
skill: cap-suggest-patterns
namespace: "@epam/sap"
version: 0.1.0
owner: Vera Lazouskaya
project_types: [greenfield, brownfield, bluefield, product-development]
sdlc_phases: [realize]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
First EPAM source baseline, 0.1.0, for CAP-AI-11. Original workflow informed by the
supplied SAP skill references; no copied skill bodies or missing upstream files.
One assistant-neutral procedure owns compact preparation, bounded context batches,
CAP compatibility review, clean diffs, approved local artifacts, and deterministic
decision validation. Prefer native CAP to custom dependencies; the bundled helper
remains private/experimental. Reopen approvals on changed evidence fingerprints.

Input limits are not a total token/billing guarantee. Model review still needs
customer acceptance. No CAP-AI-10 environment setup, CAP-AI-12 client-code intake,
automatic code adoption, or publishing is included.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `cap-pattern-scanner` | requires | Local evidence, catalog, and experimental npm helper source. |