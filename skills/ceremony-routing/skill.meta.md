---
skill: ceremony-routing
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
Scores Light/Standard/Deep ceremony depth after triage or requirements
intake. Does not replace domain diagnostics — only sets how deep to run the
matrix handoff into root-cause-playbook (and its domain specializations).

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
| skill | incident-triage | related | receives the classified/deduped/routed incident as input |
| skill | root-cause-playbook | chains-to | routes the incident into the diagnostic tree at the scored depth |
| mcp-server | jira | requires | work-item context for depth scoring |
| knowledge | domain-packs | consumes | depth scoring draws on domain expertise |
| knowledge | process | consumes | scores depth against known process scope |
