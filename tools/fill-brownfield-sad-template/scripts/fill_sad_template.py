#!/usr/bin/env python3
"""Fill the Brownfield SAD template from confirmed evidence artifacts and decision outputs.

Reads staging artifacts (readiness, sizing, scoping), the ADR log, and the confirmed
sad-decisions.json; resolves {{decisions.*}} tokens and <!-- fill_sad_template --> markers
in the template; writes a structured SAD markdown document.

Usage:
    python3 fill_sad_template.py \
        --engagement-id <id> \
        --readiness  <path> \
        --sizing     <path> \
        --scoping    <path> \
        --adr-log    <path> \
        --decisions  <path> \
        [--template  <path>] \
        [--out       <path>] \
        [--schema    <path>]
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

DEFAULT_TEMPLATE = Path("artifacts/brownfield-sad/template.md")
DEFAULT_SCHEMA   = Path("artifacts/brownfield-sad/schema.json")


def load_json(path: Path, label: str) -> dict:
    if not path.exists():
        sys.exit(f"error: {label} not found at {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"error: {label} at {path} is not valid JSON: {e}")


def load_text(path: Path, label: str) -> str:
    if not path.exists():
        sys.exit(f"error: {label} not found at {path}")
    return path.read_text(encoding="utf-8")


def resolve_token(key: str, decisions: dict) -> str:
    """Resolve a {{decisions.a.b.c}} token against the decisions dict."""
    parts = key.strip("{} ").split(".")
    node = {"decisions": decisions}
    for part in parts:
        if not isinstance(node, dict) or part not in node:
            return f"[{key} — not set]"
        node = node[part]
    return str(node) if node is not None else "TBC"


def resolve_tokens(text: str, decisions: dict) -> str:
    """Replace all {{decisions.*}} and {{engagement_id}} tokens."""
    def replacer(m: re.Match) -> str:
        token = m.group(0)
        inner = m.group(1).strip()
        if inner.startswith("decisions."):
            return resolve_token(inner, decisions)
        return token  # leave unknown tokens as-is for now

    return re.sub(r"\{\{([^}]+)\}\}", replacer, text)


def build_adr_table(adr_log: dict) -> str:
    entries = adr_log.get("entries", [])
    if not entries:
        return "*No ADR entries recorded yet.*"
    rows = ["| ADR ID | Decision | Stage | Status |",
            "|---|---|---|---|"]
    for e in entries:
        rows.append(
            f"| {e.get('id','—')} | {e.get('title','—')} | {e.get('stage','—')} | {e.get('status','—')} |"
        )
    return "\n".join(rows)


def build_open_topics_table(open_topics: list) -> str:
    if not open_topics:
        return "*No open topics.*"
    rows = ["| ID | Title | Source stage | Owner | Due | Status |",
            "|---|---|---|---|---|---|"]
    for t in open_topics:
        rows.append(
            f"| {t.get('id','—')} | {t.get('title','—')} | {t.get('source_stage','—')} "
            f"| {t.get('owner','TBC')} | {t.get('due_date','—') or '—'} | {t.get('status','open')} |"
        )
    return "\n".join(rows)


def extract_open_topics_from_artifacts(readiness_text: str, sizing_text: str,
                                       scoping_text: str) -> list:
    """Collect TBC items from staging artifact text files."""
    topics = []
    counter = 1
    for stage, text in [("readiness", readiness_text),
                         ("sizing", sizing_text),
                         ("scoping", scoping_text)]:
        for line in text.splitlines():
            if "TBC" in line or "tbc" in line.lower():
                stripped = line.strip().lstrip("#*-| ").strip()
                if len(stripped) > 5:
                    topics.append({
                        "id": f"OT-{counter}",
                        "title": stripped[:120],
                        "source_stage": stage,
                        "owner": "TBC",
                        "due_date": None,
                        "resolution": None,
                        "status": "open",
                    })
                    counter += 1
    return topics


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fill the Brownfield SAD template from evidence artifacts and decisions."
    )
    parser.add_argument("--engagement-id", required=True)
    parser.add_argument("--readiness",     required=True, type=Path)
    parser.add_argument("--sizing",        required=True, type=Path)
    parser.add_argument("--scoping",       required=True, type=Path)
    parser.add_argument("--adr-log",       required=True, type=Path)
    parser.add_argument("--decisions",     required=True, type=Path)
    parser.add_argument("--template",      default=DEFAULT_TEMPLATE, type=Path)
    parser.add_argument("--schema",        default=DEFAULT_SCHEMA,   type=Path)
    parser.add_argument("--out",           default=None,             type=Path)
    args = parser.parse_args()

    out_path = args.out or Path(
        f"workspace/{args.engagement_id}/brownfield-sad/staged/06-brownfield-sad.md"
    )

    # Load inputs
    decisions  = load_json(args.decisions, "sad-decisions.json")
    adr_log    = load_json(args.adr_log,   "adr-log.json")
    template   = load_text(args.template,  "SAD template")
    readiness  = load_text(args.readiness, "readiness artifact")
    sizing     = load_text(args.sizing,    "sizing artifact")
    scoping    = load_text(args.scoping,   "scoping artifact")

    # Validate required decision keys
    required_decision_keys = [
        "instance_strategy", "ricefw_disposition", "sizing_strategy",
        "data_migration_architecture", "dual_maintenance_retrofit",
    ]
    missing = [k for k in required_decision_keys if k not in decisions]
    if missing:
        sys.exit(f"error: sad-decisions.json is missing required keys: {', '.join(missing)}")

    # Collect open topics from prior-stage artifacts
    open_topics = extract_open_topics_from_artifacts(readiness, sizing, scoping)

    # Resolve {{decisions.*}} tokens
    filled = resolve_tokens(template, decisions)

    # Replace engagement_id and generated_at
    filled = filled.replace("{{engagement_id}}", args.engagement_id)
    filled = filled.replace("{{generated_at}}", str(date.today()))
    filled = filled.replace("{{review_status}}", "unreviewed")
    filled = filled.replace("{{reviewer}}", "—")
    filled = filled.replace("{{review_date}}", "—")

    # Populate ADR table
    adr_table = build_adr_table(adr_log)
    filled = re.sub(
        r"\| \*auto-populated from adr-log\.json\* \|.*",
        adr_table,
        filled,
    )

    # Populate open topics table
    ot_table = build_open_topics_table(open_topics)
    filled = re.sub(
        r"\| \*auto-populated\* \|.*",
        ot_table,
        filled,
    )

    # Check for unresolved tokens
    unresolved = re.findall(r"\{\{[^}]+\}\}", filled)
    if unresolved:
        sys.exit(
            f"error: {len(unresolved)} unresolved token(s) after fill: "
            + ", ".join(set(unresolved))
        )

    # Word count check
    word_count = len(filled.split())
    if word_count < 500:
        sys.exit(
            f"error: generated SAD has only {word_count} words — likely a near-empty fill; "
            "check that all evidence artifacts contain content."
        )

    # Write output
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = out_path.with_suffix(".new")
    tmp.write_text(filled, encoding="utf-8")
    tmp.rename(out_path)

    # Count sections
    sections = [ln.lstrip("# ").strip() for ln in filled.splitlines()
                if ln.startswith("## ")]

    print(f"SAD generated: {out_path}")
    print(f"Sections:      {len(sections)}")
    print(f"Word count:    {word_count}")
    print(f"Open topics:   {len(open_topics)}")
    print(f"ADR entries:   {len(adr_log.get('entries', []))}")
    print()
    print("Sections:")
    for s in sections:
        print(f"  {s}")
    if open_topics:
        print()
        print("Open topics:")
        for t in open_topics[:10]:
            print(f"  {t['id']}: {t['title'][:80]}")
        if len(open_topics) > 10:
            print(f"  ... and {len(open_topics) - 10} more")


if __name__ == "__main__":
    main()
