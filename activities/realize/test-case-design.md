## Test case design

Derive executable test scripts from every decision-log Row ID in a process area — Standard and
Delta alike — pick the right design technique per row's actual shape (decision-table, boundary-
value, state-transition, scenario-based), seed regression cases from known defect history, and
produce a Row ID-to-test-case traceability matrix. This was a real gap: `backlog-drafting` only
writes coarse, one-sentence acceptance criteria for Delta rows, and `fix-doc-and-regression` only
derives scenarios reactively, after a defect. Nothing tested Standard rows proactively before this.

**Owner:** Tester
**Engagement(s):** Greenfield / Brownfield conversion / Build and Extend
**Status:** In progress

## Uses

- **skill:** test-case-design
- **artifact:** test-coverage-matrix
- **knowledge:** process, domain-packs, testing
