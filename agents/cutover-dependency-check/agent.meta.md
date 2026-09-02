---
agent: cutover-dependency-check
namespace: "@epam/sap"

category: "SAP Activate / Deploy"
sdlc-stage: in-progress
use-case: ["Cutover planning & go-live readiness"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [flagged_items, notifications, object_dependency_data_available, status]
human-confirms: true

assistant: [TBD]
---

## Notes
Built for `EPMCSAPAI-265` (Backlog `#18`) once its blocker `#8` (Cutover strategy,
`EPMCSAPAI-251`) resolved 2026-09-02. The ticket's Jira label says `Phase: realize`, but its
actual dependency chain and role (autonomous BOT feeding a go-live decision) sit in this
factory's `Deploy` phase, alongside its sibling `cutover-risk-assessor` in the same
`cutover-planning` activity — placed there rather than under the `realize` label, consistent
with this factory's practice of trusting the real dependency chain over a Jira label/backlog-ID
direction that sometimes points the wrong way (see `sad-assembly`'s q-gate correction, same
pattern).

Ticket's `T5 Notification instrument` tool has no equivalent connector in this factory —
rather than inventing one or silently dropping the requirement, the agent returns a
`notifications` list stating the channel honestly (`manual — no notification connector wired`
unless a real one is actually configured), so the gap is visible to whoever reviews the
output rather than hidden behind a claimed "sent" notification.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | cutover-plan | consumes | source of the checklist/task list this agent checks |
| artifact | delivery-strategy | consumes | `strategy_type: Cutover`, from `EPMCSAPAI-251` |
| knowledge | methodology/cutover | consumes | canonical checklist stage sequence |
| mcp | abap-mcp | consumes | optional live transport/object dependency query |
| artifact | cutover-dependency-check | produces | this agent's own output |
| agent | cutover-risk-assessor | feeds | downstream go/conditional/no-go verdict reads an improved rehearsal record |
