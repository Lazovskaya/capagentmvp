# GitHub Copilot adapter

Emits `.github/copilot-instructions.md` and `.vscode/mcp.json` for a project, and places skills
under `.agents/skills/` (requires the `chat.useAgentSkills` VS Code setting, off by default).
Agents and gates have no adapted equivalent yet, see `factory-data.json`'s `coverage` section for
the known gaps.

**Status:** Not yet implemented. `tools/claude-code/adapter/install.py` is the first real adapter —
reuse its connector-normalization (`server.json` shape detection, refusing `"command": "TODO"`
placeholders), content-hash, and `factory-lock.json` pattern here; the only real differences are
the output paths above (skills copy verbatim into `.agents/skills/<name>/`, same as Claude Code,
just a different destination root).
