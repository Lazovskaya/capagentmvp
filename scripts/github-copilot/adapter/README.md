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
  [--activity "Defect triage" [--activity "Defect pattern analysis"] ...] \
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

**Status:** v1 implemented — own-posture skills, own-posture agents, verified-wiring connectors,
`copilot-instructions.md`, `factory-lock.json`. Still manual: adopt-posture skills (see the root
`README.md`'s "Installing skills into a project" section), and the actual credential `.env` files
each connector's "Wiring" section describes. Q-gates have no adapted equivalent yet (see
`factory-data.json`'s `coverage` table).

Agents write into `.github/agents/<name>.md` per
[docs.github.com/.../custom-agents-configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
and
[.../about-custom-agents](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents)
(confirmed 2026-09-08) -- Visual Studio Code is explicitly named among the surfaces that can
invoke a custom agent this way, though the feature sits under GitHub's "cloud agent" concept and
its docs give no explicit GA/stable statement for VS Code specifically (only JetBrains/Eclipse/
Xcode are named "public preview"). Same inferred-from-docs caveat as the rest of this adapter.
