# bundle/ — the component under test

This folder holds a **copy** of the AI component (agent + its tool(s) + any
subagent) that the scenario tests. The clone step copies it here from its original
location and records that origin as `bundle_source` in `scenario.config.md`, so the
run step can detect if the original later drifted from this tested copy.

Expected shape (mirrors how the factory ships a component):

```
bundle/
  CLAUDE.md                     # bootstrap: "operate as <agent>", read its file
  .claude/agents/<agent>.md     # the agent (orchestrator) under test
  .claude/agents/<subagent>.md  # a subagent it delegates to (optional)
  tools/<tool>.py               # a deterministic tool it calls (optional)
  components/*.meta.md          # governance sidecars (not executed)
```

The placeholder files here are illustrative and are replaced by the real component
when a scenario is created from this template.
