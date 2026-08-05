# Assessment report — agent-readiness

This is the artifact the `discover→prepare` Q-gate reads, and what `agent-build` should later be
scoped against. A process not listed here as a `Candidate` is not yet an agent-build target.

- **Client / engagement:**
- **Assessment date:**
- **Assessor (architect):**
- **Process scope covered:** <which process landscape was considered — name the source, e.g.
  "Signavio process mining export, <date>, <scope>">

## Candidates

| Process | Volume | Exception rate | Reversibility | Data reachability | Verdict | Guardrail / checkpoint needed |
|---|---|---|---|---|---|---|
| | | | | | Candidate | — |
| | | | | | Candidate with guardrails | <name the human-in-loop checkpoint or escalation path required> |

## Leave alone

| Process | Disqualifying axis | Why it isn't close | Revisit condition |
|---|---|---|---|
| | e.g. Data reachability | <one line — this is the sentence someone reads in a year to understand why nothing was built> | <what would have to change for this to be re-scored, e.g. "if X system exposes a released API"> |

## Explicitly considered and rejected as demo-driven, not evidence-driven

<Only needed if a process was proposed on enthusiasm/sponsorship grounds rather than organic
candidacy. Name it and show its actual scores here — this section is what prevents "but I thought we
were doing X" from resurfacing without a documented answer.>

| Process | Who proposed it | Scores (4 axes) | Verdict |
|---|---|---|---|

## Validity checklist before this report is considered complete

- [ ] Every Candidate row scored on all four axes — none inferred or skipped
- [ ] Every Leave-alone row names the specific disqualifying axis, not "scored low overall"
- [ ] Every "Candidate with guardrails" row names the actual checkpoint, not just "needs guardrails"
- [ ] Data reachability was checked against the knowledge-graph, not assumed
- [ ] This report states it is a bridge to evaluation, not a build commitment
