# Tool: Read Confluence Page

Reads a Confluence page's metadata and content hash for the state-reconciliation use case.
Returns the page's current version number, last-modified timestamp, and a SHA-256 hash of
its storage-format body -- the three values `brownfield-sad-state-reconciliation` needs to
decide whether the live page has drifted from the local checkpoint.

Does not return the full page content (only its hash and length), deliberately: this tool
is for version comparison, not content extraction. The `confluence-document-publishing`
Skill uses the connector's `confluence_get_page` MCP tool for full-content reads.

Requires the `confluence` connector's credentials file to be set up (see
`connectors/confluence/connector.md` -- Wiring section). Does **not** require a running
MCP server or active Claude Code session -- it calls the Confluence REST API directly via
`urllib` (stdlib only, no extra dependencies).


## Input contract

```yaml
page:
 type: string
 required: true
 description: >
 Numeric Confluence page ID, or a Confluence page URL containing /pages/<id> or
 pageId=<id>. Cloud and Server/DC URL shapes both accepted.
destination:
 type: string
 required: false
 default: "default"
 description: >
 Credentials destination name; matches the filename stem in
 ~/.config/mcp-atlassian/sessions/<destination>.env. Defaults to "default".
out:
 type: string
 required: false
 description: >
 Write the JSON result to this file path instead of stdout.
```

CLI: `python3 tools/read-confluence-page/scripts/read_confluence_page.py <page_id_or_url> [--destination=<name>] [--out=<file.json>]`

## Setup

No additional dependencies beyond Python stdlib (`urllib`, `hashlib`, `json`). The only
prerequisite is a credentials file at `~/.config/mcp-atlassian/sessions/<destination>.env`
-- same file the `confluence` connector launcher reads. See
`connectors/confluence/connector.md` -- Wiring.

## Operation

1. Loads credentials from `~/.config/mcp-atlassian/sessions/<destination>.env`.
2. Resolves the page ID from the input (numeric ID passthrough, or URL extraction).
3. Calls `GET <CONFLUENCE_URL>/rest/api/content/<page_id>?expand=version,body.storage,space`.
4. Computes SHA-256 of the page's `body.storage.value` field (Confluence's raw HTML/wiki
 storage format).
5. Returns a JSON object; writes to `--out` file if given, otherwise prints to stdout.

Auth is automatic: `CONFLUENCE_PERSONAL_TOKEN` → Bearer (Server/DC);
`CONFLUENCE_USERNAME` + `CONFLUENCE_API_TOKEN` → Basic (Cloud).

## Output contract

```yaml
page_id: string # Confluence numeric ID
title: string
space_key: string
version: integer # Confluence internal version counter (increments on every save)
last_modified: string # ISO 8601 datetime of the last edit
modified_by: string # Display name of the last editor
content_hash: string # SHA-256 hex digest of body.storage.value
content_length: integer # Byte length of body.storage.value (for rough size comparison)
url: string # Canonical page URL
```

## Errors and confirmations

- Exits 1 with a clear message if the credentials file is missing or incomplete.
- Exits 1 with the HTTP status and body excerpt if the Confluence API returns an error
 (404 page not found, 401 unauthorized, etc.).
- Read-only; never writes to Confluence. No confirmation required.

**Verified live 2026-09-14:** tested against kb.epam.com (Confluence
Server/DC). Returns correct version, title, space key, modified-by, and content hash.
Note: Cloudflare in front of kb.epam.com requires a non-default User-Agent header --
the script sends `Mozilla/5.0 (compatible; sap-ai-factory/1.0)`.
