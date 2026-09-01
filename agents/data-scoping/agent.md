# data-scoping

Bounded Explore-phase agent for `EPMCSAPAI-268`. It complements `objects-list` (`EPMCSAPAI-242`):
that agent scopes *object types and counts*, this agent scopes *records within those object
types* — applying rule-based cut-offs (date, company-code/org unit, historical retention) from a
scoping-rules knowledge base to decide which individual records actually get migrated.

Does not decide object-level scope (that's `objects-list`'s job) or perform the migration
itself — record-level in/out-of-scope decisions and volume reporting only.

## Inputs

**Required:**
- `migration-objects-list` artifact from `objects-list` (`EPMCSAPAI-242`) — the in-scope object
  types this agent scopes records within. Skip any row still `NEEDS_DECISION` or
  `NEEDS_RECONCILIATION` upstream; its object-level scope isn't settled yet.
- Source data (SAP HANA / ECC direct read, or Excel table / SQL dump) covering the records for
  each in-scope object type.

**Required, or explicitly absent per object type:**
- Scoping rules from `knowledge/data/scoping-rules.md` (the "Rules for scoping" knowledge base)
  — date cut-offs, company-code/org-unit inclusion, historical retention thresholds. An object
  type with no applicable rule is handled per step 3, not treated as blocking.

## Procedure

1. **Read the in-scope object types.** Take every `migration-objects-list` row that isn't
   `ZERO_VOLUME`, `NEEDS_DECISION`, or `NEEDS_RECONCILIATION` — reuse its `object_type` and
   `object_name_or_prefix` verbatim as the join key back to the inventory.
2. **Apply every scoping rule that names this object type.** For each source record, evaluate
   the rule (date cut-off, company-code/org-unit filter, retention threshold) and mark it
   `IN_SCOPE` or `OUT_OF_SCOPE`. Record the specific `rule_id` that produced the decision — never
   leave a decision unattributed to a rule.
3. **Object type with no applicable rule.** Default to `IN_SCOPE` for every record (the safer
   default — excluding data nobody decided to exclude is the more expensive mistake), but flag
   the object type `NO_RULE_APPLIED` for review. Do not silently apply a rule from a similar
   object type — that's a guess, not a rule match.
4. **Count volumes.** Report pre-scoping (source) and post-scoping (in-scope) record counts per
   object type, plus the count excluded per rule — a reviewer challenging one rule needs to see
   its specific impact, not just the object type's net total.
5. **Handle conflicting rules.** If two rules produce different verdicts for the same record
   (e.g. a date cut-off says include, a retention rule says exclude), flag that record
   `RULE_CONFLICT` with both rule ids named — do not pick a winner between them.
6. **Write `record-scoping-decision` artifact** with status `DRAFT`, versioned. Every
   `NO_RULE_APPLIED` object type and every `RULE_CONFLICT` record routes to human review — do not
   resolve the gap or the conflict for the reviewer.

## Returns

- `record-scoping-decision` artifact: per object type, pre-/post-scoping volume counts, the
  per-rule exclusion breakdown, and any `NO_RULE_APPLIED` flag.
- Rule-conflict log: every `RULE_CONFLICT` record with both applicable rule ids and their
  individual verdicts.

## Refuse conditions

- No `migration-objects-list` artifact supplied, or none of its rows are past scope filtering:
  return `blocking missing input — no in-scope object inventory`.
- No source data for a given in-scope object type: flag that object type
  `blocking missing input — no source data` in the output rather than refusing the whole run —
  other object types with data available should still be scoped.
- No scoping-rules knowledge base available at all (not even a partial one): proceed per step 3
  (default `IN_SCOPE`, flag `NO_RULE_APPLIED`) for every object type rather than refusing — an
  unscoped-but-reported dataset is more useful to the reviewer than nothing.

## Output schema compatibility

`record-scoping-decision` is a record-level companion to `migration-objects-list`, keyed by the
same `object_type` / `object_name_or_prefix`. Any migration execution or load step consuming
scoped records should filter by this artifact's `IN_SCOPE` verdicts, not re-derive scope from the
source data directly.

## Related

- `EPMCSAPAI-242` Objects List Agent — upstream, object-level scope; this agent narrows to
  records within that scope. Distinct but complementary steps, not a dependency chain where one
  blocks the other's design (this agent still needs its output to run, though).

## Status

Progress. `agent.md` written; not yet dry-run tested against real source data or a real scoping-
rules knowledge base. `knowledge/data/scoping-rules.md` referenced but not yet written — this
agent works without it (step 3's `NO_RULE_APPLIED` default) but every object type stays flagged
for review until real rules exist.
