---
agent: e2e-process-scope
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress
use-case: ["Business process hierarchy & blueprint"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [l1_value_stream, included_nodes, linked_fit_gap_rows, status]
human-confirms: true

assistant: [TBD]
---

## Notes
Built for `EPMCSAPAI-249` once both its Jira dependencies (`#4` fit-gap → `EPMCSAPAI-243`/
`-247`, `#7` process hierarchy → `EPMCSAPAI-250`) were confirmed Resolved (2026-09-02). Treats
SAP's own L1 value streams (from [[business-process-hierarchy]]) as the E2E flow boundary
itself — "Lead to Cash" etc. are end-to-end by SAP's own definition, so this agent does not
invent a separate E2E grouping scheme on top of the hierarchy it consumes.

The one real design risk: `fit-gap-analysis` and `business-process-hierarchy` were built by
different tickets with no shared process ID (`row_id`/`process_step` free text vs.
`process_id`/`process_name`), so joining them here is a name-match heuristic, not a hard
reference — matches pattern 3 in `docs/skill-design-conventions.md` (explicit escalation path):
anything that doesn't clear the match bar goes to `unlinked_fit_gap_items`, never forced.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | business-process-hierarchy | consumes | from [[business-process-hierarchy]] (`EPMCSAPAI-250`); required |
| artifact | fit-gap-analysis | consumes | from `EPMCSAPAI-243`/`-247`; optional, joined by name-match heuristic |
| artifact | e2e-process-scope | produces | one row per E2E flow, plus unscoped-processes and unlinked-fit-gap-items lists |
| agent | EPMCSAPAI-252 Blueprint generation | feeds | downstream consumer, not yet built |
