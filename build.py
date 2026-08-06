#!/usr/bin/env python3
"""Regenerate index.html's inline data block, factory-data.js, and confluence-fragment.html
from factory-data.json.

factory-data.json is the single source of truth. Run this after editing it, before viewing
index.html locally (file:// can't fetch factory-data.json directly because of CORS).
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "factory-data.json"
INDEX_FILE = ROOT / "index.html"
JS_FILE = ROOT / "factory-data.js"
FRAGMENT_FILE = ROOT / "confluence-fragment.html"

BEGIN = "window.FACTORY_DATA = {"
# index.html's inline block ends at the line "};" right before "</script>" that follows it.
BLOCK_RE = re.compile(
    r"window\.FACTORY_DATA = \{.*?\n\};",
    re.DOTALL,
)
# index.html is a full document (doctype/html/head/body) for standalone file:// viewing.
# Confluence's HTML macro inserts its content into an already-existing page DOM, so pasting
# a second doctype/html/head/body breaks rendering. Only the <body> contents are wanted there.
BODY_RE = re.compile(r"<body>\n(.*)\n</body>", re.DOTALL)


def load_data():
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def to_js_literal(data):
    return "window.FACTORY_DATA = " + json.dumps(data, indent=1, ensure_ascii=False) + ";"


def update_index(data):
    html = INDEX_FILE.read_text(encoding="utf-8")
    if not BLOCK_RE.search(html):
        raise SystemExit("Could not find window.FACTORY_DATA block in index.html")
    new_block = to_js_literal(data)
    html = BLOCK_RE.sub(lambda _m: new_block, html, count=1)
    INDEX_FILE.write_text(html, encoding="utf-8")
    print(f"Updated {INDEX_FILE.name}")


def write_js(data):
    JS_FILE.write_text(to_js_literal(data) + "\n", encoding="utf-8")
    print(f"Wrote {JS_FILE.name}")


def write_confluence_fragment():
    html = INDEX_FILE.read_text(encoding="utf-8")
    m = BODY_RE.search(html)
    if not m:
        raise SystemExit("Could not find <body>...</body> in index.html")
    FRAGMENT_FILE.write_text(m.group(1) + "\n", encoding="utf-8")
    print(f"Wrote {FRAGMENT_FILE.name}")


def print_seats():
    # team.html was dropped from this repo (org-chart page, kept elsewhere as context only).
    print("No team.html in this repo, seat listing does not apply here.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seats", action="store_true", help="list seat keys (not applicable, see note)")
    args = parser.parse_args()

    if args.seats:
        print_seats()
        return

    data = load_data()
    update_index(data)
    write_js(data)
    write_confluence_fragment()


if __name__ == "__main__":
    main()
