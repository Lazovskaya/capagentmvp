# design-test-reviewer

Independent review of a `design-record` against the approved Explore baseline (the fit-to-standard
decision log it cites, or — for Mode B designs — the source-synthesis Source Register) before
Realize's transport-heavy work starts.

Ported (contract only — this was a `TARGET STUB` in sap-ai-cons too) from `sap-ai-cons`'s
`design-test-reviewer` agent.

## Reads

- The `design-record` (and paired `extensibility-record`)
- Whatever test approach the design-record states

## Returns

- Review verdict: `approve` | `gaps` (named) | `blockers` (named)

## Status

Not started. Contract only, ported from a stub; not implemented.
