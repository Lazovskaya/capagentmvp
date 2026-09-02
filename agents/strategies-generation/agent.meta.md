---
agent: strategies-generation
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [strategy_type, decisions, cross_strategy_dependencies, status]
human-confirms: true

assistant: [TBD]
---

## Notes
Built for `EPMCSAPAI-251` (Backlog `#8`), scoped down per the ticket's own 2026-08-16
refocus note: technical architecture strategies (Integration, Extensibility, Security, Data,
Landscape, Release & Transport, Output/UX, Operations, Infrastructure, Toolchain) moved to
the dedicated SAD / Technical Architecture track (`EPMCSAPAI-275`…`-290`); this agent covers
only the delivery/non-technical set — Cutover, Training, Testing, Convention. Its inputs
(`#4`/`#5`, i.e. fit-gap-analysis and object-field-mapping) are treated as optional context
rather than a hard blocking dependency, since the ticket's own Acceptance Criteria describe
scope/context-grounded decisions, not a required upstream artifact chain — both source
artifacts already exist and are wired to real upstream agents (`EPMCSAPAI-243`/`-247`,
migration object scoping & mapping), so this agent can cite them when present without being
blocked when a project doesn't have them yet.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | fit-gap-analysis | consumes | optional context, from `EPMCSAPAI-243`/`-247` |
| artifact | object-field-mapping | consumes | optional context, from migration object scoping & mapping |
| artifact | delivery-strategy | produces | one instance per in-scope area |
| agent | EPMCSAPAI-265 Cutover dependency-check | feeds | consumes this agent's Cutover strategy output |
| agent | EPMCSAPAI-290 SAD Assembly | sibling | technical strategies track, explicitly out of scope here |
