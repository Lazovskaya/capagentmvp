---
name: technical-documentation-generation
description: Atomic skill that generates technical documentation for already-developed code — purpose, inputs/outputs, key logic, and traceability back to the mapping/spec it implements. Invoked by code-development (EPMCSAPAI-254) and migration-code-development (EPMCSAPAI-256); never runs standalone against arbitrary code with no traceable source.
---

# Technical Documentation Generation

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Realize phase, whenever an invoking agent has just generated a code artifact and needs
review-ready technical documentation for it. This is a *called* skill, not one a user runs
directly against arbitrary code — `code-development` (`EPMCSAPAI-254`) and
`migration-code-development` (`EPMCSAPAI-256`) invoke it per generated artifact.

Reuses the functional-specification knowledge already in this factory's `artifacts/wricef-*`
templates (`wricef-conversion`, `wricef-report`, and siblings — added from real client FS Word
templates) for its Data Mapping, Error Handling, and Selection Screen Requirements section shapes
where a generated artifact has an equivalent. Those WRICEF templates document a *planned* build
before it exists; this skill documents *already-generated* code after the fact — same
vocabulary, different point in the lifecycle, so don't just point the caller at a WRICEF artifact
and call it done.

## Inputs (contract)

Ask for anything missing before running — do not document code with no traceable source.
- **Required:** the generated code artifact (or a reference to it) to document.
- **Required:** the spec/mapping reference(s) it implements — e.g. `migration-code-development`
  passes its traced `object-field-mapping` row IDs; `code-development` passes its own
  design-record or WRICEF functional-spec reference. Cite these IDs verbatim in the output, don't
  re-describe them in prose (pattern 1 — stable, copyable IDs).
- **Optional:** an existing WRICEF functional-spec artifact for the same object, when the code
  originated from a planned WRICEF build — reuse its Data Mapping / Error Handling / Selection
  Screen Requirements sections as the baseline rather than re-deriving them from the code.

## Steps

1. **Refuse an untraceable request.** No spec/mapping reference supplied → return
   `blocking missing input — no traceable source for this code` rather than documenting code
   with an invented purpose.
2. **State the purpose** in one or two sentences, grounded in the cited spec/mapping reference —
   not inferred from variable names alone.
3. **Document inputs/outputs** as the code actually implements them (parameters, source/target
   fields for a mapping-driven artifact, file/table inputs) — cross-check against the cited
   mapping reference and flag any place the code diverges from what the mapping specified,
   rather than silently documenting the code's behavior as if it were the intended one.
4. **Document key logic**, reusing the WRICEF template's Data Mapping / Error Handling /
   Selection Screen Requirements section shapes where the artifact has an equivalent (e.g. a
   generated conversion program's field mapping table mirrors `wricef-conversion`'s Data Mapping
   section); for logic with no WRICEF equivalent, describe it in prose against the spec.
5. **Flag anything not directly traceable to the cited spec/mapping** — a `NEEDS_MAPPING_CONFIRMATION`
   field from the caller (e.g. `migration-code-development`'s low-confidence mappings) gets an
   explicit "unverified" note in the documentation, not silent inheritance of the caller's
   confidence level as if it were fact-checked here.
6. **Write the `technical-documentation` artifact** — see
   `../../artifacts/technical-documentation/template.md`.

## Output

- **`technical-documentation` artifact**
  (`../../artifacts/technical-documentation/template.md`): purpose, inputs/outputs, key logic,
  and the cited spec/mapping reference IDs verbatim — consumable directly by the invoking agent,
  not a separate document it has to re-attach traceability to.
- If step 1 refuses, return the refusal to the caller rather than a partial document — the
  invoking agent's own refuse conditions already cover "documentation unavailable, generate the
  code anyway" (see `agents/migration-code-development/agent.md`'s Refuse conditions).

## Judgment calls worth stating out loud

- **A generated artifact with no cited spec/mapping isn't a documentation gap to paper over** —
  it's a sign the artifact shouldn't have been generated without traceability in the first place.
  Refuse, don't guess at a purpose.
- **Reusing a WRICEF section shape isn't the same as reusing its content.** The WRICEF templates
  document a *planned* build; this skill documents what the code *actually does* — cite the
  WRICEF spec if one exists, but verify the generated code still matches it rather than copying
  the spec's prose forward unchecked.

## Driver

Main driver: technical/functional split depends on the invoking agent's own driver
(`code-development`/`migration-code-development`). This skill itself has no owning role beyond
the agents that call it — see `docs/skill-design-conventions.md` pattern 3 if a future version
needs to distinguish a documentation reviewer role from the code author.

## Status

Progress. Contract and steps written, reusing WRICEF functional-spec section shapes as prior art
per the user's note that this factory already has functional-spec knowledge; not yet dry-run
tested against a real generated artifact from either invoking agent. `code-development`
(`EPMCSAPAI-254`) itself doesn't exist yet in this repo, so only `migration-code-development`'s
invocation contract (already committed) is concretely verified against.
