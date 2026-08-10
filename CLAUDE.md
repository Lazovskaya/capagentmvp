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

Regenerates `index.html`'s inline `window.FACTORY_DATA` block, `factory-data.js` (the `file://`
fallback `index.html` loads when it can't `fetch()` its own JSON due to CORS), and
`confluence-fragment.html` (just `index.html`'s `<body>` contents, no
`<!doctype>`/`<html>`/`<head>`/`<body>` wrapper — that wrapper is what actually gets pasted into the
Confluence page, see "Where people actually view it" below) from `factory-data.json`. Run this after
every edit to `factory-data.json`, before viewing `index.html` locally. Never hand-edit any of the
three generated files — they get overwritten.

No lint/test commands exist yet — `validators/` (CI checks: every reference in `factory-data.json`
resolves to a real file, no orphaned skill/agent/connector/artifact/gate files, generated adapters
not drifted) is scaffolded but **not yet implemented**.

## Architecture

`factory-data.json` is the single source of truth for the whole factory. Everything else either
derives from it, points back into it, or exists to keep it honest:

- **`index.html`** — the interactive component map. Only the inline `FACTORY_DATA` block is
  generated; everything else is hand-written. Its client-side `paths()` function encodes the same
  path convention as the repo's actual directory layout, so the map and the repo can't drift apart by
  more than a rebuild.
- **Where people actually view it**: git.epam.com's file browser doesn't render `index.html` live —
  it shows raw source. The page people actually look at is a Confluence copy ([SAP AI Factory
  Design](https://kb.epam.com/spaces/ESAPCC/pages/2898132737/SAP+AI+Factory+Design)), updated by
  pasting `confluence-fragment.html`'s content into the page's HTML macro after every `build.py`
  run — not `index.html` itself, whose `<!doctype>`/`<html>`/`<head>`/`<body>` wrapper breaks the
  macro (it inserts into an already-existing page DOM). This repo holds the versioned source of
  truth; Confluence is a rendering target, not the canonical copy.
- **`skills/<name>/SKILL.md`** — own-posture skills (authored in this repo).
- **`skills/index.yaml`** — adopt-posture skills: not authored here, pulled in from elsewhere
  (e.g. `epam-sap-skills`, `skills.cloud.sap`). The own/adopt split is a deliberate posture
  distinction tracked per-component in `factory-data.json` (`postures`/`postureWhy` keys).
- **`agents/<name>.md`** — bounded agents that return a typed, auditable verdict.
- **`connectors/<name>/connector.md` + `connectors/<name>/server.json`** — MCP/CLI connector
  definitions and their config fragments.
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
- `validators/` and the per-tool `tools/<tool>/adapter/` folders are scaffolded only.
