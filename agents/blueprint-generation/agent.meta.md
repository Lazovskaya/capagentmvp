---
agent: blueprint-generation
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [l1_value_stream, included_nodes, design_decisions, not_yet_covered, status]
human-confirms: true

assistant: [TBD]
---

## Notes
Built for `EPMCSAPAI-252` once all three of its Jira dependencies (`#6` → `EPMCSAPAI-249`,
`#4` → `EPMCSAPAI-243`/`-247`, `#7` → `EPMCSAPAI-250`) were Resolved (2026-09-02). Assembles
rather than decides: every design statement in its output cites an upstream `row_id` or node
it came from, per this factory's general "AI-assisted suggestion needs a stated basis" pattern
(same shape as [[objects-mapping]]'s confidence/match_basis, adapted here to citation rather
than confidence since blueprint statements are traced facts, not scored guesses). A `GAP` row
with `disposition: solution-design-required` becomes a named open question, never a fabricated
design answer — that decision stays with `solution-design`, downstream of this agent.

Chained on top of two same-day, still-untested upstream agents
([[e2e-process-scope]] EPMCSAPAI-249, [[business-process-hierarchy]] EPMCSAPAI-250) — flagged
explicitly under `## Status` rather than treated as more solid than it is.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | e2e-process-scope | consumes | from [[e2e-process-scope]] (`EPMCSAPAI-249`); required |
| artifact | fit-gap-analysis | consumes | from `EPMCSAPAI-243`/`-247`; required, grounds design decisions |
| artifact | business-process-hierarchy | consumes | from [[business-process-hierarchy]] (`EPMCSAPAI-250`); optional, resync cross-check only |
| artifact | solution-blueprint | produces | one section per E2E flow, cited design decisions, explicit not-yet-covered list |
| skill | solution-design | feeds | an `open-question` disposition in the blueprint is what solution-design resolves next |
