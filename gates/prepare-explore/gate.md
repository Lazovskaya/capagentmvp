# Gate: prepare→explore

Exit criteria: knowledge built and validated, custom-code baseline taken, team onboarded.

**Status:** Criteria and evidence mapping defined below. Not yet run on a real engagement.

## Mechanism

**We do not own this gate's mechanism.** SAP Cloud ALM's "Quality Gates" app supplies the checklist
and approval workflow. What we own is the mapping below: which of this factory's own artifacts
supplies the evidence a Cloud ALM checklist item would ask for.

**Gate type:** Acceptance (closes Prepare) / Readiness (opens Explore) — Prepare's gate confirms
implementation readiness: resourcing, planning, and per Activate, the knowledge/team foundation.

## Evidence mapping

| Checklist item (typical) | Evidence artifact | Produced by |
|---|---|---|
| Knowledge base built and validated (bucket-by-bucket, not aggregate) | bucket-validation-log (see `skills/knowledge-discovery`) | `knowledge-discovery` |
| Custom-code baseline taken | remediation inventory | `custom-code-scan` |
| Team onboarded, ready-to-take-a-ticket evidenced | `onboarding-record` | `onboarding-guide` |

**Do not accept this gate on an aggregate "knowledge base is ready" claim** — the checklist should
carry one line item per bucket status, mirroring `knowledge-discovery`'s bucket-by-bucket reporting
rule (see `skills/knowledge-discovery/references/bucket-validation-log-template.md`).

## Sources

These are SAP Community blog posts and course material, not SAP's primary product documentation —
treat the checklist item names above as representative/typical, not a verbatim official checklist.
Verify against the client's actual Cloud ALM instance for a live engagement.

- [Quality gates with Activate methodology and Rise with ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914)
- [Quality Gate Reporting with SAP Cloud ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gate-reporting-with-sap-cloud-alm/ba-p/13865005)
- [SAP Activate Elements and Phases — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/sap-activate-elements-and-phases/ba-p/13510606)
