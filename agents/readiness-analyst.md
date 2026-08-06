# readiness-analyst

Isolated reviewer for Discover-phase quality — checks a `simplification-impact-report`'s
completeness and flags missing evidence, without owning the `readiness-analysis` skill itself.

Ported (contract only — this was a `TARGET STUB` in sap-ai-cons too) from `sap-ai-cons`'s
`readiness-analyst` agent.

## Reads

- The `simplification-impact-report` draft
- The source Readiness Check / SI-Check export(s) it was built from

## Returns

- Bounded verdict: `complete` | `gaps` (named) | `blocking missing evidence`

## Status

Not started. Contract only, ported from a stub; not implemented.
