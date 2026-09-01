---
agent: migration-code-development
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [object_type, target_object, generated_artifact_ref, mapping_ref, confirmation_flag]
human-confirms: true

assistant: [TBD]
---

## Notes
Third link in the object-migration chain after [[objects-list]] (`EPMCSAPAI-242`) and
[[objects-mapping]] (`EPMCSAPAI-246`): only generates code for `object-field-mapping` rows
already `MATCHED`, reusing `object_type`/`object_name_or_prefix` verbatim as the join key rather
than re-deriving it — same stable-ID discipline as its two upstream agents, per pattern 1 in
`docs/skill-design-conventions.md`. A field mapping with `confidence: low` still gets code
generated, but flagged `NEEDS_MAPPING_CONFIRMATION` rather than shipped as if fully trusted — the
same "don't silently upgrade a weak signal" posture `objects-mapping` applies to its own
`REVIEW_REQUIRED` rows. `human-confirms: true` is grounded in the agent's own invocation of
pattern 6 (MCP mutations are dry-run unless `--apply`) under `## Procedure` step 6 — generated
code is always a local `DRAFT` artifact, never a live write, until a human explicitly promotes
it. Invokes technical-documentation-generation (`EPMCSAPAI-255`) per generated artifact, but that
skill doesn't exist in this repo yet — this agent degrades to generating the code artifact alone
and saying so explicitly, per this factory's own "say so explicitly rather than letting the
decision go untracked" convention (see `agents/sap-adr-log`-style skill-unavailable handling in
the broader factory, though this repo's own equivalent is `## Refuse conditions`).

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | object-field-mapping | consumes | from [[objects-mapping]] (`EPMCSAPAI-246`); only `MATCHED` rows |
| artifact | migration-objects-list | consumes | from [[objects-list]] (`EPMCSAPAI-242`); volume/batch-sizing context |
| artifact | record-scoping-decision | consumes | from `data-scoping` (`EPMCSAPAI-268`), optional; narrows generated code to `IN_SCOPE` records |
| skill | EPMCSAPAI-255 Technical Documentation Generation | invokes | not yet built in this repo; degrades gracefully when unavailable |
| artifact | migration-code-package | produces | canonical, versioned generated-code deliverable — `DRAFT` until human review/`--apply` |
| connector | T1 CloudLLM Hub MCP | consumes | referenced in ticket, not yet defined under `connectors/` |
| connector | T2 SAP transport/object dependency query | consumes | referenced in ticket, not yet defined under `connectors/` |
