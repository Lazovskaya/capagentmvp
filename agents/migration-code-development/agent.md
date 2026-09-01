# migration-code-development

Bounded Realize-phase agent for `EPMCSAPAI-256`. It develops data migration/transformation code
from the source→target mapping produced by `objects-mapping` (`EPMCSAPAI-246`), deciding
transformation logic per field mapping and invoking a technical-documentation-generation step for
each generated artifact.

Does not decide the object/field mapping itself (that's `objects-mapping`'s job) or execute code
against a live system — code generation and traceable documentation only. Every generated
mutation is a reviewable draft; this agent never writes to a live target system on its own.

## Inputs

**Required:**
- `object-field-mapping` artifact from `objects-mapping` (`EPMCSAPAI-246`) — per object type, its
  `target_object` and `status` (only `MATCHED` rows are ready for code generation; `UNMAPPED` and
  `REVIEW_REQUIRED` rows are not), and per field its `target_field`, `confidence`,
  `match_basis`, and transformation notes.
- `migration-objects-list` artifact from `objects-list` (`EPMCSAPAI-242`) — for volume context
  (e.g. batch-sizing the generated load logic to the object's actual `volume_count`).

**Optional:**
- `record-scoping-decision` artifact from `data-scoping` (`EPMCSAPAI-268`), when it exists — scope
  the generated code to `IN_SCOPE` records only rather than the full object-level volume.

## Procedure

1. **Filter to ready mappings.** Only generate code for `object-field-mapping` rows with
   `status: MATCHED`. Skip `UNMAPPED`/`REVIEW_REQUIRED` rows entirely — generating code against an
   unresolved mapping bakes an unreviewed guess into a deliverable.
2. **Translate each field's transformation notes into transformation logic.** Where the mapping
   already documents a transformation rule (type/unit conversion, code-value remapping,
   concatenation/split), implement exactly that rule — do not invent a different one because it
   seems simpler. Where a field mapping carries `confidence: low`, flag the generated logic for
   that field as `NEEDS_MAPPING_CONFIRMATION` rather than shipping it as if it were `high`
   confidence.
3. **Scope the generated load logic to available volume/scope context.** Use
   `migration-objects-list`'s `volume_count` for batch sizing; if a `record-scoping-decision`
   artifact is available, filter to its `IN_SCOPE` records instead of the object's full volume.
4. **Trace every generated artifact back to its mapping.** Each generated code artifact records
   the specific `object_type` + field mappings it implements — a reviewer must be able to find the
   exact `object-field-mapping` row that justifies any line of generated logic.
5. **Invoke technical-documentation-generation** (`EPMCSAPAI-255`, not yet built in this repo) for
   each generated code artifact — pass it the traced mapping references so the documentation
   itself carries the same traceability, not a re-derived description.
6. **Write `migration-code-package` artifact** with status `DRAFT`, versioned. This is a reviewable
   draft, never a live write: per pattern 6 in `docs/skill-design-conventions.md` (MCP mutations
   are dry-run unless `--apply`), generated code and any target-system write it implies stays
   local-artifact-only until a human explicitly approves promoting it — this agent has no
   `--apply` path of its own to skip that.

## Returns

- `migration-code-package` artifact: per object type, the generated transformation code, its
  traced `object-field-mapping` references, batch-sizing basis (object volume or scoped
  in-scope count), and any `NEEDS_MAPPING_CONFIRMATION` flags.
- Documentation handoff record: which `EPMCSAPAI-255` invocation (once it exists) was made for
  each generated artifact, and what it was passed.

## Refuse conditions

- No `object-field-mapping` artifact supplied, or none of its rows are `MATCHED`: return
  `blocking missing input — no ready-to-implement mapping`.
- No `migration-objects-list` artifact supplied (needed for volume/batch-sizing context): return
  `blocking missing input — no volume context for batch sizing`.
- Technical-documentation-generation is unavailable: generate the code artifact anyway and say so
  explicitly (per this factory's own convention: "if a skill identifies a decision-worthy finding
  and this skill isn't available, say so explicitly rather than letting it go untracked") — don't
  block code generation on a documentation step that doesn't exist yet.

## Output schema compatibility

`migration-code-package` rows key by the same `object_type` / `object_name_or_prefix` that
`objects-list` and `objects-mapping` already use — never re-keyed. Any downstream execution/load
step consuming this artifact should treat its `NEEDS_MAPPING_CONFIRMATION` flags the same way
`objects-mapping`'s `REVIEW_REQUIRED` is treated: not ready to run until a human clears it.

## Related

- `EPMCSAPAI-246` Objects Mapping Agent — direct upstream dependency; this agent cannot generate
  code for a mapping still `UNMAPPED`/`REVIEW_REQUIRED`.
- `EPMCSAPAI-242` Objects List Agent — upstream, provides volume context.
- `EPMCSAPAI-268` Data Scoping Agent — optional upstream, narrows generated-code scope to
  in-scope records when available.
- `EPMCSAPAI-255` Technical Documentation Generation — invoked skill, not yet built in this repo.

## Status

Progress. `agent.md` written; not yet dry-run tested against a real target mapping or a real
`EPMCSAPAI-255` implementation (which doesn't exist yet — step 5 and the "Technical
documentation generation is unavailable" refuse condition are the placeholder for that gap).
T1 (CloudLLM Hub MCP) and T2 (SAP transport/object dependency query) connectors referenced in the
ticket also don't exist yet in `connectors/` — this agent's procedure doesn't assume a specific
connector shape, so it isn't blocked on them, but real tool wiring is still TBD.
