---
name: artifact-design
description: Analyse a contributor's free-form request and produce a structured authoring plan — what to create from scratch, what to modify in existing files, draft IDs, applicability, and a dependency order — before any file is touched.
---

# Artifact Design

Turns a contributor's free-form request into a concrete, reviewable plan. No files are
created or modified by this skill — it only reads and reasons.

## When to use

Always first. Every contribution session starts here, whether the request is:
- "I want to add a new use case for X"
- "Add a step to skill Y"
- "Port skill Z from another repo"
- "Extend agent W to also handle use case V"

## Inputs

- Contributor's request (free-form, any level of detail)
- Optionally: Jira ticket ID, target assistant, candidate IDs the contributor already has in mind

## Steps

### 1. Classify the request

Determine which category applies (more than one is possible):

| Category | Examples |
|---|---|
| New use case | New skill + agent + assistant from scratch |
| Extend existing | Add skill to existing agent, add use case to assistant routing table |
| Content edit | Add/remove/rewrite steps in SKILL.md or agent.md |
| Structural edit | New dependency edge, version bump, v0.3 migration |
| Port | Bring a skill/agent from another factory repo |

### 2. Read the current state

For the artifacts the request touches:
- Read their `*.meta.md` sidecars (frontmatter + dependency graph)
- Read their body files (SKILL.md, agent.md, assistant.md as applicable)
- Check `factory-data.json` for existing entries with the same `name` field under the same `kind` (collision source separate from `*.meta.md`)
- Scan all `*.meta.md` files for ID collisions on any candidate stable IDs:
  ```bash
  grep -rn '<candidate-id>' skills/ agents/ tools/ connectors/ knowledge/
  ```
  Replace `<candidate-id>` with the actual proposed ID string (e.g. `gap-fit-analysis`).

### 3. Draft the plan

Produce a structured plan with these sections:

**New artifacts to create** (if any):
- Stable ID, artifact type, draft `project_types`, `sdlc_phases`, dependency edges
- Bottom-up order: Connector → Tool → Knowledge source → Skill → Agent → Assistant

**Existing artifacts to modify** (if any):
- File path, specific change (which field, which section, what to add/remove/replace)
- Whether the change warrants MAJOR / MINOR / PATCH version bump (see versioning rules below)

**Practice-controlled IDs requiring confirmation** (flag, do not mint unilaterally):
- New `use_case_id` — ask `katsiaryna_ustsinava@epam.com` or check the Jira ticket; the AI Glossary lives in a separate repo not cloned here. Also add the new ID to `factory-data.json` under the relevant use case entry AND to `agent.meta.md`'s `use_case_ids` field.
- New Tool `operation` — check existing `tool.meta.md` files for the nearest match
- New Assistant `role_scope` — always flag, always requires practice owner sign-off
  (currently `katsiaryna_ustsinava@epam.com`)

**Open questions** — anything that requires human input before proceeding:
- Bucket choice for a new Knowledge source (if unclear after reading bucket READMEs)
- Whether a Factory Tool wrapper is needed vs. direct MCP invocation from skill instructions
- Any ambiguity in the contributor's stated scope

### 4. Versioning rules for modified artifacts

Apply to every existing artifact the plan touches:

| Change | Bump |
|---|---|
| Wording, typo, formatting — behaviour unchanged | PATCH |
| New capability added, nothing removed or changed | MINOR |
| Existing behaviour changed or removed (new required input, changed output contract, removed use case, connector needs different credentials) | MAJOR |

When in doubt: *if someone using the previous version changed nothing on their end, would it now behave differently?* Yes → MAJOR. No but something new is available → MINOR. No change at all → PATCH.

## Output

A structured plan document containing:
- Classification of the request
- New artifacts list (IDs, types, draft applicability, dependency edges, creation order)
- Existing artifacts modification list (file, change, version bump)
- Practice-controlled IDs flagged for confirmation
- Open questions requiring human resolution before creation/editing begins

The plan is presented to the contributor for explicit confirmation before `artifact-creation`
or `artifact-editing` is invoked.
