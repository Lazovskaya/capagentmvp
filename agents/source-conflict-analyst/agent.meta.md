---
agent: source-conflict-analyst
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [source_register, conflicts, uncovered_fields]
human-confirms: true

assistant: [TBD]
---

## Notes
Provenance and contradiction analysis across a scattered source pack
(emails, decks, transcripts, specs), supporting `solution-design`'s Mode B
(compose/maintain) without stuffing every raw source into the main skill's
own context. Drafts, never decides — every proposed conflict resolution
needs `solution-design`/the consultant's confirmation before it is written
as the record's stated value; an unconfirmed proposal stays
`TBC — ⚠ see Conflict` per the open-conflict rule in
`knowledge/standards/source-synthesis.md`. Ported (contract only) from
sap-ai-cons's `source-conflict-analyst`, itself an unbuilt `TARGET STUB`
there.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| knowledge | standards | requires | runs `source-synthesis.md`'s registration and conflict-detection steps |
| artifact | design-record | related | output shape matches `design-record/schema.json`'s `source_synthesis` object directly, but `solution-design` is what actually writes the artifact |
