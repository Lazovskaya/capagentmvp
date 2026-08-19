"""Data integrity tests for factory-data.json.

Each test checks one class of reference:
  - forward refs  : factory-data.json mentions something that must exist on disk
  - reverse refs  : file exists on disk but is not referenced anywhere in factory-data.json

Tests are parametrized so each broken item shows up as a separate named failure.
"""
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "factory-data.json"
VALID_PHASES = {"Discover", "Prepare", "Explore", "Realize", "Deploy", "Run"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_data():
    return json.loads(DATA.read_text(encoding="utf-8"))


def _activities():
    return load_data().get("activities", [])


def _components():
    return load_data().get("components", [])


def _all_uses(kind):
    """Collect (activity_title, name) pairs for a given use kind across all activities."""
    results = []
    for a in _activities():
        for use_kind, names in a.get("uses", []):
            if use_kind == kind:
                for name in names:
                    results.append((a["title"], name))
    return results


def _referenced_names(kind):
    """All names referenced in uses for a given kind (mcp → connector key)."""
    return {name for _, name in _all_uses(kind)}


def _adopt_skill_names():
    """Adopt-posture skills only ever have a skills/index.yaml entry, never a
    skills/<name>/SKILL.md directory -- that's the whole point of the own/adopt split
    (see root README.md and CLAUDE.md). Parsed lightly (no PyYAML dependency needed for
    one field), matching the same convention tools/adapter_common.py already relies on."""
    text = (ROOT / "skills" / "index.yaml").read_text(encoding="utf-8")
    names = set()
    for line in text.splitlines():
        stripped = line.strip().lstrip("-").strip()
        if stripped.startswith("name:"):
            names.add(stripped.split(":", 1)[1].strip())
    return names


# ---------------------------------------------------------------------------
# Required fields on every activity
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a.get("title", "?"))
def test_activity_has_required_fields(activity):
    for field in ("title", "file", "phase", "owner", "uses"):
        assert field in activity, f"missing field '{field}'"


@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a.get("title", "?"))
def test_activity_phase_is_valid(activity):
    assert activity["phase"] in VALID_PHASES, (
        f"phase '{activity['phase']}' is not a valid SAP Activate phase"
    )


# ---------------------------------------------------------------------------
# Activity files exist on disk
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a.get("title", "?"))
def test_activity_file_exists(activity):
    path = ROOT / activity["file"]
    assert path.exists(), f"activity file not found: {activity['file']}"


# ---------------------------------------------------------------------------
# Forward refs: uses entries resolve to real files
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity_title,name", _all_uses("skill"),
                         ids=lambda x: x if isinstance(x, str) else "")
def test_skill_ref_exists(activity_title, name):
    assert (ROOT / "skills" / name / "SKILL.md").exists() or name in _adopt_skill_names(), (
        f"activity '{activity_title}' references skill '{name}' "
        f"but skills/{name}/SKILL.md not found and '{name}' isn't a listed adopt-posture "
        f"skill in skills/index.yaml either"
    )


@pytest.mark.parametrize("activity_title,name", _all_uses("agent"),
                         ids=lambda x: x if isinstance(x, str) else "")
def test_agent_ref_exists(activity_title, name):
    assert (ROOT / "agents" / f"{name}.md").exists(), (
        f"activity '{activity_title}' references agent '{name}' "
        f"but agents/{name}.md not found"
    )


@pytest.mark.parametrize("activity_title,name", _all_uses("mcp"),
                         ids=lambda x: x if isinstance(x, str) else "")
def test_connector_ref_exists(activity_title, name):
    assert (ROOT / "connectors" / name / "server.json").exists(), (
        f"activity '{activity_title}' references connector '{name}' "
        f"but connectors/{name}/server.json not found"
    )


@pytest.mark.parametrize("activity_title,name", _all_uses("artifact"),
                         ids=lambda x: x if isinstance(x, str) else "")
def test_artifact_ref_exists(activity_title, name):
    assert (ROOT / "artifacts" / name / "template.md").exists(), (
        f"activity '{activity_title}' references artifact '{name}' "
        f"but artifacts/{name}/template.md not found"
    )


@pytest.mark.parametrize("activity_title,name", _all_uses("knowledge"),
                         ids=lambda x: x if isinstance(x, str) else "")
def test_knowledge_ref_exists(activity_title, name):
    assert (ROOT / "knowledge" / name).is_dir(), (
        f"activity '{activity_title}' references knowledge bucket '{name}' "
        f"but knowledge/{name}/ not found"
    )


@pytest.mark.parametrize("activity_title,name", _all_uses("q-gate"),
                         ids=lambda x: x if isinstance(x, str) else "")
def test_gate_ref_exists(activity_title, name):
    # gates are referenced with → arrow but stored with - dash on disk
    gate_file = (ROOT / "gates" / (name.replace("→", "-") + ".md"))
    assert gate_file.exists(), (
        f"activity '{activity_title}' references gate '{name}' "
        f"but {gate_file.relative_to(ROOT)} not found"
    )


# ---------------------------------------------------------------------------
# Reverse refs: nothing on disk is orphaned (every file is used somewhere)
# ---------------------------------------------------------------------------

def _orphaned(disk_names, referenced):
    return sorted(disk_names - referenced)


@pytest.mark.parametrize("name", _orphaned(
    {p.parent.name for p in (ROOT / "skills").glob("*/SKILL.md")},
    _referenced_names("skill"),
))
def test_no_orphaned_skills(name):
    pytest.fail(
        f"skills/{name}/SKILL.md exists but '{name}' is not referenced in any activity's uses. "
        f"Either add it to an activity or remove it from the repo."
    )


@pytest.mark.parametrize("name", _orphaned(
    {p.stem for p in (ROOT / "agents").glob("*.md")},
    _referenced_names("agent"),
))
def test_no_orphaned_agents(name):
    pytest.fail(
        f"agents/{name}.md exists but '{name}' is not referenced in any activity's uses. "
        f"Either add it to an activity or remove it from the repo."
    )


@pytest.mark.parametrize("name", _orphaned(
    {p.parent.name for p in (ROOT / "connectors").glob("*/server.json")},
    _referenced_names("mcp"),
))
def test_no_orphaned_connectors(name):
    pytest.fail(
        f"connectors/{name}/server.json exists but '{name}' is not referenced in any activity's uses. "
        f"Either add it to an activity or remove it from the repo."
    )


@pytest.mark.parametrize("name", _orphaned(
    {p.parent.name for p in (ROOT / "artifacts").glob("*/template.md")},
    _referenced_names("artifact"),
))
def test_no_orphaned_artifacts(name):
    pytest.fail(
        f"artifacts/{name}/template.md exists but '{name}' is not referenced in any activity's uses. "
        f"Either add it to an activity or remove it from the repo."
    )


@pytest.mark.parametrize("name", _orphaned(
    {p.name for p in (ROOT / "knowledge").iterdir() if p.is_dir()},
    _referenced_names("knowledge"),
))
def test_no_orphaned_knowledge(name):
    pytest.fail(
        f"knowledge/{name}/ exists but '{name}' is not referenced in any activity's uses. "
        f"Either add it to an activity or remove it from the repo."
    )


@pytest.mark.parametrize("name", _orphaned(
    {p.stem for p in (ROOT / "gates").glob("*.md")},
    {n.replace("→", "-") for n in _referenced_names("q-gate")},
))
def test_no_orphaned_gates(name):
    pytest.fail(
        f"gates/{name}.md exists but is not referenced in any activity's uses. "
        f"Either add it to an activity or remove it from the repo."
    )


# ---------------------------------------------------------------------------
# Components registry is consistent with disk
# ---------------------------------------------------------------------------

KIND_TO_DISK = {
    "Skill":     lambda n: (ROOT / "skills" / n / "SKILL.md").exists() or n in _adopt_skill_names(),
    "Agent":     lambda n: (ROOT / "agents" / f"{n}.md").exists(),
    "Connector": lambda n: (ROOT / "connectors" / n / "server.json").exists(),
    "Artifact":  lambda n: (ROOT / "artifacts" / n / "template.md").exists(),
    "Knowledge": lambda n: (ROOT / "knowledge" / n).is_dir(),
    "Q-gate":    lambda n: (ROOT / "gates" / (n.replace("→", "-") + ".md")).exists(),
}


@pytest.mark.parametrize("component", _components(),
                         ids=lambda c: f"{c.get('kind')}/{c.get('name')}")
def test_component_file_exists(component):
    kind = component.get("kind")
    name = component.get("name")
    checker = KIND_TO_DISK.get(kind)
    if checker is None:
        pytest.skip(f"no disk check defined for component kind '{kind}'")
    assert checker(name), (
        f"component {kind}/{name} is listed in factory-data.json "
        f"but its file does not exist on disk"
    )
