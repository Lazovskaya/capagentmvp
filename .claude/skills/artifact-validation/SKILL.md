---
name: artifact-validation
description: Verify that created or edited SAP AI Factory artifacts pass the linter, have valid dependency graph vocabulary, satisfy the applicability intersection, and meet all merge-admission rules before an MR is opened.
---

# Artifact Validation

Runs all available checks on a set of created or edited artifacts and produces a pass/fail
report with specific issues to fix. Always the last skill invoked before commit guidance.

If any check fails, the agent re-invokes `artifact-creation` or `artifact-editing` to fix the
issue, then re-runs this skill. Validation is not skipped even for "trivial" edits.

## When to use

After `artifact-creation` and/or `artifact-editing` complete. Called by `artifact-authoring-agent`
automatically; can also be invoked directly to re-check after manual fixes.

## Inputs

- List of created and/or edited artifact paths (from creation/editing output)
- Optionally: specific check to re-run after a fix

## Steps

### 1. Run the linter

```bash
python3 tools/lint_dependencies.py
```

Parse and report every issue. The linter auto-discovers skills by scanning `skills/*/SKILL.md` — no registration needed for a new skill directory. It covers skills only; agents and assistants are checked in step 2.

Common failures and their fixes:

| Linter message | Fix |
|---|---|
| `vocab: unknown type '<X>'` | Replace with a valid v0.3 type (see `.claude/references/meta-templates.md` → Valid vocabulary) |
| `vocab: unknown relation '<X>'` | Replace with a valid v0.3 relation |
| `knowledge_source declared but not in FORWARD_DECLARED list` | Either add to `FORWARD_DECLARED_KNOWLEDGE_SOURCES` in `lint_dependencies.py`, or create the real knowledge source file |
| `artifact declared but not found in SKILL.md` | Add a reference to the artifact's stable ID in the relevant SKILL.md section, or remove the `produces` edge if no durable handoff is actually needed |
| linter flags rows you did not add | The existing meta file uses pre-v0.3 vocabulary. Migrate the whole file using `artifact-editing`'s v0.3 migration guidance before opening the MR — partial migration is not acceptable. |

### 2. Manual vocabulary check for agents and assistants

The linter covers skills only — agents and assistants require this manual check.

For every `agent.meta.md` and `assistant.meta.md` in the changed set, run:

```bash
grep -A30 '## Dependency graph' agents/<id>/agent.meta.md
grep -A30 '## Dependency graph' assistants/<id>/assistant.meta.md
```

Verify each row:

- `Type` column: must be one of `assistant`, `agent`, `skill`, `tool`, `connector`,
  `artifact`, `knowledge_source`, `q-gate`
- `Relation` column: must be one of `requires`, `optional`, `routes-to`, `chains-to`,
  `produces`, `consumes`, `gates-at`, `related`

Also check forbidden edges:
- `assistant → tool`: never allowed
- `agent` or `skill` → `connector`: never allowed (Tool owns the Connector edge)
- Any outgoing edge from a `knowledge_source` or `q-gate`: never allowed (they are leaves)

### 3. Applicability intersection check

For each new or modified Agent, walk the full dependency path down to Connectors and Knowledge
sources. Procedure:
1. Start from the agent's `## Dependency graph` — list every referenced artifact.
2. For each, read its `*.meta.md` frontmatter and collect `project_types` and `sdlc_phases`.
3. Recurse into that artifact's own `## Dependency graph` until you reach leaves (connectors,
   knowledge sources, q-gates).
4. Compute: `project_types` of assistant ∩ `project_types` of each layer. Must be non-empty.
5. Same for `sdlc_phases`. These are two separate intersection checks.

Verify that both intersections are non-empty.

Old-format Connectors (missing `project_types` / `sdlc_phases` in frontmatter, e.g. `abap-mcp`)
cannot be checked at their layer — skip them and note the gap. Do not fail validation on this
alone; document it in the report.

If the intersection fails: widen the narrower artifact's `project_types` or `sdlc_phases` —
usually the new lower-layer artifact (skill, tool), not the assistant. Edit the sidecar and
re-run this step.

### 4. Merge-admission checklist

For every artifact in the changed set:

- [ ] Stable ID is kebab-case, unique across the repo, matches its directory name
- [ ] All `## Dependency graph` rows point at real files that exist in the repo (or are in
  `FORWARD_DECLARED_KNOWLEDGE_SOURCES`)
- [ ] `project_types` intersection across the full Assistant → Agent → Skill → Tool path is non-empty, AND `sdlc_phases` intersection across the same path is non-empty (two separate checks — step 3)
- [ ] `owner` is a named person's email — not a team, role, or placeholder
- [ ] Linter passes (`python3 tools/lint_dependencies.py` exits 0)
- [ ] New Connectors that depend on a live system: `verified_live` is a real date, not `false`
  (reused existing connectors: their `verified_live` value is their own concern)

### 5. Report

Produce a structured report:

```
Linter: PASS / FAIL
  [issue list if FAIL]

Agent/Assistant vocabulary (manual): PASS / FAIL
  [issue list if FAIL]

Applicability intersection: PASS / SKIPPED (old-format connector) / FAIL
  [intersection result or skip reason]

Merge-admission checklist:
  [✓ / ✗ per rule]

Overall: PASS — ready for commit  /  FAIL — issues to fix before MR
```

## Output

Structured validation report. If overall PASS: contributor can commit and open the MR.
If overall FAIL: specific issues with file paths and lines to fix, fed back to the agent
for re-invocation of `artifact-creation` or `artifact-editing`.
