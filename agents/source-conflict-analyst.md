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

1. **Register every source**: id, type, title, date, author, reliability tag (signed spec/workshop
   decision = high; informal email = low).
2. **Extract statements and map each to a design-record field** (what changes / where it lives /
   data-objects touched / integration points) it would inform.
3. **Detect conflicts**: where two or more sources make claims about the same field that disagree,
   record both sides with their source ids and dates — never pick a side.
4. **Propose a resolution** per conflict using authority/recency (formal > informal, newer > older
   for the same topic, flag when the two disagree with each other) — a proposal for the consultant
   to confirm, not a decision this agent makes.
5. **Flag signed-artefact supersession risk**: if an informal or governance source contradicts a
   signed spec, note that this may need a scope amendment/CR rather than a simple supersession.

## Returns

- `source_register`: id, type, title, date, author, reliability — one row per source
- `conflicts`: per conflicting field, the sides (with source ids), a proposed resolution, and
  whether it's flagged as a possible signed-spec-supersession case
- `uncovered_fields`: design-record fields no source addressed — the raw material for `TBC` marks,
  not something this agent fills in on its own

## Human-in-the-loop

This agent drafts, it does not decide. `solution-design` (and ultimately the consultant) confirms
every proposed conflict resolution before it's written as the record's stated value — an unconfirmed
proposal must stay `TBC — ⚠ see Conflict` in the design-record, per the open-conflict rule.

## Status

Progress. Procedure derived from `source-synthesis.md`'s compose-mode steps; not yet wired as a
standalone bounded agent or dry-run tested.
