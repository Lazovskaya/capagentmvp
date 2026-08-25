# Gate: realize→deploy

Exit criteria: config documented, custom code ATC-clean, data reconciled.

**Status:** Criteria and evidence mapping defined below. Not yet run on a real engagement.

## Mechanism

**We do not own this gate's mechanism.** SAP Cloud ALM's "Quality Gates" app supplies the checklist
and approval workflow. What we own is the mapping below.

**Gate type:** Acceptance (closes Realize).

## Evidence mapping

| Checklist item (typical) | Evidence artifact | Produced by |
|---|---|---|
| Config documented, with transport | `config-record` + `transport-record` | `config-doc` |
| Custom code ATC-clean | remediation status | `abap-dev` / `custom-code-scan` |
| Data reconciled within tolerance | `reconciliation-report` | `reconciliation` |
| Defect backlog triaged, no unresolved traceability gaps blocking go-live | `triage-verdict` log | `defect-triage` |
| Every decision-log Row ID has test coverage, Standard rows included | `test-coverage-matrix` | `test-case-design` |

**`defect-triage`'s `Untraceable` verdicts are a specific risk signal for this gate** — a rising count
going into Deploy means the traceability chain has real holes that should be closed before production
conversion, not carried into it.

**A `test-coverage-matrix` with a non-empty Gaps section is the equivalent signal for test
coverage** — rows with zero test cases going into Deploy are exactly the "vendor-tested, therefore
untested by us" gap `test-case-design` exists to close; don't wave a gate through with open gaps in
that section just because the row is Standard-classified.

## Sources

These are SAP Community blog posts and course material, not SAP's primary product documentation —
treat the checklist item names above as representative/typical, not a verbatim official checklist.
Verify against the client's actual Cloud ALM instance for a live engagement.

- [Quality gates with Activate methodology and Rise with ALM — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/quality-gates-with-activate-methodology-and-rise-with-alm/ba-p/14092914)
- [SAP Activate Elements and Phases — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/sap-activate-elements-and-phases/ba-p/13510606)
