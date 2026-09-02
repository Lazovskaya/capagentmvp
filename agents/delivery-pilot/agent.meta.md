---
agent: delivery-pilot
namespace: "@epam/sap"

category: "all"                       # cross-engagement evaluator, not phase-bound — an accepted exception to the single-phase convention
sdlc-stage: in-progress
use-case: ["Knowledge harvest"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [verdict, scorecard, evidence_references, blockers, platform_vs_consulting_defects, knowledge_deltas, next_actions, pilot_readiness]
human-confirms: false                 # agent.md carries no `## Human-in-the-loop` section — this agent's own output IS the confirmation instrument, see Notes

assistant: [TBD]
---

## Notes
Independent evaluator for one end-to-end reference engagement — measures
whether the delivery chain produced usable evidence; does not execute
delivery skills, create client decisions, or mutate Jira/Cloud ALM/LeanIX.
Never calls a write-capable connector tool and never invents missing
evidence or treats a verbal confirmation as accepted. Separates delivery
defects (route to the platform team) from platform defects and knowledge-
base gaps (route to knowledge-discovery/harvest). `human-confirms: false`
here does not mean unreviewed — the verdict itself (`PILOT_PASS` /
`PILOT_PASS_WITH_GAPS` / `PILOT_BLOCKED`) is the artifact a human reads to
decide whether the factory is ready for another pilot, but no separate
named-human confirmation step is described inside `agent.md` the way
`design-test-reviewer`/`cutover-risk-assessor` describe theirs.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | architecture-package | consumes | checks cross-artifact traceability chain from requirement through sign-off |
| artifact | run-exit-record | consumes | Deploy → Run handoff and run-exit evidence, when the pilot reaches Run |
| knowledge | operations | related | routes content gaps discovered during the pilot to knowledge discovery/harvest, not a direct call |
