# strategies-generation

Bounded Explore-phase orchestrator for `EPMCSAPAI-251`. Generates the **non-technical /
delivery** project strategy documents — **Cutover, Training, Testing, and Convention** —
deciding each from project scope and context rather than from SAP standard content. Does
**not** cover technical architecture strategies (Integration, Extensibility, Security, Data,
Landscape, Release & Transport, Output/UX, Operations, Infrastructure, Toolchain) — those
belong to the separate SAD / Technical Architecture track (`EPMCSAPAI-275`…`-290`), composed
by the SAD Assembly agent (`EPMCSAPAI-290`).

## Inputs

**Optional (at least one expected, but never required as a hard gate):**
- `fit-gap-analysis` artifact — scope and disposition context a strategy's decisions can cite.
- `object-field-mapping` artifact — migration-object context relevant to Cutover/Testing.
- Any other project-scope or landscape context supplied directly.

## Procedure

1. **Take the in-scope delivery-strategy areas** — Cutover, Training, Testing, Convention.
   Skip an area only if the project explicitly excludes it; state the exclusion, don't just
   drop it silently.
2. **For each area, decide from actual project scope and context**, not from a generic
   template filled with placeholder prose. Every decision row states its own rationale citing
   the scope/context input it came from (a `fit-gap-analysis` row, an `object-field-mapping`
   entry, or explicitly "no grounding input — team judgment call").
3. **Note cross-strategy dependencies explicitly** — the two the ticket itself calls out are
   Cutover <-> Testing (a cutover rehearsal needs test coverage to have run; test data cleanup
   affects cutover data steps), but do not force a link where none actually exists.
4. **Convention strategy may overlap with EPMCSAPAI-289's Toolchain & Standards agent** (not
   yet built as of this agent's own writing) — where a Convention decision is really a
   toolchain/standards decision, say so in that row's rationale rather than silently deciding
   it twice once both agents exist.
5. **Write one `delivery-strategy` artifact instance per area**, `status: DRAFT`. Route to
   human review before the strategy is treated as agreed — none of these are self-approving.

## Returns

- One `delivery-strategy` artifact per in-scope area (Cutover / Training / Testing /
  Convention), each with cited decisions and any cross-strategy dependency notes.
- `EXCLUDED_AREAS` list: any of the four areas the project explicitly excluded, with why.
- `UNGROUNDED_DECISIONS` list: decisions made with no fit-gap/object-mapping/other-context
  grounding — flagged, not hidden, so a reviewer knows which rows are team judgment calls.

## Refuse conditions

- No project scope or context of any kind is available (no fit-gap, no object mapping, no
  other context, no ticket/scope description): return
  `blocking missing input — no project scope to ground strategy decisions in`. Do not invent
  a strategy from nothing.

## Related

- `EPMCSAPAI-243`/`-247` fit-gap-analysis — optional upstream context.
- `EPMCSAPAI-*` object-field-mapping (migration object scoping & mapping) — optional upstream
  context.
- `EPMCSAPAI-265` Cutover dependency-check agent — downstream consumer of this agent's Cutover
  strategy output.
- `EPMCSAPAI-275`…`-290` SAD / Technical Architecture track — sibling track covering the
  technical strategies this agent explicitly excludes; composed by `EPMCSAPAI-290` SAD
  Assembly.
- `EPMCSAPAI-289` Toolchain & Standards agent (not yet built) — likely future reconciliation
  point for Convention strategy, per step 4.

## Status

Progress. `agent.md` written; not yet dry-run tested against real fit-gap/object-mapping
output.
