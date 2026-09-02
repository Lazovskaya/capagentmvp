---
agent: objects-list
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress
use-case: ["Migration object scoping & mapping"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [object_type, object_name_or_prefix, volume_count, key_attributes, module, source_evidence, status_flag]
human-confirms: true

assistant: [TBD]
---

## Notes
Normalizes migration scope into one versioned, reviewable inventory rather than letting each
downstream agent re-derive it. Prefers a SAP BTC/DTV Perform Scoping or Perform Modeling export
as the source of truth for scope when one exists — this agent does not duplicate BTC/DTV's own
scoping or modeling functionality, it normalizes that output and enriches it with source-system
volume, key attributes, and organizational splits BTC/DTV doesn't provide, flagging any
disagreement between BTC/DTV scope and source-system data as `NEEDS_RECONCILIATION` rather than
silently preferring one. Excel/SQL-dump or direct SAP HANA/ECC ingest remains the fallback path
when no BTC/DTV export is available. `human-confirms: true` is grounded in the agent's own
"do not decide scope for the reviewer" statement under `## Procedure` step 7 — every
`NEEDS_DECISION` or `NEEDS_RECONCILIATION` row is routed to human review rather than resolved
automatically, and the `DRAFT`-status output as a whole is meant to be human-reviewed before
downstream use, not just the flagged rows.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | SAP BTC/DTV export | consumes | preferred scope source when available; see agent.md `## Inputs` |
| connector | SAP transport/object dependency query (T2) | consumes | full-mode direct HANA/ECC read, used for enrichment or as fallback source |
| artifact | migration-objects-list | produces | canonical, versioned inventory — `DRAFT` until human review |
| agent | EPMCSAPAI-246 Objects Mapping | feeds | consumes `object_type`, `object_name_or_prefix`, `volume_count` — not yet built in this repo |
| agent | EPMCSAPAI-256 Migration Code Development | feeds | consumes `object_type`, `key_attributes`, `module` |
| agent | EPMCSAPAI-268 Data scoping | related | complementary, not dependent: this agent scopes object types/counts, EPMCSAPAI-268 scopes records within those objects |
