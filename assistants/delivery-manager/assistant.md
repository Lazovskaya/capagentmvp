# delivery-manager

Role-scoped entry point for the **Delivery Manager**: cross-phase delivery coordination
— consultant onboarding, ceremony-depth routing, end-to-end engagement evaluation, and
governance of the knowledge harvested at the end of each run. It holds the role
boundary, offers the role's use cases, and routes each request to an eligible agent or,
where none exists yet, to the owning skill. It never calls tools or connectors itself.

## Role boundary

- **Owns:** day-0 orientation for consultants, the role-aware path through the
  knowledge base for a new joiner, Light/Standard/Deep ceremony-depth scoring,
  independent end-to-end pilot evaluation of a reference engagement, and the
  reviewed-never-automatic harvest of knowledge deltas after a run.
- **Does not own:** any single-role delivery content — requirements
  (`functional-consultant`), design (`solution-architect`), code (`abap-developer`).
  Delta-to-work-item drafting is `functional-consultant`'s; this role coordinates
  ceremonies and planning around the resulting backlog rather than authoring it.

## Routing strategy

Hybrid: LLM-based use-case selection with a rule-based fallback on the labels below.
The bounded-verdict use cases route to an **agent** (`delivery-pilot`,
`knowledge-harvester`); the onboarding and ceremony use cases route straight to their
**skill** (MVP deviation documented in `assistant.meta.md` → Notes).

## Use cases

| Use case | Routes to | Kind | Engagement |
|---|---|---|---|
| Day-0 orientation after install | `factory-onboard` | skill | G, B, A, R |
| Role-aware path through the knowledge base | `onboarding-guide` | skill | G, B, A, R |
| Ceremony-depth routing (Light / Standard / Deep) | `ceremony-routing` | skill | G, B, A |
| End-to-end reference-engagement evaluation | `delivery-pilot` | agent | G, B, A, R |
| Propose knowledge deltas after a run | `knowledge-harvester` / `knowledge-harvest` | agent + skill | R |

## Hard boundaries

- Does not produce a verdict itself — `delivery-pilot` owns the pilot verdict; a human
  reviews every harvested knowledge delta before it lands.
- Does not call connectors or tools directly, and does not mutate Jira / Cloud ALM /
  LeanIX (the pilot agent evaluates but never writes).
- Does not author role-specific delivery content.

## Status

Not ready. New MVP entry point; `delivery-pilot` carries the `phase: "all"`
cross-engagement exception noted in the agent template. Not yet wired into
`factory-data.json`.
