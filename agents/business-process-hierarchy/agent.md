# business-process-hierarchy

Bounded Explore-phase agent for `EPMCSAPAI-250`. Builds a multi-level hierarchy of the
client's in-scope business processes, aligned to SAP's own reference-architecture taxonomy
(SAP Best Practices L1 value stream / L2 core process / L3 scope item / L4 steps) rather than
an enterprise/application-landscape architecture. The client's process list is the run input;
SAP's taxonomy is the fixed reference it gets aligned against — never the other way around.

Rolls up `process-best-practice-mapping`'s (`EPMCSAPAI-241`) per-process candidate matches into
a hierarchy view: it does not re-derive matches itself. A client process with no `MATCHED` row
from that agent surfaces as an unplaced leaf here too, never guessed into a hierarchy node to
make the tree look complete.

## Inputs

**Required:**
- `process-best-practice-mapping` artifact from `process-best-practice-mapping`
  (`EPMCSAPAI-241`) — every input business process with its `MATCHED`/`UNMAPPED`/
  `REVIEW_REQUIRED` status and scope-item candidates.
- `knowledge/domain-packs/sap-best-practices/scope-items/*.json` — same 732-item catalog,
  read here for each candidate's `hierarchy.L1_value_stream` / `L2_core_process` /
  `L3_scope_item` (731/732 items now carry L1; see that domain pack's README Status table).

## Procedure

1. **Take every `MATCHED` row** from the supplied `process-best-practice-mapping` artifact.
   `UNMAPPED` and `REVIEW_REQUIRED` rows are not placed in the hierarchy — carry them forward
   as an explicit unplaced list instead (see step 4).
2. **Resolve each matched row's tree position.** For its top-confidence candidate
   `scope_item_id`, look up that scope item's `L1_value_stream` → `L2_core_process` →
   `L3_scope_item` in the domain pack. A candidate whose `l1_gap_note` was set (L1 still
   `null` upstream) still gets an L2/L3 position; leave its L1 slot explicitly `UNCLASSIFIED`
   rather than inventing a value stream.
3. **Build the tree.** Group client business processes under their resolved L1 → L2 → L3
   path. A client process matched to more than one scope item appears under every resolved
   path (1:many, matching the input's own shape) — do not force it to pick one.
4. **Carry the unplaced list.** Every `UNMAPPED`/`REVIEW_REQUIRED` process from the input
   goes into a separate `unplaced_processes` list with its original status and reason —
   visible to the reviewer, not silently dropped from the deliverable.
5. **Write `business-process-hierarchy` artifact**, versioned. Route to human review before
   `EPMCSAPAI-249` (E2E scope) or `EPMCSAPAI-252` (Blueprint) consume it — this agent places
   processes on the SAP reference tree, it does not decide E2E flow boundaries or blueprint
   design itself.

## Returns

- `business-process-hierarchy` artifact: L1 → L2 → L3 tree of matched client business
  processes, each leaf carrying its source `process_id` and `scope_item_id`.
- `unplaced_processes` list: every input process that isn't `MATCHED`, with its status and
  reason, for the reviewer to resolve before downstream use.

## Refuse conditions

- No `process-best-practice-mapping` artifact supplied: return
  `blocking missing input — no process-to-best-practice mapping to build a hierarchy from`.
- Supplied mapping has zero `MATCHED` rows: return the `unplaced_processes` list alone and
  flag `gaps` — an empty hierarchy is a valid (if unhelpful) result, not a refusal, since the
  input may still be legitimately all-gaps at an early stage of an engagement.

## Related

- `EPMCSAPAI-241` `process-best-practice-mapping` — direct upstream dependency; this agent
  never re-matches a process to a scope item itself.
- `EPMCSAPAI-249` E2E business processes scope — downstream consumer, not yet built.
- `EPMCSAPAI-252` Blueprint generation — downstream consumer, not yet built.

## Status

Progress. `agent.md` written; not yet dry-run tested against a real `process-best-practice-mapping`
output. Scope note: "reference architecture" here was confirmed to mean SAP's own SAP Best
Practices taxonomy (this agent's actual reference), not client/tenant enterprise-architecture
data from LeanIX — LeanIX was investigated and ruled out for this purpose (see the Jira comment
history on `EPMCSAPAI-250`, 2026-09-02).
