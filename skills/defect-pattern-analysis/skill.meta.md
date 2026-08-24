---
skill: defect-pattern-analysis
title: Defect pattern analysis   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Run"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [test]
engagement: [R]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — none recorded in factory-data.json for this activity
---

## Notes
Prevent: periodically (sprint / month / hypercare wrap-up) clusters a defect
backlog by cause (not symptom), ranks by business weight, and proposes
permanent fixes on the eliminate/prevent/detect/absorb ladder. Domain-neutral
engine, run on a schedule rather than per-ticket — distinct from the
per-ticket triage pipeline.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| mcp-server | jira | requires | pulls the resolved-defect backlog for the period |
| knowledge | domain-packs | consumes | clusters defects by cause using domain expertise |
| knowledge | process | consumes | ties clusters back to process areas |
| knowledge | testing | consumes | reads prior defect/spec-flaw classification history |
| knowledge | operations | consumes | reads operational baselines to rank business weight |
