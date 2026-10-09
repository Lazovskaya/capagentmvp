# summarize-test-runs (tool config)

Script and behaviour notes for the `summarize-test-runs` tool; no lifecycle tags (local contributor tool).

## Notes

Deterministic reporter + rotator (`summarize_runs.py`): reads a scenario's
`scenario.config.md` for `runs_dir`/`test_scenario`, finds finished `live-*`/
`replay-*` batches not yet in `Complete/`, renders one Markdown report into the
scenario's `test-results/`, and moves the processed batches into
`runs_dir/<test_scenario>/Complete/`. Its scope is slightly broader than a pure in-scenario write because it also moves directories
inside the external `runs_dir` (outside the git repo) — no delete, only move.
Reaches no external system.
