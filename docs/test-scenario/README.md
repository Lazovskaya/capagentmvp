# test-scenario

Everything for **testing AI components** — turning a shipped agent/skill into a
repeatable, gradable test-scenario. Start with the guides.

## Contents

| Location | What it is |
|---|---|
| `docs/test-scenario/` (this folder) | The guides (numbered `01`-`06`) and the overview deck. Read these first: overview & principles, template structure, how to create a scenario, runnability requirements, and a plain-language end-to-end walkthrough. |
| `.claude/references/test-scenario-template/` | The base skeleton every scenario is cloned from (data + its own harness copy). Do not run tests from here. |
| `.claude/skills/clone-test-scenario/` | Local contributor skill (+ scaffold tool) that creates a new scenario from the template and a `User input/` staging area. |
| `.claude/skills/run-test-scenario/` | Local contributor skill (+ capture tool) that runs a scenario and reports the verdict. |
| `.claude/skills/create-test-run-summary/` | Local contributor skill (+ summarize tool) that rolls finished run batches into one Markdown report. |

Scenario settings live in each scenario's `scenario.config.md`; the tools keep their
notes in `tools/<tool>.tool.config.md`. Real runs go **outside** the repo, to the
`runs_dir` set in `scenario.config.md`.

## The guides (read in order)

1. `01-testing-overview-and-principles.md` — what we test, the three grading levels, and the principles we chose vs the alternatives.
2. `02-template-structure.md` — every part of the template and what it is for.
3. `03-create-scenario-from-template.md` — how to build a new scenario.
4. `04-scenario-runnability-requirements.md` — the checklist a scenario must satisfy to run.
5. `05-end-to-end-run.md` — the whole chain in plain language, from a new component to a tested one.
5.1. `05.1-end-to-end-run-easy-go.md` — the condensed, 5-step version of #5, for a first-time user.
6. `06-human-evaluation.md` — validating the LLM-judge against humans, and human sign-off of runs.

## Two-minute mental model

Fill `User input/` (a sample input, a sample good output, and context) → the
`clone-test-scenario` skill builds a runnable scenario from the template → the
`run-test-scenario` skill runs it (a first live run, freeze a golden run, then free
replay, real pass-rate live, and a with/without-bundle benchmark) → validate the
judge against a human and have a person sign off (human evaluation) → read the
verdict in `runs_dir`. Each scenario is self-contained and carries its own harness
copy.
