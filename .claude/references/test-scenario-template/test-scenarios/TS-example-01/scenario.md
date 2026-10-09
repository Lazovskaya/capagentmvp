---
name: <scenario-id>
description: <one line: what this scenario proves about the component under test>
---

# TS-<scenario-id> — <short title>

## Business context (signed off by the business owner)

- **Task:** <the business task the component performs>
- **Input artifact:** `fixtures/<input-file>` (one frozen input case).
- **Expected result (in business terms):** <what a good output looks like to the business>

## Setup — isolation

- **Bundle under test:** `bundle/` (<agent + tool + subagent, name them>).
- **Allowed tools:** <e.g. Bash, Task, Read, Write, Glob, Grep> (nothing else).
- **Forbidden:** any network (`WebFetch`, `WebSearch`).
- **Isolation:** fresh temp working directory + isolated `CLAUDE_CONFIG_DIR`
  (only credentials seeded); runs go to the `runs_dir` from `scenario.config.md`.

## Task prompt (fed into the clean session — verbatim)

> <the exact prompt; must match `harness.task_prompt` in scenario.config.md>

## Expected — activation

- MUST run: the `<component-under-test>` agent.
- MUST delegate to: the `<subagent>` subagent (if the component uses one).

## Expected — behavior (by level)

### Level 1 — deterministic (code/schema)
- [ ] `<output-file>` was created in the working directory.
- [ ] It validates against `expected/machine-evaluation/l1-evaluation-deterministic/output.schema.json`.
- [ ] `<stable id field>` == `<expected id>` (verbatim).
- [ ] <other required fields / enums present>.

### Level 2 — tool trajectory (any-order)
- [ ] The `<tool>` was invoked (a Bash call running `<script>`).
- [ ] The `<subagent>` subagent was invoked (an Agent call), if used.
- [ ] No forbidden tool (`WebFetch`/`WebSearch`) was used.

### Level 3 — LLM-judge (rubric, 1-5, separate context)
- [ ] <quality dimension 1, e.g. rationale grounded in real figures>.
- [ ] <quality dimension 2, e.g. decision defensible>.
- [ ] <quality dimension 3, e.g. recommendations concrete>.
- Pass when avg score >= `judge_pass_threshold` and no dimension < `judge_min_dimension`
  (see `expected/machine-evaluation/l3-evaluation-llm-judge/rubric.md`).

## Grading routing (explicit test)

- Level 1 ✔ AND Level 2 ✔ AND (judge disabled OR judge ✔) → **Pass**
- Any Level 1 ✘ → **Fail** (hard; judge is not run)
- Level 1 ✔ but Level 2 ✘ → **Fail (trajectory)**
- Level 1+2 ✔ but judge < threshold → **Fail (quality)**
- Harness/environment error (not the component's fault) → **Blocked** (not Fail)
- Mixed Pass/Fail across runs on identical input → scenario is **Flaky**.

## Scenario verdict

Run `runs_required` times; **Passing** if pass-rate >= `pass_threshold`. Per-run
metrics (tokens, cost, turns, tool count) are recorded in `runs_dir/.../grading.json`.
