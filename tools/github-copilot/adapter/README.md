# GitHub Copilot adapter

Installs this factory's own-posture skills and connectors into a client project: copies skills
into `.agents/skills/<name>/`, enables the `chat.useAgentSkills` VS Code setting those need (off
by default otherwise, in `.vscode/settings.json`), generates a working `.vscode/mcp.json` from
connector definitions, emits `.github/copilot-instructions.md`, and records what was installed in
`factory-lock.json`.

```bash
python3 tools/github-copilot/adapter/install.py \
  --project /path/to/client-project \
  --skills fit-to-standard,defect-triage \
  --connectors jira \
  [--destination jira=myclient] \
  [--check] [--force]
```

Same flags, same connector-normalization/content-hash/`factory-lock.json` behavior as the Claude
Code adapter (`tools/claude-code/adapter/install.py`) this was ported from — see that folder's
README for the full flag reference. The only real differences: skills land in
`.agents/skills/<name>/` instead of `.claude/skills/<name>/`, the mcp file is
`.vscode/mcp.json` with entries nested under a `"servers"` key (VS Code's shape, not Claude Code's
flat top-level), and the entry file is `.github/copilot-instructions.md`.

Agents and gates have no adapted equivalent yet, see `factory-data.json`'s `coverage` section for
the known gaps.

**Caveat:** per `factory-data.json`'s `coverage.toolNotes.Copilot`, Copilot's skills/mcp
conventions here are inferred from current docs, not live-tested against a real VS Code + Copilot
session the way `jira`/`abap-mcp` were for Claude Code. Verify the `.vscode/mcp.json` `"servers"`
shape and the `chat.useAgentSkills` setting name against current docs before relying on this in a
real project.

**Status:** v1 implemented — own-posture skills, verified-wiring connectors,
`copilot-instructions.md`, `factory-lock.json`. Still manual: adopt-posture skills (see the root
`README.md`'s "Installing skills into a project" section), the actual credential `.env` files each
connector's "Wiring" section describes, and anything involving agents or Q-gates.
