# Human evaluation

Automated grading (Levels 1-3) is not the whole story. The LLM-judge (Level 3) is
itself a model and can be biased or miscalibrated, and some acceptance decisions
should be signed off by a person. Human evaluation covers both, in two distinct
roles.

## Role A — Judge validation (calibrate the measuring instrument)

**Why.** "The judge scored it 5/5" means nothing until we have checked the judge
actually agrees with a human on the same rubric. This is calibration, like checking
a thermometer against a reference before trusting it. It is done once per scenario /
rubric, and again whenever the rubric, judge model, or judge prompt changes — not
per run.

**How it works.**
1. A human scores a small set of candidate outputs (of varying quality) with the
   same rubric the judge uses.
2. The judge scores the same candidates.
3. We measure agreement (within-1 rate, exact-match rate, mean absolute error).
4. If agreement clears `min_judge_agreement`, the judge is marked **validated** for
   this scenario; otherwise fix the rubric / judge and re-check.

**Files** (under `test-scenarios/TS-<id>/expected/human-evaluation/judge-validation/`):
- `candidates/*.json` — candidate outputs of varying quality (good, borderline,
  weak, wrong).
- `human-labels.json` — the human's 1-5 scores per candidate and dimension (you
  fill this).
- `REVIEW.md` — a readable sheet showing the input and every candidate, to score from.
- `alignment.json` — generated: per-dimension and overall agreement, and
  `validated: true/false`.

**Run it.**
```bash
python harness/align_judge.py --scenario test-scenarios/TS-<id>
```
Exit code `0` if validated, `100` if not. It scores the candidates with the same
`harness.judge_model` from `scenario.config.md` that live runs use for Level 3 —
calibration is only meaningful against the exact model that will actually judge
real runs (`--judge-model` overrides it for a one-off check).

**Effect on runs.** Until a scenario has `alignment.json` with `validated: true`,
every Level-3 result carries a **caveat** (`validated_against_humans: false`,
`caveat: "judge not validated against humans"`). This is separate from the run's
Pass/Fail verdict — a passing judge score you cannot yet trust is flagged rather
than silently accepted.

## Role B — Human sign-off (adjudicate the runs)

**Why.** For consequential acceptance, a person should confirm the harness verdicts —
especially borderline `Fail (quality)`, `Flaky`, or a sample of `Pass` runs. The
human can confirm or override, and the decision is recorded as evidence.

**How it works.**
1. Generate a review sheet from a completed run set.
2. A human reads each run's input, output and judge verdict, and marks `Confirm` or
   `Override` with a note.
3. Summarize to a net human sign-off (Accepted, or Rejected by human).

**Files** (under `test-scenarios/TS-<id>/expected/human-evaluation/human-signoff/`):
- `review.md` — generated: input + each run's output + harness/judge verdict.
- `human-verdict.json` — generated blank; the human fills `Confirm`/`Override`.
- `signoff-summary.json` — generated: confirmed/overridden counts and the net status.

**Run it.**
```bash
# generate the sheet from a run set:
python harness/make_review_sheet.py --generate \
  --scenario test-scenarios/TS-<id> \
  --run-set <runs_dir>/<test_scenario>/live-<ts> \
  --out test-scenarios/TS-<id>/expected/human-evaluation/human-signoff
# after a human fills human-verdict.json:
python harness/make_review_sheet.py --summarize \
  --verdict test-scenarios/TS-<id>/expected/human-evaluation/human-signoff/human-verdict.json
```

**Enforcement.** `require_human_signoff` in `scenario.config.md` (`## Settings`) marks a
scenario as requiring sign-off before acceptance. `summarize` exits `100` if any run
was overridden, so it can gate a pipeline.

## Where human evaluation sits relative to the three levels

- Levels 1-3 grade each run automatically.
- **Role A** decides whether the Level-3 judge can be trusted at all (a precondition
  for believing L3 verdicts).
- **Role B** is the human-in-the-loop acceptance on top of the automated verdicts.

Both are deliberately cheap and small: a handful of human scores to calibrate the
judge, and a quick confirm/override pass on the runs.
