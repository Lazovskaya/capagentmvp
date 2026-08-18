# Cursor adapter

Installs this factory's own-posture skills and connectors into a client project: copies skills
into `.cursor/skills/<name>/SKILL.md` (Cursor reads `SKILL.md` natively, confirmed against
`dyoshikawa/rulesync`'s Cursor generator, `projects/rulesync`'s `cursor-skill.ts` -- same format
Claude Code and Copilot use, no content rewrite needed), generates a working `.cursor/mcp.json`
from connector definitions, emits the entry rule (`.cursor/rules/factory.mdc`, `alwaysApply: true`
frontmatter so it's always in context), and records what was installed in `factory-lock.json`.

```bash
python3 tools/cursor/adapter/install.py \
  --project /path/to/client-project \
  --skills fit-to-standard,defect-triage \
  --connectors jira \
  [--activity "Defect triage" [--activity "Defect pattern analysis"] ...] \
  [--destination jira=myclient] \
  [--check] [--force]
```

Same flags, same connector-normalization/content-hash/`factory-lock.json` behavior as the Claude
Code adapter (`tools/claude-code/adapter/install.py`) this was ported from -- see that folder's
README for the full flag reference. The only real differences: skills land in
`.cursor/skills/<name>/` instead of `.claude/skills/<name>/`, and the entry file is a Cursor rule
(`.cursor/rules/factory.mdc`) instead of `CLAUDE.md`.

Agents and gates have no adapted equivalent yet, see `factory-data.json`'s `coverage` section for
the known gaps.

**Cursor-specific gotcha, found running a real demo:** unlike Claude Code, which reads `.mcp.json`
and starts a server automatically, Cursor needs each MCP server in `.cursor/mcp.json` explicitly
enabled once from **Settings → MCP** (the "Customize" panel lists servers with an on/off toggle).
Installing the files with this adapter is not enough on its own -- tell whoever opens the project
in Cursor for the first time to check that panel if a connector's tools don't show up.

**Status:** v1 implemented -- own-posture skills, verified-wiring connectors,
`factory.mdc`, `factory-lock.json`. Still manual: adopt-posture skills (see the root `README.md`'s
"Installing skills into a project" section), the actual credential `.env` files each connector's
"Wiring" section describes, and anything involving agents or Q-gates.
