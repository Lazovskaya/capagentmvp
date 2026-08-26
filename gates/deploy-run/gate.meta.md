---
gate: deploy-run
namespace: "@epam/sap"

gate-type: Acceptance
sdlc-stage: in-progress

distribution-class: client-shippable

source: SAP
source-repo: "https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914"

verified-against-live-cloud-alm: false
---

## Notes
Closes Deploy — cutover rehearsed, go-live criteria met.

`gate.md`'s "Production conversion executed with evidence" checklist item
cites a "conversion log" (produced by `production-conversion`) as evidence —
that is not a registered `Artifact` component, so it is not modeled as a
Dependency-graph row below.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | sign-off-record | requires | evidence for "Every process area's go-live checklist item closed, none left open without a named risk acceptance" (produced by `go-live-readiness`) |
| artifact | sign-off-record | requires | evidence for "Cutover rehearsed end to end, go-live criteria attached" (produced by `cutover-plan`) |
