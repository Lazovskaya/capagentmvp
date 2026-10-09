# machine-evaluation/

Deterministic and judge-based grading references — no human involved (see
`../human-evaluation/` for the human-in-the-loop side).

- `l1-evaluation-deterministic/output.schema.json` — Level 1: required fields,
  types and enums of a good output.
- `l3-evaluation-llm-judge/rubric.md` — Level 3: the 1-5 quality dimensions the
  LLM-judge scores.

**Level 2 (tool trajectory) has no file here.** It is configured directly in
`scenario.config.md`'s `## Settings` block, under `grading.level2`
(`expected_tool_calls`, `forbidden_tools`, `trajectory_mode`) — by design, so
all technical grading parameters the harness reads live in one place. See
`<repo>/docs/test-scenario/02-template-structure.md`.
