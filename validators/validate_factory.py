#!/usr/bin/env python3
"""Validate the factory model, repository files, connectors, and generated views."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import adapter_common as common  # noqa: E402

DATA_PATH = ROOT / "factory-data.json"
INDEX_PATH = ROOT / "index.html"
JS_PATH = ROOT / "factory-data.js"
KINDS = {
    "Skill": ("skills", "SKILL.md"),
    "Agent": ("agents", "agent.md"),
    "Tool": ("tools", "tool.md"),
    "Assistant": ("assistants", "assistant.md"),
    "Connector": ("connectors", "server.json"),
    "Artifact": ("artifacts", "template.md"),
    "Knowledge": ("knowledge", None),
    "Q-gate": ("gates", "gate.md"),
}
# Rows laid out in phase columns: a component whose phase isn't one of data["phases"] has no
# column and is silently left off the map.
PHASE_LAYOUT_KINDS = {"Skill", "Agent", "Tool"}
FACTORY_BLOCK_RE = re.compile(r"window\.FACTORY_DATA = \{.*?\n\};", re.DOTALL)


def load_data() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def knowledge_locations() -> dict[str, Path]:
    """Governed Knowledge Source id -> its directory (nested sources don't live at
    knowledge/<id>/)."""
    return {sid: ROOT / loc for sid, loc in common.load_knowledge_sources().items()}


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


USE_KINDS = {"skill": "Skill", "agent": "Agent", "tool": "Tool", "mcp": "Connector",
             "connector": "Connector", "artifact": "Artifact", "knowledge": "Knowledge",
             "q-gate": "Q-gate"}


def uses(data: dict, kind: str) -> set[str]:
    return {
        name
        for entry in data.get("assistants", [])
        for use_kind, names in entry.get("uses", [])
        if use_kind == kind
        for name in names
    }


def component_path(kind: str, name: str) -> Path | None:
    directory, leaf = KINDS[kind]
    if kind == "Knowledge":
        return knowledge_locations().get(name, ROOT / directory / name)
    path = ROOT / directory / name
    if kind == "Artifact" and name == "explore-chain":
        return path
    return path if leaf is None else path / leaf


def validate_assistants(data: dict) -> list[str]:
    errors: list[str] = []
    phases, roles = set(data.get("phases", [])), data.get("roles", {})
    engagements, statuses = data.get("engagements", {}), data.get("statuses", {})
    if "activities" in data:
        errors.append("legacy activities[] key present; run scripts/generate_factory_data.py --write")
    for entry in data.get("assistants", []):
        label = f"assistant use case {entry.get('title', '?')}"
        missing = {"title", "file", "phase", "phases", "owner", "engagement", "status", "uses"} - entry.keys()
        errors.extend(f"{label}: missing {field}" for field in sorted(missing))
        if entry.get("phase") not in phases:
            errors.append(f"{label}: invalid phase {entry.get('phase')!r}")
        if not (ROOT / entry.get("file", "")).exists():
            errors.append(f"{label}: missing file {entry.get('file')}")
        if entry.get("owner") not in roles:
            errors.append(f"{label}: owner {entry.get('owner')!r} not in roles")
        errors.extend(f"{label}: engagement {value!r} not in engagements"
                      for value in entry.get("engagement", []) if value not in engagements)
        if entry.get("status") not in statuses:
            errors.append(f"{label}: status {entry.get('status')!r} not in statuses")
    return errors


def validate_references(data: dict) -> list[str]:
    errors = validate_assistants(data)
    for use_kind, kind in USE_KINDS.items():
        for name in uses(data, use_kind):
            path = component_path(kind, name)
            if kind == "Skill" and (path and path.exists() or name in adopt_skills()):
                continue
            if not path or not path.exists():
                errors.append(f"{use_kind} reference does not resolve: {name}")
    phases, statuses = set(data.get("phases", [])), data.get("statuses", {})
    for component in data.get("components", []):
        kind, name = component.get("kind"), component.get("name")
        path = component_path(kind, name) if kind in KINDS else None
        if kind not in KINDS or not path:
            errors.append(f"component has invalid kind/name: {kind}/{name}")
        elif not (path.exists() or (kind == "Skill" and name in adopt_skills())):
            errors.append(f"component file does not exist: {kind}/{name}")
        if component.get("status") not in statuses:
            errors.append(f"component {kind}/{name}: status {component.get('status')!r} not in statuses")
        if kind in PHASE_LAYOUT_KINDS and component.get("phase") not in phases:
            errors.append(f"component {kind}/{name}: phase {component.get('phase')!r} has no "
                          f"column, so it is not shown on the map")
    return errors


def validate_orphans(data: dict) -> list[str]:
    errors: list[str] = []
    for kind, (directory, leaf) in KINDS.items():
        root = ROOT / directory
        if not root.exists():
            continue
        if kind == "Knowledge":
            # Governed sources by id, plus top-level buckets with no governed source beneath
            # them; container dirs (methodology/, domain-packs/) hold nested sources instead.
            sources = knowledge_locations()
            disk = set(sources) | {
                p.name for p in root.iterdir()
                if p.is_dir() and not any(p.glob("**/knowledge.meta.md"))
            }
        elif leaf is None:
            disk = {p.name for p in root.iterdir() if p.is_dir()}
        else:
            disk = {p.parent.name for p in root.glob(f"*/{leaf}")}
        referenced = set().union(*(uses(data, u) for u, k in USE_KINDS.items() if k == kind))
        referenced |= {
            component.get("name")
            for component in data.get("components", [])
            if component.get("kind") == kind
        }
        if kind == "Skill":
            referenced |= adopt_skills()
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
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
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
