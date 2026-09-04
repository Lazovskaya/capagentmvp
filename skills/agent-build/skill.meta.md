---
skill: agent-build
title: Agent build & registration
namespace: "@epam/sap"

category: "SAP Activate / Run"
sdlc-stage: in-test
target-role: [developer]
engagement: [A, R]
use-case: ["Agent build & registration"]

distribution-class: client-shippable
source: internal
source-repo: [TBD]
q-gate: [run-exit]
---

## Notes
Builds a Joule Studio agent from an approved readiness assessment and records
evaluation, authorization, ownership and registration evidence. AI Agent Hub
registration is conditional because a stable public API is not currently exposed.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | joule-studio | requires | CLI build, lint, compile and deployment workflow |
| connector | ai-agent-hub | requires | registration when the tenant capability is available |
| artifact | agent-card | produces | purpose, owner, data scope, guardrails and eval pack |
| knowledge | extensibility, standards | consumes | released APIs, clean core and authorization constraints |
| skill | agent-readiness | requires | approved process candidate and data-reachability evidence |
| q-gate | run-exit | gates-at | evaluation, ownership and operational acceptance recorded |
