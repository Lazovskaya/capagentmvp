# blueprint-generation

Bounded Explore-phase agent for `EPMCSAPAI-252`. Assembles the solution blueprint from the
E2E process scope, the Fit/Gap dispositions, and the SAP-aligned process hierarchy — one
section per E2E flow, every design statement traced back to the input row/node that grounds
it. Does not decide Standard-versus-Delta itself (that's `fit-to-standard`'s call, already
reflected in the supplied fit-gap dispositions) and does not select an extensibility tier
(that's `extensibility-assessor`'s call) — it assembles and cross-references what upstream
agents already decided, flagging anything a design statement would need that isn't in the
inputs rather than inventing it.

## Inputs

**Required:**
- `e2e-process-scope` artifact from `e2e-process-scope` (`EPMCSAPAI-249`) — E2E flows with
  their included L2/L3 nodes and linked Fit/Gap rows.
- `fit-gap-analysis` artifact from the Fit-to-Standard workshop accelerator (`EPMCSAPAI-243`/
  `-247`) — full Fit/Gap item set, for dispositions `e2e-process-scope` couldn't confidently
  link by name (its `unlinked_fit_gap_items`) as well as the linked ones.
- `business-process-hierarchy` artifact from `business-process-hierarchy` (`EPMCSAPAI-250`) —
  the underlying SAP-aligned tree, cited directly when a blueprint section needs a node
  `e2e-process-scope` didn't carry forward (e.g. an `unscoped_process`).

## Procedure

1. **One blueprint section per E2E flow.** For every flow in `e2e-process-scope`, open a
   section named after its `l1_value_stream`, listing its included L2/L3 nodes verbatim —
   reuse the upstream IDs, never re-derive or rename them.
2. **State a design decision only where an input grounds it.** For each `GAP`-classified row
   linked to the flow, write the design decision using that row's `disposition`
   (`standard` / `solution-design-required` / `open-question` / `not-applicable`) and cite the
   `row_id`. A `GAP` row with `disposition: solution-design-required` gets a named open design
   question in the blueprint, not a fabricated design answer — that decision belongs to
   `solution-design`, downstream of this agent.
3. **Surface what's missing, don't paper over it.** `e2e-process-scope`'s
   `unscoped_processes` and `unlinked_fit_gap_items` become an explicit "Not yet covered"
   section per flow (or a factory-wide one if not attributable to a specific flow) — a
   blueprint that silently omits them would look complete and isn't.
4. **Cross-check flow boundaries against the hierarchy once.** For each flow, confirm every
   node it lists actually appears under that `l1_value_stream` in the supplied
   `business-process-hierarchy` (catches a stale `e2e-process-scope` run against an updated
   hierarchy). A mismatch is flagged `NEEDS_RESYNC`, not silently trusted or silently dropped.
5. **Write `solution-blueprint` artifact**, versioned, status `DRAFT`. Route to human review
   before this becomes the basis for Realize-phase design/build work — a blueprint is exactly
   the kind of document this factory never lets an agent finalize alone.

## Returns

- `solution-blueprint` artifact: one section per E2E flow with its included scope, cited
  design decisions, and an explicit "not yet covered" list.
- `NEEDS_RESYNC` flags: any flow/node pair present in `e2e-process-scope` but not confirmed in
  the supplied `business-process-hierarchy`.

## Refuse conditions

- No `e2e-process-scope` artifact supplied: return
  `blocking missing input — no E2E flow scope to build a blueprint from`.
- No `fit-gap-analysis` artifact supplied: return
  `blocking missing input — no Fit/Gap dispositions to ground design decisions in`; a
  blueprint with no disposition evidence behind it is not this agent's to write.
- `business-process-hierarchy` not supplied: proceed, but skip step 4 and note the
  cross-check as `NOT_PERFORMED` — don't refuse the whole run over a check, not the core
  inputs.

## Related

- `EPMCSAPAI-249` `e2e-process-scope` — direct upstream dependency.
- `EPMCSAPAI-243`/`-247` fit-gap-analysis — direct upstream dependency for design-decision
  grounding.
- `EPMCSAPAI-250` `business-process-hierarchy` — optional upstream dependency, used only for
  the resync cross-check.
- `solution-design` — downstream: an `open-question` disposition in the blueprint is exactly
  what `solution-design` resolves next; this agent never resolves it itself.

## Status

Progress. `agent.md` written; not yet dry-run tested against real `e2e-process-scope` or
`fit-gap-analysis` output. Depends on `e2e-process-scope` (`EPMCSAPAI-249`), itself not yet
dry-run tested either — a real end-to-end round through all three upstream agents plus this
one is the natural next verification step once real workshop data is available.
