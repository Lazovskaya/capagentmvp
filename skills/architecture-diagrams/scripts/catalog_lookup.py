#!/usr/bin/env python3
"""
Search and inspect the bundled SAP Architecture Center catalog
(references/catalog.json).

Usage:
    python3 catalog_lookup.py search "integration"
    python3 catalog_lookup.py search "joule"
    python3 catalog_lookup.py get RA0024
    python3 catalog_lookup.py list-domains
"""
import sys
import json
import os

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "references", "catalog.json")

DOMAIN_TAGS = {
    "AI & Machine Learning": ["genai", "agents"],
    "Application Development & Automation": ["appdev", "cap", "build", "buildworkzone"],
    "Data & Analytics": ["data", "bdc", "databricks", "snowflake"],
    "Integration": ["integration", "eda", "eic"],
    "Operation & Security": ["security"],
}


def load_catalog():
    with open(CATALOG_PATH) as f:
        return json.load(f)


def search(query):
    query = query.lower()
    catalog = load_catalog()
    hits = []
    for entry in catalog:
        haystack = " ".join(
            [entry["id"], entry["title"], entry["description"]] + entry["tags"]
        ).lower()
        if query in haystack:
            hits.append(entry)
    if not hits:
        print(f"No matches for '{query}'. Try a broader term or list-domains.")
        return
    for e in hits:
        print(f"{e['id']}: {e['title']}")
        print(f"   tags: {', '.join(e['tags'])}")
        print(f"   diagrams: {len(e['diagrams'])}")
        if e.get("url"):
            print(f"   docs: {e['url']}")
        print()


def get(ra_id):
    catalog = load_catalog()
    for e in catalog:
        if e["id"].lower() == ra_id.lower():
            print(json.dumps(e, indent=2))
            return
    print(f"No entry found for id '{ra_id}'")


def list_domains():
    catalog = load_catalog()
    for domain, tags in DOMAIN_TAGS.items():
        matches = [e for e in catalog if any(t in e["tags"] for t in tags)]
        print(f"{domain} ({len(matches)})")
        for e in matches:
            print(f"   {e['id']}: {e['title']}")
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "search" and len(sys.argv) > 2:
        search(" ".join(sys.argv[2:]))
    elif cmd == "get" and len(sys.argv) > 2:
        get(sys.argv[2])
    elif cmd == "list-domains":
        list_domains()
    else:
        print(__doc__)
        sys.exit(1)
