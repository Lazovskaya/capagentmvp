---
agent: business-process-hierarchy
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [process_id, l1_value_stream, l2_core_process, l3_scope_item, scope_item_id]
human-confirms: true

assistant: [TBD]
---

## Notes
Built for `EPMCSAPAI-250` after resolving the ticket's own ambiguous wording ("reference
architecture") with the ticket owner on 2026-09-02: the reference is SAP's own SAP Best
Practices taxonomy, not client/tenant enterprise-architecture data — LeanIX was investigated
and explicitly ruled out (see Jira comment history). This reframes the agent from "needs a new
data source" to "rolls up an existing agent's output" — a peer/downstream agent to
[[process-best-practice-mapping]] (`EPMCSAPAI-241`), not an independent one. Never re-matches a
process to a scope item itself; only places `MATCHED` rows on the SAP L1/L2/L3 tree and carries
everything else forward as an explicit `unplaced_processes` list (pattern 3 in
`docs/skill-design-conventions.md` — explicit reopen/escalation path, not silent drop).
`human-confirms: true` because hierarchy placement is exactly the kind of decision this factory
routes to a reviewer before it feeds Blueprint or E2E scope design.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | process-best-practice-mapping | consumes | from [[process-best-practice-mapping]] (`EPMCSAPAI-241`); only `MATCHED` rows are placed |
| knowledge | domain-packs | consumes | `sap-best-practices/scope-items/*.json` for each candidate's L1/L2/L3 path |
| artifact | business-process-hierarchy | produces | L1→L2→L3 tree plus an explicit unplaced-processes list |
| agent | EPMCSAPAI-249 E2E business processes scope | feeds | downstream consumer, not yet built in this repo |
| agent | EPMCSAPAI-252 Blueprint generation | feeds | downstream consumer, not yet built in this repo |
