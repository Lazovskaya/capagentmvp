# Cursor adapter

Emits `.cursor/rules/factory.mdc` and `.cursor/mcp.json` for a project, and copies skills into
`.cursor/skills/<name>/SKILL.md` — Cursor reads `SKILL.md` natively (confirmed against
`dyoshikawa/rulesync`'s Cursor generator, `projects/rulesync`'s `cursor-skill.ts`), the same
format Claude Code and Copilot use, so this needs no content rewrite. (Corrects this file's
earlier claim that Cursor has no native skills convention and needs `.mdc` rewriting — that was
wrong; `factory-data.json`'s `tools.cursor.skills` and `coverage` table have been corrected to
match.) Agents and gates still have no adapted equivalent, see `factory-data.json`'s `coverage`
section for those gaps.

**Status:** Not yet implemented. `tools/claude-code/adapter/install.py` and
`tools/github-copilot/adapter/install.py` are the two real adapters so far, both built on shared
skill-discovery/connector-normalization/content-hash/lock-file logic in `tools/adapter_common.py`
— reuse that module here too, including `copy_skill()` unchanged (just pointed at
`.cursor/skills/`, same as the other two just target different roots). The only real work left is
the entry file (`.cursor/rules/factory.mdc`) and `.cursor/mcp.json`.
