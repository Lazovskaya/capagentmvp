# Test design techniques (generic, method only — no client data)

Standard, publicly documented test-design techniques (the same vocabulary ISTQB's foundation
syllabus uses), applied to how SAP decision-log rows and design-records actually show up. This is
method knowledge, not something ported from any predecessor repo or another vendor's tooling — the
Salesforce repo surveyed for this factory (`sf-testing`) turned out to only cover *running and
fixing already-written Apex tests*, not deriving test cases from requirements, so there was nothing
to adapt from there.

## Pick the technique by the row's actual shape — don't default to one

| Row shape | Technique | Why it fits |
|-----------|-----------|-------------|
| Decision-heavy logic (pricing/discount rules, credit-check thresholds, approval-matrix routing, tax determination) | **Decision-table testing** — enumerate the input conditions as columns, one row per condition combination, one expected action per combination | These are exactly rule tables in disguise (SAP pricing procedures, credit check settings, release strategies *are* decision tables); testing "the happy path" alone leaves untested rule combinations that will surface as production incidents later |
| Numeric/date ranges, thresholds, tolerances (credit limits, condition-record validity dates, price tolerance checks) | **Boundary Value Analysis** (+ Equivalence Partitioning for the ranges either side) | Off-by-one and expiry-boundary defects live exactly at range edges — see the judgment call below, this is not theoretical for this factory |
| Status/workflow-driven flows (order status progression, IDoc status transitions, release-strategy states) | **State-transition testing** — test each valid transition, plus at least one invalid-transition attempt per state | A status field is a state machine whether or not anyone modeled it as one; untested invalid transitions are exactly where "how did it end up in that status" incidents come from |
| Everything else — a straightforward process step with no rule table, range, or status machine behind it | **Scenario/use-case walkthrough** — one test per distinct path through the step, following the decision-log's own recorded Standard/Delta behavior | Don't force decision-table or state-transition structure onto a step that doesn't have that shape; a plain scenario is the honest fit |

State which technique(s) were chosen for a row and why, in the test case's own traceability header —
a technique picked without being named invites the next person to "simplify" the test back down to
a single happy-path case.

**The written test for a row that matches more than one shape** (e.g. a credit-limit rule table
that also drives a release-workflow status): ask "does the row's rule table and its status machine
fail independently of each other?" If yes — a wrong release-workflow transition can happen even when
the rule table itself is correct, and vice versa — use **both** techniques, one test set each; don't
pick the "primary-looking" one and drop the other's coverage. If the two are actually the same
failure mode wearing two descriptions (rare), name that explicitly and use one technique. Never
resolve the ambiguity by silently picking whichever technique is listed first in the table above.

## Coverage is requirements/decision coverage, not code coverage

A code-coverage percentage (the Salesforce repo's `sf-testing`/`sf-init-testing` skills only measure
this) says nothing about whether the *decisions* the business actually made were tested. The
coverage question this factory's Realize phase needs answered is: **"does every decision-log Row ID
in scope have at least one test case that would fail if that decision were violated?"** — see
`artifacts/test-coverage-matrix/`.

## Positive, negative, and boundary — not just "happy path plus one exception"

- **Positive:** the documented Standard/Delta behavior occurs under normal conditions.
- **Negative:** an invalid input, an out-of-policy attempt, or a missing prerequisite is correctly
  rejected or flagged — not just "an exception is thrown somewhere."
- **Boundary:** the edge of a range/threshold/validity window, on both sides.

A design-record's `test_approach` field (one sentence, written at solution-design time) is a seed
for this, not a finished test plan — expanding it into an actual positive/negative/boundary set is
this skill's job, not a rubber stamp on that sentence.

## Prioritize by risk, not by row order

Same discipline `incident-triage-method.md` applies to severity: state the actual test, don't just
rank by a vague sense of importance.

**The test:** does this row's failure (a) affect cash/compliance/a whole channel, (b) deviate from
vendor-tested standard behavior (every Delta, by definition), or (c) touch a sub-process with wide
adjacency fan-out (per the domain pack's adjacency map)? Any yes → execute early. All no → a Standard
row with narrow, contained impact executes later in the cycle, not first.

## Judgment calls worth stating out loud

- **A Standard-classified row still needs at least one test case.** "Standard, therefore
  vendor-tested, therefore untested by us" is exactly the gap that let this factory's own
  `defect-pattern-analysis` real run this session find a recurring master-data defect (expired
  discount condition records) that no one was proactively checking — that specific failure mode is
  a textbook Boundary Value Analysis case (validity end date) that a systematic pass would have
  caught before the first customer complaint, not after the third.
- **A recurring cause family surfaced by `defect-pattern-analysis`, once identified, gets an explicit
  regression test case added here** — not just a process fix. A permanent fix without a
  corresponding test to prove it stays fixed is half a fix.
- **Don't force a technique onto a row it doesn't fit** — a plain scenario walkthrough is the
  correct, honest choice for a step with no rule table, range, or state machine behind it; forcing a
  decision table onto it just produces padding, not coverage.
