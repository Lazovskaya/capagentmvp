---
name: create-test-run-summary
description: Turn a test-scenario's completed live/replay run batches into one human-readable Markdown summary (pass-rate, per-run verdicts, judge scores, cost, failure detail), then rotate the summarized batches into a Complete/ folder so the next run only picks up what is new. Use when asked to "summarize the test runs", "show me the results in a readable form", "make a report of the runs", or after running `run-test-scenario` a few times and wanting a human-readable rollup instead of raw grading.json files.
---

# create-test-run-summary (Skill)

Reads a scenario's finished `live-<ts>/` and `replay-<ts>/` run batches from
`runs_dir/<test_scenario>/`, writes one Markdown report into the scenario's own
`test-results/`, and moves the summarized batches into `Complete/` so they are not
summarized again next time.

## Inputs (contract)

- A scenario with at least one finished `run-test-scenario` batch: a `live-<ts>/`
  or `replay-<ts>/` directory under `runs_dir/<test_scenario>/` that already has a
  top-level `grading.json` or `benchmark.json` (i.e. the run finished; a batch
  still in progress has neither yet and is correctly left alone).

## Steps

1. **Locate.** Read `runs_dir` and `test_scenario` from the scenario's
   `scenario.config.md`.
2. **Find new batches.** List `live-*` / `replay-*` directories directly under
   `runs_dir/<test_scenario>/` (skipping `Complete/` itself) that are finished and
   not already inside `Complete/`.
3. **Nothing new?** Report that and stop — no file is written, nothing is moved.
4. **Summarize.** Run the tool:
   ```bash
   python <this-skill>/tools/summarize_runs.py \
     --scenario test-scenarios/TS-<id> [--out test-results]
   ```
   This writes `test-results/summary-<generated-ts>.md` covering every new batch,
   then moves each of those batches into `runs_dir/<test_scenario>/Complete/`.
5. **Report.** Tell the user the summary's path and its headline numbers
   (pass-rate per condition per batch, any flaky/failing runs, judge-validation
   status).

## What the summary contains

- One line of business context (from `scenario.md`), for a standalone read.
- A table of the batches included (mode + timestamp).
- **Live** and **replay** results in **separate sections** — replay re-grades the
  same frozen golden run deterministically and for free; it is not independent
  evidence of the agent's behaviour, so its pass-rate is never folded into live's.
- Per batch: condition summary (status, pass-rate, flaky, mean cost), a per-run
  table (verdict, model, judge model, judge average, turns, cost), and — for any
  failing run — which specific Level 1/2 check failed and why (from the check's
  own `why`/`detail`, not just the verdict label).
- A benchmark's with-bundle vs without-bundle delta, when the batch used
  `--benchmark`.
- One informational line on whether the Level-3 judge is validated against a
  human (`alignment.json`), separate from the pass/fail verdicts above it.

## Guardrails

- `align-<ts>/` batches (judge calibration, Human eval Role A) are **never**
  included or rotated — they test the judge, not the agent; see
  `06-human-evaluation.md`. Only their validation status is surfaced.
- **Uniqueness of `test_scenario` across different local scenario copies is not
  verified by this tool.** If two scenarios share a `test_scenario` id in their
  `scenario.config.md` (and therefore the same `runs_dir` subfolder), their batches
  are indistinguishable to this tool and moving one scenario's batches to
  `Complete/` will also move the other's. Keeping ids unique is on the user —
  the runs folder should be clean (i.e., belong to one scenario) before running
  this skill.
- Never re-summarizes a batch already in `Complete/`; never deletes anything —
  rotation is a move, not a delete.

## Output Contract

| Field | Type | Description |
|---|---|---|
| `test-results/summary-<ts>.md` | file | Human-readable run summary for the batches processed this time. |
| `runs_dir/<test_scenario>/Complete/<batch>/` | folder | Each summarized batch, moved out of the active queue. |
| final message | text | Summary path + headline pass-rate/flaky/judge-validation status. |
