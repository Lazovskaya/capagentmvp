---
skill: knowledge-harvest
title: Knowledge harvest   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Run"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Knowledge harvest"]

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [run-exit]                 # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
After a run, proposes targeted knowledge deltas: what changed, what was
learned, which guidance turned out to be wrong. Reviewed, never
auto-merged. This is the step that makes the next engagement start faster
than the last, and the one most likely to be skipped under delivery
pressure.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | knowledge-harvester | requires | returns proposed knowledge deltas after each run |
| artifact | run-exit-record | consumes | reads the run disposition to scope the harvest |
| knowledge | process, config, custom-code, clean-core, extensibility, data, testing, operations, standards | produces | proposes refresh deltas across all nine buckets, reviewed not auto-merged |
| q-gate | run-exit | gates-at | exit criteria: knowledge harvested |
