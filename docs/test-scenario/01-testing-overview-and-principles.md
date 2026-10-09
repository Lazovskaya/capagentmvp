# Testing AI scenarios — overview and principles

## The gap this solves

We can assemble and ship sets of AI components (agents, tools, subagents) for a
business task. What we could not do before is **prove a shipped set actually
works**. A test-scenario is a "unit test for AI": a frozen input, an isolated run
of the component, and an automatic check of the result across three levels, repeated
several times because model behaviour is non-deterministic.

A test-scenario is the contract between two kinds of knowledge: the **business**
side owns the task, the sample inputs and the expectations; the **delivery** side
owns the mechanics of running and grading. Both are captured in one scenario.

## The model

Every scenario is the same triple, the shape all major eval frameworks converge on:

```
input (fixture)  +  expected (schema / rubric)  +  grader
```

- **Input** — a frozen fixture, so results do not drift because data changed.
- **Expected** — a schema for the output (structure) and a rubric for quality.
- **Grader** — code that checks the produced output and the run transcript.

## Three grading levels (deterministic first)

Ordered by cost and reliability; deterministic checks carry most of the load.

1. **Level 1 — deterministic (code/schema).** The output exists, validates against
   the schema, and carries the correct stable id. Fast, free, reproducible.
2. **Level 2 — tool trajectory.** The right tool was actually called and the right
   subagent was delegated to; no forbidden (e.g. network) tool was used. Parsed
   from the run transcript.
3. **Level 3 — LLM-judge.** Open-ended quality (is the reasoning grounded, the
   decision defensible, the recommendations concrete) scored 1-5 by a judge running
   in a separate, fresh context.

On top of these automated levels there is **human evaluation** (`06-human-evaluation.md`):
validating the Level-3 judge against human scores before trusting it, and a human
sign-off that can confirm or override the runs.

## Principles we settled on (and the alternatives)

| Decision | Chosen | Alternatives considered | Why |
|---|---|---|---|
| **Run engine** | Hybrid: live `claude -p` + free deterministic replay | Live-only; pure Python simulation | Replay lets us build/verify the grader for free and deterministically; live proves real behaviour. |
| **Harness location** | A copy inside each scenario (scenario-local) | One shared engine | Scenarios are expected to be complex and varied; a local harness can be adapted per scenario without affecting others. |
| **Component under test** | Copied into the scenario's `bundle/` | Referenced by path | The scenario is self-contained and reproducible; the exact tested version is frozen. A staleness check warns if the original later drifts. |
| **Grading order** | Deterministic (L1/L2) first, judge (L3) last | Judge everything | Deterministic checks are cheaper and more reliable; the judge is only for what code cannot check. |
| **LLM-judge** | Separate context, rubric, small 1-5 scale, reason-before-score | Same-session self-grading | Avoids self-preference and position bias; the judge is itself validated against human labels before being trusted. |
| **Human evaluation** | Judge validation (align judge to humans) + human sign-off of runs | Trust the judge blindly; no human in the loop | An LLM-judge can be miscalibrated, so we calibrate it against a human before trusting L3, and a person can confirm/override consequential runs. See `06-human-evaluation.md`. |
| **Non-determinism** | Run N times, report pass-rate vs a threshold | Single run = verdict | One run is not evidence; a pass-rate captures flakiness. |
| **Value proof** | with-bundle vs without-bundle benchmark | Assume the bundle helps | Shows the components add the value, not that the model would have coped anyway. |

## Isolation

Each run happens in a fresh temporary working directory containing only the bundle
and the fixtures, under a throwaway `CLAUDE_CONFIG_DIR` seeded with credentials only
(so personal settings, memory and history do not leak). Managed/enterprise settings
still apply at OS level by design; a container is the path to a fully clean room for
CI. Run outputs are written to a clean scratch area outside the repo (`runs_dir`).

## CI

The runner exits `0` when the scenario is Passing and `100` otherwise, so a scenario
can gate a pipeline directly. Replay runs need no live model and are the CI-friendly
default; live runs produce the real pass-rate on demand.
