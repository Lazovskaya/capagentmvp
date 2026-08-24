# SAP Best Practices taxonomy — domain pack

Engagement-agnostic SAP Best Practices process taxonomy (L1-L4 hierarchy, scope items, Fiori
apps/TCodes), following the same domain-pack pattern as [`order-to-cash/`](../order-to-cash/README.md):
reusable expertise a generic engine plugs in, not a client's own discovered content (that stays in
`knowledge/process/`, per-client and authority-tracked).

Originated from the Recommendation 2 automation strategy for EPMCSAPAI-197 (unblocking the Core
Delivery Pipeline track, `Knowledge: process` bucket).

## What lives here

- `scope-items/` — **regenerable cache**, not curated knowledge. One JSON file per SAP Best
  Practice scope item (e.g. `BD9.json`), each mapping the scope item to its Fiori apps, TCodes,
  business roles and components. Produced by `tools/ingest_sap_best_practices.py` from a locally
  downloaded Fiori Apps Reference Library export (see below). Gitignored — see "Why this is a
  cache, not committed content" below.
- Curated markdown (taxonomy overview, L1/L2 value-stream summaries, per-scope-item process notes
  in `order-to-cash/`'s style) is the intended next layer once enrichment below is further along.
  Not written yet — this pack currently has the raw scope-item JSON only. L2 is partially
  populated (Fiori Line-Of-Business heuristic, and now real Signavio `linkedBy` data once
  `enrich_sap_best_practices_signavio.py` is run at scale); L1 is still `null` everywhere (see
  "Known gap" and the Method 1/2 sections below).

## How to (re)generate the cache

Method 4's original plan (documented in EPMCSAPAI-197) was a live, anonymous call to the classic
Fiori Apps Library's `SingleApps.xsodata` OData feed. That service is gone — SAP retired the
classic library in favor of **FAL 2.0** at `fal.cloud.sap`, which requires Sign In. There is no
unauthenticated live API left, so this script parses a local export instead, the same pattern
`tools/map_processes_to_fiori_apps.py` already uses in this repo:

1. Sign in to `https://fal.cloud.sap/` and export the "App List" view to `.xlsx` (Scope Item and
   Transaction Codes columns included).
2. Run:
   ```bash
   python3 tools/ingest_sap_best_practices.py --export /path/to/export.xlsx
   python3 tools/ingest_sap_best_practices.py --export /path/to/export.xlsx --scope-item BD9   # one scope item
   ```
3. If the export's column headers don't match `DEFAULT_COLUMNS` in the script, override with
   `--column-map key=Header`, e.g. `--column-map scope_item="Best Practice ID"`.

Confirmed against a real FAL 2.0 export (2026-08-24, 3149 app rows -> 498 scope items, with
`Business Role` and `Line Of Business` columns added to the export on the same date): the
`Scope Item` cell lists `"<title> - <CODE>"` entries joined by `" | "`, and `Line Of Business` lists
a broad-to-narrow path the same way (e.g. `"Finance | Budget and Finance | Corporate Finance |
Finance & Risk"`) — the parser splits both into structured values, so generated files carry the
real scope-item title (not a placeholder) and a best-effort `L2_core_process`. The TCode column is
named `Transaction Codes` (plural); there's no `UI Technology` column in this export type, so
`app_type` is `null` in every step.

## Known gap

The local export has no explicit L1 value stream (Order-to-Cash, Procure-to-Pay, ...) column, so
`L1_value_stream` stays `null` until Method 1 or 2 below is wired up. `L2_core_process` is filled
as a majority vote across an app row's Line Of Business path when a scope item's apps disagree
(most do, since one scope item spans apps from several functional areas) — treat it as a
best-effort hint, not an authoritative grouping; each file's `note` field names the runner-up LOBs
whenever the vote was contested, so a reader can judge how much to trust it.

## Why this is a cache, not committed content

`order-to-cash/README.md` states the policy this pack follows too: *"Live SAP resources are a
runtime concern, not baked in ... never a copied snapshot committed here."* A live OData pull is
exactly that — a point-in-time snapshot of SAP's own reference data, not our distilled expertise.
So `scope-items/*.json` is gitignored and regenerated on demand, while any curated markdown this
pack grows (our own summaries, pointers to scope-item IDs and SAP Note numbers) is the part that
gets committed, matching `order-to-cash`'s "reference, don't copy" rule.

## Method 1 — SAP Cloud ALM Process Content API: dead end for hierarchy

Tried against a real Cloud ALM tenant (2026-08-24) via `/api/calm-processauthoring/v1/*`. OAuth2
client-credentials auth worked; `businessProcesses` and `solutionProcesses` returned real data. But
neither the list nor the single-item detail view nor the diagram endpoints
(`solutionValueFlowDiagram`, `solutionProcessFlows`) carry any L1 (value stream) or L2 (line of
business) field — the model is flat in this tenant, and diagram `svg` came back `null`. Not a scope
or permissions problem: the data genuinely isn't there. Also, `businessProcesses` in this specific
tenant mixes real client-engagement content (company names, project folders) with generic SAP scope
items — confirmed **not** a source to harvest broadly from, only usable for single-known-code
lookups, and even those add nothing beyond what Method 2 already gives. Not pursued further.

## Method 2 — SAP Signavio Process Manager: gives real L2, not L1

`tools/enrich_sap_best_practices_signavio.py` (new this cycle, written but **not yet run against
the full registry** — confirmed only on a 20-scope-item sample) enriches the existing scope-item
cache with `hierarchy.L2_core_process`, sourced from a real Signavio Process Manager tenant (not
SAP's read-only Process Navigator — a distinct product this factory has its own tenant/workspace
for, with a dedicated technical-user login, no OAuth/service-key flow).

What's confirmed real, walking the tenant by hand before writing the script:

- The tenant's `Shared documents` folder mixes real client-engagement work (Syngenta, ARBA,
  ACINO, Medartis_Demo, project-specific company-code scopes — never touch these) alongside a
  read-only `Copy from SAP Signavio Process Explorer` folder. Only the latter's
  `SAP Product Portfolio / SAP S/4HANA / Solution Process` subtree is authoritative, unmodified SAP
  content: **602 scope-item folders**, each named `"<title> (<CODE>)"`, each holding that scope
  item's own BPMN model(s).
- Each scope item's BPMN model has a `linkedBy` reverse-reference (via
  `/model/{id}/info` -> `/revision/{revId}` -> `linkedBy`) listing every OTHER diagram that calls it
  as a subprocess — these callers are **L2 process groups** (e.g. BD9 / Sell from Stock is called by
  "Order and Contract Management" across 4 country/deployment variants, which the script collapses
  to one name). Confirmed clean and consistent across a 20-item sample: `2TW` -> Inventory/Invoice
  Management/Operational Procurement, `5WF` -> Treasury Management, `3I7` -> Retail, etc.
- **L1 (value stream) is not reachable this way.** The L2 process-group folders
  (`SAP Best Practices for SAP S/4HANA (USA|Germany)` etc.) are themselves a flat list, not nested
  under a further value-stream diagram — `linkedBy`'s one hop up is as far as this technique goes. A
  separate `Processes` folder in the same tenant *does* organize content by end-to-end value stream
  (`Lead to Cash for Sell from Stock...`, `Source to Pay...`), but scope items connect to it through
  BPMN call-activity content, not folder nesting — a materially harder parse deferred for now (see
  "Planned enrichment" below).

Run it (against a `.env` file kept **outside** the repo, e.g.
`~/.config/sap-best-practices/sessions/<destination>.env` — copy `.env.example` there first):

```bash
python3 tools/enrich_sap_best_practices_signavio.py --env-file ~/.config/sap-best-practices/sessions/default.env --limit 20   # smoke test first
python3 tools/enrich_sap_best_practices_signavio.py --env-file ~/.config/sap-best-practices/sessions/default.env               # full ~602-item run (~1200+ requests, several minutes)
```

## Planned enrichment (not yet built)

- **L1 value stream**: a small, stable, publicly documented set (~10 value streams per line of
  business) — worth curating once by hand as a static L2 -> L1 lookup table rather than chasing a
  third API hop through BPMN call-activity content for marginal gain.
- Curated markdown layer (taxonomy overview, per-scope-item process notes in `order-to-cash/`'s
  style) — not started; still only the raw JSON cache exists.

## Status

`scope-items/` cache generation is verified end to end against a real FAL 2.0 export (498 scope
items, real titles/TCodes/roles, best-effort L2 from Line Of Business) and, separately, against a
real Signavio tenant for L2 via `linkedBy` (confirmed on a 20-item sample, script written but the
full 602-item run hasn't been executed yet). Method 1 (Cloud ALM) is a confirmed dead end for
hierarchy, documented above rather than retried. L1 value streams and the curated markdown layer
remain unstarted.
