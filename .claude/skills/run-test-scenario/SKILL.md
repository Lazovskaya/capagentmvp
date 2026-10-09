---
name: run-test-scenario
description: Run a test-scenario against its bundled component using the scenario's own harness - a first live verification run, capturing the golden replay fixture, then replay/live/benchmark as needed, and reporting the verdict. Use when asked to "run a test scenario", "test this component", "execute the scenario", "run the harness", or "benchmark with vs without the bundle".
---

# run-test-scenario (Skill)

Execute a test-scenario and report whether the component passes. Uses the scenario
workspace's own `harness/runner.py` (each scenario carries its own harness copy).

## Inputs (contract)

- A scenario workspace with a filled `test-scenarios/TS-<id>/` (see
  `clone-test-scenario`) and a `bundle/` containing the component under test.
- Prerequisites: `claude` logged in; `pip install -r harness/requirements.txt`.

## Steps

1. **Locate.** Find `harness/runner.py` and the scenario dir
   `test-scenarios/TS-<id>/` in the workspace.

2. **Bundle freshness (staleness gate).** For live runs the runner compares
   `bundle/` against `harness.bundle_source`. If it drifted, the runner prints
   `BUNDLE STALE` and exits with code 3. When that happens, **ask the user**:
   - refresh the tested copy from the source → re-run with `--update-bundle`, or
   - keep testing the existing copy → re-run with `--keep-bundle`.

3. **First live verification (1 run).** Confirm the component works end-to-end:

   ```bash
   python harness/runner.py --scenario test-scenarios/TS-<id> --mode live --runs 1
   ```

   Inspect the printed verdict and the per-run `grading.json`.

4. **Capture the golden fixture.** If that run passed Level 1+2, freeze it for
   replay:

   ```bash
   python <this-skill>/tools/capture_golden.py \
     --scenario test-scenarios/TS-<id> \
     --run-dir <runs_dir>/<test_scenario>/live-<ts>/with-bundle/run-1 \
     --output-artifact <output_artifact>
   ```

   Now `--mode replay` grades deterministically and for free.

5. **Run per need.**
   - Deterministic self-check (free): `--mode replay --runs 3`
   - Real pass-rate with quality judge: `--mode live --runs N --with-judge`
   - Value proof (with vs without bundle): add `--benchmark`

6. **Human evaluation (see guide 06).**
   - *Judge validation (Role A):* if the scenario has
     `expected/human-evaluation/judge-validation/` with human-labels filled, run
     `python harness/align_judge.py --scenario test-scenarios/TS-<id>` to check the
     judge agrees with the human. Until it does, every Level-3 result carries a
     "judge not validated against humans" caveat.
   - *Human sign-off (Role B):* generate a review sheet with
     `make_review_sheet.py --generate ...`, have a person mark Confirm/Override in
     `human-verdict.json`, then `make_review_sheet.py --summarize ...` for the net
     sign-off. Required when `require_human_signoff: true`.

7. **Report the verdict.** Read the top-level `grading.json` / `benchmark.json`
   from `runs_dir`; state the pass-rate vs `pass_threshold`, any flakiness, judge
   scores (and whether the judge is validated), and per-run cost/turns. The runner
   exit code is `0` (Passing) or `100` (Failing) for CI.

## Guardrails

- Runs are written to `runs_dir` (from `scenario.config.md`), a clean area outside the
  repo — never into the scenario folder.
- Do not silently overwrite the golden run; only re-capture when intentionally
  re-baselining after a component change.
- Live runs cost tokens; prefer replay for iterating on the harness/grader.
- `harness.model` / `harness.judge_model` in `scenario.config.md` pick which model
  runs the agent and which judges it; `--model` / `--judge-model` on `runner.py`
  and `--judge-model` on `align_judge.py` override them for one invocation.

## Output Contract

| Field | Type | Description |
|---|---|---|
| `runs_dir/<test_scenario>/<mode>-<ts>/` | folder | Transcripts + per-run and summary grading.json (+ benchmark.json). |
| final message | text | Scenario status (Passing/Failing), pass-rate vs threshold, judge scores, cost. |
