#!/usr/bin/env python3
"""Validate factory-data.json against the repo tree.

Checks:
  - every own-posture Skill has skills/<name>/SKILL.md
  - every adopt-posture Skill is listed in skills/index.yaml (best-effort name match)
  - every Agent has agents/<name>.md
  - every Connector has connectors/<name>/connector.md
  - every Artifact has artifacts/<name>/ (template or schema)
  - every Q-gate name maps to gates/<file>.md (arrow → hyphen)
  - every activity.file exists
  - every skill named in activity uses[] exists in components
  - readySlice names resolve to components (or known domain-pack / path)
  - orphan warning: skills/*/SKILL.md not listed in components

Exit 0 on success, 1 on any error. Warnings print but do not fail unless --strict-orphans.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "factory-data.json"


def gate_filename(name: str) -> str:
    # "discover→prepare" → "discover-prepare.md"
    return name.replace("→", "-").replace(" ", "") + ".md"


def load() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict-orphans",
        action="store_true",
        help="Fail if an authored skills/*/SKILL.md is missing from factory-data.json",
    )
    args = parser.parse_args()

    data = load()
    errors: list[str] = []
    warnings: list[str] = []

    components = data.get("components", [])
    by_kind: dict[str, dict[str, dict]] = {}
    for c in components:
        by_kind.setdefault(c["kind"], {})[c["name"]] = c

    # --- component path checks ---
    for name, c in by_kind.get("Skill", {}).items():
        if c.get("posture") == "own":
            p = ROOT / "skills" / name / "SKILL.md"
            if not p.is_file():
                errors.append(f"Skill {name!r}: missing {p.relative_to(ROOT)}")
        elif c.get("posture") == "adopt":
            index = ROOT / "skills" / "index.yaml"
            if index.is_file():
                text = index.read_text(encoding="utf-8")
                if name not in text and name.replace("-", "_") not in text:
                    warnings.append(
                        f"Skill {name!r} (adopt): name not found in skills/index.yaml"
                    )
            else:
                errors.append("skills/index.yaml missing (needed for adopt skills)")

    for name in by_kind.get("Agent", {}):
        p = ROOT / "agents" / f"{name}.md"
        if not p.is_file():
            errors.append(f"Agent {name!r}: missing {p.relative_to(ROOT)}")

    for name in by_kind.get("Connector", {}):
        p = ROOT / "connectors" / name / "connector.md"
        if not p.is_file():
            errors.append(f"Connector {name!r}: missing {p.relative_to(ROOT)}")

    for name in by_kind.get("Artifact", {}):
        d = ROOT / "artifacts" / name
        if not d.is_dir():
            errors.append(f"Artifact {name!r}: missing directory {d.relative_to(ROOT)}")
        elif not any(d.glob("template.md")) and not any(d.glob("schema.json")):
            # explore-chain style dirs may only have yaml/md handoffs
            if not any(d.iterdir()):
                errors.append(f"Artifact {name!r}: empty directory")

    for name in by_kind.get("Q-gate", {}):
        p = ROOT / "gates" / gate_filename(name)
        # also try without special chars already hyphenated in components
        alt = ROOT / "gates" / f"{name}.md"
        if not p.is_file() and not alt.is_file():
            # components use names like "discover→prepare" or file-style
            slug = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-")
            slug_path = ROOT / "gates" / f"{slug}.md"
            if not slug_path.is_file():
                errors.append(
                    f"Q-gate {name!r}: missing gates/{gate_filename(name)} "
                    f"(also tried {name}.md, {slug}.md)"
                )

    for name in by_kind.get("Knowledge", {}):
        d = ROOT / "knowledge" / name
        if not d.is_dir():
            errors.append(f"Knowledge {name!r}: missing {d.relative_to(ROOT)}")

    # --- activities ---
    skill_names = set(by_kind.get("Skill", {}))
    for act in data.get("activities", []):
        f = act.get("file")
        if f:
            p = ROOT / f
            if not p.is_file():
                errors.append(f"Activity {act.get('title')!r}: missing {f}")
        for use in act.get("uses", []):
            if not use or use[0] != "skill":
                continue
            for sn in use[1]:
                if sn not in skill_names:
                    errors.append(
                        f"Activity {act.get('file')}: uses unknown skill {sn!r}"
                    )

    # --- readySlice ---
    rs = data.get("readySlice") or {}
    for key in ("explore", "bugfix", "connectors", "entry"):
        val = rs.get(key)
        if key == "entry" and val:
            if val not in skill_names:
                errors.append(f"readySlice.entry {val!r} not in components")
        elif isinstance(val, list):
            kind = "Connector" if key == "connectors" else "Skill"
            pool = set(by_kind.get(kind, {}))
            for n in val:
                if n not in pool:
                    errors.append(f"readySlice.{key}: {n!r} not a {kind} component")
    for pack in rs.get("domainPacks") or []:
        d = ROOT / "knowledge" / "domain-packs" / pack
        if not d.is_dir():
            errors.append(f"readySlice.domainPacks: missing {d.relative_to(ROOT)}")
    for rel in rs.get("contracts") or []:
        p = ROOT / rel
        if not p.exists():
            errors.append(f"readySlice.contracts: missing {rel}")

    # --- orphans ---
    listed = set(by_kind.get("Skill", {}))
    for skill_md in (ROOT / "skills").glob("*/SKILL.md"):
        name = skill_md.parent.name
        if name not in listed:
            msg = f"orphan skill directory skills/{name}/ not in factory-data.json components"
            if args.strict_orphans:
                errors.append(msg)
            else:
                warnings.append(msg)

    for w in warnings:
        print(f"WARNING: {w}")
    for e in errors:
        print(f"ERROR: {e}")

    if errors:
        print(f"\nvalidate failed: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"validate ok ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
