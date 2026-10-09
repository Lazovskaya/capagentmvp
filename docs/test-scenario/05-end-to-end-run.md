# End-to-end: from a new component to a tested one

A plain-language walkthrough of the whole chain, for someone new to this. Each step
says what you do, what happens, and the command. Read top to bottom.

Three skills do the heavy lifting: `clone-test-scenario` (build the test),
`run-test-scenario` (run the test), and `create-test-run-summary` (turn the raw
run output into a human-readable report). Everything runs from the scenario
workspace.

---

## Step 0 — Prerequisites
Make sure `claude` is installed and logged in once, and install the harness deps.
```bash
python -m pip install -r <workspace>/harness/requirements.txt   # jsonschema, PyYAML
```

## Step 1 — Have the component you want to test
This is the agent (with its tool(s) and any subagent) you built and want to prove.
It lives at some path — remember it; the test will copy it and watch it for changes.

## Step 2 — Describe the task (fill "User input")
Create a workspace folder and drop three things into `User input/`:
- `Expected input/` — one realistic input the component will work on.
- `Expected output/` — a sample of what a *good* result looks like.
- `Context/` — the component's purpose, any rules/policy, and the component itself
  (or a path to it).
This is where the business knowledge enters; you are not writing code here.

## Step 3 — Build the test (clone the template)
Run the `clone-test-scenario` skill. It copies the template, copies your component
into `bundle/`, and fills in the scenario from your `User input/`: the input becomes
a fixture, the sample output becomes a schema, the context becomes a judge rubric,
and the expected tool/subagent calls are recorded.
```bash
python .claude/skills/clone-test-scenario/tools/scaffold_scenario.py \
  --template .claude/references/test-scenario-template \
  --target   <workspace> --scenario-id <id> --bundle-source <component-path>
# then the skill fills scenario.config.md, scenario.md, expected/*, fixtures/*
```
Result: a runnable `test-scenarios/TS-<id>/`.

## Step 4 — Check it is runnable
Verify the scenario against the runnability checklist
(`04-scenario-runnability-requirements.md`). Fix anything missing. No live model
needed yet.

## Step 5 — First live run (does it work at all?)
Run the component for real, once, in an isolated clean session.
```bash
python harness/runner.py --scenario test-scenarios/TS-<id> --mode live --runs 1
```
What happens: a fresh `claude` session reads the input, calls the tool, delegates to
the subagent, and writes the output; the harness grades Levels 1 and 2 and prints a
verdict. Look at the per-run `grading.json` if anything fails, and adjust.

## Step 6 — Freeze a "golden" run
Once a live run passes, capture it so future checks are free and repeatable.
```bash
python .claude/skills/run-test-scenario/tools/capture_golden.py \
  --scenario test-scenarios/TS-<id> \
  --run-dir <runs_dir>/<test_scenario>/live-<ts>/with-bundle/run-1 \
  --output-artifact <output-file>
```
This stores a transcript + output under `fixtures/golden-run/` — the replay baseline.

## Step 7 — Iterate for free (replay)
While you tune the schema, rubric, or expected calls, re-grade the golden run
instantly and at no cost.
```bash
python harness/runner.py --scenario test-scenarios/TS-<id> --mode replay --runs 3
```
Keep going until replay is a clean Pass. You are debugging the *test*, not spending
tokens on the model.

## Step 8 — Get the real pass-rate (live + judge)
Now measure how the component behaves across several real runs, including the quality
judge.
```bash
python harness/runner.py --scenario test-scenarios/TS-<id> --mode live --runs 3 --with-judge
```
Because the model is non-deterministic, the verdict is a pass-rate compared to
`pass_threshold`, not a single run. Which model runs the agent and which judges
it come from `harness.model` / `harness.judge_model` in `scenario.config.md`
(blank = account default); `--model` / `--judge-model` override them for one
invocation without editing the file.

## Step 9 — Prove the component adds value
Run the same task with and without the bundle. Without it, the bare session should
fail (no proper output); this is the evidence that the component is what makes the
task work.
```bash
python harness/runner.py --scenario test-scenarios/TS-<id> --mode live --runs 3 --with-judge --benchmark
```

## Step 10 — Read the result
Open `runs_dir/<test_scenario>/<mode>-<ts>/grading.json` (and `benchmark.json`).
Check `status` (Passing/Failing), `pass_rate` vs `pass_threshold`, `flaky`, the
judge scores, and per-run cost/turns. The runner also exits `0` (Passing) or `100`
(Failing) for CI.

## Step 11 — Human evaluation (optional, but required if `require_human_signoff: true`)
Automated grading (Levels 1-3) is not the whole story: the Level-3 judge is itself
a model and can be miscalibrated, and some acceptance decisions deserve a human
sign-off on top of the automated verdict. See `06-human-evaluation.md` for both
roles in full — Role A (`align_judge.py`, calibrate the judge against a human)
and Role B (`make_review_sheet.py --generate`/`--summarize`, human confirms or
overrides the runs).

## Step 12 — Summarize the results into a human-readable report
Raw `grading.json`/`benchmark.json` files are exact but not pleasant to read.
Run the `create-test-run-summary` skill to turn every finished, not-yet-summarized
`live-<ts>`/`replay-<ts>` batch into one Markdown report.
```bash
python .claude/skills/create-test-run-summary/tools/summarize_runs.py \
  --scenario test-scenarios/TS-<id>
```
Result: `test-results/summary-<ts>.md` — pass-rate per batch/condition, a per-run
table (verdict, model, judge score, cost), failure detail for anything that
didn't pass, and the judge-validation status. The summarized batches are then
moved into `runs_dir/<test_scenario>/Complete/`, so the next summary only covers
what is new. `align-<ts>/` batches are never included here — they calibrate the
judge, not the agent (Step 11); only their validation status is surfaced.

## Step 13 — Later: the component changes
When you edit the original component, the next live run notices that `bundle/` no
longer matches its source and stops with a `BUNDLE STALE` message. Decide:
- refresh the tested copy → re-run with `--update-bundle` (then re-capture the golden
  run), or
- keep testing the frozen copy → re-run with `--keep-bundle`.

## Step 14 — Commit and let CI guard it
Commit the scenario (`scenario.*`, `fixtures/` including `golden-run/`, `expected/`,
`bundle/`) to the repo. CI runs `--mode replay` (free, deterministic) and fails the
build on exit code `100`, so a regression in the component or the scenario is caught
automatically.

---

### The one-line mental model
Fill `User input` → clone into a scenario → run live once → freeze a golden run →
iterate free on replay → measure pass-rate live → prove value with a benchmark →
read the verdict → (optional) human evaluation → summarize into a report →
commit for CI.

---

### [ADD] Worked example — a finished scenario's file tree

`TS-invoice-validation-01` after Steps 3-6 have all run, showing what each file is for:

```
TS-invoice-validation-01/
├── scenario.md                          — human-readable spec: business task,
│                                           expected behaviour per level, Pass/Fail/
│                                           Blocked routing. What the business owner
│                                           signs off (Step 3/4).
├── scenario.config.md                     — machine-readable config: scenario id
│                                           in the frontmatter + the ## Settings block
│                                           the harness reads (fixtures, task_prompt,
│                                           allowed_tools, grading rules, etc.).
│
├── fixtures/                            — frozen input (Step 2/3)
│   ├── README.md                        — explains this folder's purpose
│   ├── invoice.md                       — the frozen input fixture; same on every run
│   │                                       so results don't drift with changing data
│   └── golden-run/                      — the golden run captured in Step 6, used by
│       │                                   replay mode (Step 7)
│       ├── invoice-validation.json      — the output artifact from that golden run
│       └── run-transcript.jsonl         — its full stream-json transcript
│
└── expected/                            — grading references (Step 3/4)
    ├── machine-evaluation/              — deterministic + judge references, no human
    │   ├── README.md                    — notes that Level 2 lives in scenario.config.md,
    │   │                                   not a file here
    │   ├── l1-evaluation-deterministic/
    │   │   └── output.schema.json       — Level 1: required fields/types (schema)
    │   └── l3-evaluation-llm-judge/
    │       └── rubric.md                — Level 3: 1-5 quality dimensions for the
    │                                       LLM-judge
    │
    └── human-evaluation/                — the human-in-the-loop side (06-human-evaluation.md)
        ├── judge-validation/            — Human eval Role A: calibrate the judge
        │   ├── candidates/              — sample outputs of varying quality
        │   │   ├── candidate-good.json
        │   │   ├── candidate-weak.json
        │   │   ├── candidate-reject.json
        │   │   └── candidate-wrong.json
        │   ├── REVIEW.md                — sheet a human scores the candidates from
        │   ├── human-labels.json        — the human's 1-5 scores (filled by hand)
        │   └── alignment.json           — generated: judge/human agreement +
        │                                   validated: true/false, and which
        │                                   judge_model was calibrated
        │
        └── human-signoff/               — Human eval Role B: sign off real runs
            ├── review.md                — generated: each run's input/output/verdict
            ├── human-verdict.json       — generated blank; human marks Confirm/
            │                               Override
            └── signoff-summary.json     — generated: net Accepted / Rejected by
                                            human status
```

---

### [ADD] The three run modes — align, live, replay

The harness has three run modes. They are not three variants of "run the test" —
each answers a different question, at a different cost, and none of them replaces
the others.

**The problem they solve.** A model is not deterministic: the same input can
produce a slightly different output on two runs, so one run is never proof of
anything (Step 8-9). And the Level-3 LLM-judge is itself a model that can be
biased or miscalibrated, so its scores cannot be trusted blindly either
(`06-human-evaluation.md`). Three modes exist because "does the agent work",
"is the judge trustworthy", and "does the test itself still grade correctly" are
three separate questions.

- **`live`** — the only mode that actually calls a real model on the agent under
  test. Each run gets a fresh, isolated working copy of `bundle/` plus the fixture,
  and a throwaway config directory, so runs cannot leak into each other (see
  "Isolation" in `01-testing-overview-and-principles.md`). Because the model is
  non-deterministic, `live` is run **N times** (Step 8) and reported as a
  pass-rate against `pass_threshold`, not a single verdict. It can optionally
  attach a Level-3 judge session per run, and optionally run the same task
  **without** the bundle to prove the component adds value (Step 9,
  `benchmark.json`). This is the expensive, ground-truth mode — real tokens, real
  time, real cost per run.

- **`replay`** — re-grades a **frozen** golden run (Step 6: one good `live` run,
  captured once into `fixtures/golden-run/`) without calling any model at all. It
  feeds the same recorded transcript and output back through the grader, so you
  can rewrite the schema, rubric, or the expected tool calls and
  re-check them instantly and for free (Step 7), as many times as needed, while
  you debug the *test* rather than the agent. Because it needs no live model and
  is fully deterministic, it is the natural fit for a CI gate (the runner's exit
  code `0`/`100` is designed for this) — note that wiring an actual CI job to call
  it is a separate, project-specific setup step, not something that happens
  automatically just because the mode exists.

- **`align`** — does not test the agent at all; it tests whether the Level-3
  **judge** can be trusted (Human eval Role A). It runs the judge against a small,
  fixed set of hand-picked candidate outputs of known quality (e.g. a good one, a
  weak one, a wrong one) and compares the judge's scores to a human's scores on
  the same rubric. Done once per scenario/rubric, not per run — its output
  (`alignment.json`, outside these run folders) flips a scenario's judge to
  "validated" or leaves every Level-3 result carrying a caveat.

**How they fit together over time:**
```
align   → run once (and again if the rubric/judge changes) to trust the judge at all
live    → first real run to prove the agent works → freeze it as the golden run
live    → repeated + judged + benchmarked, to get a real pass-rate and value proof
replay  → unlimited free iterations on the grader itself, and the CI-friendly check
```

**What a run of each mode leaves behind**, in generic form (`runs_dir` is
`## Settings`'s `runs_dir`, outside the repo):

```
runs_dir/<test_scenario>/
├── align-<timestamp>/                  — judge calibration pass, no agent involved
│   ├── good/                           — one folder per candidate of known quality
│   ├── weak/                           #   (good / borderline / weak / wrong, ...)
│   └── .../
│       ├── judge-transcript.jsonl      — the judge's own reasoning + score for that candidate
│       └── cfg/                        — throwaway config dir for that judge session
│
├── live-<timestamp>/                   — real runs of the agent under test
│   ├── benchmark.json                  — with-bundle vs without-bundle comparison (value proof)
│   ├── with-bundle/
│   │   ├── grading.json                — aggregated verdict across all with-bundle runs
│   │   └── run-N/
│   │       ├── work/                   — isolated copy: bundle + fixture + any tool(s)
│   │       ├── cfg/                    — throwaway config dir for this run
│   │       ├── run-transcript.jsonl    — this run's real stream-json transcript
│   │       ├── <output-artifact>       — the real output this run produced
│   │       ├── grading.json            — this run's Level 1/2(/3) verdict + which
│   │       │                              model/judge_model produced it
│   │       └── judge/                  — optional Level-3 judge session, separate context
│   └── without-bundle/
│       └── run-N/ ...                  — same shape, no bundle/tools — the baseline for benchmark.json
│
└── replay-<timestamp>/                 — free, deterministic re-grade, no model call
    └── with-bundle/run-1/
        ├── run-transcript.jsonl        — copied from fixtures/golden-run/, not a new session
        ├── <output-artifact>           — copied from fixtures/golden-run/
        └── grading.json                — the grader re-run against schema/rubric
```
