# Knowledge: testing

Defect history and what has already been classified as a spec flaw.

## What's here

- `defect-history-template.md` — the central default: an **empty**, fixed-schema register a
  project appends to over time via `knowledge-harvest`, not a one-off period export. Read/written by
  `defect-triage` (precedent check), `defect-pattern-analysis` (its real-engagement source for the
  "defect set for a defined period" input), and `test-case-design` (regression-case seeding from
  recurring cause families). See that file for the full schema and the precedent-check test.
- `test-script-template.md` — a step-by-step test-cycle script template, traced back to a
  fit-to-standard Row ID / design-record / `fix-doc-and-regression` scenario. Written fresh (no
  predecessor-repo file existed to port), grounded in standard SAP test-management practice.
  Populated by `../../skills/test-case-design/SKILL.md`.

## The O2C domain pack question — still deferred, on purpose

The order-to-cash domain pack (incident taxonomy, signal catalog, routing matrix, 10
troubleshooting trees) already lives in `../domain-packs/order-to-cash/` — that's swappable domain
expertise shared across engagements, a distinct bucket by design (see
`knowledge/domain-packs/README.md`). Whether any of it should *also* be mirrored or summarized here
is a separate decision, still not made, and this bucket's own content above doesn't depend on that
decision either way.

## Known-issues note

A recurring, confirmed-cause-family finding from `defect-pattern-analysis` (e.g. "expired
customer-discount condition records, recurring") is a candidate for a `knowledge/operations/`
known-issue entry via `knowledge-harvest`, not for this bucket — this bucket holds the raw defect
history; `operations/` holds the digested "here's how we've fixed this exact recurring thing
before" entries. See `knowledge/operations/README.md`.

## Status

In progress. `defect-history-template.md` and `test-script-template.md` are real, structured
content, not stubs — but both are unpopulated templates, not yet exercised against a real project's
accumulated history (this factory's own dry-runs/real-runs write their evidence to
`workspace/bugfix/`, which is gitignored per-engagement output, not this bucket).
