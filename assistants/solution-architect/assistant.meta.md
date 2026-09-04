---
assistant: solution-architect
namespace: "@epam/sap"

role_scope: solution-architect
engagement: [G, B, A]        # G=Greenfield | B=Brownfield | A=Build and Extend | R=AMS & Run

sdlc-stage: in-test          # not-ready | in-progress | in-test | ready
distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal             # internal | secondsky | SAP | community
source-repo: [TBD]
---

## Notes

Entry point for the Architect role (`roles.architect` in `factory-data.json`), active
across Discover → Prepare → Explore and the architect's cross-phase Run governance
activity. Routing is hybrid (LLM-based with a rule-based fallback on the use-case
labels in `assistant.md`).

**MVP routing deviation.** The strict practice model is Assistant → Agent → Skill, but
most architect use cases are today implemented by a skill with no wrapping agent. Until
those agents exist, `routes-to` edges below point at a **skill** where no agent covers
the use case, and at an **agent** where one does. Wrapping the skill-only use cases in
agents is second-wave work.

`design-test-reviewer` is routed from here (it reviews the design-record this role's
`solution-design` produces) rather than from a not-yet-created `qa-lead` assistant.
`use_case_id` identifiers are descriptive labels until a use-case registry exists.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | readiness-analyst | routes-to | for use case: readiness assessment |
| agent | simplification-items-to-processes | routes-to | for use case: Simplification Item processing |
| agent | extensibility-assessor | routes-to | for use case: extensibility-tier decision |
| agent | design-test-reviewer | routes-to | for use case: independent design-record review |
| agent | source-conflict-analyst | routes-to | for use case: source provenance / contradiction analysis |
| skill | readiness-analysis | routes-to | no agent wrapper yet; paired with readiness-analyst |
| skill | knowledge-discovery | routes-to | no agent wrapper yet; extract client shape |
| skill | solution-design | routes-to | no agent wrapper yet; target design + tier decision record |
| skill | agent-readiness | routes-to | no agent wrapper yet; which processes are agent-ready |
| knowledge | standards | requires | architecture standards loaded as role context |
| knowledge | clean-core | requires | clean-core principles loaded as role context |
| knowledge | extensibility | requires | extensibility guidance loaded as role context |
