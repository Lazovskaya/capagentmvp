# source-conflict-analyst

Provenance and contradiction analysis across a scattered source pack (emails, decks, transcripts,
specs) — supports `solution-design`'s Mode B (compose/maintain, see
`../knowledge/standards/source-synthesis.md`) without stuffing every raw source into the main
skill's own context.

Ported (contract only in sap-ai-cons — this was a `TARGET STUB` there too) from `sap-ai-cons`'s
`source-conflict-analyst` agent, which supported `business-blueprint` the same way before that
method was folded into `solution-design`. The procedure below runs `source-synthesis.md`'s own
compose-mode steps 1-4, since sap-ai-cons's version had no procedure of its own.

## Reads

- The source pack (emails, decks, transcripts, specs) for the delta being designed

## Procedure

Runs `source-synthesis.md`'s registration and conflict-detection steps — stops before synthesis
itself, which stays `solution-design`'s job:

1. **Register every source**: id, type, title, date, author-or-named-body, reliability tag (signed
   spec/workshop decision = high; informal email = low). Not every real source has an individual
   author — a committee/role name is a valid entry, don't force one that doesn't exist.
2. **Check whether the pack covers more than one separable decision** before mapping statements to
   fields — if so, say so explicitly and group sources by which decision they inform; this agent
   does not decide how `solution-design` splits the pack into design-records, but it should never
   silently treat a multi-decision pack as one.
3. **Extract statements and map each to a design-record field** — `delta_summary`, `what_changes`,
   `where_it_lives`, `data_objects_touched`, `integration_points`, and `test_approach`. All six, not
   just the four "Target design" sub-fields — `test_approach` and `delta_summary` are frequently the
   ones no source addresses at all, and that has to be visible, not silently skipped because this
   agent's own mapping never looked there.
4. **Detect conflicts**: where two or more sources make claims about the same field(s) that
   disagree, record both sides with their source ids and dates, and **every field the conflict
   affects** (a scope-level conflict, e.g. rollout timing, can span several fields at once — list
   them together under one conflict entry, don't fragment it into duplicate entries) — never pick a
   side.
5. **Propose a resolution** per conflict using authority/recency (formal > informal, newer > older
   for the same topic, flag when the two disagree with each other) — a proposal for the consultant
   to confirm, not a decision this agent makes.
6. **Flag signed-artefact supersession risk**: if an informal or governance source contradicts a
   signed spec, note that this may need a scope amendment/CR rather than a simple supersession.

## Returns

Shape matches `artifacts/design-record/schema.json`'s `source_synthesis` object directly:

- `source_register`: id, type, title, date, author (person or named body), reliability — one row
  per source
- `conflicts`: per conflict, `fields` (array — every field it affects, not just one), `sides` (with
  source ids), `proposed_resolution`, and `signed_spec_supersession_risk` (boolean)
- `uncovered_fields`: every one of the six design-record fields above that no source addressed —
  the raw material for `TBC` marks, not something this agent fills in on its own

## Human-in-the-loop

This agent drafts, it does not decide. `solution-design` (and ultimately the consultant) confirms
every proposed conflict resolution before it's written as the record's stated value — an unconfirmed
proposal must stay `TBC — ⚠ see Conflict` in the design-record, per the open-conflict rule.

## Status

Progress. Procedure derived from `source-synthesis.md`'s compose-mode steps; not yet wired as a
standalone bounded agent or dry-run tested.
