# Gate: discover→prepare

Exit criteria: scope and readiness accepted.

**Status:** Criteria and evidence mapping defined below. Not yet run on a real engagement.

## Mechanism

**We do not own this gate's mechanism.** SAP Cloud ALM's "Quality Gates" app supplies the checklist
and approval workflow (checkpoints checked and approved individually, gate lands on `Accepted` or
`Conditionally Accepted`). What we own is the mapping below: which of this factory's own artifacts
supplies the evidence a Cloud ALM checklist item would ask for.

**Gate type:** Acceptance (closes Discover) — SAP's Discover-phase gate confirms scope and objectives
are clearly defined before Prepare's resourcing/planning begins.

## Evidence mapping

| Checklist item (typical) | Evidence artifact | Produced by |
|---|---|---|
| Scope and simplification impact assessed | `simplification-impact-report` | `readiness-analysis` |
| Agent-readiness candidates named (if in scope) | `assessment-report` | `agent-readiness` |

**Approver (typical):** delivery lead + client sponsor — Activate doesn't prescribe a fixed role here;
SI/client governance model decides. State the named approver in the Cloud ALM gate record itself, not
just in these artifacts.

## Sources

These are SAP Community blog posts and course material, not SAP's primary product documentation (Help
Portal / Roadmap Viewer) — treat the checklist item names above as representative/typical, not a
verbatim official checklist. Verify against the client's actual Cloud ALM instance and the current SAP
Activate Roadmap Viewer content for a live engagement.

- [Quality gates with Activate methodology and Rise with ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914)
- [Quality Gate Reporting with SAP Cloud ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gate-reporting-with-sap-cloud-alm/ba-p/13865005)
- [Safeguarding Quality: The Necessity and Strategic Usage of Quality Gates in Projects — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-sap/safeguarding-quality-the-necessity-and-strategic-usage-of-quality-gates-in/ba-p/13584493)
- [Quality Gates: Leveraging the Continuous Quality Check (CQC) Service Report for Project Readiness — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/quality-gates-leveraging-the-continuous-quality-check-cqc-service-report/ba-p/14357994)
- [SAP Ariba Roadmap: Quality Gates Checklist in SAP Cloud ALM — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/sap-ariba-roadmap-quality-gates-checklist-in-sap-cloud-alm/ba-p/14308967)
- [SAP Activate Elements and Phases — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/sap-activate-elements-and-phases/ba-p/13510606)
