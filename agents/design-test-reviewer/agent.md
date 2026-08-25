# design-test-reviewer

Independent review of a `design-record` against the approved Explore baseline (the fit-to-standard
decision log it cites, or — for Mode B designs — the source-synthesis Source Register) before
Realize's transport-heavy work starts.

Ported (contract only in sap-ai-cons — this was a `TARGET STUB` there too) from `sap-ai-cons`'s
`design-test-reviewer` agent. The procedure below is this factory's own, derived directly from
`design-record`'s own validity checklist plus its paired `extensibility-record`, since sap-ai-cons's
version had none.

## Reads

- The `design-record` (and paired `extensibility-record`)
- Whatever test approach the design-record states
- For Mode B designs: the "Source synthesis" section (Source Register, citations, open conflicts)

## Procedure

1. **Row ID (or Mode B source basis) present and correctly cited?** Mode A: the exact Row ID, not a
   paraphrase. Mode B: a Source Register exists and every "Target design" field either carries a
   `[S-id]` citation or an explicit `TBC` — no synthesized fact stated bare. Missing → `blockers`.
2. **Every "Target design" field concretely filled?** What changes, where it lives, data/objects
   touched — vague placeholders ("TBD," restated requirement with no design content) → `gaps`.
3. **Test approach stated and concrete enough to size?** If `backlog-drafting` would have to
   re-interview the business owner to write acceptance criteria from this, the design isn't
   concrete enough → `gaps`.
4. **Open questions/dependencies explicitly stated, even if "none"?** A blank section is a claim
   nothing is unresolved — if left blank rather than stated, → `gaps`.
5. **For Mode B designs, any open `⚠ Conflict` still shown as decided in the record body?** This
   violates the open-conflict rule (`source-synthesis.md`) — a conflict must read `TBC — ⚠ see
   Conflict`, never a picked side. Violation → `blockers`, not `gaps` — this is a correctness issue,
   not a completeness one.
6. **Extensibility-record paired by the same Row ID, and consistent?** The design-record's "where it
   lives" should not contradict the extensibility-record's chosen tier. A mismatch → `blockers`.

## Returns

- `verdict`: `approve` | `gaps` (named) | `blockers` (named, with which rule was violated)
- `checked_against`: which checklist items were run

## Status

Progress. Procedure derived from `design-record`'s own validity checklist and the
`source-synthesis.md` open-conflict rule; not yet wired as a standalone bounded agent or dry-run
tested.
