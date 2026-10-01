---
name: artifact-editing
description: Modify existing SAP AI Factory artifacts — body file instructions (steps, output contract, routing table) or sidecar structure (dependency edges, frontmatter fields, version bump) — following a confirmed plan or a direct contributor instruction.
---

# Artifact Editing

Applies changes to existing factory artifacts. Covers two kinds of change, often applied
together to the same artifact:

- **Content changes** — modifying what an artifact says and does: adding or rewriting steps
  in SKILL.md, updating agent.md orchestration instructions, expanding an Output Contract,
  modifying a routing table row, changing connector governance prose.
- **Structural changes** — modifying how an artifact connects: adding or removing dependency
  graph edges, updating frontmatter fields (`project_types`, `sdlc_phases`, `use_case_ids`,
  `risk_freedom`), migrating old-format frontmatter to v0.3.

Always bumps the version. Never modifies files without reading them first.

## When to use

When `artifact-design` has produced a confirmed plan that includes changes to existing
artifacts, or when a contributor gives a direct instruction such as:
- "Add a step to skill X"
- "The output contract of agent Y needs a new field"
- "Add use case Z to the routing table of the solution-architect assistant"
- "Migrate abap-mcp connector.meta.md to v0.3 format"

## Inputs

- Confirmed plan from `artifact-design` (preferred), or direct contributor instruction
- The specific file(s) to edit

## Steps

### 1. Read before editing

Read the full file before making any change — body file and `*.meta.md` sidecar together.
Understand the current state; do not assume what it contains from earlier context.

### 2. Apply content changes (if any)

**SKILL.md / agent.md / assistant.md / connector.md changes:**

- Adding a step: insert at the correct position in the `## Steps` section; match the existing
  format exactly — if the skill uses `### Step N` headings add a heading, if it uses a numbered
  list add a list item; keep the same writing style (imperative, direct, tool-agnostic).
- Removing a step: if other steps reference it by number or name, update those references.
- Rewriting instructions: preserve the intent unless the plan explicitly changes it.
- Adding/modifying an Output Contract section: follow the table format of existing Output
  Contracts in the repo (type + required content columns).
- Adding a routing table row: use the existing row format (`| use-case-id | agent-id | rule |`).

When editing instructions, ask: does this change what the artifact actually does, or just how
it is described? The answer determines the version bump in step 4.

### 3. Apply structural changes (if any)

**Dependency graph:**
- Adding an edge: insert a new row in `## Dependency graph`. Use only v0.3 valid types and
  relations (see `.claude/references/meta-templates.md` → Valid vocabulary).
- Finding a knowledge source's stable ID: look in `knowledge/<bucket>/<dir>/knowledge.meta.md`
  under the `knowledge_source:` frontmatter key — do not infer from directory name alone
  (a directory named `north-star` may have ID `north-star-methodology`; always verify via
  `knowledge.meta.md`).
- Relation type guidance: knowledge sources use `consumes`; q-gates use `gates-at`; tools and
  skills that are hard dependencies use `requires`; conditional or fallback dependencies use
  `optional`.
- Removing an edge: confirm nothing else in the repo references the removed dependency before
  deleting the row.
- documented-only Connector trap: never add a Connector with `"pattern": "documented-only"`
  in its `server.json` to any dependency graph, even as `optional`.

**Frontmatter fields:**
- Expanding `project_types` or `sdlc_phases`: adding values is a MINOR bump.
- Narrowing `project_types` or `sdlc_phases`: removing values affects existing deployments —
  MAJOR bump, and flag to the contributor that downstream users may be affected.
- Adding a `use_case_id`: MINOR bump on both the agent and assistant sidecars.

**v0.3 migration** (old-format connectors and other pre-v0.3 artifacts):
- Replace old field names (`sdlc-stage`, `system-type`, etc.) with v0.3 equivalents.
- Add missing required fields (`project_types`, `sdlc_phases`, `provenance`, `namespace`).
- Set `verified_live: false` if the connector has never been verified post-migration.
- Treat migration as a MINOR bump (additive restructure, no behavioral change).

### 4. Bump the version

Apply to the `*.meta.md` sidecar of every file edited. Rules:

| Change | Bump |
|---|---|
| Wording, typo, formatting only | PATCH |
| New content/capability added, nothing removed | MINOR |
| Existing behaviour changed or removed | MAJOR |

On MAJOR: also update `## Notes` in the sidecar with what changed and why, and tell the
contributor to check who else points at this artifact via `## Dependency graph` in other
`*.meta.md` files — they may need updating too.

### 5. Cross-reference check

For structural changes: after editing, grep for the artifact's stable ID across all
`*.meta.md` files to find other artifacts that declare a dependency on it. If the change
affects their declared relation (e.g. a produces edge now points at a renamed artifact),
flag them for a follow-up edit.

## Output

For each edited artifact:
- File path and a summary of what changed (content vs. structural)
- Old version → new version (with bump type: PATCH / MINOR / MAJOR)
- Any cross-references flagged for follow-up
