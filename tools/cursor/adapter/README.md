# Cursor adapter

Emits `.cursor/rules/factory.mdc` and `.cursor/mcp.json` for a project, rewriting skills into
Cursor's rule format since Cursor has no native skills convention. Agents and gates have no
adapted equivalent yet, see `factory-data.json`'s `coverage` section for the known gaps.

**Status:** Not yet implemented. `tools/claude-code/adapter/install.py` and
`tools/github-copilot/adapter/install.py` are the two real adapters so far, both built on shared
skill-discovery/connector-normalization/content-hash/lock-file logic in `tools/adapter_common.py`
— reuse that module here too; the only real differences are the output paths above and rewriting
each `SKILL.md` into a `.mdc` rule instead of copying it verbatim.
