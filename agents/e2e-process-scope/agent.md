# e2e-process-scope

Bounded Explore-phase agent for `EPMCSAPAI-249`. Groups the client's matched business
processes into end-to-end (E2E) flows with explicit start/end boundaries, ahead of Blueprint
(`EPMCSAPAI-252`) and E2E test scenario design (not yet built). Decides flow boundaries and
inclusion; does not decide Fit/Gap disposition or blueprint design content itself.

## Inputs

**Required:**
- `business-process-hierarchy` artifact from `business-process-hierarchy` (`EPMCSAPAI-250`) —
  the L1 (value stream) → L2 (core process) → L3 (scope item) tree of matched client
  processes.

**Optional, sharpens boundary decisions:**
- `fit-gap-analysis` artifact from the Fit-to-Standard workshop accelerator (`EPMCSAPAI-243`/
  `-247`) — Fit/Gap dispositions per decision-log row. There is no shared ID between a
  fit-gap row (`row_id`/`process_step`, free text) and a hierarchy leaf (`process_id`/
  `process_name`) — see Procedure step 3 for how this agent joins them and what it refuses
  to assume.

## Procedure

1. **One candidate E2E flow per L1 value stream.** Each `l1_value_stream` node in the
   hierarchy with at least one placed process is a candidate E2E flow — SAP's own L1 value
   streams (Lead to Cash, Source to Pay, Plan to Fulfill, ...) are themselves end-to-end flows
   by definition, not just a taxonomy label. An `UNCLASSIFIED` L1 node (upstream L1 gap) is
   never turned into a flow — carry its processes forward as `unscoped_processes` instead.
2. **Set the flow boundary from the L2/L3 tree, do not invent a sequence.** The flow's
   included sub-processes are every L2/L3 node under that L1 in the hierarchy. This agent has
   no step-ordering data beyond what `business-process-hierarchy` already carries (L4 steps
   are per-scope-item, not per-flow) — state the boundary as the *set* of included L2/L3
   nodes, not a claimed end-to-end sequence, unless the input explicitly supplies ordering.
3. **Join fit-gap dispositions by name, mark confidence, never force a match.** When a
   `fit-gap-analysis` artifact is supplied, match each item's `process_step` text against
   hierarchy leaf `process_name`s (case-insensitive substring, both directions). A confident
   match attaches that row's `classification`/`disposition` to the flow. Anything that doesn't
   clear a defensible text-overlap bar goes to `unlinked_fit_gap_items` — never silently
   dropped, never guessed onto a flow to look complete.
4. **Write `e2e-process-scope` artifact**, one row per E2E flow (its L1 value stream, included
   L2/L3 nodes, and any linked fit-gap dispositions), plus the `unscoped_processes` and
   `unlinked_fit_gap_items` lists. Route to human review before `EPMCSAPAI-252` (Blueprint)
   consumes it — a flow boundary is a scope decision, not this agent's to finalize alone.

## Returns

- `e2e-process-scope` artifact: one entry per E2E flow with its boundary (included L2/L3
  nodes) and any linked Fit/Gap dispositions.
- `unscoped_processes`: hierarchy leaves under an `UNCLASSIFIED` L1, not assigned to any flow.
- `unlinked_fit_gap_items`: fit-gap rows that couldn't be confidently matched to a hierarchy
  leaf.

## Refuse conditions

- No `business-process-hierarchy` artifact supplied: return
  `blocking missing input — no process hierarchy to build E2E flows from`.
- Supplied hierarchy has zero placed processes (only `unplaced_processes`): return the
  `unscoped_processes` list alone and flag `gaps` rather than refusing outright — the input
  may legitimately be all-gaps early in an engagement.

## Related

- `EPMCSAPAI-250` `business-process-hierarchy` — direct upstream dependency.
- `EPMCSAPAI-243`/`-247` fit-gap-analysis — optional upstream input; joined by name, not by a
  shared ID (see Procedure step 3).
- `EPMCSAPAI-252` Blueprint generation — downstream consumer, not yet built.
- E2E test scenarios (backlog `#15`) — downstream consumer, not yet built in this repo.

## Status

Progress. `agent.md` written; not yet dry-run tested against real `business-process-hierarchy`
or `fit-gap-analysis` output. The fit-gap join (step 3) is the weakest part of this design —
built on a name-match heuristic because the two upstream artifacts were built independently
with no shared ID scheme; flagged rather than hidden.
