# Creating a new test-scenario from the template

This is the clone workflow, performed by the `clone-test-scenario` skill (a person
can also do it by hand following the same steps). It turns a populated `User input/`
staging area plus a component into a complete, runnable scenario.

## Before you start

1. Have the **component under test** ready (an agent, with its tool(s) and any
   subagent) at a known path. This is its `bundle_source`.
2. Create a workspace folder for the scenario and populate the staging area:

   ```
   <workspace>/User input/
     Expected input/    # one sample input artifact the component consumes
     Expected output/   # a sample or ideal output (what a good result looks like)
     Context/           # the component's purpose, any policy/rules, guardrails,
                        # and the component files or a path to them
   ```

## Steps

1. **Scaffold (mechanical copy).** Run the scaffolder to clone the template into the
   workspace and copy the component into `bundle/`:

   ```bash
   python .claude/skills/clone-test-scenario/tools/scaffold_scenario.py \
     --template   .claude/references/test-scenario-template \
     --target     <workspace> \
     --scenario-id <id, e.g. invoice-validation-01> \
     --bundle-source <path-to-original-component>
   ```

   This copies the template (keeping your `User input/`), renames the scenario
   folder to `TS-<id>`, and copies the component into `bundle/`.

2. **Fill `scenario.config.md`.** Replace every `<...>`:
   - Frontmatter: `test_scenario`.
   - `## Settings`:
     - `runs_dir` (clean scratch area), `runs_required`, thresholds.
     - `harness.bundle_source` = the original component path (enables the staleness
       check), `harness.fixtures` = the input filename, `harness.task_prompt` = the
       exact prompt fed to the clean session, `harness.output_artifact` = the file
       the component must write, `harness.allowed_tools`, `harness.model` /
       `harness.judge_model` (leave blank for the account default unless you need
       a specific model pinned for the agent and/or the Level-3 judge).
     - `grading.level1.expected_stable_id` = an id that appears verbatim in the
       output.
     - `grading.level2.expected_tool_calls` = the tool's Bash call (`kind: bash`,
       `contains: <script>`) and the subagent's delegation (`kind: agent`,
       `contains: <subagent>`) if one is used.

3. **Write `expected/machine-evaluation/l1-evaluation-deterministic/output.schema.json`.**
   Derive the required fields, types and enums from your `Expected output` sample.
   Make it match a *good* output — not so loose that a bad output would also pass.

4. **Write `expected/machine-evaluation/l3-evaluation-llm-judge/rubric.md`.** Turn
   the `Context` expectations into 1-5 quality dimensions. Keep the JSON keys
   `grounding` / `defensibility` / `relevance` unless you also update `judge.py`.

5. **Write `scenario.md`.** The human-readable spec: business task, per-level
   expectations, and the grading routing, consistent with the meta.

6. **Place fixtures.** Copy your `Expected input` file(s) into `fixtures/` under the
   name(s) listed in `harness.fixtures`.

7. **Set the bundle bootstrap.** In `bundle/CLAUDE.md`, set the real agent name and
   the input filename.

8. **Validate.** Check the scenario against
   `04-scenario-runnability-requirements.md`. Fix anything missing.

## Result

A runnable `TS-<id>/` scenario plus a self-contained `bundle/`. The next step is the
`run-test-scenario` skill: a first live run, capturing the golden fixture, then
replay / live / benchmark (see `05-end-to-end-run.md`).
