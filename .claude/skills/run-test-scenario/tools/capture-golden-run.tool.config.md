# capture-golden-run (tool config)

Script and behaviour notes for the `capture-golden-run` tool; no lifecycle tags (local contributor tool).

## Notes

Deterministic helper (`capture_golden.py`): copies a chosen live run's
`run-transcript.jsonl` and produced output artifact into the scenario's
`fixtures/golden-run/`, establishing the replay baseline. Reaches no external system.
