# Knowledge: domain-packs

New bucket (this factory didn't have one before) — added to close a real structural gap: the
`defect-triage` skill already assumed an upstream technical-classification/diagnosis step existed
(see its own SKILL.md), but nothing in this factory's model actually supplied one. `sap-ai-cons` had
already solved this with a **generic engine + swappable domain pack** pattern for its bugfix track;
this bucket is where the swappable domain-pack half of that pattern lives.

Distinct from the other eight knowledge buckets: those hold a *project's own* discovered content
(this client's process, this client's config...). This bucket holds *pre-built, reusable, swappable*
domain expertise that a generic engine skill plugs in — the same pack can serve many engagements in
the same SAP domain, unlike `process`/`config`/etc. which are always this-client-specific.

## What lives here

- `order-to-cash/` — the first domain pack, ported from `sap-ai-cons` (real, curated content, not a
  stub): incident taxonomy, signal catalog, routing matrix, subprocess adjacency map, pricing
  condition-technique reference, billing/AR account-determination reference, IDoc ORDERS/INVOIC
  message catalog, and 10 troubleshooting diagnostic trees.

Other domains (not built yet) would bring their own pack here, following `order-to-cash/`'s shape,
without changing the generic engine skills (`incident-triage`, `root-cause-playbook`,
`defect-pattern-analysis`, `idoc-failure-analyzer`, `fix-doc-and-regression`) that orchestrate
whichever pack is in scope.

## Status

Progress. `order-to-cash/` is real, ported content; the bucket itself (as a concept distinct from
the other eight) is new this cycle, not yet re-verified end to end inside this factory's own
pipeline wiring.
