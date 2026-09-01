# Claude Code adapter

Installs this factory's own-posture skills, agents, and connectors into a client project: copies
skills into `.claude/skills/<name>/`, writes a synthesized subagent file per agent into
`.claude/agents/<name>.md`, generates a working `.mcp.json` from connector definitions, emits the
entry file (`CLAUDE.md`), and records what was installed in `factory-lock.json`.

```bash
python3 tools/claude-code/adapter/install.py \
  --project /path/to/client-project \
  --skills fit-to-standard,defect-triage \
  --agents defect-classifier \
  --connectors jira \
  [--activity "Defect triage" [--activity "Defect pattern analysis"] ...] \
  [--destination jira=myclient] \
  [--check] [--force]
```

- `--skills` / `--agents` / `--connectors` take a comma-separated list or `*`. `*` for skills
  means all own-posture skills (`skills/<name>/SKILL.md` in this repo); `*` for agents means all
  own-posture agents (`agents/<name>/agent.md`); `*` for connectors means all connectors with real
  wiring in their `server.json` (currently `abap-mcp` and `jira` — the rest are still
  `"command": "TODO"` placeholders and are refused with a clear error if named explicitly).
- Agents write as a single flat `.md` file (Claude Code's own subagent convention), not a folder
  like skills. `agents/<name>/agent.md` itself has no YAML frontmatter, so this adapter
  synthesizes a minimal `name`/`description` header around its body — see
  `tools/adapter_common.py`'s `agent_output_bytes()` for exactly what gets added.
- `--activity "Defect triage"` installs everything that Delivery-pipeline activity uses (matched
  against `factory-data.json`'s `activities` by title — case-insensitive exact match first, then
  substring if unambiguous). **Repeatable** — pass it more than once to install several activities
  in one run (`--activity "Defect triage" --activity "Defect pattern analysis"`); their
  skills/connectors are merged and deduped, e.g. both of those share `jira` but bring their own
  distinct skills. Combines with `--skills`/`--connectors` too if those are also given. **Fails
  the whole run**, rather than partially installing the rest, if *any* requested activity
  references a skill or connector this adapter can't handle — e.g. `--activity "Readiness &
  simplification analysis"` dies because that activity's `readiness-check` connector is still a
  placeholder, even if it's combined with other, fully-wired activities. At least one of
  `--skills`, `--connectors`, or `--activity` is required.
- `--destination CONNECTOR=NAME` overrides the per-developer credential-file name
  (`~/.config/<tool>/sessions/<name>.env`, see each connector's `connector.md`); defaults to
  `default`. The adapter never writes credentials anywhere — that step stays manual, by design.
  If a connector's `server.json` ever declares an `env` block with a `${VAR_NAME}` reference (none
  currently do — both real connectors pass credentials via a destination file instead, see
  above), it's rewritten into this tool's own env-var interpolation syntax automatically; see
  `tools/adapter_common.py`'s `ENV_VAR_SYNTAX`/`translate_env_placeholders` (pattern ported from
  `dyoshikawa/rulesync`'s per-tool env-var formatters — same normalize-one-source-into-many-shapes
  problem this factory already solves for the rest of a connector's MCP config).
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

Shares its skill-discovery/connector-normalization/content-hash/lock-file logic with
`tools/adapter_common.py`, the same module `tools/github-copilot/adapter/install.py` uses — the
per-tool `install.py` files only differ in output paths and entry-file shape.

**Status:** v1 implemented — own-posture skills, own-posture agents, verified-wiring connectors,
`CLAUDE.md`, `factory-lock.json`. Still manual: adopt-posture skills (see the root `README.md`'s
"Installing skills into a project" section for the `npx skills add` process those still need), the
actual credential `.env` files each connector's "Wiring" section describes, and Q-gates (no
adapted equivalent yet, see `factory-data.json`'s `coverage` section).
