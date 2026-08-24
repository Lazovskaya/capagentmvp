---
skill: idoc-failure-analyzer
title: Defect triage   # TEMP: sourced from activities[].title (realize/defect-triage.md); also reused, as-is, by run/hypercare-triage.md ("Hypercare & incident triage")
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [test, functional]    # test: realize/defect-triage.md · functional: run/hypercare-triage.md
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — none recorded for either activity that uses it
---

## Notes
Diagnose: failing IDocs by direction/message type/status code into technical,
mapping and application layers, with a safe reprocess path. Domain-neutral
engine — unlike `pricing-diagnostic`/`billing-ar-error-analyzer`, its
description does not call it a specialization of root-cause-playbook; it
runs alongside it in the same pipeline step as an independent engine.

> **Caveat on the Dependency graph below.** `factory-data.json` records `uses`
> (mcp/artifact/knowledge) at the *activity* level (`defect-triage.md` /
> `hypercare-triage.md`), not per individual skill inside the 8-skill triage
> pipeline. The rows below attribute each shared reference to this skill
> based on its described role in the pipeline — treat the mcp/knowledge
> attributions as a reasonable first draft, not a per-skill-verified fact,
> and confirm during the next skill review.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | root-cause-playbook | related | runs the same pipeline step as an alternate domain-neutral engine |
| skill | defect-triage | chains-to | hands off the layered IDoc failure classification for bug-vs-spec-flaw classification |
| knowledge | domain-packs | consumes | IDoc direction/message-type/status-code taxonomy |
| knowledge | process | consumes | ties the failing IDoc to a process area |
