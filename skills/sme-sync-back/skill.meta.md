---
skill: sme-sync-back
namespace: "@epam/sap"
version: 0.1.0
owner: Maksim_Siarheichyk@epam.com
project_types: [greenfield, brownfield]
sdlc_phases: [discover, prepare, explore, realize, deploy, run]
risk_freedom: medium
readiness: in-progress
provenance:
  source: internal
---

## Notes
Authored for EPMCSAPAI-NNN (staff/sme-contribution-roundtrip-plan.md, step 6) as the
conversational front end to `scripts/sync_back.py`. Unlike every other skill in this factory,
this one is about the factory's own contribution process, not SAP delivery work -- it applies
across every `project_types`/`sdlc_phases` value because an SME can make a worth-keeping edit at
any point in any engagement type. `owner` is left as an explicit `TODO@epam.com` rather than a
guessed name: no existing skill/agent/tool in this factory is "factory infrastructure" the way
this one is, so there's no precedent to copy an owner from, and this session has no authority to
assign a real person. A maintainer must set this before `check_mr_approvals.py`'s per-owner
approval gate (step 5) can pass on any MR that touches this skill.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
