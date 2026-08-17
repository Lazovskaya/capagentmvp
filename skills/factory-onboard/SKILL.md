---
name: factory-onboard
description: Onboard a consultant to SAP AI Factory for a project: verify the local tool path, capture engagement context, check required connectors, and route to one first delivery skill with a reproducible handoff.
---

# Factory Onboard

For consultants using the factory on an engagement, not for people authoring
`factory-data.json`, skills, validators or platform CI.

This is the single user entry after installation:

```text
orient -> verify tool path -> capture project context -> route -> hand off
```

It does not produce a client deliverable, feed a Q-gate or silently run the next
delivery skill. It produces a day-0 verification summary and a usable handoff.

## When to use

- First time after installing or cloning the factory for project work.
- When asking how to start on an engagement or which skill to run.
- When resuming after a pause and the usable connector/component status may have changed.

Do not use for client end-user training/OCM or as the contributor guide. Use
`README.md` and platform documentation for factory authoring.

## Required inputs

Always collect:

| Field | Values |
|---|---|
| `role` | `functional`, `developer`, `architect`, `delivery`, `basis`, `data`, `test` |
| `session_goal` | `orient only`, `day-0 setup`, `start project work` |
| `tool` | Claude Code, GitHub Copilot or Cursor |

For `day-0 setup` or `start project work`, also collect:

| Field | Values / rule |
|---|---|
| `skills_visible` | pass, fail or not checked; record the tool path |
| `workspace_path` | local engagement output path; no secrets or customer data in git |
| `required_connectors` | connector names needed for the first skill, or `none` |
| `connector_status` | ready, configured, unavailable or not required per connector |

For `start project work`, collect:

| Field | Rule |
|---|---|
| `phase` | Discover, Prepare, Explore, Realize, Deploy or Run |
| `engagement` | `G` Greenfield, `B` Brownfield, `A` Build and Extend, `R` AMS & Run |
| `goal` | one sentence describing the desired output |
| `domain_pack` | recommended for Realize/Run diagnostics |
| `ceremony` | optional: `light`, `standard` or `deep` |
| `apply_writes` | default `false`; live mutations require explicit approval |

Ask for missing values before finishing. Do not invent acceptance criteria,
client configuration or a connector health result.

## Progressive reads

1. Read the installation section of `../../README.md`.
2. Check `../../index.html` or the component map for `ready`, `progress` and
   `notstarted`; status beats outdated chat memory.
3. Walk `references/first-day-checklist.md`.
4. Route with `references/phase-routing.md`.
5. Read only the selected delivery skill's `SKILL.md` at handoff.

Do not send a project user to authoring conventions unless they ask how to write
factory content.

## Procedure

1. **Orient.** Explain that skills are playbooks, `knowledge/` is their input,
   `workspace/` is local run output, and component maturity is explicit.
2. **Verify the tool path.** Confirm the selected tool and that installed skills
   are visible where that tool loads them. Record `not checked` when this was not
   tested; never infer readiness from a directory existing.
3. **Check connectors.** For each connector required by the routed skill, inspect
   its connector contract and run only a safe read-only smoke test when available.
   Record configured, unavailable or not checked. Credentials remain outside the
   repository. Writes are dry-run/preview unless `apply_writes` is explicitly true.
4. **Check workspace hygiene.** Confirm the engagement output path is local and
   that client data, credentials and generated exports are excluded from git.
5. **Capture context.** For project work, write:
   `workspace/factory-onboard/<YYYY-MM-DD>-<slug>/context.json`.
6. **Route.** Use the phase, engagement and goal to select exactly one next skill.
   State its name, why it is next, required inputs and any connector gaps.
7. **Hand off.** Stop after naming the next skill unless the user explicitly asks
   to continue in the same turn. Then load that skill's contract and follow it.

## Role routing

| Role | Typical starting skills |
|---|---|
| Functional | `requirements-intake`, `fit-to-standard`, then `config-doc` |
| Architect | `readiness-analysis`, `agent-readiness`, `solution-design` |
| Developer | `custom-code-scan`, then adopted `abap-dev` |
| Delivery | phase routing; `cutover-plan` or `go-live-readiness` in Deploy |
| Data | `reconciliation` |
| Test | `test-case-design` or `defect-triage` |
| Basis | `production-conversion` |

Phase and engagement modifiers override this table. Use
`references/phase-routing.md` for the complete routing matrix.

## Output contract

Return a concise handoff containing:

```text
tool:
skills_visible:
workspace_path:
phase:
engagement:
goal:
next_skill:
why:
required_inputs:
required_connectors:
connector_gaps:
write_mode: dry-run | apply-approved
```

For project work, also write `context.json` with the same fields and the date.
The context file is local-only and must not contain credentials.

## Routing guardrails

- `requirements-intake` precedes fit-to-standard when no normalized ask exists.
- `solution-design` works at scope level and produces the architecture package;
  do not route to a separate architecture-package activity.
- Realize build skills require an `APPROVED` design record for the relevant Row ID.
- Missing or unavailable connectors produce a degraded local-artifact route, not
  an invented live result.
- A connector mutation remains preview-only until explicit approval.

## Status

Progress. This skill is the user entry and routing contract; it is not a
replacement for delivery skills or platform validation.