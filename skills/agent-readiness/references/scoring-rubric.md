# Scoring rubric — agent-readiness

Four axes, scored independently. **Do not average them into one number** — a hard fail on any single
axis is a hard fail on the process, regardless of how well it scores elsewhere. The rubric below gives
worked thresholds, not a formula; use judgment at the boundaries and say so in the report.

## 1. Volume

How often does this process run in a representative period?

| Level | Signal | Implication |
|---|---|---|
| High | Daily+ across the org, or high-count batch | Guardrail-building cost is easily justified |
| Medium | Weekly/monthly, moderate count | Justified only if the other three axes are also strong |
| Low | Rare, ad hoc, small count | Rarely worth the guardrail investment even if everything else scores well — flag as `Leave alone` unless there's a non-volume reason (e.g. high-stakes compliance value) |

## 2. Exception rate

What fraction of instances deviate from the documented happy path?

| Level | Signal | Implication |
|---|---|---|
| Low | Documented exceptions cover observed reality | Agent can likely run mostly autonomously |
| Medium | Meaningful minority of cases need judgment calls | Viable as `Candidate with guardrails` — escalation path is the real deliverable |
| High | Majority of real cases deviate from the "standard" case | Check first whether "high exception rate" reflects genuine complexity or a happy-path definition that was scoped too narrowly (see note below) |

**Note:** before scoring this axis, verify the happy-path definition itself was built from real case
data, not just the documented/idealized process. A narrow happy-path definition manufactures a
misleadingly low exception rate.

## 3. Reversibility

If the agent's decision is wrong, can it be undone cheaply?

| Level | Signal | Implication |
|---|---|---|
| High | Draft states, approval steps before anything external happens, easy rollback | Confidence bar for autonomy is lower |
| Medium | Reversible but costly (rework, delay, manual correction) | `Candidate with guardrails` — require a human checkpoint before the irreversible step |
| Low | Payment sent, contract executed, shipment dispatched, external communication sent | Raises the bar steeply; does not by itself disqualify, but full autonomy without a human-in-loop checkpoint at the point of no return should not be recommended |

## 4. Data reachability

Is what the agent needs actually reachable, not just theoretically existent?

| Level | Signal | Implication |
|---|---|---|
| High | Released API / structured source, confirmed against the knowledge-graph | Proceed |
| Medium | Reachable but needs integration work not yet built | Note as a prerequisite, not a blocker — but don't score `Candidate` until the integration is scoped |
| Low | Lives in inbox, spreadsheet, tribal knowledge, or a system with no released access path | Hard fail on this axis regardless of the other three — this is the axis most often assumed rather than checked |

## Verdict mapping

- **Candidate** — strong or acceptable on all four axes
- **Candidate with guardrails** — viable, but Reversibility or Exception rate requires an explicit
  human-in-loop or escalation design before build; name the checkpoint in the assessment report
- **Leave alone** — hard fail on at least one axis; name which axis and why it isn't close, not just
  "scored low overall"

## Anti-patterns

- Scoring a process `Candidate` because three axes are strong and hand-waving the fourth
- Treating "we could build the integration" as equivalent to "the data is reachable" — reachability is
  about what exists now, integration work is a prerequisite to name, not a pass
- Letting demo-ability, executive sponsorship, or vendor pressure substitute for a scored axis
