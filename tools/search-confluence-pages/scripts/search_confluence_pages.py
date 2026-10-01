#!/usr/bin/env python3
"""Search Confluence pages by title within a space.

Uses the Confluence REST API search endpoint with CQL. Returns a list of matching
pages (id, title, space_key, url, version) so the caller can decide whether to
create a new page or update an existing one.

Usage:
    python3 scripts/search_confluence_pages.py <title> --space=<SPACEKEY> [--destination=<name>] [--out=<file.json>]

Supports both Cloud and Server/DC (same credentials file as read-confluence-page).
"""
import argparse
import base64
import json
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


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("title", help="Page title to search for (exact or partial)")
    parser.add_argument("--space", required=True, help="Confluence space key (e.g. ESAPCC)")
    parser.add_argument("--destination", default=DEFAULT_DESTINATION)
    parser.add_argument("--out", metavar="FILE")
    args = parser.parse_args()

    creds = load_credentials(args.destination)
    base_url = creds.get("CONFLUENCE_URL", "").rstrip("/")
    if not base_url:
        print("CONFLUENCE_URL missing from credentials file", file=sys.stderr)
        sys.exit(1)

    # CQL: exact title match within the given space, type=page
    cql = f'title="{args.title}" AND space="{args.space}" AND type=page'
    params = urllib.parse.urlencode({"cql": cql, "limit": 10, "expand": "version,space"})
    url = f"{base_url}/rest/api/content/search?{params}"

    data = api_get(url, auth_header(creds))

    pages = []
    for item in data.get("results", []):
        pages.append({
            "page_id": item.get("id"),
            "title": item.get("title"),
            "space_key": item.get("space", {}).get("key"),
            "version": item.get("version", {}).get("number"),
            "url": f"{base_url}/pages/{item.get('id')}",
        })

    result = {
        "total": data.get("totalSize", len(pages)),
        "pages": pages,
    }

    out = json.dumps(result, indent=2, ensure_ascii=False)
    if args.out:
        Path(args.out).write_text(out + "\n", encoding="utf-8")
        print(f"Written to {args.out}")
    else:
        print(out)


if __name__ == "__main__":
    main()
