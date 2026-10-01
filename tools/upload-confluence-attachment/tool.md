# Tool: Upload Confluence Attachment

Uploads a file as an attachment to a Confluence page. Dry-run by default — prints the
upload plan without writing. Pass `--apply` to perform the actual upload. Re-reads the
page's attachment list after uploading to verify the file is present.

Used when an engagement document should be published as a file attachment (e.g. an
exported PDF or XLSX) rather than as page content.

**Verified live 2026-09-14:** tested against kb.epam.com (Confluence
Server/DC). Upload and post-upload verification both confirmed.


## Input contract

```yaml
page_id:
 type: string
 required: true
 description: Numeric Confluence page ID to attach the file to.

file:
 type: string (file path)
 required: true
 description: Path to the file to upload. Content-Type is inferred from the extension.

comment:
 type: string
 required: false
 description: Optional version comment shown in the attachment history.

destination:
 type: string
 required: false
 default: "default"
 description: Credentials destination; matches ~/.config/mcp-atlassian/sessions/<name>.env.

apply:
 type: flag
 default: false
 description: Actually upload. Without --apply, prints preview and exits.

out:
 type: string
 required: false
 description: Write result JSON to this file instead of stdout.
```

CLI:
```
python3 tools/upload-confluence-attachment/scripts/upload_confluence_attachment.py \
 --page-id=<id> --file=<path/to/file.pdf> \
 [--comment="Upload comment"] [--destination=<name>] [--apply]
```

## Notes

Confluence requires `X-Atlassian-Token: no-check` on attachment uploads to bypass its
XSRF protection — this is the documented approach for server-side/API clients.

If a file with the same name already exists on the page, Confluence creates a new
version of the existing attachment (does not duplicate). This is the expected behaviour
for re-publishing updated files.

## Output contract (after --apply)

```yaml
attachment_id: string
filename: string
page_id: string
version: integer
size_bytes: integer
sha256: string # SHA-256 hex of the uploaded file bytes
url: string # URL of the parent page
verification:
 found_after_upload: boolean
```
