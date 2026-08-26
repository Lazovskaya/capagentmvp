---
artifact: transport-record
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy]
---

## Notes
Transport ID recorded by construction — captured as part of documenting the
config change, not typed in from memory afterward. Produced by both
`config-doc` (configuration activity) and `abap-dev` (ABAP development
activity, per `activities/realize/abap-development.md`) — this is a genuine
two-producer artifact, not a single canonical source.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | config-doc | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| skill | abap-dev | produced-by | TMP — second producer, ABAP-development-originated transports. `abap-dev` has a `factory-data.json` entry but **no `/skills` folder or `skill.meta.md`** yet, so this edge has no mirror to check against; same removal note applies |
| artifact | config-record | related | referenced, never duplicated |
| q-gate | realize-deploy | gates-at | "config documented, with transport" is a named checklist item |
