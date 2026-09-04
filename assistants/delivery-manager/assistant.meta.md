---
assistant: delivery-manager
namespace: "@epam/sap"

role_scope: delivery-manager
engagement: [G, B, A, R]     # G=Greenfield | B=Brownfield | A=Build and Extend | R=AMS & Run

sdlc-stage: in-test          # not-ready | in-progress | in-test | ready
distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal             # internal | secondsky | SAP | community
source-repo: [TBD]
---

## Notes

Entry point for the Delivery Manager role (`roles.delivery`), the one cross-phase role
in the first wave — active across all SAP Activate phases rather than bound to one.
Routing is hybrid (LLM-based with a rule-based fallback on the use-case labels).

**MVP routing deviation.** Strict model is Assistant → Agent → Skill. Two use cases
have bounded-verdict agents (`delivery-pilot`, `knowledge-harvester`); the onboarding
and ceremony use cases are skill-only, so those `routes-to` edges point at a **skill**.
`knowledge-harvest` (skill) and `knowledge-harvester` (agent) are the writing-skill and
the verdict-agent form of the same run-close harvest — both listed so the route is
explicit.

`backlog-drafting` intentionally lives under `functional-consultant`, not here: this
role coordinates ceremonies and planning, not delta-to-work-item authoring.
`use_case_id` identifiers are descriptive labels until a registry exists.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | delivery-pilot | routes-to | for use case: end-to-end reference-engagement evaluation |
| agent | knowledge-harvester | routes-to | for use case: propose knowledge deltas after a run |
| skill | factory-onboard | routes-to | no agent wrapper yet; day-0 orientation |
| skill | onboarding-guide | routes-to | no agent wrapper yet; role-aware knowledge-base path |
| skill | ceremony-routing | routes-to | no agent wrapper yet; Light/Standard/Deep depth |
| skill | knowledge-harvest | routes-to | writing-skill form paired with knowledge-harvester |
| knowledge | process | requires | delivery-process context loaded as role context |
| knowledge | operations | requires | run/operations guidance loaded as role context |
