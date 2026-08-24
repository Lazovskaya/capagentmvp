---
skill: fix-doc-and-regression
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
Fix/verify: documents the fix and derives regression test scope from a
domain adjacency map. Domain-neutral engine — the terminal step of the
triage pipeline, closing the loop toward run-exit in the hypercare context.

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
| skill | defect-triage | related | receives the confirmed bug/spec-flaw classification |
| mcp-server | jira | requires | records fix documentation against the work item |
| artifact | run-exit-record | produces | closes the loop toward the hypercare run-exit disposition |
| knowledge | domain-packs | consumes | derives regression scope from the domain adjacency map |
| knowledge | testing | produces | writes the fix and its derived regression scope into defect history |
