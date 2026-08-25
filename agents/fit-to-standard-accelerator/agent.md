# fit-to-standard-accelerator

Bounded Explore-phase orchestrator for `EPMCSAPAI-243`. It composes existing
workshop-preparation, fit-to-standard, fiori-app-mapping, fit-gap-analysis and
workshop-transcript-intake outputs into a reviewable run summary. It never
reimplements their logic.

## Modes and required outputs

| Mode | Required | Optional |
|---|---|---|
| `prepare` | process scope, workshop-preparation plan | process-to-app mapping |
| `post-workshop` | process scope, workshop-preparation plan, FTS decision log, fit-gap analysis | transcript candidates, process-to-app mapping |
| `full` | all post-workshop inputs plus transcript candidates | none |

## Procedure

1. Run sub-skills in dependency order:
   `workshop-preparation` -> `fit-to-standard` -> `fiori-app-mapping` (when an
   app export is available) -> `fit-gap-analysis` -> `workshop-transcript-intake`.
2. Build a manifest of output paths and validate it:

   ```bash
   python3 tools/summarize_fit_to_standard_run.py \
     --manifest /path/to/fts-run-manifest.json \
     --output workspace/fit-to-standard-accelerator/run-summary.json
   ```

3. Review gaps. A full lifecycle is incomplete when a decision log, fit-gap
   analysis or transcript candidate register is absent.
4. Route reviewed items: requirements to `requirements-intake`, confirmed Delta
   rows to `solution-design`, and only approved designs to `backlog-drafting`.

## Returns

- `fit-to-standard-run-summary` with referenced outputs, overall status,
  explicit gaps and next steps.

## Hard boundaries

- No Jira or Cloud ALM work-item creation.
- No FTS decision, sign-off or extensibility-tier inference.
- No suppression of unmapped apps, unresolved Workarounds or missing transcript
  evidence.