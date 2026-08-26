---
skill: workshop-transcript-intake
title: Workshop transcript intake   # TEMP: no activities[] entry exists for this skill; name derived from the skill itself, not sourced from a title field
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [functional]          # UNVERIFIED — inferred by analogy with fit-to-standard/requirements-intake (workshop-facing, Explore phase); no activities[].owner exists to confirm
engagement: []                     # UNVERIFIED — no activities[] entry exists to source this from; leave empty until confirmed

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — no activities[] entry exists to source this from
---

## Notes
Extracts traceable candidate requirements, decisions, open questions and
backlog candidates from a workshop transcript, without creating work items.

> **Data-completeness caveat.** Unlike every other skill in this file, this
> one has **no `activities[]` entry** in `factory-data.json` — its only
> appearance is a `components[]`-shaped object that turned up nested inside
> `coverage.rows[Agents].cells` (alongside a companion `workshop-candidate-register`
> artifact object nested inside `coverage.rows[Q-gates].cells`), which looks
> like a data defect in `factory-data.json` itself rather than an intentional
> placement. Because of this, `target-role`, `engagement` and `q-gate` above
> could not be sourced from an activity record the way every other skill's
> could — they are either left empty or explicitly flagged as inferred.
> Recommend fixing `factory-data.json` (giving this skill a real
> `activities[]` entry) before treating this file's governance fields as
> reliable.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | workshop-candidate-register | produces | transcript-derived candidate requirements, decisions, open questions and work items with segment-level provenance; never an approved delivery backlog |
| skill | requirements-intake | related | UNVERIFIED — inferred from the shared "candidates, not approved work items" pattern; no `uses` list exists to confirm |
| skill | backlog-drafting | related | UNVERIFIED — plausible downstream consumer of the candidate register; no `uses` list exists to confirm |
