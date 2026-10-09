# judge-validation/ — Human evaluation, Role A

Calibrate the Level-3 judge against a human before trusting it. See
`<repo>/docs/test-scenario/06-human-evaluation.md`.

The rubric it scores against now lives at
`../../machine-evaluation/l3-evaluation-llm-judge/rubric.md`.

Fill this folder when creating the scenario:
- `candidates/*.json` — a few candidate outputs of varying quality (good, borderline,
  weak, wrong) for the scenario's input.
- `human-labels.json` — a human's 1-5 scores per candidate and dimension.
- `REVIEW.md` (optional) — a readable sheet to score from.

Then run:
```bash
python harness/align_judge.py --scenario test-scenarios/TS-<id>
```
It writes `alignment.json` (`validated: true/false`). Until validated, every Level-3
result in a run carries a "judge not validated against humans" caveat.
