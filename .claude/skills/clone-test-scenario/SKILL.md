---
name: clone-test-scenario
description: Create a new runnable test-scenario from the test-scenario-template by reading a populated "User input" staging area (Expected input, Expected output, Context) and the component under test, then scaffolding and filling in the scenario. Use when asked to "create a test scenario", "clone the test-scenario template", "set up a test for this agent/skill", or "scaffold a new test-scenario".
---

# clone-test-scenario (Skill)

Turn a populated `User input/` staging area plus a target component into a complete,
runnable test-scenario built from `test-scenario-template`. You do the reasoning
(deriving the schema, rubric, fixtures, expected tool calls); a small tool does the
mechanical copy.

## Inputs (contract)

A target workspace directory that contains a populated staging area:

```
<workspace>/User input/
  Expected input/    # sample input artifact(s) the component consumes
  Expected output/   # a sample or ideal output artifact (shape of a good result)
  Context/           # extra info: the component's purpose, policy/rules, guardrails,
                     # and either the component's files or a path to them
```

You also need the **component under test** (agent + its tool(s) + any subagent) and
its original location (`bundle_source`). It may be provided as a path in `Context/`
or created alongside the workspace.

## Steps

1. **Read the staging area.** Read every file under `User input/Expected input`,
   `User input/Expected output`, and `User input/Context`. Identify: the business
   task, the input shape, what a good output looks like, and the component under
   test (its agent/tool/subagent names and its source path).

2. **Choose a scenario id.** `<process>-<role>-NN` style, e.g. `invoice-validation-01`.

3. **Scaffold (mechanical copy).** Run the tool:

   ```bash
   python <this-skill>/tools/scaffold_scenario.py \
     --template <repo>/.claude/references/test-scenario-template \
     --target   <workspace> \
     --scenario-id <id> \
     --bundle-source <path-to-original-component>
   ```

   This copies the template into the workspace (keeping `User input/`), renames the
   scenario folder to `TS-<id>`, and copies the component into `bundle/`.

4. **Fill the scenario (reasoning).** Edit the scaffolded files, replacing every
   `<...>` placeholder:
   - `test-scenarios/TS-<id>/scenario.config.md` — scenario id + `## Settings`:
     set `test_scenario`, `runs_dir`, `harness.bundle_source` (the original
     path, for the staleness check), `harness.fixtures` (the input filename),
     `harness.task_prompt`, `harness.output_artifact`, `harness.allowed_tools`,
     `harness.model`/`harness.judge_model` (leave blank for the account default
     unless the engagement needs a specific model pinned);
     and `grading.level1.expected_stable_id`, `grading.level2.expected_tool_calls`
     (the tool's Bash call + the subagent's Agent call, if any).
   - `expected/machine-evaluation/l1-evaluation-deterministic/output.schema.json`
     — derive required fields, types and enums from the `Expected output` sample.
   - `expected/machine-evaluation/l3-evaluation-llm-judge/rubric.md` — derive the
     1-5 quality dimensions from `Context` (keep the JSON keys
     `grounding`/`defensibility`/`relevance` unless you also update `judge.py`).
   - `scenario.md` — write the human-readable spec (business task, expectations,
     routing) consistent with the meta.
   - `fixtures/` — copy the `Expected input` file(s) here as the input fixture(s)
     named in `harness.fixtures`.
   - `bundle/CLAUDE.md` — set the real agent name and input filename.
   - `expected/human-evaluation/judge-validation/` — seed a few candidate outputs
     of varying quality (good, borderline, weak, wrong) in `candidates/` and list
     them in `human-labels.json` with blank scores, so the judge can later be
     validated against a human (Human evaluation Role A; see guide 06). Leave the
     human scores for a person to fill.

5. **Validate against [Anchor_1].** Check the scenario against
   `<repo>/docs/test-scenario/04-scenario-runnability-requirements.md`
   (the runnability checklist). Fix anything missing.

6. **Report.** Tell the user the scenario is ready and that the next step is the
   `run-test-scenario` skill (first live run + capture the golden fixture).

## Guardrails

- Do not invent input data: fixtures come from `Expected input`.
- The output schema must match a *good* output, not be trivially loose.
- Keep `expected_stable_id` to an id that genuinely appears verbatim in the output.
- Leave the `harness/` copy as-is unless the component needs a check outside the
  Level 1/2/3 model (then adapt this scenario's harness, not others').

## Output Contract

| Field | Type | Description |
|---|---|---|
| `<workspace>/test-scenarios/TS-<id>/` | folder | Filled, runnable scenario (spec, meta, fixtures, expected). |
| `<workspace>/bundle/` | folder | The component under test, copied from its source. |
| final message | text | Scenario id, its path, and the go/no-go against [Anchor_1]. |
