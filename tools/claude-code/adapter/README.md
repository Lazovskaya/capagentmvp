# Claude Code adapter

Installs this factory's own-posture skills and connectors into a client project: copies skills
into `.claude/skills/<name>/`, generates a working `.mcp.json` from connector definitions, emits
the entry file (`CLAUDE.md`), and records what was installed in `factory-lock.json`.

```bash
python3 tools/claude-code/adapter/install.py \
  --project /path/to/client-project \
  --skills fit-to-standard,defect-triage \
  --connectors jira \
  [--destination jira=myclient] \
  [--check] [--force]
```

- `--skills` / `--connectors` take a comma-separated list or `*`. `*` for skills means all
  own-posture skills (`skills/<name>/SKILL.md` in this repo); `*` for connectors means all
  connectors with real wiring in their `server.json` (currently `abap-mcp` and `jira` — the rest
  are still `"command": "TODO"` placeholders and are refused with a clear error if named
  explicitly).
- `--destination CONNECTOR=NAME` overrides the per-developer credential-file name
  (`~/.config/<tool>/sessions/<name>.env`, see each connector's `connector.md`); defaults to
  `default`. The adapter never writes credentials anywhere — that step stays manual, by design.
- `--check` reports drift against `factory-lock.json` without writing anything.
- `--force` reinstalls even when the content hash hasn't changed.
- Re-running with no source changes is a no-op (compares content hashes recorded in
  `factory-lock.json`); only what actually changed gets reinstalled.

Pure Python 3 stdlib, no `npx`/Node dependency. Deliberately reimplements the copy step instead of
shelling out to the `skills` CLI (`vercel-labs/skills`) that the old manual process used: this
script only ever writes into `<project>/.claude/skills/`, `.mcp.json`, `CLAUDE.md`, and
`factory-lock.json` under `--project`, and never touches this repo's own `skills/`/`connectors/`
trees — which is what actually matters, since the manual process was found (by testing it against
a real clone) to sometimes *delete* matching source-repo files when the destination project was
itself a checkout of this repo. `--project` resolving to this repo is an explicit hard error too,
belt-and-suspenders on top of that.

**Status:** v1 implemented — own-posture skills, verified-wiring connectors, `CLAUDE.md`,
`factory-lock.json`. Still manual: adopt-posture skills (see the root `README.md`'s "Installing
skills into a project" section for the `npx skills add` process those still need), the actual
credential `.env` files each connector's "Wiring" section describes, and anything involving agents
or Q-gates (no adapted equivalent yet, see `factory-data.json`'s `coverage` section).
