# SAP AI Factory

Successor to `sap-ai-framework`: the same underlying idea, tool-agnostic components installed
into whichever tool a project actually uses (Claude Code, Cursor, GitHub Copilot), restructured
around the Activate-phase-and-component-kind model in `factory-data.json`.

## Single source of truth

`factory-data.json` is canonical, but it holds two different kinds of content:

- **Hand-authored taxonomy** -- `phases`, `roles`/`roleOrder`, `engagements`, `statuses`,
  `postures`/`postureWhy`, `rows`, `coverage`, `tools`, `scaffold`, `groups`. Nothing else in the
  repo derives these; they exist only here, and there is no folder to regenerate them from.
- **`components[]` and `assistants[]`** -- these describe what's actually on disk. Regenerate them
  from the real `skills/`, `agents/`, `tools/`, `connectors/`, `artifacts/`, `gates/`,
  `knowledge/`, and `assistants/` folders (their `*.meta.md` sidecars) with:

  ```bash
  python3 scripts/generate_factory_data.py --write
  ```

  Use `--check` instead of `--write` to preview the diff without writing. A component folder with
  no matching sidecar is dropped from `factory-data.json`, not carried forward as a stale
  placeholder for something that no longer exists.

Either way, once `factory-data.json` says what you want, regenerate `index.html`'s inline copy and
`factory-data.js` (the `file://` fallback the page loads when it can't `fetch()` its own JSON due
to CORS):

```bash
python3 build.py
```

`build.py` only ever reads `factory-data.json` -- it never looks at the component folders itself,
so editing a `skill.meta.md` and running only `build.py` has no effect until the generator step
above has updated `factory-data.json` first. `python3 build.py --regenerate` runs both steps in one
call. Neither script can create `index.html` or `factory-data.json` from nothing: both are
in-place updates to files that must already exist, and both fail with `FileNotFoundError` if the
target file is missing or renamed. Never hand-edit `index.html`'s inline block or `factory-data.js`
directly, they get overwritten on the next run.

## Where people actually view this page

`git.epam.com`'s normal file browser does not render `index.html` live, it shows the HTML source
as text, the same as any other file. The page people actually look at is the Confluence one:
[SAP AI Factory Design](https://kb.epam.com/spaces/ESAPCC/pages/2898132737/SAP+AI+Factory+Design).
That page's HTML macro was seeded once from `index.html`'s `<body>` contents, but its script
fetches `factory-data.json` at runtime from the page's own attachment (the macro can't run from
`file://`, where CORS blocks `fetch()`, so it can't read an inline block instead). So after editing
`factory-data.json`:

1. Run `python3 build.py` to regenerate `index.html`'s inline data.
2. Re-upload `factory-data.json` as that Confluence page's attachment (Attachments → replace the
   existing `factory-data.json`) — the HTML macro itself does not need touching again.
3. Commit the source changes here too, so the two stay in sync and the history is not only on
   Confluence.

## Data source modes

`index.html` tries three data sources in order, shown top-right as a small label:

1. **KB** -- Confluence page attachment (only tried when a page ID is detectable).
2. **File** -- `factory-data.json` fetched relative to the page (local server, or a file:// same-folder `factory-data.js` load).
3. **Fallback (embedded)** -- the `window.FACTORY_DATA` baked into `index.html` at the last `build.py` run.

To run it locally with a real `File` mode (double-clicking the file falls back to `Fallback (embedded)`, since `fetch()` is CORS-blocked under `file://`):

```powershell
scripts\serve-local.ps1
```

Starts a local HTTP server and opens `index.html` in the browser.

## CI pipelines

What each GitLab CI job does, when it runs, and which project variables it needs (including the
opt-in auto-regeneration of `factory-data.json` on `main`): [docs/ci-pipelines.md](docs/ci-pipelines.md).

## Layout

- `factory-data.json`, the data model: hand-authored taxonomy (phases, roles, engagements,
  statuses, postures, component rows, tool coverage, scaffold) plus `components[]`/`assistants[]`,
  generated from the folders below -- see "Single source of truth" above.
- `scripts/generate_factory_data.py`, rewrites `factory-data.json`'s `components[]`/`assistants[]`
  from the `*.meta.md` sidecars on disk.
- `index.html`, the interactive component map, generated content lives inline, everything else is
  hand-written.
- `build.py`, regenerates the generated parts of `index.html` plus `factory-data.js` from
  `factory-data.json`.
- `skills/<name>/SKILL.md` plus `skill.meta.md`, own-posture skills, authored here.
- `skills/index.yaml`, adopt-posture skills, not authored here, pulled in from elsewhere.
- `agents/<name>/agent.md` plus `agent.meta.md`, bounded agents returning a typed, auditable
  verdict.
- `tools/<name>/tool.md` plus `tool.meta.md`, callable operations a Skill or Agent invokes; each
  reaches an external system only through a Connector.
- `connectors/<name>/connector.md` plus `connectors/<name>/server.json`, MCP and CLI connector
  definitions plus their config fragments.
- `artifacts/<name>/template.md` plus `artifacts/<name>/schema.json`, durable handoff templates
  and their required fields.
- `gates/<name>/gate.md` plus `gate.meta.md`, phase-exit criteria (Activate's own gates, not a
  vocabulary we invented).
- `knowledge/<name>/`, the knowledge buckets, each ships a central default a project can override
  per file.
- `assistants/<name>/assistant.md` plus `assistant.meta.md`, role-scoped entry points that route a
  request to the right agent or skill; one `assistants[]` entry per `use_case_id` they declare.
- `scripts/adapter_common.py`, shared skill-discovery/connector-normalization/content-hash/lock-file
  logic used by all three working adapters below.
- `scripts/claude-code/adapter/`, `scripts/github-copilot/adapter/`, and `scripts/cursor/adapter/`,
  each an `install.py` (see "Installing skills into a project" below). `validators/` and `docs/`
  beyond `skill-design-conventions.md` are still scaffold only, not yet implemented, see each
  folder's own README.

This mirrors the path convention the component map's own client-side code uses (see `index.html`'s
`paths()` function), so the map and the repo can never drift apart by more than a rebuild.

## Installing skills into a project

Use `scripts/unpack.py` — the single entry point across all three tools:

```bash
python3 scripts/unpack.py --target claude-code --project /path/to/client-project \
  --skills '*' --connectors abap-mcp
```

`--target` accepts `claude-code`, `github-copilot` (alias `copilot`), or `cursor`; repeatable
to install for multiple tools in one call. See `scripts/unpack.py`'s own docstring for the full
reference.

**For adopt-posture/ad-hoc setups**, call a specific tool's adapter directly — see each
folder's README for the full flag reference:

```bash
python3 scripts/claude-code/adapter/install.py \
  --project /path/to/client-project --skills '*' --connectors jira
# or:
python3 scripts/github-copilot/adapter/install.py \
  --project /path/to/client-project --skills '*' --connectors jira
# or:
python3 scripts/cursor/adapter/install.py \
  --project /path/to/client-project --skills '*' --connectors jira
```

All three install only own-posture skills (`skills/<name>/SKILL.md` in this repo) plus connectors
that have real, non-placeholder wiring, generate a working mcp config and entry file in the tool's
own shape, and record what was installed in `factory-lock.json` so re-runs only touch what
actually changed. `scripts/unpack.py` is a thin dispatcher over these same three scripts, not a
separate implementation.

**Adopt-posture skills** (listed in `skills/index.yaml`, not authored in this repo — neither
adapter above handles these) still need the real, live-tested manual process, using the `skills` CLI
(`vercel-labs/skills`, the same tool `factory-data.json`'s `postureWhy.adopt` references for
pulling them into this factory in the first place):

```bash
npx skills add /path/to/sap-ai-factory -a claude-code -s '*' --copy -y
```

- **Scope `-a` to the one tool the project actually uses** (`claude-code`, `cursor`, or
  `github-copilot`). Never run with `--all` — that installs into every one of the ~70 agents the
  CLI supports (`.goose/`, `.grok/`, `.junie/`, …), cluttering the project with dozens of unwanted
  directories.
- **`--copy`, not the default symlink**, so a client project gets its own snapshot rather than a
  live link back into this repo's checkout.
- **Skills only land where the target tool actually looks.** For Claude Code that's
  `.claude/skills/<name>/`, not this repo's own `skills/<name>/` — a bare top-level `skills/`
  folder is not auto-discovered by any coding agent; that's exactly what this multi-tool install
  step is for.
- **Caveat, found by testing this against a real clone:** if the *destination* project is itself a
  full checkout of this repo (or otherwise has its own top-level `skills/<name>/` folders using the
  same names), `skills add` from a local-path source has been observed to delete those matching
  files from the destination after copying them into `.claude/skills/`, rather than leaving them in
  place. Recoverable with `git checkout -- skills/` if the destination is itself a git repo, but
  worth knowing before running this inside a working checkout of this factory rather than a real
  client project. This is exactly the footgun `install.py` was written to structurally avoid for
  own-posture skills — see that folder's README.

## Migrating from sap-ai-framework

Already ported, with real content, not left as generic stubs:

- `skills/fit-to-standard/SKILL.md`, from `epam-sap-skills`' `skills/brownfield/fit-to-standard`,
  the one fully built reference skill in the old system. Marked ready here too, this factory's
  proof that the pipeline works end to end.
- `knowledge/clean-core/README.md`, from `sap-ai-framework/knowledge/standards/clean-core.md`.
  Turned out to be a stub there too (contract only, no content); carried forward honestly rather
  than invented.
- `knowledge/standards/`, the other four files copied verbatim from
  `sap-ai-framework/knowledge/standards/`, also all stubs.
- `skills/defect-triage/SKILL.md` and `agents/defect-classifier.md`, adapted (not copied) from
  sap-ai-cons's real, Jira-integrated bugfix track (`incident-triage`, `root-cause-playbook`,
  `defect-pattern-analysis`, live-tested on real tickets). The domain-specific part
  (order-to-cash taxonomy, signal catalog, troubleshooting trees) was deliberately left out,
  following sap-ai-cons's own generic-engine-plus-domain-pack pattern, see the "Domain packs"
  note in `skills/defect-triage/SKILL.md`.
- `agents/knowledge-harvester.md`, from sap-ai-cons's own agent of the same name, itself a stub
  there too.
- `connectors/jira/`, from sap-ai-cons's `mcp/connectors/tickets.md` and
  `jira-e2e-runbook.md`, the most mature connector across either predecessor repo: `mcp-atlassian`
  wiring exercised against real tickets there. The launch script that actually supplies
  credentials wasn't carried over in the initial port, though — `server.json` ran
  `uvx mcp-atlassian` directly with nothing to authenticate it, until that was found and fixed
  (`connectors/jira/scripts/start-mcp-atlassian.py`, cross-platform, reads a `.env` file outside
  the project rather than sap-ai-cons's original macOS-only Keychain script) and re-verified live.

Resolved:

- `skills/index.yaml`'s `abap-dev` entry: confirmed the real source is `epam-sap-skills`'
  `classic-abap` and `modern-abap`, not skills.cloud.sap. `factory-data.json`'s description was
  corrected to match.

Also ported, in a later pass:

- sap-ai-cons's full bugfix pipeline — `incident-triage`, `root-cause-playbook`,
  `pricing-diagnostic`, `billing-ar-error-analyzer`, `idoc-failure-analyzer`,
  `fix-doc-and-regression`, `defect-pattern-analysis` — real, Jira-tested skills, not stubs.
  `defect-triage` narrowed back to just the commercial bug-vs-spec-flaw call it was always meant to
  make, deferring intake/diagnose to these siblings instead of informally duplicating them.
- sap-ai-cons's order-to-cash domain pack (10 troubleshooting trees, taxonomy, signal catalog,
  routing matrix, subprocess adjacency, pricing condition-technique, billing/AR account
  determination, IDoc ORDERS/INVOIC catalog) — real and live-tested, ported wholesale into a new
  `knowledge/domain-packs/` bucket (not `testing`, since it's swappable domain expertise shared
  across engagements, distinct from a project's own discovered content).

Still open:

- Per-bucket `knowledge/<name>/README.md` files under `process`, `config`, `data`, `testing`, and
  `operations` list candidate files from `sap-ai-framework/knowledge/methodology|domain|templates`
  that look like they'd migrate into that bucket. Nothing has actually been moved, review and
  decide per bucket.
- `index.html`'s runtime script (`__runtime()`) carries its own hand-written `SCAFFOLD` and
  `TOOLS` objects, a second copy of what `factory-data.json`'s `scaffold` and `tools` fields
  already say, not derived from them at runtime. This was already true of the page as given, not
  introduced here. The two currently agree, but nothing enforces that: editing
  `factory-data.json`'s `scaffold` or `tools` fields won't update this block, `build.py` only
  regenerates the inline `FACTORY_DATA` blob and `factory-data.js`. Worth fixing if this page gets
  more maintenance life, by generating that block too rather than hand-authoring it.
