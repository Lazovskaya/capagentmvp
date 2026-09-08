# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

SAP AI Factory — successor to `sap-ai-framework`. It defines a tool-agnostic set of components
(skills, agents, connectors, artifacts, gates, knowledge) organized around SAP Activate's
phase-and-component-kind model, meant to be installed into whichever tool a project actually uses
(Claude Code, Cursor, GitHub Copilot). This is a content/data repo, not an application — there is no
build step for software, only a data-regeneration script for a static HTML page.

**Mission:** deliver SAP projects faster and at lower cost, without lowering the quality bar —
target 30% delivery acceleration, measured per engagement. The factory model is: Activities (one per
unit of delivery work, owned by a role, ending at a gate) composed of the six component kinds
(Skills, Agents, Connectors, Artifacts, Q-gates, Knowledge), carried across every SAP Activate phase
by whichever tool the team already uses — the same component files, adapted per tool, not
reimplemented per tool. Evidence at each gate rather than assurances; clean core by default. Built to
compound: every engagement is meant to leave behind knowledge and components (mainly via
`knowledge/`) that make the next engagement cheaper. When judging whether something belongs in this
repo, or how to prioritize among gaps, weigh it against this goal rather than treating this as a
generic internal tooling repo.

## Commands

```bash
python3 build.py
```

Regenerates `index.html`'s inline `window.FACTORY_DATA` block and `factory-data.js` (the `file://`
fallback `index.html` loads when it can't `fetch()` its own JSON due to CORS) from
`factory-data.json`. Run this after every edit to `factory-data.json`, before viewing `index.html`
locally. Never hand-edit either generated file — they get overwritten.

```bash
python3 -m pytest -q
```

Runs `tests/` — a real, sizeable suite (1500+ parametrized cases) checking `factory-data.json`
referential integrity, SAP Activate gate-sequence rules, artifact schema/template consistency,
own-posture skill convention compliance, and the `tools/` scripts themselves. See `tests/README.md`
for what each file covers. `validators/validate_factory.py` is a separate, already-implemented
standalone CLI script doing a broader one-shot repo health check (referential integrity, connector
JSON, generated-file drift) — run it too before a push if unsure which catches what; it isn't
merged into the pytest suite.

## Architecture

`factory-data.json` is the single source of truth for the whole factory. Everything else either
derives from it, points back into it, or exists to keep it honest:

- **`index.html`** — the interactive component map. Only the inline `FACTORY_DATA` block is
  generated; everything else is hand-written. Its client-side `paths()` function encodes the same
  path convention as the repo's actual directory layout, so the map and the repo can't drift apart by
  more than a rebuild.
- **Where people actually view it**: git.epam.com's file browser doesn't render `index.html` live —
  it shows raw source. The page people actually look at is a Confluence copy ([SAP AI Factory
  Design](https://kb.epam.com/spaces/ESAPCC/pages/2898132737/SAP+AI+Factory+Design)). That page's
  HTML macro was seeded once from `index.html`'s `<body>` contents, but its script fetches
  `factory-data.json` at runtime from the page's own attachment rather than reading an inline block
  (needed because the macro can't run from `file://`, where CORS blocks `fetch()`). So after every
  `python3 build.py` run, re-upload `factory-data.json` as that page's attachment (Attachments →
  replace the existing `factory-data.json`) — the HTML macro itself does not need touching again.
  This repo holds the versioned source of truth; Confluence is a rendering target, not the
  canonical copy.
- **`skills/<name>/SKILL.md`** — own-posture skills (authored in this repo).
- **`skills/index.yaml`** — adopt-posture skills: not authored here, pulled in from elsewhere
  (e.g. `epam-sap-skills`, `skills.cloud.sap`). The own/adopt split is a deliberate posture
  distinction tracked per-component in `factory-data.json` (`postures`/`postureWhy` keys).
- **`agents/<name>/agent.md`** (+ `agent.meta.md` sidecar) — bounded agents that return a typed,
  auditable verdict. All three tool adapters write them as a single synthesized `.md` file per
  agent (`.claude/agents/<n>.md`, `.cursor/agents/<n>.md`, `.github/agents/<n>.md` -- each tool's
  own subagent convention, confirmed against current docs 2026-09-08); Copilot's carries the same
  inferred-from-docs caveat as its skill/MCP support, see that adapter's README.
- **`connectors/<name>/connector.md` + `connectors/<name>/server.json`** — MCP/CLI connector
  definitions and their config fragments. `abap-mcp` and `jira` are the two connectors actually
  live-tested against a real system (not just documented) as of this writing; both follow the same
  credential pattern worth reusing for any new connector: real secrets live in a file outside the
  project directory (`~/.config/<tool>/sessions/<destination>.env` or equivalent), loaded by a
  small launcher script referenced from `server.json` — never inline env vars in `.mcp.json` (that
  silently doesn't work for `abap-mcp`'s `mcp-abap-adt`) and never an OS-specific mechanism like
  macOS Keychain (breaks on Linux/Windows; `jira`'s launcher was rewritten in Python specifically
  to avoid this).
- **`artifacts/<name>/template.md` + `artifacts/<name>/schema.json`** — durable handoff templates
  between phases/skills, with required fields enforced by the schema.
- **`gates/<name>.md`** — phase-exit criteria, named after Activate's own gates (not an invented
  vocabulary): `discover-prepare`, `prepare-explore`, `explore-realize`, `realize-deploy`,
  `deploy-run`, `run-exit`.
- **`knowledge/<name>/`** — nine knowledge buckets (`clean-core`, `config`, `custom-code`, `data`,
  `domain-packs`, `extensibility`, `operations`, `process`, `standards`, `testing`), each ships a
  central default a project can override per file. `domain-packs` specifically holds swappable
  domain expertise (e.g. order-to-cash) shared across engagements, distinct from a project's own
  discovered content.
- **`activities/<phase>/<name>.md`** — one file per activity listed in `factory-data.json`; these are
  short pointers back to the real skill/agent/connector/artifact files, not new content of their own.
- **`tools/<tool>/adapter/`** — per-tool (`claude-code`, `cursor`, `github-copilot`) adapter
  scaffolding; not yet implemented, see each folder's own README.

When adding or moving a component, update `factory-data.json` first (it's canonical), then run
`python3 build.py`, then keep the corresponding files in the directories above in sync with what
`factory-data.json` now says — nothing currently enforces that sync automatically (see "Known gaps").

### Skill authoring conventions

Before designing or reviewing a skill under `skills/`, read `docs/skill-design-conventions.md` in
full — it documents patterns discovered across seven rounds of dry-run testing (things like: give
every artifact a stable copyable ID at creation time rather than free-text re-description; give
status enums an explicit reopen/escalation path, not just forward motion; use distinct names for
distinct roles even when one person holds several; separate a fine-grained "Caveats" flag from a
coarse Status field; write out the actual decision test behind any N-way routing, not just a table).
Each skill that follows these conventions links back to this file from its own `SKILL.md`.

### Known gaps (don't assume these are wired up)

- `index.html`'s runtime script (`__runtime()`) hand-maintains its own `SCAFFOLD` and `TOOLS`
  objects, which duplicate `factory-data.json`'s `scaffold` and `tools` fields rather than deriving
  from them at runtime. `build.py` does not regenerate this block — editing `factory-data.json`'s
  `scaffold` or `tools` fields will not update it. The two currently agree, but nothing enforces that.
- `knowledge/<name>/README.md` files under `process`, `config`, `data`, and `operations` list
  candidate files that look like they'd migrate in from `sap-ai-framework`, but that repo does not
  exist in this environment — there is nothing to actually move. Treat those lists as "what this
  bucket should eventually cover," not a pending copy job; writing real content (grounded in
  standard SAP practice, or ported from `sap-ai-cons` where a real equivalent exists) is the only
  way any of them progress, the same way `knowledge/testing/` did.
- `knowledge/testing/` now has real content (`defect-history-template.md`,
  `test-script-template.md`) — the empty-shape/candidate-list pattern the other four buckets above
  are still in.
- `validators/validate_factory.py` is implemented (see Commands above); the per-tool
  `tools/<tool>/adapter/` folders are still scaffolded only.
- A connector's prose claiming "real, live-tested wiring" is not proof the wiring still works —
  both `abap-mcp` and `jira` said this while actually being broken (a missing launcher script for
  `jira`; an `.mcp.json` env-var pattern for `abap-mcp` that the server silently ignores). Treat
  any untouched connector's setup steps as unverified until someone actually runs them end to end
  against a real system again.
