## Test case design

Derive executable test scripts from every decision-log Row ID in a process area — Standard and
Delta alike — after an input-quality check on decision-log cells / Delta `test_approach`, pick the
right design technique per row's actual shape (decision-table, boundary-value, state-transition,
scenario-based), seed regression cases from known defect history, produce a Row ID-to-test-case
traceability matrix under a per-run ledger, and require user review before any optional
test-management sync. This was a real gap: `backlog-drafting` only writes coarse acceptance
criteria for Delta rows, and `fix-doc-and-regression` only derives scenarios reactively, after a
defect. Nothing tested Standard rows proactively before this.

**Owner:** Tester
**Engagement(s):** Greenfield / Brownfield conversion / Build and Extend
**Status:** In progress

## Uses

- **skill:** test-case-design, e2e-test-scenario-generation
- **agent:** test-generation
- **artifact:** test-coverage-matrix, e2e-test-scenarios, test-generation-report
- **knowledge:** process, domain-packs, testing
