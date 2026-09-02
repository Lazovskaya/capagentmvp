---
agent: design-test-reviewer
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress
use-case: ["Solution design, architecture package & extensibility routing"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [verdict, checked_against]
human-confirms: false                 # agent.md carries no `## Human-in-the-loop` section

assistant: [TBD]
---

## Notes
Independent review of a `design-record` (and its paired `extensibility-record`)
against the approved Explore baseline, before Realize's transport-heavy work
starts. For Mode B (compose/maintain) designs, an open `⚠ Conflict` shown as
decided in the record body is a `blockers` violation, not a `gaps` one — a
correctness issue, not a completeness one. A design/extensibility-record
mismatch on the chosen tier is also `blockers`. Ported (contract only) from
sap-ai-cons's `design-test-reviewer`, itself an unbuilt `TARGET STUB` there;
the actual procedure here is this factory's own.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | design-record | consumes | reviews against its own validity checklist |
| artifact | extensibility-record | consumes | cross-checks the paired tier for consistency with the design-record |
