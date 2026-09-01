---
agent: objects-mapping
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [object_type, target_object, field_mappings, status, confidence, match_basis]
human-confirms: true

assistant: [TBD]
---

## Notes
Direct downstream consumer of `objects-list` (`EPMCSAPAI-242`): only maps objects whose scope is
no longer `NEEDS_DECISION`/`NEEDS_RECONCILIATION` in that agent's `migration-objects-list`
output, and reuses its `object_type`/`object_name_or_prefix` verbatim as the join key rather than
re-keying by a re-derived name — see [[objects-list]] and pattern 1 in
`docs/skill-design-conventions.md` (stable, copyable IDs). Field-level mapping suggestions are
AI-assisted, never auto-applied: every suggestion carries a `confidence` (`high`/`medium`/`low`)
paired with a `match_basis` rationale string, reusing the same pairing `defect-classifier` and
`artifacts/process-app-mapping/schema.json` already use elsewhere in this factory rather than
inventing a new confidence vocabulary. `human-confirms: true` is grounded in the agent's own
"do not resolve a conflict or pick a target for the reviewer" statement under `## Procedure`
step 6 — every `UNMAPPED`/`REVIEW_REQUIRED` row is routed to human review, and the `DRAFT`-status
output as a whole is meant to be human-reviewed before `EPMCSAPAI-256` consumes it.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | migration-objects-list | consumes | from [[objects-list]] (`EPMCSAPAI-242`); only rows past scope filtering |
| knowledge | data | consumes | `standard-mapping-rules.md` (not yet written) — default transformation rules for common object types, cited by id in `match_basis` when applicable |
| artifact | object-field-mapping | produces | canonical, versioned source→target mapping — `DRAFT` until human review |
| agent | EPMCSAPAI-256 Migration Code Development | feeds | consumes object-level target, field mappings, transformation notes |
| agent | EPMCSAPAI-271 AI Reconciliation Agent | feeds | consumes field-level mapping for field-by-field comparison — not yet built in this repo |
