# cutover-dependency-check

Bounded Deploy-phase autonomous check for `EPMCSAPAI-265`. Evaluates dependency relationships
across the cutover checklist's tasks/objects — flags conflicts and missing prerequisites,
proposes ordering adjustments, and lists who needs to know — before `cutover-risk-assessor`
runs its own go/conditional/no-go read on the rehearsal record. A recommendation with
traceable rationale, not an auto-applied re-sequencing.

## Reads

- **`cutover-plan`'s sequenced task list** (task/owner/dependency/expected duration; see
  `skills/cutover-plan/SKILL.md`) — the actual checklist this agent checks.
- **`delivery-strategy` artifact, `strategy_type: Cutover`** (from `strategies-generation`,
  `EPMCSAPAI-251`) — the strategy-level decisions (big-bang vs. phased, parallel-run-with-legacy,
  sequence) a task's dependency should not silently contradict.
- **`knowledge/methodology/cutover/cutover-checklist-template.md`** — the canonical stage
  sequence (Preparation → support/site setup → config verification → legacy month-end close →
  master data → transactional data → Go/No-Go → Go-Live) used as the expected precedence
  baseline for out-of-order detection.
- **Transport/object dependency data**, when available, via `abap-mcp` (`ListTransports`,
  `GetTransport`, `GetWhereUsed`) — confirms whether a task's named object/transport is actually
  released ahead of the task depending on it.

## Procedure

1. **Build the task dependency graph** from the checklist's Dependency column. A task past the
   Preparation stage with no stated dependency is a candidate finding, not an automatic
   failure — some tasks genuinely have none; say so in the rationale either way.
2. **Detect cycles.** Any circular dependency chain is `CIRCULAR` — always blocking, never a
   soft flag.
3. **Check named object/transport prerequisites against live data**, when `abap-mcp` access is
   available: a task consuming an object whose defining transport hasn't released yet, per
   `GetTransport`/`ListTransports`, is `MISSING_PREREQUISITE` with the transport reference as
   evidence. When live data is unavailable, mark every object-referencing task
   `OBJECT_DEPENDENCY_NOT_VERIFIED` instead of guessing — never claim a transport check ran when
   it didn't.
4. **Check task order against the canonical stage sequence.** A task's stated dependency
   pointing to a later stage than the task itself (or missing where an earlier-stage task the
   canonical sequence implies is required) is `OUT_OF_ORDER`.
5. **Cross-check against the Cutover delivery-strategy's own decisions.** A task that assumes
   a big-bang cutover when the strategy decided phased (or a parallel-run assumption the
   strategy ruled out) is `STRATEGY_CONFLICT`, citing the specific strategy decision row.
6. **Propose an ordering fix per flagged item** where one exists (not for
   `OBJECT_DEPENDENCY_NOT_VERIFIED`, which has nothing to reorder until verified) — the earliest
   valid position given the task's actual dependencies.
7. **Group flagged items by owner (Team/Resource column) into a notification list.** State the
   channel honestly: this factory has no wired notification connector (no T5 equivalent exists
   yet) — return `manual — no notification connector wired` unless a real channel (e.g. posting
   to the project's own Jira/Cloud ALM) is actually configured for this engagement. Never claim
   a notification was sent when it wasn't.
8. **Write one `cutover-dependency-check` artifact instance**, `status: DRAFT`, routed to the
   Delivery Manager for review before any re-sequencing is actually applied to the checklist.

## Returns

- One `cutover-dependency-check` artifact: `flagged_items` (task ref, issue type, evidence,
  proposed position, rationale) and `notifications` (owner, task refs, channel).
- `object_dependency_data_available`: whether live transport/object data actually backed this
  run — read this before trusting any `MISSING_PREREQUISITE`/`OBJECT_DEPENDENCY_NOT_VERIFIED`
  split.

## Refuse conditions

- No cutover checklist/task list supplied at all: return
  `blocking missing input — no checklist to check dependencies against`.
- No delivery-strategy (Cutover) and no canonical stage knowledge either: continue on the
  checklist's own dependency column alone, but drop `STRATEGY_CONFLICT` entirely from scope for
  this run rather than inventing a strategy to check against — state this explicitly in the
  output, don't silently omit it.

## Related

- `EPMCSAPAI-251` `strategies-generation` — upstream Cutover-strategy dependency (`#8` blocks
  `#18` per the ticket's own comment).
- `skills/cutover-plan` — the actual source of the checklist this agent checks; not itself a
  committed artifact type, read as workspace content per that skill's own Output section.
- `agents/cutover-risk-assessor` — downstream sibling in the same `cutover-planning` activity;
  reads the rehearsal record this agent's findings should already have improved.

## Status

Progress. `agent.md` written; not yet dry-run tested against a real checklist or a live
`abap-mcp` transport query. No notification connector exists in this factory yet — the
`notifications` output is a to-notify list for a human to actually act on, not a sent
notification, regardless of what `channel` says.
