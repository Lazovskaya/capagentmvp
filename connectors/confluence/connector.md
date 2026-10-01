# Connector: Confluence

Canonical document store for Brownfield SAD engagement outputs. Publishes approved
readiness, sizing, scoping, and SAD documents as Confluence pages; also read-checks
linked pages during state reconciliation.

The Confluence tools (`read-confluence-page`,
`search-confluence-pages`, `upsert-confluence-page`) call the Confluence REST API
directly via Python stdlib — no MCP server, no `uvx`, no `.mcp.json` wiring needed.
`server.json` and the launcher script remain for optional MCP use, but the Skills
that ship with this connector do not require them.

**Verified live 2026-09-14** against kb.epam.com (Confluence Server/DC): all three
tools confirmed working.

## What it connects to

Confluence REST API, via stdlib `urllib`. Credentials come from a `.env` file outside
the project directory — the same file the optional MCP launcher also reads.

Supports both deployment types:
- **Cloud** (`*.atlassian.net`): `CONFLUENCE_URL`, `CONFLUENCE_USERNAME`,
 `CONFLUENCE_API_TOKEN` (Atlassian API token, not account password).
- **Server / Data Center** (e.g. `kb.epam.com`): `CONFLUENCE_URL`,
 `CONFLUENCE_PERSONAL_TOKEN` (PAT generated in Confluence profile → Personal Access
 Tokens).

Detection is automatic based on which keys are present.

## Wiring

Only one step required — create the credentials file:

```bash
mkdir -p ~/.config/mcp-atlassian/sessions

# Server / Data Center (e.g. kb.epam.com):
cat > ~/.config/mcp-atlassian/sessions/<destination>.env << 'EOF'
CONFLUENCE_URL=https://your-confluence.example.com
CONFLUENCE_PERSONAL_TOKEN=your-personal-access-token
EOF

# Cloud (*.atlassian.net):
cat > ~/.config/mcp-atlassian/sessions/<destination>.env << 'EOF'
CONFLUENCE_URL=https://yourorg.atlassian.net
CONFLUENCE_USERNAME=you@example.com
CONFLUENCE_API_TOKEN=your-api-token
EOF
```

Use any name for `<destination>` (e.g. `default`, `epam`, `client-acme`). Pass it to
every tool via `--destination=<destination>`. The file lives outside the project
directory and is never committed.

**Verify the setup:**
```bash
python3 tools/read-confluence-page/scripts/read_confluence_page.py <any-page-id> \
 --destination=<destination>
```
A JSON response with `page_id`, `title`, and `version` confirms the credentials work.

## Tools

Four Python tools ship with this connector, all using the same credentials file:

- `read-confluence-page` — reads page metadata and content hash; used by
 `brownfield-sad-state-reconciliation` to compare the live page against the local
 checkpoint. Read-only.
- `search-confluence-pages` — CQL title search within a space; used by
 `confluence-document-publishing` to detect duplicates before creating a page.
 Read-only.
- `upsert-confluence-page` — creates or updates a page (dry-run by default, `--apply`
 required for any write); used by `confluence-document-publishing`.
- `upload-confluence-attachment` — uploads a file attachment to a page (dry-run by
 default, `--apply` required); re-reads the attachment list after uploading to verify.
- `reconcile-brownfield-sad-state` — local checkpoint tool; pulled in transitively
 via the `brownfield-sad-authoring-state` artifact.

No delete, move, space-admin, or permission-change operation is implemented.

## Write-back contract

**Default is dry-run.** The `confluence-document-publishing` Skill previews the exact
page title, parent page, space key, and full content before any write. Live MCP
mutations happen only when the user explicitly passes `--apply` (or equivalent). See
See Write-back contract above.

1. Render the document locally first; present the exact title, parent, space key, and
 full content preview.
2. Require explicit user approval (`--apply`).
3. Create or update the page via the connector.
4. Re-read the page immediately after writing to verify version, URL, and that the
 content round-trips correctly.
5. Record the canonical page URL and version in the engagement's
 `brownfield-sad-authoring-state` artifact; never leave publication state ambiguous.

## If it's not connected

`brownfield-sad-authoring-agent` explicitly falls back to working with local files when
Confluence is unavailable -- documents are staged locally and publication state is
marked `not_published -- Confluence unavailable` in the artifact. Nothing blocks on
this connector for the readiness/sizing/scoping analysis steps; only the document
publication step in `confluence-document-publishing` and the live-page hash check in
`brownfield-sad-state-reconciliation` are affected.

## Used by

- `brownfield-sad-state-reconciliation` Skill (via the `read-confluence-page` Tool) — reads linked pages to compare live versions against local
 checkpoints.
- `confluence-document-publishing` Skill — creates and updates Brownfield SAD
 engagement documents.

## Never

Never put credentials in `.mcp.json`, `server.json`, or anywhere in git. Never delete,
move, or change permissions on a Confluence page through this connector. Never write to
a page the engagement did not itself create without an explicit, separate human
approval beyond the standard `--apply` gate.

## Governance contract

```yaml
data_classification:
 input: client-confidential
 output: client-confidential
 credentials: restricted
default_mode: read-only
allowed_operations:
 [read-confluence-page, search-confluence-pages, upsert-confluence-page, upload-confluence-attachment]
approval_required: [upsert-confluence-page, upload-confluence-attachment]
forbidden_operations:
 [delete, move, space-admin, permission-change, space-crawl]
write_controls:
 preview_payload: true
 local_artifact_required: true
 reread_after_write: true
 external_id_required: true
 apply_flag_required: true
```

Engagement document content is client-confidential. Do not promote page content to
reusable knowledge without redaction, provenance, and explicit reuse approval.
