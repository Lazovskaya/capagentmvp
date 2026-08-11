# Cursor adapter

Emits `.cursor/rules/factory.mdc` and `.cursor/mcp.json` for a project, rewriting skills into
Cursor's rule format since Cursor has no native skills convention. Agents and gates have no
adapted equivalent yet, see `factory-data.json`'s `coverage` section for the known gaps.

**Status:** Not yet implemented. `tools/claude-code/adapter/install.py` is the first real adapter —
reuse its connector-normalization (`server.json` shape detection, refusing `"command": "TODO"`
placeholders), content-hash, and `factory-lock.json` pattern here; the only real differences are
the output paths above and rewriting each `SKILL.md` into a `.mdc` rule instead of copying it
verbatim.
