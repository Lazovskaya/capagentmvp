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

All 816 tests should pass (87 skipped is expected — those cover optional connectors).

---

## Adding a skill

Skills are the most common contribution. Own-posture skills live in `skills/<name>/SKILL.md`.

### 1. Create the skill directory and file

```
skills/
  <your-skill-name>/
    SKILL.md
```

`SKILL.md` structure:
```markdown
---
name: <your-skill-name>
description: One sentence — what the skill produces, when to use it, which phase.
---

# <Display Name>

[Context: where this comes from, what it merges or replaces — keep this short]

*Design conventions this skill follows are in `../../../docs/skill-design-conventions.md`.*

## When to use

[Phase, trigger condition, what it is NOT for]

## Inputs (contract)

Ask for anything missing before running.
- **Required:** ...
- **Optional:** ...

## Knowledge this skill orchestrates

- `knowledge/<bucket>/` — what domain knowledge it reads

## Steps

1. ...

## Output

- [Named artifact or workspace output]
- Feeds: [downstream skill or gate]

## Judgment calls worth stating out loud

- [Non-obvious decision the skill makes, stated as a rule]

## Driver

Main driver: <delivery|architect|functional>. Owner role per factory-data.json: **<role>**.

## Status

notstarted | progress | ready
```

**Apply `docs/skill-design-conventions.md` at design time** — stable IDs, status enums with reopen
paths, distinct role names, caveats field, explicit routing tests. Skills that skip this tend to
fail dry-runs on exactly these points.

### 2. Register in factory-data.json

Add an entry to the `components` array:

```json
{
  "kind": "Skill",
  "name": "<your-skill-name>",
  "posture": "own",
  "status": "notstarted",
  "phase": "<Discover|Prepare|Explore|Realize|Deploy|Run|all>",
  "desc": "One sentence matching the SKILL.md description."
}
```

Fields:
| Field | Values | Notes |
|---|---|---|
| `kind` | `Skill`, `Agent`, `Connector`, `Artifact`, `Q-gate`, `Knowledge` | Must match the component type |
| `posture` | `own`, `adopt` | `own` = authored in this repo; `adopt` = pulled from elsewhere |
| `status` | `notstarted`, `progress`, `ready` | `ready` = end-to-end dry-run tested |
| `phase` | Activate phase name or `all` | The primary phase where this component is used |
| `desc` | string | Short description shown in the component map |

### 3. Regenerate and test

```bash
python3 build.py
python3 -m pytest tests/
```

`test_factory_integrity.py` will catch: unregistered skill files, broken `factory-data.json`
references, orphaned files. `test_skill_conventions.py` checks frontmatter format and description
field presence.

---

## Adding an agent

Agents live in `agents/<name>.md`. Unlike skills, agents orchestrate other skills and return a
typed verdict — not a document, but a `go`/`conditional`/`no-go` or similar bounded output.

```
agents/
  <your-agent-name>.md
```

Agent file structure (see `agents/fit-to-standard-accelerator.md` as the reference pattern):
- What the agent reads (which skill outputs)
- Modes (if it has distinct operating modes)
- Procedure (numbered steps)
- Returns (the typed verdict and its fields)
- Hard boundaries (what it explicitly does NOT do)
- Human-in-the-loop note (if a human still makes the final call)
- Status line

Register in `factory-data.json` with `"kind": "Agent"`.

---

## Adding a connector

Connectors live in `connectors/<name>/`:
```
connectors/
  <name>/
    connector.md     # human-readable setup guide
    server.json      # MCP server config fragment (used by adapters)
    scripts/         # optional launcher scripts
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
```

`schema.json` must have `"required"` listing every field a downstream skill or gate will reference.
`test_artifact_schema.py` validates every template against its schema on every test run.

Register in `factory-data.json` with `"kind": "Artifact"`.

---

## Adding knowledge

Knowledge lives in `knowledge/<bucket>/` — one of: `clean-core`, `config`, `custom-code`, `data`,
`domain-packs`, `extensibility`, `operations`, `process`, `standards`, `testing`.

Add files under the appropriate bucket. No registration in `factory-data.json` required — knowledge
files are referenced directly from SKILL.md's "Knowledge this skill orchestrates" section.

**Distribution class** (required until EPMCSAPAI-291's sidecar schema lands): treat any unreviewed
knowledge file as `epam-internal-only` by default. Do not commit SAP documentation, SAP Help Portal
content, or bulk SAP knowledge extracts — see ADR 0001 (`docs/adr/0001-knowledge-organization-and-distribution.md`)
and EPMCSAPAI-239 for why this is a legal constraint, not just a preference.

---

## Running the test suite

```bash
python3 -m pytest tests/                    # all tests
python3 -m pytest tests/test_skill_conventions.py   # convention compliance only
python3 -m pytest tests/test_factory_integrity.py   # reference integrity only
python3 -m pytest tests/test_artifact_schema.py     # artifact schema validation only
```

What each module checks:
| Module | Checks |
|---|---|
| `test_factory_integrity.py` | Every `factory-data.json` component resolves to a real file; no orphaned files |
| `test_skill_conventions.py` | SKILL.md frontmatter format, required fields, description presence |
| `test_activity_completeness.py` | Activity metadata completeness in `factory-data.json` |
| `test_gate_sequence.py` | Q-gate sequence ordering |
| `test_artifact_schema.py` | Every artifact template validates against its JSON Schema |
| `test_adapter_common.py` | Shared adapter logic (skill discovery, content hashing, lock file) |

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
