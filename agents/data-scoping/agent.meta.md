---
agent: data-scoping
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [object_type, object_name_or_prefix, in_scope_count, out_of_scope_count, rule_id, status_flag]
human-confirms: true

assistant: [TBD]
---

## Notes
Record-level companion to [[objects-list]] (`EPMCSAPAI-242`): that agent scopes object types and
counts, this agent scopes the individual records within those types, reusing
`object_type`/`object_name_or_prefix` verbatim as the join key rather than re-keying — same
stable-ID discipline as [[objects-mapping]], per pattern 1 in `docs/skill-design-conventions.md`.
Every in/out-of-scope decision is attributed to a specific `rule_id` from the "Rules for scoping"
knowledge base (not yet written — see Dependency graph); an object type with no applicable rule
defaults to `IN_SCOPE` (the safer default) but is flagged `NO_RULE_APPLIED` rather than silently
passed through. `human-confirms: true` is grounded in the agent's own "does not resolve the gap
or the conflict for the reviewer" statement under `## Procedure` step 6 — every
`NO_RULE_APPLIED` object type and `RULE_CONFLICT` record routes to human review before the
`DRAFT` output is used.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | migration-objects-list | consumes | from [[objects-list]] (`EPMCSAPAI-242`); only rows past scope filtering |
| knowledge | data | consumes | `scoping-rules.md` (not yet written) — date/company-code/org cut-offs, retention thresholds |
| artifact | record-scoping-decision | produces | canonical, versioned in/out-of-scope record set — `DRAFT` until human review |
| agent | objects-list | related | complementary, not blocking: object-level scope vs. record-level scope within it |
