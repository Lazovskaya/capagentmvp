# Gate: deploy→run

Exit criteria: cutover rehearsed, go-live criteria met.

**Status:** Criteria and evidence mapping defined below. Not yet run on a real engagement.

## Mechanism

**We do not own this gate's mechanism.** SAP Cloud ALM's "Quality Gates" app supplies the checklist
and approval workflow. What we own is the mapping below.

**Gate type:** Acceptance (closes Deploy) — cutover rehearsed, go-live criteria met.

## Evidence mapping

| Checklist item (typical) | Evidence artifact | Produced by |
|---|---|---|
| Every process area's go-live checklist item closed, none left open without a named risk acceptance | `sign-off-record` (checklist section) | `go-live-readiness` |
| Cutover rehearsed end to end, go-live criteria attached | `sign-off-record` | `cutover-plan` |
| Production conversion executed with evidence | conversion log | `production-conversion` |

## Sources

These are SAP Community blog posts and course material, not SAP's primary product documentation —
treat the checklist item names above as representative/typical, not a verbatim official checklist.
Verify against the client's actual Cloud ALM instance for a live engagement.

- [Quality gates with Activate methodology and Rise with ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914)
- [SAP Activate Elements and Phases — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/sap-activate-elements-and-phases/ba-p/13510606)
