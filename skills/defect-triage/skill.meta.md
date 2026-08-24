---
skill: defect-triage
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
Classify: bug or functional spec flaw. A commercial call, so a human confirms
the verdict. Reused, as-is, by hypercare.

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
| skill | root-cause-playbook | related | receives the ranked root cause from the generic diagnostic engine |
| skill | pricing-diagnostic | related | receives the ranked root cause from the pricing specialization |
| skill | billing-ar-error-analyzer | related | receives the ranked root cause from the billing/AR specialization |
| skill | idoc-failure-analyzer | related | receives the layered classification from the IDoc engine |
| skill | fix-doc-and-regression | chains-to | hands off the confirmed class for fix documentation and regression scoping |
| agent | defect-classifier | requires | returns class, confidence, route and recommended fix |
| mcp-server | jira | requires | records the confirmed classification against the work item |
| artifact | triage-verdict | produces | class, route, and the human who confirmed it |
