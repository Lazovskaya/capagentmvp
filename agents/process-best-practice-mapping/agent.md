# process-best-practice-mapping

Bounded Discover-phase agent for `EPMCSAPAI-241` (greenfield scenario). Maps a supplied list of
business processes to SAP Best Practices scope items from `knowledge/domain-packs/sap-best-practices/`,
proposing the best-fit standard process per input process to accelerate the move toward standard
adoption.

Does not decide Standard-versus-Delta (that's `fit-to-standard`'s call) and does not write or modify
the domain-pack itself — read-only consumer of the scope-item taxonomy. A process with no defensible
match is flagged as a gap, never forced onto a nearest candidate.

## Inputs

**Required:**
- Business process list (JSON), same minimal shape `fiori-app-mapping` uses:
  ```json
  {
    "processes": [
      {"process_id": "PROC-OTC-001", "name": "Sell from stock", "keywords": ["sales order", "delivery", "billing"]}
    ]
  }
  ```
- `knowledge/domain-packs/sap-best-practices/scope-items/*.json` — 732 scope items, each with
  `scope_item_id`, `title`, `hierarchy` (`L1_value_stream`, `L2_core_process`, `L3_scope_item`,
  `L4_steps`), and a `note` documenting how that item's hierarchy was sourced.

**Optional, improves match quality:**
- Target release / industry scope restriction, to narrow the candidate scope-item set before matching.

## Procedure

1. **Load the scope-item catalog.** Read every file under
   `knowledge/domain-packs/sap-best-practices/scope-items/`. Note which items carry a `null`
   `L1_value_stream` (per the domain pack's own README, this is a known partial gap, not
   universal — verify against the current file set rather than assuming a fixed count).
2. **Match each input process.** Compare `name`/`keywords` against each scope item's `title`,
   `L2_core_process`, and `L4_steps[].name`. A process may match more than one scope item
   (1:many, per acceptance criteria) — keep every defensible candidate, not just the top one.
3. **Score confidence and cite the basis.** For each candidate match, set `confidence`
   (`high`/`medium`/`low`) and a `match_basis` string naming exactly what the match rests on
   (e.g. "title exact match", "L2_core_process + 2 keyword hits in L4 steps") — never a bare
   confidence with no stated reason, matching the pairing `objects-mapping` and
   `fiori-app-mapping` already use.
4. **Flag the L1 gap where it applies.** If the best-matching scope item has `L1_value_stream:
   null`, still report the match but add a note that the value-stream classification is missing
   upstream in the domain pack — do not infer or invent an L1 value to fill the gap.
5. **Flag true gaps.** A process with no scope item clearing a minimum relevance bar (title nor
   L2 nor L4 step names share any defensible overlap) is `UNMAPPED`, not force-matched to the
   nearest available item.
6. **Write `process-best-practice-mapping` artifact.** One row per input process: its status
   (`MATCHED`/`UNMAPPED`/`REVIEW_REQUIRED`), every candidate scope item with confidence and
   match_basis, and the L1-gap note where relevant. Human review before this feeds any Standard
   adoption decision.

## Returns

- `process-best-practice-mapping` artifact: 1:many mapping from input business processes to
  SAP Best Practices scope items, with per-match confidence, match_basis, and explicit gaps.
- Gap list: input processes with no defensible scope-item candidate.

## Refuse conditions

- No business process list supplied: return `blocking missing input — no business processes to map`.
- `knowledge/domain-packs/sap-best-practices/scope-items/` missing or empty: return
  `blocking missing input — no best-practices reference content available`.
- Reference content present but a given process's keywords/name share no overlap with any scope
  item: flag that process `UNMAPPED` rather than refusing the whole run.

## Related

- `EPMCSAPAI-197` — originated the `sap-best-practices` domain pack this agent consumes.
- `fit-to-standard` — downstream: this agent's `MATCHED` rows are candidate standard processes,
  not a Standard/Delta decision.
- `fiori-app-mapping` — sibling Explore-phase skill using the same process-list input shape and
  confidence/match_basis pairing, against a different reference source (Fiori Apps Library export
  vs. this agent's SAP Best Practices domain pack).

## Status

Progress. `agent.md` written; not yet dry-run tested against a real business process list. Consumes
`knowledge/domain-packs/sap-best-practices/` as-is, including its documented partial L1 gap — see
Procedure step 1 and 4.
