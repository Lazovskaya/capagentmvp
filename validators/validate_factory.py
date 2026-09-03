#!/usr/bin/env python3
"""Validate the factory model, repository files, connectors, and generated views."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "factory-data.json"
INDEX_PATH = ROOT / "index.html"
JS_PATH = ROOT / "factory-data.js"
VALID_PHASES = {"Discover", "Prepare", "Explore", "Realize", "Deploy", "Run"}
KINDS = {
    "Skill": ("skills", "SKILL.md"),
    "Agent": ("agents", "agent.md"),
    "Connector": ("connectors", "server.json"),
    "Artifact": ("artifacts", "template.md"),
    "Knowledge": ("knowledge", None),
    "Q-gate": ("gates", "gate.md"),
}
FACTORY_BLOCK_RE = re.compile(r"window\.FACTORY_DATA = \{.*?\n\};", re.DOTALL)


def load_data() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def adopt_skills() -> set[str]:
    path = ROOT / "skills" / "index.yaml"
    if not path.exists():
        return set()
    names: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"\s*-\s+name:\s*(\S+)", line)
        if match:
            names.add(match.group(1))
    return names


def uses(data: dict, kind: str) -> set[str]:
    return {
        name
        for activity in data.get("activities", [])
        for use_kind, names in activity.get("uses", [])
        if use_kind == kind
        for name in names
    }


def component_path(kind: str, name: str) -> Path | None:
    directory, leaf = KINDS[kind]
    if kind == "Q-gate":
        name = name.replace("→", "-")
    path = ROOT / directory / name
    if kind == "Artifact" and name == "explore-chain":
        return path
    return path if leaf is None else path / leaf


def validate_references(data: dict) -> list[str]:
    errors: list[str] = []
    for activity in data.get("activities", []):
        missing = {"title", "file", "phase", "owner", "uses"} - activity.keys()
        errors.extend(f"activity {activity.get('title', '?')}: missing {field}" for field in missing)
        if activity.get("phase") not in VALID_PHASES:
            errors.append(f"activity {activity.get('title', '?')}: invalid phase")
        if not (ROOT / activity.get("file", "")).exists():
            errors.append(f"activity {activity.get('title', '?')}: missing file {activity.get('file')}")
    kind_map = {"skill": "Skill", "agent": "Agent", "mcp": "Connector",
                "artifact": "Artifact", "knowledge": "Knowledge", "q-gate": "Q-gate"}
    for use_kind, kind in kind_map.items():
        for name in uses(data, use_kind):
            path = component_path(kind, name)
            if kind == "Skill" and (path and path.exists() or name in adopt_skills()):
                continue
            if not path or not path.exists():
                errors.append(f"{use_kind} reference does not resolve: {name}")
    for component in data.get("components", []):
        kind, name = component.get("kind"), component.get("name")
        path = component_path(kind, name) if kind in KINDS else None
        if kind in KINDS and not path:
            errors.append(f"component has invalid kind/name: {kind}/{name}")
        elif kind in KINDS and not (
            (path and path.exists())
            or (kind == "Skill" and name in adopt_skills())
        ):
            errors.append(f"component file does not exist: {kind}/{name}")
    return errors


def validate_orphans(data: dict) -> list[str]:
    errors: list[str] = []
    for kind, (directory, leaf) in KINDS.items():
        root = ROOT / directory
        if not root.exists():
            continue
        if leaf is None:
            disk = {p.name for p in root.iterdir() if p.is_dir()}
        else:
            disk = {p.parent.name for p in root.glob(f"*/{leaf}")}
        referenced = uses(data, {"Skill": "skill", "Agent": "agent", "Connector": "mcp",
                                "Artifact": "artifact", "Knowledge": "knowledge",
                                "Q-gate": "q-gate"}[kind])
        referenced |= {
            component.get("name")
            for component in data.get("components", [])
            if component.get("kind") == kind
        }
        if kind == "Skill":
            referenced |= adopt_skills()
        if kind == "Q-gate":
            referenced = {name.replace("→", "-") for name in referenced}
        errors.extend(f"orphan {kind}: {name}" for name in sorted(disk - referenced))
    return errors


def expected_js(data: dict) -> str:
    return "window.FACTORY_DATA = " + json.dumps(data, indent=1, ensure_ascii=False) + ";"


def validate_generated(data: dict) -> list[str]:
    errors: list[str] = []
    expected = expected_js(data)
    if not JS_PATH.exists() or JS_PATH.read_text(encoding="utf-8").strip() != expected:
        errors.append("factory-data.js is out of date; run python3 build.py")
    if not INDEX_PATH.exists():
        errors.append("index.html is missing")
    else:
        match = FACTORY_BLOCK_RE.search(INDEX_PATH.read_text(encoding="utf-8"))
        if not match or match.group(0) != expected:
            errors.append("index.html FACTORY_DATA block is out of date; run python3 build.py")
    return errors


def validate_connectors() -> list[str]:
    errors: list[str] = []
    for path in sorted((ROOT / "connectors").glob("*/server.json")):
        try:
            config = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
            continue
        if config.get("command") == "TODO" or any(
            isinstance(value, dict) and value.get("command") == "TODO"
            for value in config.values()
        ):
            errors.append(f"{path.relative_to(ROOT)}: TODO connector wiring")
        pattern = config.get("pattern")
        if pattern in {"script", "cli", "documented-only"} and not config.get("note"):
            errors.append(f"{path.relative_to(ROOT)}: {pattern} connector needs a note")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-generated", action="store_true", help="skip generated-file checks")
    args = parser.parse_args(argv)
    try:
        data = load_data()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"factory-data.json: {exc}")
        return 1
    errors = validate_references(data) + validate_orphans(data) + validate_connectors()
    if not args.no_generated:
        errors += validate_generated(data)
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors))
        print(f"Validation failed with {len(errors)} error(s).")
        return 1
    print("Factory validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
