# Tool: Write Confluence Page

Creates or updates a single Confluence page via the REST API. Dry-run by default —
prints the full payload without writing. Pass `--apply` to perform the actual write.
Re-reads the page after writing to verify title, version, and content length.

Used by `confluence-document-publishing` in Step 4 (write) and Step 5 (verify).

**Verified live 2026-09-14:** create and update both tested against
kb.epam.com (Confluence Server/DC). Verification (re-read) confirmed correct version
and content round-trip.


## Input contract

```yaml
# Required always:
title:
 type: string
 description: Exact page title to create or update.

body:
 type: string (inline) | file path via --body-file
 description: Page body in Confluence storage format (XHTML). Use --body-file for files.

# For CREATE (omit --page-id):
space:
 type: string
 required: true for create
 description: Confluence space key (e.g. "ESAPCC").

parent_id:
 type: string
 required: true for create
 description: Numeric page ID of the parent page.

# For UPDATE (provide --page-id):
page_id:
 type: string
 required: true for update
 description: Numeric ID of the existing page to update.

version:
 type: integer
 required: true for update
 description: Target version number -- must be current version + 1. Get current version
 from read-confluence-page or search-confluence-pages.

# Optional:
destination:
 type: string
 default: "default"
 description: Credentials destination; matches ~/.config/mcp-atlassian/sessions/<name>.env.

apply:
 type: flag
 default: false
 description: Actually write to Confluence. Without --apply, prints preview and exits.

out:
 type: string
 description: Write result JSON to this file instead of stdout.
```

CLI:
```
# Create:
python3 tools/upsert-confluence-page/scripts/upsert_confluence_page.py \
 --space=ESAPCC --parent-id=12345 --title="My Page" --body-file=page.html \
 [--destination=<name>] [--apply]

# Update:
python3 tools/upsert-confluence-page/scripts/upsert_confluence_page.py \
 --page-id=67890 --title="My Page" --body-file=page.html --version=3 \
 [--destination=<name>] [--apply]
```

## Output contract (after --apply)

```yaml
page_id: string
title: string
version: integer # confirmed post-write version from re-read
url: string
content_length: integer
action: "created" | "updated"
verification:
 title_match: boolean
 version_match: boolean
 content_length: integer
```

## Errors

- Exits 0 with dry-run output when `--apply` is not passed.
- Exits 1 on HTTP 409 (version conflict — re-read the page and retry with the new version).
- Exits 1 on HTTP 401/403 (credentials invalid or insufficient permissions).
- Never silently retries.
