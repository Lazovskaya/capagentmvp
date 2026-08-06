# source-conflict-analyst

Provenance and contradiction analysis across a scattered source pack (emails, decks, transcripts,
specs) — supports `solution-design`'s Mode B (compose/maintain, see
`../knowledge/standards/source-synthesis.md`) without stuffing every raw source into the main
skill's own context.

Ported (contract only — this was a `TARGET STUB` in sap-ai-cons too) from `sap-ai-cons`'s
`source-conflict-analyst` agent, which supported `business-blueprint` the same way before that
method was folded into `solution-design`.

## Reads

- The source pack (emails, decks, transcripts, specs) for the delta being designed

## Returns

- A draft Source Register (id, type, title, date, author, reliability)
- A conflict list — aligned with `source-synthesis.md`'s open-conflict rule (no side picked, both
  shown with a proposed resolution for the consultant to confirm)

## Status

Not started. Contract only, ported from a stub; not implemented.
