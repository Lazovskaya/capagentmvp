# SAP AI Factory

Successor to `sap-ai-framework`: the same underlying idea, tool-agnostic components installed
into whichever tool a project actually uses (Claude Code, Cursor, GitHub Copilot), restructured
around the Activate-phase-and-component-kind model in `factory-data.json`.

## Single source of truth

`factory-data.json` is canonical. `index.html` (the component map) keeps an inline copy of that
same data for standalone viewing; after editing `factory-data.json`, run:

```bash
python3 build.py
```

This regenerates `index.html`'s inline block and `factory-data.js` (the `file://` fallback the
page loads when it can't `fetch()` its own JSON due to CORS). Never hand-edit either generated
block, they get overwritten.

## Where people actually view this page

`git.epam.com`'s normal file browser does not render `index.html` live, it shows the HTML source
as text, the same as any other file. The page people actually look at is the Confluence one:
[SAP AI Factory Design](https://kb.epam.com/spaces/ESAPCC/pages/2898132737/SAP+AI+Factory+Design).

This repo holds the versioned source. After editing `factory-data.json`:

1. Run `python3 build.py` to regenerate `index.html`'s inline data.
2. Copy the updated `index.html` content into the Confluence page (it's embedded there as raw
   HTML, the same way `index.html`'s own comments describe attachment-based data loading for a
   Confluence-hosted copy).
3. Commit the source changes here too, so the two stay in sync and the history is not only on
   Confluence.

## Layout

- `factory-data.json`, the data model: phases, roles, engagements, statuses, postures, component
  rows, components, activities, tool coverage, and the scaffold.
- `index.html`, the interactive component map, generated content lives inline, everything else is
  hand-written.
- `build.py`, regenerates the generated parts of `index.html` plus `factory-data.js` from
  `factory-data.json`.
- `skills/<name>/SKILL.md`, own-posture skills, authored here.
- `skills/index.yaml`, adopt-posture skills, not authored here, pulled in from elsewhere.
- `agents/<name>.md`, bounded agents returning a typed, auditable verdict.
- `connectors/<name>/connector.md` plus `connectors/<name>/server.json`, MCP and CLI connector
  definitions plus their config fragments.
- `artifacts/<name>/template.md` plus `artifacts/<name>/schema.json`, durable handoff templates
  and their required fields.
- `gates/<name>.md`, phase-exit criteria (Activate's own gates, not a vocabulary we invented).
- `knowledge/<name>/`, the nine knowledge buckets, each ships a central default a project can
  override per file.
- `activities/<phase>/<name>.md`, one file per activity in `factory-data.json`, short pointers
  back to the real skill/agent/connector/artifact files, not new content.
- `tools/<tool>/adapter/`, `validators/`, `docs/`, scaffold only, not yet implemented, see each
  folder's own README.

This mirrors the path convention the component map's own client-side code uses (see `index.html`'s
`paths()` function), so the map and the repo can never drift apart by more than a rebuild.

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
  `jira-e2e-runbook.md`, the most mature connector across either predecessor repo: real, live
  tested wiring via `mcp-atlassian` and OS keychain credentials, not a specification.

Resolved:

- `skills/index.yaml`'s `abap-dev` entry: confirmed the real source is `epam-sap-skills`'
  `classic-abap` and `modern-abap`, not skills.cloud.sap. `factory-data.json`'s description was
  corrected to match.

Still open:

- Per-bucket `knowledge/<name>/README.md` files under `process`, `config`, `data`, `testing`, and
  `operations` list candidate files from `sap-ai-framework/knowledge/methodology|domain|templates`
  that look like they'd migrate into that bucket. Nothing has actually been moved, review and
  decide per bucket.
- sap-ai-cons's order-to-cash domain pack (10 troubleshooting trees, taxonomy, signal catalog,
  real and live-tested) is the strongest available content for the `testing` knowledge bucket, but
  porting a client-facing domain pack wholesale is a separate decision from this scaffold pass,
  not done here.
- `index.html`'s runtime script (`__runtime()`) carries its own hand-written `SCAFFOLD` and
  `TOOLS` objects, a second copy of what `factory-data.json`'s `scaffold` and `tools` fields
  already say, not derived from them at runtime. This was already true of the page as given, not
  introduced here. The two currently agree, but nothing enforces that: editing
  `factory-data.json`'s `scaffold` or `tools` fields won't update this block, `build.py` only
  regenerates the inline `FACTORY_DATA` blob and `factory-data.js`. Worth fixing if this page gets
  more maintenance life, by generating that block too rather than hand-authoring it.
