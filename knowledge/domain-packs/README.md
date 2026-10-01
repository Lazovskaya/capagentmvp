# Knowledge: domain-packs

New bucket — added to close a real structural gap: the `defect-triage` skill already assumed an
upstream technical-classification/diagnosis step existed (see its own SKILL.md), but nothing in
this factory's model actually supplied one. This bucket provides the **generic engine + swappable
domain pack** pattern for the bugfix track; the swappable domain-pack half lives here.

Distinct from the other eight knowledge buckets: those hold a *project's own* discovered content
(this client's process, this client's config...). This bucket holds *pre-built, reusable, swappable*
domain expertise that a generic engine skill plugs in — the same pack can serve many engagements in
the same SAP domain, unlike `process`/`config`/etc. which are always this-client-specific.

## What lives here

- `order-to-cash/` — the first domain pack (real, curated content, not a stub): incident taxonomy,
  signal catalog, routing matrix, subprocess adjacency map, pricing condition-technique reference,
  billing/AR account-determination reference, IDoc ORDERS/INVOIC message catalog, and 10
  troubleshooting diagnostic trees.

- `sap-best-practices/` — SAP Best Practices process taxonomy (L1-L4 hierarchy, 732 scope items,
  BPMN flow steps, Fiori apps, cross-item dependency graph). Structural/taxonomy layer generated
  from Signavio + FAL 2.0 data; L1 value stream populated for 731/732 items as of 2026-09-02
  (see its own README's Status table). Expert content layer (troubleshooting trees, failure modes,
  configuration gotchas per scope item) not yet written.

## Planned domain packs (not yet built)

Following `order-to-cash/`'s shape — generic engine skills stay unchanged, only the pack swaps:

| Domain | Priority driver |
|---|---|
| Source to Pay / Procure-to-Pay | Second most common engagement type after O2C |
| Finance and Accounting | FI-CO defects form a large share of AMS volume |
| Manufacturing / Plan to Fulfill | PP/MM defects, BOM/routing issues |

Each pack needs: incident taxonomy, signal catalog, routing matrix, subprocess adjacency, and
at least 5 troubleshooting trees to be useful. `sap-best-practices/` taxonomy data is available
for all three as a starting point for scope-item scoping.

## Status

`order-to-cash/` is real, ported content. `sap-best-practices/` has the structural taxonomy layer
(2026-08-25), with L1 value stream populated for 731/732 items (2026-09-02); expert content layer
not yet written. Other domain packs not started.
