---
q_gate: prepare-explore
namespace: "@epam/sap"
version: 0.1.0
owner: katsiaryna_ustsinava@epam.com
project_types: [greenfield, brownfield, bluefield]
sdlc_phases: [prepare, explore]
gate_type: acceptance
mechanism_provider: sap-cloud-alm
readiness: in-progress
provenance:
  source: SAP
  source_repo: "https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914"
verified_against_live_cloud_alm: false
---

## Notes
Closes Prepare / opens Explore — a combined type per Activate's own framing
of this transition (resourcing/planning readiness plus the knowledge/team
foundation). Must not be accepted on an aggregate "knowledge base is ready"
claim — the checklist should carry one line item per `knowledge-discovery`
bucket, not one line for the whole knowledge base.

Two of `gate.md`'s three evidence rows ("bucket-validation-log" for
`knowledge-discovery`, "remediation inventory" for `custom-code-scan`) cite
evidence that is not a registered `Artifact` component — only
`onboarding-record` is. Not modeled as a Dependency-graph row until (or
unless) those two get a real `/artifacts` entry of their own.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | onboarding-record | requires | evidence for "Team onboarded, ready-to-take-a-ticket evidenced" (produced by `onboarding-guide`) |
