---
name: defect-triage
description: Classify each item in the defect or incident queue as bug versus functional spec flaw, route it, and recommend a fix. A commercial call, so a human confirms the verdict. Reused by Realize-phase defect triage and Run-phase hypercare.
---

# Defect Triage

Adapted from sap-ai-cons's real, Jira-integrated bugfix track (`incident-triage`,
`root-cause-playbook`, `defect-pattern-analysis`, live-tested on EPMCSAPAI-203/204). That track is
domain-specific (order-to-cash) and richer than this factory's `defect-triage` component actually
needs; this file keeps the **generic engine** (classify, route, recommend) and leaves the O2C
routing/signal-catalog detail where it belongs, in a domain pack, following sap-ai-cons's own
"generic engine + domain pack" pattern. Do not fold O2C-specific content into this file, add it as
a domain pack instead (see "Domain packs" below).

## When to use

Realize-phase defect triage (this factory's `defect-triage` activity) and Run-phase hypercare
(`hypercare-triage` activity), which reuses this same skill with a different intake source
(incidents from live users rather than defects from test cycles).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the incoming items, an export file (CSV/XLSX/JSON) by default, or a live connector
  pull via the `jira` connector.
- **Required:** which domain pack applies, if any exists for this engagement (none is bundled with
  this factory yet, see "Domain packs" below); without one, classification falls back to a generic
  layer order (user, master-data, data, config, custom).
- **Optional:** the existing open backlog, for cross-item dedup.

## Knowledge this skill orchestrates

- `knowledge/testing/` (defect history and prior spec-flaw classifications).
- `knowledge/process/` and `knowledge/config/` (what the process and config are supposed to do,
  needed to tell a bug from a spec flaw).
- `knowledge/custom-code/` (whether the affected object is custom, which shapes routing).
- A domain pack, if one exists (taxonomy, signal catalog, routing matrix, adjacency map), the same
  role O2C played in sap-ai-cons. None is bundled here yet.

## Steps

1. **Load** items from the export or the `jira` connector.
2. **Classify** each: sub-process (from a domain pack if present, else generic), layer, and
   whether it looks like a bug (implementation does not match agreed design) or a functional spec
   flaw (implementation matches design, but the design itself is wrong or incomplete). This
   classification is commercial, not just technical, a bug is fixed under the delivery fee, a
   spec flaw is a change request.
3. **Dedupe**: same document or root cause, mark primary, link duplicates.
4. **Route**: to the owning role per the classification and layer.
5. **Recommend a fix** direction, without inventing a code fix in prose for `custom`-layer items,
   scope it for a developer instead.
6. **Human confirmation.** The agent (`defect-classifier`) recommends; a named human confirms the
   verdict before it's final. The `triage-verdict` artifact records who.
7. **Write back**, if a live connector is connected: preview the exact mutation, get explicit
   approval, then write. Preserve existing labels and never change status, priority or assignee
   outside the classification fields. If no connector: state that write-back did not happen.

## Domain packs

sap-ai-cons already has one real, tested pack (order-to-cash: taxonomy, signal catalog, routing
matrix, subprocess adjacency, 10 troubleshooting trees). Porting that pack wholesale into this
factory is a separate decision, not done here, since it's real client-facing content that deserves
its own review rather than a silent copy. If ported, it should live under
`knowledge/testing/domain/<name>/` or a sibling bucket, not inside this skill file.

## Output

A triaged, deduped, routed worklist producing one `triage-verdict` artifact per item: class,
confidence, route, recommended fix, and the human who confirmed it.

## Status

In progress. The classify/route/recommend logic above is adapted from real, working sap-ai-cons
skills; the domain pack that gives it O2C-specific (or any other domain's) depth is not yet
ported into this factory.
