#!/usr/bin/env python3
"""Upload or replace a file attachment on a Confluence page.

Dry-run by default -- prints what would be uploaded without writing. Pass --apply
to perform the actual upload. Re-reads the attachment list after uploading to verify.

Confluence requires X-Atlassian-Token: no-check on attachment uploads to bypass its
XSRF protection (documented behaviour, safe to use from a server-side script).

Usage:
  python3 scripts/upload_confluence_attachment.py \
      --page-id=<id> --file=<path/to/file.pdf> \
      [--comment="Upload comment"] \
      [--destination=<name>] [--apply] [--out=<result.json>]

Supports both Cloud and Server/DC. Same credentials file as other Confluence tools.
"""
import argparse
import base64
import email.generator
import email.mime.multipart
import email.mime.base
import hashlib
import io
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_DESTINATION = "default"


def load_credentials(destination):
    path = Path.home() / ".config" / "mcp-atlassian" / "sessions" / f"{destination}.env"
    if not path.is_file():
        print(f"Credentials file not found: {path}", file=sys.stderr)
        sys.exit(1)
    values = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def auth_header(creds):
    if creds.get("CONFLUENCE_PERSONAL_TOKEN"):
        return {"Authorization": f"Bearer {creds['CONFLUENCE_PERSONAL_TOKEN']}"}
    if creds.get("CONFLUENCE_API_TOKEN") and creds.get("CONFLUENCE_USERNAME"):
        token = base64.b64encode(
            f"{creds['CONFLUENCE_USERNAME']}:{creds['CONFLUENCE_API_TOKEN']}".encode()
        ).decode()
        return {"Authorization": f"Basic {token}"}
    print("Incomplete credentials", file=sys.stderr)
    sys.exit(1)


def api_get(url, headers):
    req = urllib.request.Request(url, headers={
        **headers,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; sap-ai-factory/1.0)",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} from {url}: {body[:500]}", file=sys.stderr)
        sys.exit(1)


def build_multipart(filename, file_bytes, content_type, comment):
    """Build a multipart/form-data body manually (no external deps)."""
    boundary = "----SapAiFactoryBoundary7a3f2e"

    def part_header(name, filename=None, ctype=None):
        h = f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"'
        if filename:
            h += f'; filename="{filename}"'
        if ctype:
            h += f'\r\nContent-Type: {ctype}'
        return (h + "\r\n\r\n").encode()

    body = bytearray()
    if comment:
        body += part_header("comment")
        body += comment.encode("utf-8") + b"\r\n"
    body += part_header("file", filename=filename, ctype=content_type)
    body += file_bytes + b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    return bytes(body), f"multipart/form-data; boundary={boundary}"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--page-id", required=True, help="Confluence page ID to attach the file to")
    parser.add_argument("--file", required=True, help="Path to the file to upload")
    parser.add_argument("--comment", default="", help="Optional upload comment / version message")
    parser.add_argument("--destination", default=DEFAULT_DESTINATION)
    parser.add_argument("--apply", action="store_true", help="Actually upload (default: dry-run)")
    parser.add_argument("--out", metavar="FILE", help="Write result JSON to this file")
    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.is_file():
        print(f"File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    file_bytes = file_path.read_bytes()
    filename = file_path.name
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    file_size = len(file_bytes)

    creds = load_credentials(args.destination)
    base_url = creds.get("CONFLUENCE_URL", "").rstrip("/")
    if not base_url:
        print("CONFLUENCE_URL missing from credentials file", file=sys.stderr)
        sys.exit(1)

    upload_url = f"{base_url}/rest/api/content/{args.page_id}/child/attachment"
    list_url = f"{upload_url}?expand=version&filename={urllib.parse.quote(filename)}"

    # Dry-run preview
    print(f"\nCONFLUENCE ATTACHMENT UPLOAD PREVIEW")
    print(f"{'─' * 40}")
    print(f"Page ID:      {args.page_id}")
    print(f"File:         {filename}")
    print(f"Size:         {file_size:,} bytes")
    print(f"Content-Type: {content_type}")
    print(f"SHA-256:      {file_hash}")
    if args.comment:
        print(f"Comment:      {args.comment}")
    print()

    if not args.apply:
        print("DRY RUN — pass --apply to upload.")
        sys.exit(0)

    headers = {
        **auth_header(creds),
        "X-Atlassian-Token": "no-check",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; sap-ai-factory/1.0)",
    }

    body, content_type_header = build_multipart(filename, file_bytes, content_type, args.comment)
    headers["Content-Type"] = content_type_header

    print("Uploading...")
    req = urllib.request.Request(upload_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_err = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body_err[:800]}", file=sys.stderr)
        sys.exit(1)

    # The response is a list with one result entry for the new attachment
    results = resp_data.get("results", [resp_data])
    att = results[0] if results else resp_data

    attachment_id = att.get("id", "")
    attachment_title = att.get("title", filename)
    attachment_version = att.get("version", {}).get("number", 1)

    # Verify: re-list to confirm the file is there
    verify_data = api_get(list_url, {
        **auth_header(creds),
        "User-Agent": "Mozilla/5.0 (compatible; sap-ai-factory/1.0)",
    })
    verified = any(
        r.get("title") == filename
        for r in verify_data.get("results", [])
    )

    result = {
        "attachment_id": attachment_id,
        "filename": attachment_title,
        "page_id": args.page_id,
        "version": attachment_version,
        "size_bytes": file_size,
        "sha256": file_hash,
        "url": f"{base_url}/pages/{args.page_id}",
        "verification": {
            "found_after_upload": verified,
        },
    }

    print(json.dumps(result, indent=2, ensure_ascii=False))

    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nWritten to {args.out}")


if __name__ == "__main__":
    main()
