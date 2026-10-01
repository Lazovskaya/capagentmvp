# Contributing to SAP AI Factory

This guide is for contributors who add or maintain components in the factory repo — skills, agents,
connectors, artifacts, knowledge. It is tool-agnostic: the steps here work regardless of whether
you use Claude Code, Cursor, or GitHub Copilot as your AI assistant.

For end-user project setup (installing factory components into a client project), see `README.md`.

## Before you start

**Prerequisites:** Python 3 (stdlib only — no pip install required for authoring or testing).

**Read first:**
- `README.md` — repo layout and single source of truth model
- `CLAUDE.md` — architecture, known gaps, skill authoring conventions
- `docs/skill-design-conventions.md` — patterns from dry-run testing; apply at design time, not after

## Repo orientation

`factory-data.json` is the canonical registry. Every component file (SKILL.md, agent .md,
connector/, artifact/) must have a matching entry there. The interactive component map (`index.html`)
and its `file://` fallback (`factory-data.js`) are generated from it — never hand-edit either.

After any `factory-data.json` change:
```bash
python3 build.py
```

After editing, run the test suite to catch broken references and convention violations before committing:
```bash
python3 -m pytest tests/
```

`tests/` currently holds `test_lint_dependencies.py`, `test_schema_validation.py`,
`test_fill_sad_template.py`, and `test_check_mr_approvals.py` (`conftest.py` wires `scripts/`
onto `sys.path` for all of them) — not the larger, differently-named suite an older version of
this doc described. Also run the dependency-graph linter directly; it's the one check whose
"no `*.meta.md` sidecar" failure is unconditional (not gated behind `--strict`):
```bash
python3 scripts/lint_dependencies.py
```

---

## Adding a skill

Skills are the most common contribution. Own-posture skills live in `skills/<name>/`, with two
files — `SKILL.md` (the skill itself) and a **`skill.meta.md` sidecar** (governance metadata and
the Dependency graph). Both are required; `lint_dependencies.py` fails unconditionally on a
missing sidecar.

### 1. Create the skill directory

```
skills/
  <your-skill-name>/
    SKILL.md
    skill.meta.md
```

`SKILL.md` structure:
```markdown
---
name: <your-skill-name>
description: One sentence — what the skill produces, when to use it, which phase.
---

# <Display Name>

[Context: where this comes from, what it merges or replaces — keep this short]

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

## When to use

[Phase, trigger condition, what it is NOT for]

## Inputs (contract)

Ask for anything missing before running.
- **Required:** ...
- **Optional:** ...

## Steps

1. ...

## Output

- [Named artifact or workspace output]
- Feeds: [downstream skill or gate]
```

**Apply `docs/skill-design-conventions.md` at design time** — stable IDs, status enums with reopen
paths, distinct role names, caveats field, explicit routing tests. Skills that skip this tend to
fail dry-runs on exactly these points.

`skill.meta.md` structure (see `skills/adr-log/skill.meta.md` for a real, filled-in example):
```markdown
---
skill: <your-skill-name>
namespace: "@epam/sap"
version: 0.1.0
owner: <your-email>
project_types: [greenfield, brownfield]
sdlc_phases: [discover]
risk_freedom: low|medium|high
provenance:
  source: internal|external
  source_repo: <url, if ported from elsewhere>
---

## Notes
[Anything a future maintainer needs to know that isn't obvious from SKILL.md itself.]

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | `<tool-name>` | requires | |
| knowledge_source | `<knowledge-source-id>` | consumes | |
| artifact | `<artifact-name>` | produces | |
```

Every `Ref` your `SKILL.md` body actually mentions must have a matching row here (and vice
versa) — `lint_dependencies.py` flags the drift either direction; `--fix` appends missing rows
for you when the direction is "referenced in SKILL.md but not declared."

### 2. Register in factory-data.json [ADD]

Don't hand-edit `components[]` or `assistants[]` -- both are generated from the sidecars, and a
hand-added entry for a component that has a sidecar is overwritten on the next regeneration.
What ends up in `factory-data.json` comes from your `skill.meta.md`:

| Generated field | Comes from | Notes |
|---|---|---|
| `kind` / `name` | directory + the sidecar's id field (`skill:`, `tool:`, `q_gate:`, ...) | `Tool` is a registered kind too |
| `posture` | `provenance.source` | `internal` -> `own`, anything else -> `adopt`; Connectors are always `adopt` |
| `status` | `readiness` | `not-started` / `in-progress` / `in-test` / `ready`; Knowledge has no `readiness` field |
| `phases` / `phase` | `sdlc_phases` | Activate order; `phase` is the earliest one; an empty list means Discover |
| `desc` | the component's own files | Skill: `SKILL.md` `description:`; Agent/Assistant/Connector/Tool/Q-gate: first paragraph of the body file; Artifact: `schema.json` `description`; Knowledge: first sentence of `## Notes` |

### 3. Regenerate and test [ADD]

```bash
python3 build.py --regenerate          # rewrites components[]/assistants[], then index.html
python3 scripts/generate_factory_data.py --check
python3 scripts/lint_dependencies.py
python3 validators/validate_factory.py
python3 -m pytest tests/
```

---

## Adding an agent or an assistant

Agents and Assistants share a shape and a purpose (a bounded, invocable entry point rather than
a document-producing Skill) but differ in scope: an **Agent** orchestrates a chain of Skills
toward a typed verdict; an **Assistant** is a role-scoped entry point that routes a request to
the right Agent or Skill and holds no state of its own. Both live one directory level deeper than
an older version of this doc described:

```
agents/
  <your-agent-name>/
    agent.md
    agent.meta.md
assistants/
  <your-assistant-name>/
    assistant.md
    assistant.meta.md
```

Neither `agent.md` nor `assistant.md` carries its own YAML frontmatter — each per-tool adapter
synthesizes it (`name`/`description`, the latter derived from the body's first paragraph) when
installing into a client project; see `scripts/adapter_common.py`'s `agent_output_bytes()` /
`assistant_output_bytes()`. Write the body's opening paragraph as a real one-line summary for
that reason — it becomes the installed file's `description:`.

Agent/Assistant body structure (see `agents/brownfield-sad-authoring-agent/agent.md` and
`assistants/solution-architect/assistant.md` as reference patterns):
- What it reads (which Skill outputs, or which use case it routes)
- Modes (if it has distinct operating modes)
- Procedure or routing table (numbered steps, or a decision table for an Assistant)
- Returns (an Agent's typed verdict and its fields)
- Hard boundaries (what it explicitly does NOT do)
- Human-in-the-loop note (if a human still makes the final call)

`agent.meta.md`/`assistant.meta.md` follow the same frontmatter + Dependency graph shape as
`skill.meta.md` above (owner, project_types, sdlc_phases, risk_freedom, provenance, Dependency
graph table) — same required-sidecar rule, same `lint_dependencies.py` check.

Register in `factory-data.json` with `"kind": "Agent"` or `"kind": "Assistant"`.

---

## Adding a tool

A Tool is deterministic, script-backed logic a Skill depends on (parsing, calculation,
extraction) — not itself a Claude Code/Cursor/Copilot primitive, so every adapter places it at
the same factory-relative path in a client project regardless of tool:

```
tools/
  <your-tool-name>/
    tool.md         # what it does, its CLI/interface contract
    tool.meta.md     # governance metadata + Dependency graph, same shape as skill.meta.md
    scripts/         # the actual implementation
```

A Skill that depends on a Tool declares it in its own `skill.meta.md` Dependency graph
(`| tool | \`<your-tool-name>\` | requires | ... |`) — the adapter then copies the Tool into the
client project automatically alongside that Skill; see `tools/parse-readiness-check-export/`
for a real example already wired this way.

`tool.md`/`tool.meta.md` are stripped out of a client-facing package (`package-for-tool`'s
`TARGET_TOOL` jobs), on the reasoning that a coding agent never reads them at runtime — the
Skill's own instructions are meant to be self-sufficient. Keep the operative contract (what
arguments it takes, what it returns) in a place the Skill's own `SKILL.md` can restate briefly,
not only in `tool.md`.

---

## Adding a connector

Connectors live in `connectors/<name>/`:
```
connectors/
  <name>/
    connector.md     # human-readable setup guide
    connector.meta.md # governance metadata (no Dependency graph -- connectors are graph leaves)
    server.json       # MCP server config fragment (used by adapters)
    scripts/          # optional launcher scripts
```

**Credential pattern** (mandatory — do not deviate):
- Credentials live in `~/.config/<tool>/sessions/<destination>.env` on the contributor's machine
- The `server.json` command points to a launcher script that reads that file — never inline secrets
- The launcher uses Python `subprocess.run`, not `os.execvpe` (Windows compatibility — see
  `connectors/jira/scripts/start-mcp-atlassian.py` for the reference implementation)
- Never put credentials in `.mcp.json`, never use OS-specific mechanisms (macOS Keychain breaks
  on Linux/Windows)

`server.json` shape:
```json
{
  "<connector-name>": {
    "type": "stdio",
    "command": "python3",
    "args": ["./connectors/<name>/scripts/start-<name>.py", "--destination=<destination>"],
    "note": "Why this launcher exists instead of calling the server binary directly."
  }
}
```

A connector's `status` in `factory-data.json` is `"ready"` only after it has been end-to-end
tested against a real system — prose claiming it works is not evidence.

---

## Adding an artifact

Artifacts are durable handoff templates between phases. Each lives in `artifacts/<name>/`:
```
artifacts/
  <name>/
    template.md      # the fillable template
    schema.json      # JSON Schema (draft-07) enforcing required fields
    artifact.meta.md # governance metadata (not yet present on every existing artifact)
```

`schema.json` must have `"required"` listing every field a downstream skill or gate will reference.
`tests/test_schema_validation.py` validates schemas/fixtures against each other on every test run.

Register in `factory-data.json` with `"kind": "Artifact"`.

---

## Adding knowledge

Knowledge lives in `knowledge/<bucket>/` — one of: `clean-core`, `config`, `custom-code`, `data`,
`domain-packs`, `extensibility`, `methodology`, `operations`, `process`, `standards`, `testing`.

Add files under the appropriate bucket. A bucket (or a finer-grained directory within one, e.g.
`knowledge/methodology/brownfield-conversion/`) that commits real, reusable content becomes a
governed **Knowledge Source** with its own `knowledge.meta.md` sidecar (declaring
`knowledge_source`/`source_location`); see `knowledge/README.md`'s "Governed Knowledge Sources"
table and any existing `knowledge.meta.md` for the shape. A Skill that consumes one declares it in
its own `skill.meta.md` Dependency graph as a `knowledge_source` row, not a bare `knowledge/<bucket>`
reference.

**Distribution class** (required until EPMCSAPAI-291's sidecar schema lands): treat any unreviewed
knowledge file as `epam-internal-only` by default. Do not commit SAP documentation, SAP Help Portal
content, or bulk SAP knowledge extracts — see ADR 0001 (`docs/adr/0001-knowledge-organization-and-distribution.md`)
and EPMCSAPAI-239 for why this is a legal constraint, not just a preference.

---

## Testing in the test repo and bringing changes back

Authoring a component here isn't the end of the loop. The intended flow is: work on a branch in
this repo, install it into a generated test project (e.g. `sap-ai-factory-test`) and actually use
it there, then bring back whatever you inevitably adjusted while testing — a typo, a missing
edge case, something that only became obvious once real content flowed through it.

**Installing your branch for testing:**
```bash
python3 scripts/claude-code/adapter/install.py --project /path/to/sap-ai-factory-test \
  --skills <your-skill-name> [--agents ...] [--assistants ...] [--connectors ...]
```

**Bringing your edits back**, once you've made them in the test project rather than here:
```bash
python3 scripts/sync_back.py --project /path/to/sap-ai-factory-test --check
```
This is read-only and always safe — it prints a verdict per component (`UNCHANGED`,
`LOCAL-EDIT`, `NEW`, `CONFLICT`, `REMOVED`, and a few more; see the script's own module
docstring for the full table). `LOCAL-EDIT`/`NEW` is the normal, expected result of checking a
branch with real edits, so it exits 0 (pass `--dotenv-out PATH` to also record `MR_REQUIRED=true`
there, for a CI job to hand to a later one); only a `CONFLICT` — something no automation should
resolve on its own — exits 1. Once you've looked at the verdicts:
```bash
python3 scripts/sync_back.py --project /path/to/sap-ai-factory-test --apply
```
writes the `LOCAL-EDIT`/`NEW` content into **this** checkout (never into the test project) as a
plain file-by-file overlay — it never deletes anything, and it never touches a `CONFLICT` or a
`REMOVED` verdict on its own; both require you to look and decide. Run
`python3 scripts/lint_dependencies.py` afterward (a brand-new skill from the test repo won't have
a `skill.meta.md` sidecar yet — `--scaffold-sidecars` on the same script writes one) and
`python3 -m pytest tests/` before opening the MR, same as any other change.

If your test-repo edit amounted to **splitting or renaming** a component rather than a simple
edit, `sync_back.py --check` will say so and print a graph impact report — the other factory-only
files (`factory-data.json`, `gates/*.md`, other components' own Dependency graph rows) that still
need hand-updating. It deliberately doesn't attempt that rewrite itself.

From inside the test repo, an SME who isn't primarily a git user can instead say "contribute my
changes back" and let the `sme-sync-back` skill (`skills/sme-sync-back/SKILL.md`)
walk through the same steps conversationally. See `staff/sme-contribution-roundtrip-plan.md` for
the full design behind this, including the safety rules `sync_back.py` enforces (never overwriting
a protected branch without confirmation, never running against a dirty tree, never guessing at a
`REMOVED` or `CONFLICT` verdict).

---

## Running the test suite

```bash
python3 -m pytest tests/                          # all tests
python3 -m pytest tests/test_lint_dependencies.py  # lint_dependencies.py's own logic
python3 -m pytest tests/test_check_mr_approvals.py # check_mr_approvals.py's own logic
python3 -m pytest tests/test_schema_validation.py  # artifact/tool schema validation
python3 -m pytest tests/test_fill_sad_template.py  # a specific tool's template-fill logic
python3 scripts/lint_dependencies.py               # not a pytest module -- run directly
```

`conftest.py` puts `scripts/` on `sys.path` so every test module can `import` the script it's
testing directly, rather than shelling out to it.

---

## What "ready" means before merging

A component moves from `progress` to `ready` in `factory-data.json` when:

1. It has been **dry-run tested end to end** against a realistic scenario — not just authored and
   syntax-checked. A skill that has never been invoked on real or realistic inputs is `progress`,
   not `ready`, even if the prose looks good.
2. All **`python3 -m pytest tests/` tests pass**.
3. The skill follows **all conventions** in `docs/skill-design-conventions.md`.
4. If the skill produces an artifact, that artifact has a **schema.json** with required fields.
5. The component is **registered in `factory-data.json`** and `python3 build.py` runs clean.

A PR can land with `status: progress` — the factory accumulates unverified components deliberately.
The distinction matters because tools, delivery managers, and quality gates read `status` to decide
what to trust.

---

## Confluence sync

After merging changes to `factory-data.json`:
1. Run `python3 build.py`
2. Re-upload `factory-data.json` as an attachment on the [SAP AI Factory Design](https://kb.epam.com/spaces/ESAPCC/pages/2898132737/SAP+AI+Factory+Design) Confluence page (Attachments → replace the existing file)

The HTML macro fetches the attachment at runtime — no HTML editing needed.
