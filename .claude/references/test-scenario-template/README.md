# test-scenario-template

The base skeleton for a **test-scenario** — a self-contained workspace that tests
one AI component (an agent, with its tool(s) and any subagent). Copy it (via the
`clone-test-scenario` skill) and adapt it per component; do not run tests from the
template itself.

## Structure

```
test-scenario-template/
  bundle/                       # the component under test (copied in per scenario)
    CLAUDE.md                   # bootstrap: operate as the agent under test
    .claude/agents/*.md         # agent (+ optional subagent)
    tools/*.py                  # optional deterministic tool(s)
    components/*.meta.md        # governance sidecars
  test-scenarios/
    TS-example-01/
      scenario.md               # human-readable spec (business + expected + routing)
      scenario.config.md          # machine config (scenario id + ## Settings)
      fixtures/                 # frozen input(s) + golden-run/ for replay
      expected/
        machine-evaluation/l1-evaluation-deterministic/output.schema.json  # Level 1
        machine-evaluation/l3-evaluation-llm-judge/rubric.md               # Level 3
        human-evaluation/judge-validation/, human-signoff/                 # see guide 06
  harness/                      # the run/grade engine (own copy per scenario)
    runner.py grader.py judge.py lib/ requirements.txt
  User input/                   # staging area you fill BEFORE cloning
    Expected input/             #   sample input artifacts  -> become fixtures
    Expected output/            #   sample/expected outputs -> inform schema + rubric
    Context/                    #   extra info (purpose, policy, the component)
```

## What you edit vs what stays

You edit **data**: `scenario.md`, `scenario.config.md`, `fixtures/`,
`expected/machine-evaluation/l1-evaluation-deterministic/output.schema.json`,
`expected/machine-evaluation/l3-evaluation-llm-judge/rubric.md`, and you drop the
component into `bundle/`. The **harness** is a working copy you normally leave
as-is — but it is intentionally scenario-local, so you may adapt it for a complex
scenario without affecting other scenarios.

See `<repo>/docs/test-scenario/` for the full walkthrough.
