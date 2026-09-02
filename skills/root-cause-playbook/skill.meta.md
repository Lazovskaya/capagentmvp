---
skill: root-cause-playbook
title: Defect triage   # TEMP: sourced from activities[].title (realize/defect-triage.md); also reused, as-is, by run/hypercare-triage.md ("Hypercare & incident triage")
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [test, functional]    # test: realize/defect-triage.md · functional: run/hypercare-triage.md
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Defect triage", "Hypercare & incident triage"]

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — none recorded for either activity that uses it
---

## Notes
Diagnose: walks a domain taxonomy's diagnostic tree top-down to a ranked root
cause with evidence and fix. Domain-neutral engine — `pricing-diagnostic` and
`billing-ar-error-analyzer` are explicit domain-specific specializations of
this skill; `idoc-failure-analyzer` runs alongside it in the same pipeline
step but is its own domain-neutral engine, not described as a specialization
of this one.

> **Caveat on the Dependency graph below.** `factory-data.json` records `uses`
> (mcp/artifact/knowledge) at the *activity* level (`defect-triage.md` /
> `hypercare-triage.md`), not per individual skill inside the 8-skill triage
> pipeline. The rows below attribute each shared reference to this skill
> based on its described role in the pipeline — treat the mcp/knowledge
> attributions as a reasonable first draft, not a per-skill-verified fact,
> and confirm during the next skill review.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | ceremony-routing | related | receives the incident at the ceremony-scored depth |
| skill | pricing-diagnostic | related | domain-specific specialization of this engine for SD pricing |
| skill | billing-ar-error-analyzer | related | domain-specific specialization of this engine for SD billing / FI-AR |
| skill | idoc-failure-analyzer | related | runs the same pipeline step as an alternate domain-neutral engine |
| skill | defect-triage | chains-to | hands off the ranked root cause for bug-vs-spec-flaw classification |
| knowledge | domain-packs | consumes | walks the domain taxonomy's diagnostic tree |
| knowledge | process | consumes | ties the root cause to a process area |
| knowledge | config | consumes | ties the root cause to a config decision |
