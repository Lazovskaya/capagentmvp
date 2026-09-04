---
skill: incident-triage
title: Defect triage   # TEMP: sourced from activities[].title (realize/defect-triage.md); also reused, as-is, by run/hypercare-triage.md ("Hypercare & incident triage")
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-test                # not-ready | in-progress | in-test | ready
target-role: [test, functional]    # test: realize/defect-triage.md · functional: run/hypercare-triage.md
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Defect triage", "Hypercare & incident triage"]

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — none recorded for either activity that uses it
---

## Notes
Intake: classify by sub-process, layer, severity; dedupe; route; then hand
off to ceremony-routing for depth. Domain-neutral engine, reused as-is by
hypercare (`run/hypercare-triage.md`) for live-user intake — same skill, same
behavior, different activity context.

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
| skill | ceremony-routing | chains-to | hands off the classified/deduped/routed incident for ceremony-depth scoring |
| connector | jira | requires | work-item intake and dedupe context |
| connector | cloud-alm | requires | live-user incident intake context in hypercare |
| artifact | triage-verdict | produces | initial classification feeding the eventual class/route/confirmer record |
| knowledge | domain-packs | consumes | sub-process/layer classification uses domain expertise |
| knowledge | process | consumes | classifies against known process scope |
| knowledge | config | consumes | classifies against known config context |
| knowledge | custom-code | consumes | classifies against known custom-code inventory (realize context) |
| knowledge | operations | consumes | classifies against operational baselines (hypercare context) |
| knowledge | testing | consumes | reads prior defect/spec-flaw classification history |
