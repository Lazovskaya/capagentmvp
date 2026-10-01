#!/usr/bin/env python3
"""Create or update a Confluence page via the REST API.

Dry-run by default -- prints the full request payload without writing. Pass --apply
to perform the actual write. Re-reads the page after writing to verify.

Usage:
  # Create a new page:
  python3 scripts/upsert_confluence_page.py \
      --space=ESAPCC --parent-id=12345 --title="My Page" --body-file=page.html \
      [--destination=<name>] [--apply]

  # Update an existing page:
  python3 scripts/upsert_confluence_page.py \
      --page-id=67890 --title="My Page" --body-file=page.html \
      --version=<current_version+1> \
      [--destination=<name>] [--apply]

Body must be Confluence storage format (XHTML). Use --body-file to pass a file,
or --body to pass inline content.

Supports both Cloud (CONFLUENCE_USERNAME + CONFLUENCE_API_TOKEN) and
Server/DC (CONFLUENCE_PERSONAL_TOKEN). Same credentials file as read-confluence-page.
"""
import argparse
import base64
import json
import sys
import urllib.error
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


def common_headers(creds):
    return {
        **auth_header(creds),
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; sap-ai-factory/1.0)",
    }


def api_request(method, url, headers, payload=None):
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} from {url}: {body[:800]}", file=sys.stderr)
        sys.exit(1)


def api_get(url, headers):
    req = urllib.request.Request(url, headers={
        **headers,
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} from {url}: {body[:500]}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--page-id", help="Existing page ID (for update). Omit for create.")
    parser.add_argument("--space", help="Space key (required for create, ignored for update)")
    parser.add_argument("--parent-id", help="Parent page ID (required for create)")
    parser.add_argument("--title", required=True, help="Page title")
    parser.add_argument("--body-file", help="Path to file with Confluence storage format HTML body")
    parser.add_argument("--body", help="Inline body content (Confluence storage format HTML)")
    parser.add_argument("--version", type=int, help="Target version number (required for update; must be current+1)")
    parser.add_argument("--destination", default=DEFAULT_DESTINATION)
    parser.add_argument("--apply", action="store_true", help="Actually write (default: dry-run only)")
    parser.add_argument("--out", metavar="FILE", help="Write result JSON to this file")
    args = parser.parse_args()

    if not args.body_file and not args.body:
        print("Error: provide --body-file or --body", file=sys.stderr)
        sys.exit(1)

    body_content = args.body
    if args.body_file:
        body_content = Path(args.body_file).read_text(encoding="utf-8")

    creds = load_credentials(args.destination)
    base_url = creds.get("CONFLUENCE_URL", "").rstrip("/")
    if not base_url:
        print("CONFLUENCE_URL missing from credentials file", file=sys.stderr)
        sys.exit(1)

    headers = common_headers(creds)

    is_update = bool(args.page_id)

    if is_update:
        if not args.version:
            print("Error: --version is required for update (must be current version + 1)", file=sys.stderr)
            sys.exit(1)
        payload = {
            "type": "page",
            "title": args.title,
            "version": {"number": args.version},
            "body": {"storage": {"value": body_content, "representation": "storage"}},
        }
        url = f"{base_url}/rest/api/content/{args.page_id}"
        method = "PUT"
        action_label = f"UPDATE page {args.page_id} → version {args.version}"
    else:
        if not args.space:
            print("Error: --space is required for create", file=sys.stderr)
            sys.exit(1)
        if not args.parent_id:
            print("Error: --parent-id is required for create", file=sys.stderr)
            sys.exit(1)
        payload = {
            "type": "page",
            "title": args.title,
            "space": {"key": args.space},
            "ancestors": [{"id": args.parent_id}],
            "body": {"storage": {"value": body_content, "representation": "storage"}},
        }
        url = f"{base_url}/rest/api/content"
        method = "POST"
        action_label = f"CREATE in space {args.space} under parent {args.parent_id}"

    # Dry-run preview
    print(f"\nCONFLUENCE WRITE PREVIEW")
    print(f"{'─' * 40}")
    print(f"Action:  {action_label}")
    print(f"Title:   {args.title}")
    print(f"Body:    {len(body_content)} chars")
    print(f"First 200 chars of body:\n  {body_content[:200]!r}")
    print()

    if not args.apply:
        print("DRY RUN — pass --apply to write.")
        sys.exit(0)

    print("Writing to Confluence...")
    result_data = api_request(method, url, headers, payload)

    page_id = result_data.get("id")
    version_out = result_data.get("version", {}).get("number")
    page_url = f"{base_url}/pages/{page_id}"

    # Verify: re-read the page
    verify_url = f"{base_url}/rest/api/content/{page_id}?expand=version,body.storage"
    verify_data = api_get(verify_url, headers)
    verified_title = verify_data.get("title")
    verified_version = verify_data.get("version", {}).get("number")
    verified_length = len(verify_data.get("body", {}).get("storage", {}).get("value") or "")

    result = {
        "page_id": page_id,
        "title": verified_title,
        "version": verified_version,
        "url": page_url,
        "content_length": verified_length,
        "action": "updated" if is_update else "created",
        "verification": {
            "title_match": verified_title == args.title,
            "version_match": verified_version == (args.version if is_update else 1),
            "content_length": verified_length,
        },
    }

    print(json.dumps(result, indent=2, ensure_ascii=False))

    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nWritten to {args.out}")


if __name__ == "__main__":
    main()
