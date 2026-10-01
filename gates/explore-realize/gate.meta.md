---
q_gate: explore-realize
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield]
sdlc_phases: [explore, realize]
gate_type: acceptance
mechanism_provider: sap-cloud-alm
readiness: in-progress
provenance:
  source: SAP
  source_repo: "https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914"
verified_against_live_cloud_alm: false
---

## Notes
Closes Explore. `design-record` status must be `APPROVED` (see
`artifacts/explore-chain/handoff.md`) before backlog baseline and Realize
build evidence count toward this gate. A work item with a missing or
incomplete backlink chain should block this gate item, not just get
flagged, per `backlog-drafting`'s own rule.

`gate.md`'s "Backlog baselined, fully backlinked" checklist item cites "work
items with backlink chain" as evidence, produced by `backlog-drafting` —
that is not a registered `Artifact` component, so it is not modeled as a
Dependency-graph row below.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | sign-off-record | requires | evidence for "Fit-to-standard signed, per process" (produced by `fit-to-standard`) |
| artifact | design-record | requires | evidence for "Design approved" (produced by `solution-design`) |
| artifact | extensibility-record | requires | evidence for "Extensibility tier recorded and justified" (produced by `solution-design`) |
