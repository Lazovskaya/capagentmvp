# Scenario runnability requirements  [Anchor_1]

A scenario is **runnable** when it satisfies every requirement below. The
`clone-test-scenario` skill validates against this list, and the `run-test-scenario`
skill assumes it. Use it as a pre-flight checklist.

## 1. Files present

- [ ] `test-scenarios/TS-<id>/scenario.config.md`
- [ ] `test-scenarios/TS-<id>/scenario.md`
- [ ] `test-scenarios/TS-<id>/expected/machine-evaluation/l1-evaluation-deterministic/output.schema.json`
- [ ] `test-scenarios/TS-<id>/expected/machine-evaluation/l3-evaluation-llm-judge/rubric.md`
- [ ] `test-scenarios/TS-<id>/fixtures/<each file listed in harness.fixtures>`
- [ ] `bundle/` contains the component (at least one `.claude/agents/*.md`) and, if
      the component calls a tool, the tool under `bundle/tools/`
- [ ] `harness/runner.py` (and `grader.py`, `judge.py`, `lib/`) present

## 2. scenario.config.md is complete and valid

- [ ] Frontmatter parses and has `test_scenario`.
- [ ] A `## Settings` YAML block exists and parses.
- [ ] No `<...>` placeholders remain anywhere in the file.
- [ ] `runs_required` >= 1; `0 < pass_threshold <= 1`.
- [ ] `judge_pass_threshold` in 1-5; `judge_min_dimension` in 1-5.
- [ ] `runs_dir` is set to a writable path outside the repo.
- [ ] `harness.bundle_dir` = `bundle`; `harness.output_artifact` is a filename.
- [ ] `harness.fixtures` lists at least one file, and each exists in `fixtures/`.
- [ ] `harness.task_prompt` is non-empty and refers to the actual input file.
- [ ] `harness.allowed_tools` includes every tool the component needs (e.g. `Bash`
      for a tool call, `Task` for a subagent) and nothing gratuitous.
- [ ] `harness.schema` and `harness.rubric` point at the files in
      `expected/machine-evaluation/`.
- [ ] `harness.model` / `harness.judge_model` are either blank (account default)
      or a real model id/alias.

## 3. Grading config is meaningful

- [ ] `grading.level1.expected_stable_id` is a value that genuinely appears verbatim
      in a correct output (not a guess).
- [ ] `grading.level2.expected_tool_calls` has one entry per required behaviour:
  - the tool call: `kind: bash`, `contains: <script name>`;
  - the subagent (if any): `kind: agent`, `contains: <subagent name>`.
  - `kind` matches the real tool name in the transcript (the subagent-spawn tool is
    `Agent` in current Claude Code).
- [ ] `grading.level2.forbidden_tools` lists tools that must never be used
      (at least `WebFetch`, `WebSearch` unless the component legitimately needs them).

## 4. Expected output schema is honest

- [ ] `output.schema.json` is valid JSON Schema (draft-07).
- [ ] `required` lists the fields a correct output must have, including the stable-id
      field and the main decision field.
- [ ] Enumerated decisions use `enum`; free-text justification uses a sensible
      `minLength`. The schema should reject an obviously bad output, not just any
      JSON.

## 5. Rubric is judge-ready

- [ ] Three dimensions with 1-5 anchors and reason-before-score.
- [ ] The output JSON block uses the keys `grounding`, `defensibility`, `relevance`
      (or `judge.py` is updated to match).

## 6. Bundle is consistent

- [ ] `bundle/CLAUDE.md` names the real agent and the real input filename.
- [ ] The agent's declared tools cover what the scenario expects it to call.
- [ ] If `harness.bundle_source` is set, it points at the original component (used
      for the staleness check).

## 7. Prompt / behaviour consistency

- [ ] The prompt in `scenario.md` matches `harness.task_prompt` verbatim.
- [ ] The tools named in `expected_tool_calls` are within `allowed_tools`.
- [ ] The stable id in `expected_stable_id` also appears in the input fixture (so a
      correct run can carry it through).

## 8. Human evaluation (recommended, not required to run)

- [ ] `expected/human-evaluation/judge-validation/` has candidates + filled
      `human-labels.json`, and
      `align_judge.py` has produced `alignment.json` with `validated: true`. Until
      then, Level-3 results are flagged "judge not validated against humans".
- [ ] If `require_human_signoff: true`, a human `human-verdict.json` exists and
      `make_review_sheet.py --summarize` reports Accepted.

See `06-human-evaluation.md`.

A scenario missing any Section 1-3 item cannot run correctly. Sections 4-7 are what
make a passing result trustworthy rather than accidental; Section 8 is what lets you
trust the judge and the acceptance decision.
