---
name: artifact-creation
description: Create new SAP AI Factory artifact files from scratch — body file + *.meta.md sidecar — following confirmed plan from artifact-design, in bottom-up order.
---

# Artifact Creation

Creates new artifact files from scratch following a confirmed plan from `artifact-design`.
Templates source: `.claude/references/meta-templates.md`.
Conventions source: `docs/skill-design-conventions.md`.

Never invoked without a confirmed plan. Never creates files for artifacts that already exist
(use `artifact-editing` for those).

## When to use

When `artifact-design` has produced a confirmed plan that includes new artifacts to create.

## Inputs

- Confirmed plan from `artifact-design`
- Contributor's original request (for content detail)

## Steps

Follow the bottom-up order strictly: Connector → Tool → Knowledge source → Skill → Agent →
Assistant. Complete each layer fully before starting the next.

### For each artifact in the plan

**1. Load the correct template**

Open `.claude/references/meta-templates.md` and use the section matching
the artifact type. Replace every `<placeholder>` — leave no angle-bracket tokens in the file.

**2. Write the body file**

| Type | Body file | Required sections |
|---|---|---|
| Assistant | `assistants/<id>/assistant.md` | Description, `## Routing table` |
| Agent | `agents/<id>/agent.md` | Instructions, `## Output Contract` |
| Skill | `skills/<id>/SKILL.md` | YAML frontmatter (`name:`, `description:`), then sections: `## When to use`, `## Inputs (contract)`, `## Steps`, `## Output`, `## Status` |
| Tool | `tools/<id>/tool.md` | `## Input contract`, `## Operation`, `## Output contract`, `## Errors and confirmations` |
| Connector | `connectors/<id>/connector.md` | What it connects to, Wiring, Exposed operations, Write-back contract (if any), Fallback, `## Governance contract` |
| Knowledge source | `knowledge/<bucket>/<id>/` | At minimum a `README.md` describing the source. For content file structure, follow an existing governed source in the same bucket (e.g. `knowledge/methodology/activate-s4hc-pe/`). For the `knowledge.meta.md` sidecar, use the template in `.claude/references/meta-templates.md` — the example directories do not model the sidecar. |

**Knowledge source — bucket selection guide:**

| Bucket | Use for |
|---|---|
| `methodology/` | Authoring methodology, conversion/scoping/assessment methods |
| `standards/` | Fit-to-standard taxonomy, SAP reference lists, gap-disposition rules |
| `custom-code/` | ABAP code quality, ATC rules, clean-core constraints, unit test patterns |
| `testing/` | Functional test scripts, defect history templates |
| `domain-packs/` | Swappable domain expertise (e.g. order-to-cash) shared across engagements |
| `config/` | Configuration methodology, IMG settings |
| `data/` | Data migration methodology, mapping rules |
| `operations/` | AMS, run-phase operations |
| `process/` | Business process content |
| `extensibility/` | BTP extensions, RAP, side-by-side patterns |
| `clean-core/` | Clean-core principle content beyond custom-code scope |

When in doubt between two buckets, prefer the one whose existing README list most closely describes the content.

For Skills: read `docs/skill-design-conventions.md` before writing SKILL.md. Key patterns:
- Assign a stable copyable ID to every artifact at creation time (don't free-text re-describe)
- Every status enum needs an explicit reopen/escalation path, not just forward motion
- Use distinct names for distinct roles even when one person holds both
- Separate a Caveats flag from the coarse Status field

**3. Write the `*.meta.md` sidecar**

Use the template frontmatter exactly. Fill every required field; do not leave optional fields
empty if a value applies. Dependency graph: use only valid v0.3 types and relations (see
`## Valid vocabulary` in `.claude/references/meta-templates.md`).

Forbidden edges — never declare these:
- `assistant → tool` (Assistants never call Tools directly)
- `agent/skill → connector` (the Tool owns the Connector edge)
- Any outgoing edge from a Knowledge source or Q-gate (they are leaves)

**4. Factory Tool wrapper decision**

Before creating a `tools/<id>/` entry: a Factory Tool (Python script) is needed only when
there is local algorithmic work the assistant cannot do inline (parsing a binary, computing a
diff, filling a template from a schema). If the work is "call connector X and synthesise the
result," no Factory Tool is needed — the Skill's instructions invoke the MCP connector's
operations directly.

**5. documented-only Connector trap**

If the plan references a Connector with `"pattern": "documented-only"` in its `server.json`,
do not declare it in any dependency graph — not even as `optional`. The installer
(`adapter_common.py`'s `expand_dependencies`) pulls all declared connectors regardless of
relation type, and `documented-only` causes install to fail.

## Output

All new files created in the correct directories. Confirmation list:
- File path created
- Artifact type and stable ID
- Version set to `0.1.0`
- Dependency graph rows written (types and relations from v0.3 vocabulary only)
