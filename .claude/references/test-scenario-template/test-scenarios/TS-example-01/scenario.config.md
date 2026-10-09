---
test_scenario: <scenario-id, e.g. crm-card-analysis-01>
---

## Settings

Technical parameters read by the harness (`runner.py`) and the skill tools. Only the
scenario id lives in the frontmatter above. Fill every `<...>`.

```yaml
tests_component_kind: bundle      # what is under test: bundle | agent | tool
determinism: bounded              # bounded (LLM loop, run N times) | strict

# run counts & thresholds
runs_required: 3                  # how many times to run the scenario
pass_threshold: 0.66              # scenario is Passing if pass-rate >= this (>= 2 of 3)
judge_pass_threshold: 4.0         # Level 3: average judge score must be >= this
judge_min_dimension: 2            # Level 3: no single dimension may score below this

# human evaluation
min_judge_agreement: 0.8          # judge validation: min within-1 agreement with humans
require_human_signoff: false      # if true, a human must confirm the runs before acceptance

# where run outputs are written (outside the repo, a clean scratch area)
runs_dir: "C:/_WORK/Git/SAP-AI-Factory-Test-Run/runs"

# how the run is executed (isolation + invocation)
harness:
  bundle_dir: bundle              # local copy of the component under test (inside this scenario)
  bundle_source: ""               # <path to the ORIGINAL component; blank = skip staleness check>
  fixtures:
    - <input-fixture-filename, e.g. customer-card.md>
  task_prompt: >-
    <the exact instruction fed into the clean session, e.g.
    "Analyze the customer card in customer-card.md and produce the report.">
  allowed_tools: "Bash,Task,Read,Write,Glob,Grep"
  permission_mode: acceptEdits
  output_artifact: <output-filename the component must write, e.g. result.json>
  schema: expected/machine-evaluation/l1-evaluation-deterministic/output.schema.json
  rubric: expected/machine-evaluation/l3-evaluation-llm-judge/rubric.md
  model: ""                       # <model id/alias for the agent under test; blank = account default>
  judge_model: ""                 # <model id/alias for the Level-3 judge; blank = account default>
                                   # (also used by align_judge.py -- align must calibrate the SAME
                                   # judge model that live runs actually use)

# what each deterministic level checks
grading:
  level1:
    expected_stable_id: <id that must appear verbatim in the output, e.g. CUST-10042>
    require_schema_valid: true
  level2:
    expected_tool_calls:
      - kind: bash
        contains: <substring identifying the tool call, e.g. parse_customer_card>
        why: <why this tool must be invoked>
      - kind: agent
        contains: <subagent name if the component delegates, e.g. risk-scorer>
        why: <why the subagent must be delegated to; omit this entry if no subagent>
    forbidden_tools: [WebFetch, WebSearch]
    trajectory_mode: any_order
```
