---
artifact: explore-chain
namespace: "@epam/sap"

category: "SAP Activate / Explore"           # UNVERIFIED — no factory-data.json components[]/activities[] entry exists to source this from
sdlc-stage: in-progress                       # UNVERIFIED — same reason

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [explore-realize]                     # cited by name in gate.md's own prose ("design-record status must be APPROVED — see artifacts/explore-chain/handoff.md"), not in the Evidence-mapping table itself
---

## Notes
**Not an orphan in the usual "missing entry" sense, but structurally
different from every other `/artifacts` folder** — it ships `handoff.md` +
`artifact-model.yaml` instead of `template.md` + `schema.json`, and it is
not a per-engagement document instance at all. It is the **contract map
between Explore skills** (`requirements-intake → fit-to-standard →
solution-design → backlog-drafting → Realize`) — stable handoff rules
(required fields, refuse conditions, the `APPROVED`/`REOPENED` status gate),
maintained once as factory content, not produced fresh per engagement by any
single skill. `category`/`sdlc-stage` above are marked `UNVERIFIED` because
there is no `components[]`/`activities[]` entry in `factory-data.json` to
source them from — the values shown are a best-effort placement (all the
skills it governs are Explore-phase), not sourced data.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | requirements-intake | related | first link in the chain (`requirements-to-fts`) |
| skill | fit-to-standard | related | second link (`fts-to-design`) |
| skill | solution-design | related | third link (`design-to-backlog`) |
| skill | backlog-drafting | related | fourth link (`backlog-to-realize`) |
| q-gate | explore-realize | gates-at | design-record's `APPROVED` status (defined here) gates backlog push and Realize build |
