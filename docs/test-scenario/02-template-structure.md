# The test-scenario-template — structure and components

`test-scenario-template/` is the base skeleton every test-scenario is cloned from.
A cloned scenario is a **self-contained workspace**: it carries the component under
test, the scenario definition, the frozen inputs, the expected results, and its own
copy of the run engine.

```
test-scenario-template/
  bundle/                       # the component under test
    CLAUDE.md                   #   bootstrap: "operate as <agent>", read its file
    .claude/agents/<agent>.md   #   the agent (orchestrator) under test
    .claude/agents/<subagent>.md#   a subagent it delegates to (optional)
    tools/<tool>.py             #   a deterministic tool it calls (optional)
    components/*.meta.md         #   governance sidecars (not executed)
  test-scenarios/
    TS-example-01/              # renamed to TS-<id> on clone
      scenario.md               #   human-readable spec (business + expected + routing)
      scenario.config.md          #   machine config (scenario id + ## Settings)
      fixtures/
        <input-file>            #   the frozen input
        golden-run/             #   captured golden run for replay (run-transcript + output)
      expected/
        machine-evaluation/
          l1-evaluation-deterministic/output.schema.json  # Level 1 schema (output structure)
          l3-evaluation-llm-judge/rubric.md                # Level 3 judge rubric (quality)
        human-evaluation/
          judge-validation/     #   Human eval A: candidates + human-labels + alignment
          human-signoff/        #   Human eval B: review sheet + human verdicts (generated)
  harness/                      # the run/grade engine (own copy per scenario)
    runner.py                   #   orchestrator: isolate, run, grade, aggregate
    grader.py                   #   Level 1 (schema/id) + Level 2 (tool trajectory)
    judge.py                    #   Level 3 (LLM-judge, separate context)
    align_judge.py              #   Human eval A: validate the judge against humans
    make_review_sheet.py        #   Human eval B: generate/summarize human sign-off
    lib/                        #   transcript parser, scenario loader, isolation,
                                #   claude launcher, bundle staleness
    requirements.txt
  User input/                   # staging area you fill BEFORE cloning
    Expected input/             #   sample input artifact(s) -> become fixtures
    Expected output/            #   sample/ideal output      -> informs schema + rubric
    Context/                    #   purpose, policy, guardrails, the component itself
```

## What each part is for

### bundle/ — the component under test
A copy of the agent (plus its tools and any subagent) that the scenario tests. It is
copied here from its original location during cloning; that origin is recorded as
`bundle_source` in `scenario.config.md` so the run step can detect if the original
later drifted from this tested copy.

### test-scenarios/TS-<id>/ — the scenario definition
- **scenario.md** — the human-readable spec: the business task, the exact expected
  behaviour per level, and the grading routing (when a run is Pass, Fail, Blocked).
  This is what the business owner signs off.
- **scenario.config.md** — the machine-readable config the harness reads. The
  scenario id sits in the frontmatter; all technical parameters live in a
  `## Settings` block (see below).
- **fixtures/** — the frozen input(s), and `golden-run/` (a captured golden run
  used by replay mode).
- **expected/machine-evaluation/** — grading references nothing human scores:
  `l1-evaluation-deterministic/output.schema.json` (required fields, types and
  enums of a good output, Level 1) and `l3-evaluation-llm-judge/rubric.md` (the
  1-5 quality dimensions the judge scores, Level 3). Level 2 (tool trajectory)
  has no file here — it is configured in `scenario.config.md`'s
  `grading.level2` block, see below.
- **expected/human-evaluation/** — the two human-in-the-loop folders
  (`judge-validation/`, `human-signoff/`), see `06-human-evaluation.md`.

### harness/ — the run engine (scenario-local)
- **runner.py** — reads the scenario config, runs it N times in isolation (live or
  replay), grades each run, applies the routing, and writes `grading.json` /
  `benchmark.json` to `runs_dir`.
- **grader.py** — deterministic Level 1 + Level 2.
- **judge.py** — Level 3 LLM-judge in a separate context.
- **lib/** — `transcript.py` (parse the run), `scenario.py` (read the config),
  `isolation.py` (build the clean room), `runclaude.py` (launch `claude -p`),
  `bundlesync.py` (bundle staleness check).

Each scenario owns its harness copy, so a complex scenario can adapt the engine
without touching other scenarios.

### User input/ — the staging area
What you fill in **before** cloning. `Expected input` sample files become fixtures;
`Expected output` shapes the schema and rubric; `Context` (the component's purpose,
policy/rules, and the component files or their path) informs the whole scenario.

## The `## Settings` block in scenario.config.md

All technical parameters the harness reads:

- `tests_component_kind`, `determinism`
- `runs_required`, `pass_threshold`, `judge_pass_threshold`, `judge_min_dimension`
- `runs_dir` — where run outputs are written (a clean area outside the repo)
- `harness.*` — `bundle_dir`, `bundle_source`, `fixtures`, `task_prompt`,
  `allowed_tools`, `permission_mode`, `output_artifact`, `schema`, `rubric`,
  `model` (agent under test), `judge_model` (Level-3 judge and `align_judge.py`;
  both blank by default = account's managed model). `--model`/`--judge-model`
  on `runner.py`, and `--judge-model` on `align_judge.py`, override them per
  invocation without editing the file.
- `grading.level1` — `expected_stable_id`, `require_schema_valid`
- `grading.level2` — `expected_tool_calls` (each `kind` + `contains` + `why`),
  `forbidden_tools`, `trajectory_mode`
