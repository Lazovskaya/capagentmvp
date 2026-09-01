# objects-mapping

Bounded Explore-phase agent for `EPMCSAPAI-246`. It maps the source business objects from
`objects-list`'s (`EPMCSAPAI-242`) `migration-objects-list` inventory to their S/4HANA target
counterparts, at both object and field level, so downstream migration code development
(`EPMCSAPAI-256`) has concrete source→target mappings rather than a bare object inventory.

Does not decide conversion approach, write migration code, or execute a reconciliation run —
mapping and transformation notes only. Field-level suggestions are AI-assisted, not
auto-applied: every suggestion carries a confidence and rationale for human review, never a
silent auto-accept.

## Inputs

**Required:**
- `migration-objects-list` artifact from `objects-list` (`EPMCSAPAI-242`) — the in-scope object
  inventory (`object_type`, `object_name_or_prefix`, `volume_count`, `key_attributes`, `module`)
- Target data model / mapping references (S/4HANA target object and field definitions for the
  objects in scope)

**Optional, improves field-level suggestion quality:**
- Historical mapping data (prior engagements' accepted source→target field mappings)
- Business context sources (workshop notes, `fit-to-standard` decision-log rows) that bear on a
  specific object's mapping
- `knowledge/data/standard-mapping-rules.md` — the "Standard Mapping rules" knowledge base
  (governs default transformation rules for common object types; read it before proposing a
  mapping the rules already cover, and cite the rule id in `match_basis` rather than
  re-deriving it from scratch)

## Procedure

1. **Read the inventory.** Take every row from `migration-objects-list` that isn't `ZERO_VOLUME`
   or still `NEEDS_DECISION`/`NEEDS_RECONCILIATION` in objects-list's own output — an object
   whose scope isn't settled yet isn't ready to be mapped. Carry `object_type`,
   `object_name_or_prefix`, `volume_count`, and `key_attributes` forward as-is; do not
   re-derive them.
2. **Find the object-level target.** For each in-scope object type, identify its S/4HANA target
   object from the target data model. No candidate target exists → flag `UNMAPPED`, do not guess
   a nearest-match target.
3. **Propose field-level mappings.** For each field in `key_attributes` (and any additional
   fields the target data model requires), suggest a target field using, in order of preference:
   an applicable `knowledge/data/standard-mapping-rules.md` rule, then historical mapping data for
   the same object type, then business-context sources. Every suggestion gets a `confidence`
   (`high` / `medium` / `low`) and a `match_basis` string naming what the suggestion rests on
   (rule id, prior engagement reference, or the specific context source) — never a bare
   confidence with no stated reason.
4. **Document transformation rules.** For any field whose source and target shapes differ
   (type conversion, unit conversion, code-value remapping, concatenation/split), state the
   transformation rule in prose next to the mapping — don't leave it implied by the field names.
5. **Flag conflicts and dependencies.** Where two source fields map to the same target field, a
   target field has no clear source, or a mapping depends on another object's mapping being
   resolved first, set `status: REVIEW_REQUIRED` and name the specific conflict or dependency —
   not just "needs review."
6. **Write `object-field-mapping` artifact** with status `DRAFT`, versioned (increment when
   re-run against an updated inventory or target model). Every `UNMAPPED` and `REVIEW_REQUIRED`
   row routes to human review before `EPMCSAPAI-256` consumes it — do not resolve a conflict or
   pick a target for the reviewer.

## Returns

- `object-field-mapping` artifact: per object type, its object-level target and status
  (`MATCHED` / `UNMAPPED` / `REVIEW_REQUIRED`), and per field its target field, `confidence`,
  `match_basis`, and transformation notes.
- Conflict/dependency log: every `REVIEW_REQUIRED` row with the specific conflict or dependency
  named.

## Refuse conditions

- No `migration-objects-list` artifact supplied, or the supplied one has no rows past scope
  filtering (everything still `NEEDS_DECISION` or `ZERO_VOLUME`): return
  `blocking missing input — no in-scope object inventory`.
- No target data model / mapping reference supplied: return
  `blocking missing input — no target model to map against`.
- Target data model present but doesn't cover a given object type at all (not even a
  near-candidate): flag that object type `UNMAPPED` in the output rather than refusing the
  whole run — a partial mapping is still useful to the reviewer.

## Output schema compatibility

`object-field-mapping` rows follow the shape expected by:
- `EPMCSAPAI-256` Migration Code Development: consumes the object-level target, per-field
  mappings, and transformation notes.
- `EPMCSAPAI-271` AI Reconciliation Agent (not yet built): consumes the field-level mapping for
  field-by-field comparison during reconciliation.

Any change to the canonical row schema must be coordinated with both downstream agents. Reuses
`objects-list`'s `object_type` / `object_name_or_prefix` verbatim as the join key back to the
inventory — never re-key by a re-derived name.

## Related

- `EPMCSAPAI-242` Objects List Agent — direct upstream dependency; this agent cannot run until
  an object's scope is no longer `NEEDS_DECISION`/`NEEDS_RECONCILIATION` in that agent's output.
- `EPMCSAPAI-271` AI Reconciliation Agent — downstream consumer, not yet built.

## Status

Progress. `agent.md` written; not yet dry-run tested against a real target data model or
historical mapping data. `knowledge/data/standard-mapping-rules.md` referenced but not yet
written — this agent works without it (falls back to historical data / business context) but
loses the "cite the rule" shortcut until it exists.
