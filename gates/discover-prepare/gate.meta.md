---
q_gate: discover-prepare
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield]
sdlc_phases: [discover, prepare]
gate_type: acceptance
mechanism_provider: sap-cloud-alm
readiness: in-progress
provenance:
  source: SAP
  source_repo: "https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914"
verified_against_live_cloud_alm: false
---

## Notes
Closes Discover. Evidence mapping is sourced from SAP Community material, not
primary SAP documentation — treat checklist item names as representative,
not verbatim. Approver role is not prescribed by Activate; state the named
approver in the client's actual Cloud ALM gate record.

`gate.md`'s "Scope and simplification impact assessed" row was corrected to
cite `simplification-impact-report`, not `assessment-report` — the two were
deliberately split (`simplification-impact-report`'s own `template.md`:
"the two got conflated under one artifact name despite answering unrelated
questions" — agent-candidate scoring is `assessment-report`'s job,
conversion-blocking sizing is `simplification-impact-report`'s), and the
gate's evidence table had not been updated to match until now.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | simplification-impact-report | requires | evidence for "Scope and simplification impact assessed" (produced by `readiness-analysis`) |
| artifact | assessment-report | requires | evidence for "Agent-readiness candidates named, if in scope" (produced by `agent-readiness`) |
