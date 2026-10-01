#!/usr/bin/env python3
"""Read a Confluence page and return its metadata + content hash.

Used by brownfield-sad-state-reconciliation to compare the live Confluence page version
against the local checkpoint, without going through the MCP server (which requires a
running Claude Code session). Reads the same credentials file as the connector launcher:
~/.config/mcp-atlassian/sessions/<destination>.env.

Usage:
    python3 scripts/read_confluence_page.py <page_id_or_url> [--destination=<name>] [--out=<file.json>]

Supports both Cloud and Server/DC:
  Cloud:     CONFLUENCE_URL + CONFLUENCE_USERNAME + CONFLUENCE_API_TOKEN  (Basic Auth)
  Server/DC: CONFLUENCE_URL + CONFLUENCE_PERSONAL_TOKEN                   (Bearer auth)
"""
import argparse
import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_DESTINATION = "default"


def load_credentials(destination):
    path = Path.home() / ".config" / "mcp-atlassian" / "sessions" / f"{destination}.env"
    if not path.is_file():
        print(f"Credentials file not found: {path}", file=sys.stderr)
        print("See connectors/confluence/connector.md -- Wiring section.", file=sys.stderr)
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
    print("Incomplete credentials: need CONFLUENCE_PERSONAL_TOKEN or CONFLUENCE_USERNAME + CONFLUENCE_API_TOKEN", file=sys.stderr)
    sys.exit(1)


def resolve_page_id(page_id_or_url, base_url):
    # If it looks like a URL, extract the page ID from it.
    # Confluence Cloud: /wiki/spaces/.../pages/<id>/...
    # Confluence Server: /pages/viewpage.action?pageId=<id> or /display/.../...
    import re
    m = re.search(r"/pages/(\d+)", page_id_or_url)
    if m:
        return m.group(1)
    m = re.search(r"pageId=(\d+)", page_id_or_url)
    if m:
        return m.group(1)
    # Already a plain page ID
    if re.fullmatch(r"\d+", page_id_or_url.strip()):
        return page_id_or_url.strip()
    print(f"Cannot resolve page ID from: {page_id_or_url!r}", file=sys.stderr)
    print("Pass a numeric page ID, or a Confluence URL containing /pages/<id> or pageId=<id>.", file=sys.stderr)
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


def build_api_url(base_url, page_id):
    # Cloud: /wiki/rest/api  |  Server/DC: /rest/api
    # Detect: Cloud URLs contain /wiki in the path, Server/DC URLs typically don't.
    base = base_url.rstrip("/")
    # Try Cloud-style first; caller can override by setting CONFLUENCE_API_BASE.
    return f"{base}/rest/api/content/{page_id}?expand=version,body.storage,space,ancestors"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("page", help="Confluence page ID (numeric) or page URL")
    parser.add_argument("--destination", default=DEFAULT_DESTINATION,
                        help="credentials destination (default: 'default')")
    parser.add_argument("--out", metavar="FILE",
                        help="write JSON result to FILE instead of stdout")
    args = parser.parse_args()

    creds = load_credentials(args.destination)
    if not creds.get("CONFLUENCE_URL"):
        print("CONFLUENCE_URL missing from credentials file", file=sys.stderr)
        sys.exit(1)

    page_id = resolve_page_id(args.page, creds["CONFLUENCE_URL"])
    url = build_api_url(creds["CONFLUENCE_URL"], page_id)
    headers = auth_header(creds)

    data = api_get(url, headers)

    body_value = (data.get("body", {}).get("storage", {}).get("value") or "")
    content_hash = hashlib.sha256(body_value.encode("utf-8")).hexdigest()

    result = {
        "page_id": data.get("id"),
        "title": data.get("title"),
        "space_key": data.get("space", {}).get("key"),
        "version": data.get("version", {}).get("number"),
        "last_modified": data.get("version", {}).get("when"),
        "modified_by": data.get("version", {}).get("by", {}).get("displayName"),
        "content_hash": content_hash,
        "content_length": len(body_value),
        "url": f"{creds['CONFLUENCE_URL'].rstrip('/')}/pages/{data.get('id')}",
    }

    out = json.dumps(result, indent=2, ensure_ascii=False)
    if args.out:
        Path(args.out).write_text(out + "\n", encoding="utf-8")
        print(f"Written to {args.out}")
    else:
        print(out)


if __name__ == "__main__":
    main()
