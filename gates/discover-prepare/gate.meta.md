---
gate: discover-prepare
namespace: "@epam/sap"

gate-type: Acceptance
sdlc-stage: in-progress

distribution-class: client-shippable

source: SAP
source-repo: "https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914"

verified-against-live-cloud-alm: false
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
