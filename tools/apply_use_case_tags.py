#!/usr/bin/env python3
"""Adds/refreshes the `use-case:` frontmatter field on skill.meta.md and agent.meta.md, computed
mechanically from factory-data.json's activities[].uses lists -- the source of "which activities
use this component." Team decision (2026-09-01, EPMCSAPAI-291 thread): a component lists the
activity titles that use it, list-valued since several skills/agents serve more than one activity
(e.g. defect-triage's 8 skills, shared by "Defect triage" and "Hypercare & incident triage"). A
use case's own owner/engagement/status are explicitly NOT tracked as part of this decision --
this script only ever writes the use-case *link*, nothing else.

Scope: skill.meta.md and agent.meta.md only. assistants/ is deliberately untouched -- its own
"Use cases" table and routes-to relations are a separate, still-forming design (see
assistants/*/assistant.meta.md's own Notes: "use_case_id identifiers are descriptive labels until
a registry exists"), not this tag. connector/artifact/knowledge/gate meta files aren't in scope
either -- they're resources a use case consumes/produces, not something organized "into" one.

Usage:
    python3 tools/apply_use_case_tags.py [--check]

--check reports what would change (added/updated) without writing. Default writes.

Components that exist in skills/agents/ but never appear in any activity's `uses` list, and
activity-referenced skill/agent names with no skill.meta.md/agent.meta.md file at all, are
reported separately -- neither is an error this script can fix; both are pre-existing, already
tracked gaps (see the local kanban board).
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "tools"))
import adapter_common as common  # noqa: E402

ANCHOR_RE = re.compile(r"^(engagement|sdlc-stage):.*$", re.MULTILINE)
USE_CASE_LINE_RE = re.compile(r"^use-case:.*$", re.MULTILINE)


def build_use_case_map():
    data = json.loads(common.FACTORY_DATA_JSON.read_text(encoding="utf-8"))
    skill_map, agent_map = defaultdict(list), defaultdict(list)
    for activity in data.get("activities", []):
        title = activity["title"]
        for kind, names in activity.get("uses", []):
            target = {"skill": skill_map, "agent": agent_map}.get(kind)
            if target is None:
                continue
            for name in names:
                if title not in target[name]:
                    target[name].append(title)
    return skill_map, agent_map


def format_use_case_line(titles):
    quoted = ", ".join(f'"{t}"' for t in titles)
    return f"use-case: [{quoted}]"


def apply_to_file(meta_path, titles, check):
    """Returns 'added', 'updated', 'unchanged', or None (no frontmatter anchor found)."""
    text = meta_path.read_text(encoding="utf-8")
    new_line = format_use_case_line(titles)

    existing_match = USE_CASE_LINE_RE.search(text)
    if existing_match:
        if existing_match.group(0) == new_line:
            return "unchanged"
        new_text = USE_CASE_LINE_RE.sub(new_line, text, count=1)
        status = "updated"
    else:
        frontmatter_end = text.find("\n---", 3)
        if frontmatter_end == -1:
            return None
        frontmatter = text[:frontmatter_end]
        matches = list(ANCHOR_RE.finditer(frontmatter))
        if not matches:
            return None
        insert_at = matches[-1].end()
        new_text = text[:insert_at] + "\n" + new_line + text[insert_at:]
        status = "added"

    if not check:
        meta_path.write_text(new_text, encoding="utf-8")
    return status


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="report what would change, write nothing")
    args = parser.parse_args(argv)

    skill_map, agent_map = build_use_case_map()

    results = defaultdict(list)
    unwired = []
    no_meta = []

    for kind, name_map, root, meta_name in (
        ("skill", skill_map, common.SKILLS_DIR, "skill.meta.md"),
        ("agent", agent_map, common.AGENTS_DIR, "agent.meta.md"),
    ):
        all_names = common.all_own_skill_names() if kind == "skill" else common.all_own_agent_names()
        for name in all_names:
            titles = name_map.get(name)
            meta_path = root / name / meta_name
            if not titles:
                unwired.append(f"{kind}/{name}")
                continue
            if not meta_path.exists():
                no_meta.append(f"{kind}/{name} (no {meta_name})")
                continue
            status = apply_to_file(meta_path, titles, args.check)
            if status is None:
                no_meta.append(f"{kind}/{name} (no frontmatter anchor found)")
            else:
                results[status].append(f"{kind}/{name}")
        for name in name_map:
            if name not in all_names:
                no_meta.append(f"{kind}/{name} (no {meta_name})")

    verb = "Would add" if args.check else "Added"
    verb_upd = "Would update" if args.check else "Updated"
    print(f"{verb} use-case to {len(results['added'])}: {', '.join(results['added']) or '(none)'}")
    print(f"{verb_upd} use-case on {len(results['updated'])}: {', '.join(results['updated']) or '(none)'}")
    print(f"Already correct: {len(results['unchanged'])}")
    if unwired:
        print(f"Not used by any activity (no use-case to add): {', '.join(sorted(unwired))}")
    if no_meta:
        print(f"Referenced by an activity but no meta file exists: {', '.join(sorted(no_meta))}")


if __name__ == "__main__":
    main()
