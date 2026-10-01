# Tool: Search Confluence Pages

Searches for Confluence pages by exact title within a space using CQL. Returns a list
of matching pages (id, title, space key, version, url) so the caller can decide whether
to create a new page or update an existing one.

Read-only. No confirmation required. Used by `confluence-document-publishing` in
Step 2 (duplicate detection) to avoid creating a page that already exists.

**Verified live 2026-09-14:** tested against kb.epam.com (Confluence
Server/DC). Requires non-default User-Agent header to pass Cloudflare.


## Input contract

```yaml
title:
 type: string
 required: true
 description: Page title to search for (exact CQL match: title="<value>").

space:
 type: string
 required: true
 description: Confluence space key (e.g. "ESAPCC", "PROJECTX").

destination:
 type: string
 required: false
 default: "default"
 description: >
 Credentials destination; matches ~/.config/mcp-atlassian/sessions/<destination>.env.

out:
 type: string
 required: false
 description: Write JSON result to this file instead of stdout.
```

CLI: `python3 tools/search-confluence-pages/scripts/search_confluence_pages.py <title> --space=<KEY> [--destination=<name>] [--out=<file.json>]`

## Output contract

```yaml
total: integer # Total matches in Confluence (CQL result count)
pages:
 - page_id: string
 title: string
 space_key: string
 version: integer
 url: string
```

Returns an empty `pages` list (total 0) when no match is found — never exits with an
error for a "not found" result. Exits 1 on HTTP errors or missing credentials.
