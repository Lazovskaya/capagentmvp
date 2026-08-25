# SAP Best Practices taxonomy — domain pack

Engagement-agnostic SAP Best Practices process taxonomy (L1-L4 hierarchy, scope items, Fiori
apps/TCodes), following the same domain-pack pattern as [`order-to-cash/`](../order-to-cash/README.md):
reusable expertise a generic engine plugs in, not a client's own discovered content (that stays in
`knowledge/process/`, per-client and authority-tracked).

Originated from the Recommendation 2 automation strategy for EPMCSAPAI-197 (unblocking the Core
Delivery Pipeline track, `Knowledge: process` bucket).

## What lives here

- `scope-items/` — enriched scope-item JSON, one file per scope item (e.g. `BD9.json`). Committed
  as a snapshot (2026-08-24) because the files carry our own processed data: L1/L2 hierarchy from
  Signavio `linkedBy`, BPMN step sequences, and curated L1 lookup — not just a raw FAL export.
  Regenerate with `ingest → enrich → bpmn → populate_l1` when SAP updates FAL or Signavio content
  (see "How to (re)generate the cache" below). The snapshot will drift as SAP releases new scope
  items; treat it as authoritative for the release date noted in each file's `note` field.
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

## Why scope-items/ is now committed (policy change 2026-08-25)

The original policy (gitignored cache) applied when `scope-items/` held only raw FAL export data.
After the full enrichment pipeline (Signavio L2, BPMN parsing, L1 lookup), each JSON carries our
own processed work — L1/L2 hierarchy, ordered BPMN steps, dependency graph — not just a SAP
snapshot. Committing it lets any team member use the taxonomy without re-running a ~11-minute
pipeline requiring FAL login and Signavio credentials.

`workspace/bpmn/*.bpmn` (raw Signavio XML, 24 MB) and `workspace/AppList.xlsx` (raw FAL export)
remain gitignored: they are the upstream source files already fully consumed into scope-items JSON,
carry SAP proprietary content, and add nothing a reader can't get from the JSON.

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
`~/.config/signavio/sessions/<destination>.env` — copy `connectors/signavio/.env.example` there first):

```bash
python3 tools/enrich_sap_best_practices_signavio.py --env-file ~/.config/signavio/sessions/default.env --limit 20   # smoke test first
python3 tools/enrich_sap_best_practices_signavio.py --env-file ~/.config/signavio/sessions/default.env               # full ~602-item run (~1200+ requests, several minutes)
```

## Method 3 — BPMN 2.0 download and parse: gives real process flow

`tools/fetch_bpmn_signavio.py` (new 2026-08-24) downloads the BPMN 2.0 XML for each scope item's
main variant (prefers `{CODE} - 01 -` without country suffixes) via
`GET /p/model/{model_id}/bpmn2_0_xml` — the same authenticated `/p/` session Method 2 already uses,
no new credentials required.

Parses into a `bpmn_flow` block written into each scope-item JSON alongside the existing `hierarchy`
data. What `bpmn_flow` adds that the FAL export cannot:

- **`steps`** — tasks in topological execution order (BFS from `startEvent`), with human-readable
  role name from the swimlane and `optional` flag from `"(Optional)"` in the step name. Handles
  both `callActivity` (older diagrams) and `subProcess` (newer SAP format) transparently.
- **`gateways`** — parallel/exclusive/inclusive gateways with their position in the sequence,
  indicating branches and joins (e.g. BD9's parallel split into monitoring + AR at step 13).
- **`dependencies`** — other scope items called as subprocesses, forming a cross-scope-item
  dependency graph (BD9 depends on BD6, BDG, 1JW, J59, BKK).

The `signavio_model_id` (written by `enrich_sap_best_practices_signavio.py`) lets subsequent
`fetch_bpmn_signavio.py` runs skip folder navigation — one API call per scope item.

Run (requires `signavio_model_id` in JSON, so run enrich first):

```bash
# Enrich all (writes signavio_model_id into every JSON, ~11 min):
python3 tools/enrich_sap_best_practices_signavio.py --env-file /path/to/.env

# Fetch BPMN for all that have model_id, skip already-done:
python3 tools/fetch_bpmn_signavio.py --env-file /path/to/.env --all --skip-existing

# Single scope item (navigates if model_id missing):
python3 tools/fetch_bpmn_signavio.py --env-file /path/to/.env --scope-item BD9 --navigate

# Also save draw.io-compatible .bpmn files:
python3 tools/fetch_bpmn_signavio.py --env-file /path/to/.env --scope-item BD9 --navigate --save-xml workspace/bpmn
```

Confirmed 2026-08-24: 592/594 scope items processed successfully. 2 items (`4RF`, `6NL`) returned
HTTP 500 from Signavio (server-side issue with those specific diagrams). 61 items have 0 steps
(integration/stub scope items with no swimlane tasks in their BPMN). 103 items have cross-scope-item
dependencies.

## Planned enrichment

- **L1 value stream**: a small, stable, publicly documented set (~10 value streams per line of
  business) — worth curating once by hand as a static L2 -> L1 lookup table rather than chasing a
  third API hop.
- **Curated markdown layer** — generated from JSON by `tools/generate_sap_bp_markdown.py`
  (see below). Structural/taxonomy layer is done; expert content (troubleshooting trees, failure
  modes, configuration gotchas) is the remaining gap — those require consultant expertise or SAP
  Help Portal content and belong in separate, hand-written files that the generator never touches.

## Curated markdown layer

`tools/generate_sap_bp_markdown.py` generates three kinds of committed markdown from the JSON cache:

- `taxonomy-overview.md` — L1/L2/L3 hierarchy tables + full alphabetical index of all 732 scope items
- `dependency-map.md` — cross-scope-item subprocess dependency graph (103 items with deps)
- `value-streams/<slug>.md` — one file per L1 value stream (12 files); per-L2 group tables with
  BPMN step sequences, Fiori apps, mandatory/optional dependencies, and key roles

Run after any cache regeneration step:

```bash
python3 tools/generate_sap_bp_markdown.py
```

All output files carry an `AUTO-GENERATED` banner and are safe to overwrite. Do not hand-edit them.
Consultant notes (troubleshooting trees, failure modes) belong in separate files alongside them —
the generator never touches files it did not create.

**Why a separate script rather than baking generation into ingest/enrich/fetch:**
The JSON cache and the markdown layer have different lifecycles. The cache is regenerated rarely
(when SAP updates FAL or Signavio content); the markdown can be regenerated from the existing cache
at any time without new credentials or API calls. Keeping them separate lets a consultant regenerate
the markdown locally without having to re-run the Signavio/FAL pipeline.

## Status

Cache generation and markdown generation verified end to end (2026-08-24 / 2026-08-25):

| Source | Result |
|--------|--------|
| FAL 2.0 export (`ingest_sap_best_practices.py`) | 498 scope items, real titles/TCodes/roles |
| Signavio `linkedBy` enrichment (`enrich_sap_best_practices_signavio.py`) | 594/594 items, L2 + `signavio_model_id` written |
| BPMN download + parse (`fetch_bpmn_signavio.py`) | 592/594 items, `bpmn_flow` with ordered steps/gateways/deps |
| L1 population (`populate_l1_value_streams.py`) | ~613/732 items updated; remaining nulls are ingest artifacts (single-char L2 values from LOB path splitting in `ingest_sap_best_practices.py`) |
| Markdown generation (`generate_sap_bp_markdown.py`) | taxonomy-overview.md + dependency-map.md + 12 value-stream files |

**732 scope-item files** in the cache (union of all sources). Structural markdown layer generated
2026-08-25. Expert content layer (troubleshooting, failure modes, gotchas) not yet written.
