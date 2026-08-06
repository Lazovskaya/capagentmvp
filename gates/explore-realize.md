# Gate: explore→realize

Exit criteria: fit-to-standard signed, design approved, extensibility tier recorded, backlog baselined.

**Status:** Criteria and evidence mapping defined below. Not yet run on a real engagement.

## Mechanism

**We do not own this gate's mechanism.** SAP Cloud ALM's "Quality Gates" app supplies the checklist
and approval workflow. What we own is the mapping below.

**Gate type:** Acceptance (closes Explore) — validates fit-to-standard analysis and solution design,
per Activate's own stated focus for this phase gate.

## Evidence mapping

| Checklist item (typical) | Evidence artifact | Produced by |
|---|---|---|
| Fit-to-standard signed, per process | `sign-off-record` (Row ID range) | `fit-to-standard` |
| Design approved, extensibility tier recorded and justified | `design-record` + `extensibility-record` | `solution-design` |
| Backlog baselined, fully backlinked | work items with backlink chain | `backlog-drafting` |

**A work item with a missing or incomplete backlink chain should block this gate item**, not just get
flagged — per `backlog-drafting`'s own rule that a missing backlink is a blocking gap, not a
follow-up task.

## Sources

These are SAP Community blog posts and course material, not SAP's primary product documentation —
treat the checklist item names above as representative/typical, not a verbatim official checklist.
Verify against the client's actual Cloud ALM instance for a live engagement.

- [Quality gates with Activate methodology and Rise with ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914)
- [SAP Activate Elements and Phases — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/sap-activate-elements-and-phases/ba-p/13510606)
