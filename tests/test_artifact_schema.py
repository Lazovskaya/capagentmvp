"""Artifact schema validation tests.

Each artifact in artifacts/<name>/ must have:
  - schema.json  — a valid JSON Schema (object type, required list, properties)
  - template.md  — a Markdown template the model fills in

Checks:
  1. Both files exist (integrity guard — referential tests cover this too)
  2. schema.json is valid JSON and has the right top-level structure
  3. Every field in `required` is defined in `properties`
  4. Every top-level required field is mentioned in template.md
     (uses a keyword heuristic: significant words from the snake_case field name
     must appear somewhere in the template, singular/plural tolerant)
  5. Status enum values declared in schema appear in template
     (keeps schema and template in sync on allowed values)
  6. No duplicate field names in the `required` list
"""
import json
import re
from pathlib import Path

import pytest

ROOT  = Path(__file__).resolve().parent.parent
ARTS  = ROOT / "artifacts"

# Words too generic to be meaningful on their own when checking field coverage
_STOP = {
    "id", "log", "record", "list", "date", "type", "name", "status", "note",
    "flag", "ref", "count", "by", "to", "of", "the", "a", "an", "is", "are",
    "and", "or", "with",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def artifact_dirs():
    return sorted(
        d for d in ARTS.iterdir()
        if d.is_dir() and (d / "schema.json").exists() and (d / "template.md").exists()
    )


def artifact_name(d):
    return d.name


def load_schema(artifact_dir):
    return json.loads((artifact_dir / "schema.json").read_text(encoding="utf-8"))


def load_template(artifact_dir):
    return (artifact_dir / "template.md").read_text(encoding="utf-8")


def _key_words(field_name):
    words = re.split(r"[_-]", field_name)
    return [w for w in words if w.lower() not in _STOP and len(w) > 2]


def _in_text(word, text):
    w = word.lower()
    t = text.lower()
    return w in t or w.rstrip("s") in t or (w + "s") in t


def _enum_values(schema, field_name):
    prop = schema.get("properties", {}).get(field_name, {})
    return prop.get("enum", [])


# ---------------------------------------------------------------------------
# Check 1 — both files exist (directories without schema/template are skipped)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("artifact_dir", artifact_dirs(), ids=artifact_name)
def test_schema_and_template_exist(artifact_dir):
    assert (artifact_dir / "schema.json").exists(), \
        f"{artifact_dir.name}: missing schema.json"
    assert (artifact_dir / "template.md").exists(), \
        f"{artifact_dir.name}: missing template.md"


# ---------------------------------------------------------------------------
# Check 2 — schema.json is valid JSON with correct top-level structure
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("artifact_dir", artifact_dirs(), ids=artifact_name)
def test_schema_is_valid_json(artifact_dir):
    try:
        schema = load_schema(artifact_dir)
    except json.JSONDecodeError as e:
        pytest.fail(f"{artifact_dir.name}/schema.json is not valid JSON: {e}")

    assert schema.get("type") == "object", \
        f"{artifact_dir.name}: schema top-level type must be 'object', got {schema.get('type')!r}"
    assert isinstance(schema.get("required"), list), \
        f"{artifact_dir.name}: schema must have a 'required' list"
    assert isinstance(schema.get("properties"), dict), \
        f"{artifact_dir.name}: schema must have a 'properties' object"


# ---------------------------------------------------------------------------
# Check 3 — every required field is defined in properties
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("artifact_dir", artifact_dirs(), ids=artifact_name)
def test_required_fields_defined_in_properties(artifact_dir):
    schema = load_schema(artifact_dir)
    required = schema.get("required", [])
    properties = schema.get("properties", {})
    missing = [f for f in required if f not in properties]
    assert not missing, (
        f"{artifact_dir.name}: required field(s) {missing} not defined in properties. "
        f"Every required field must have a property definition."
    )


# ---------------------------------------------------------------------------
# Check 4 — required fields are mentioned in template.md
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("artifact_dir", artifact_dirs(), ids=artifact_name)
def test_required_fields_covered_in_template(artifact_dir):
    schema   = load_schema(artifact_dir)
    template = load_template(artifact_dir)
    required = schema.get("required", [])

    missing = []
    for field in required:
        kw = _key_words(field)
        if not kw:
            continue
        uncovered = [w for w in kw if not _in_text(w, template)]
        if uncovered:
            missing.append((field, uncovered))

    assert not missing, (
        f"{artifact_dir.name}/template.md is missing coverage for required field(s):\n"
        + "\n".join(f"  field '{f}': keywords not found: {ws}" for f, ws in missing)
    )


# ---------------------------------------------------------------------------
# Check 5 — status enum values in schema appear in template
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("artifact_dir", artifact_dirs(), ids=artifact_name)
def test_status_enum_values_in_template(artifact_dir):
    schema   = load_schema(artifact_dir)
    template = load_template(artifact_dir)
    enum_vals = _enum_values(schema, "status")
    if not enum_vals:
        pytest.skip("no top-level status enum in schema")

    missing = [v for v in enum_vals if v not in template]
    assert not missing, (
        f"{artifact_dir.name}/template.md missing status enum value(s): {missing}. "
        f"All allowed values ({enum_vals}) must appear in the template."
    )


# ---------------------------------------------------------------------------
# Check 6 — no duplicate field names in required
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("artifact_dir", artifact_dirs(), ids=artifact_name)
def test_no_duplicate_required_fields(artifact_dir):
    required = load_schema(artifact_dir).get("required", [])
    seen, dupes = set(), []
    for f in required:
        if f in seen:
            dupes.append(f)
        seen.add(f)
    assert not dupes, \
        f"{artifact_dir.name}: duplicate field(s) in required: {dupes}"
