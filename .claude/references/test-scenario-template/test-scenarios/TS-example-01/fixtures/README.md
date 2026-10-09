# fixtures/ — frozen inputs and the golden run

- **Input fixture(s)** (e.g. `customer-card.md`): the frozen input the component
  works on. Listed under `harness.fixtures` in `scenario.config.md`. Same input every
  run, so results do not drift because of changing data.

- **`golden-run/`**: a captured golden run used by **replay** mode — a deterministic,
  free re-grade that needs no live model. It holds:
  - `run-transcript.jsonl` — one real run's `stream-json` transcript.
  - `<output_artifact>` — the output that run produced.

  Capture it once from a good live run (see the "create a scenario" guide). It is a
  committed test asset (INPUT to replay), distinct from the transient run outputs
  that land in `runs_dir`.
