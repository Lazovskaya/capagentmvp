"""
Deterministic grader: Level 1 (schema/ID) + Level 2 (tool trajectory).

No LLM here. Given a produced output artifact and a run transcript, it returns a
structured verdict per level. This is the part that is cheap, fast and 100%
reproducible -- it can be developed and validated in replay mode without spending
tokens.
"""
import json
import pathlib

import jsonschema

from lib import transcript as T


def _load_json(path):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def grade_level1(artifact_path, schema_path, expected_stable_id):
    """Schema validity + stable-ID + basic field checks. Returns (passed, checks)."""
    checks = []

    p = pathlib.Path(artifact_path)
    if not p.exists():
        checks.append({"check": "artifact_exists", "ok": False,
                       "detail": f"{p.name} was not created"})
        return False, checks
    checks.append({"check": "artifact_exists", "ok": True, "detail": p.name})

    try:
        data = _load_json(p)
    except (json.JSONDecodeError, OSError) as exc:
        checks.append({"check": "artifact_is_json", "ok": False, "detail": str(exc)})
        return False, checks
    checks.append({"check": "artifact_is_json", "ok": True, "detail": "parsed"})

    schema = _load_json(schema_path)
    try:
        jsonschema.validate(instance=data, schema=schema)
        checks.append({"check": "schema_valid", "ok": True, "detail": "conforms to schema"})
        schema_ok = True
    except jsonschema.ValidationError as exc:
        loc = "/".join(str(x) for x in exc.absolute_path) or "(root)"
        checks.append({"check": "schema_valid", "ok": False,
                       "detail": f"at {loc}: {exc.message}"})
        schema_ok = False

    # Stable-id check is field-name-agnostic: the expected id must appear verbatim
    # as a value in the output (works regardless of whether the id field is called
    # customer_id, invoice_id, ticket_id, ...).
    blob = json.dumps(data, ensure_ascii=False)
    id_ok = expected_stable_id is not None and str(expected_stable_id) in blob
    checks.append({"check": "stable_id_present", "ok": id_ok,
                   "detail": f"expected {expected_stable_id!r} present verbatim in output"})

    # The tool-parsed sub-object must also carry the id (tool output integrity).
    parsed_blob = json.dumps(data.get("parsed") or {}, ensure_ascii=False)
    parsed_ok = expected_stable_id is not None and str(expected_stable_id) in parsed_blob
    checks.append({"check": "stable_id_in_parsed", "ok": parsed_ok,
                   "detail": f"expected {expected_stable_id!r} present in parsed{{}}"})

    passed = schema_ok and id_ok and parsed_ok
    return passed, checks


def grade_level2(transcript_path, expected_tool_calls, forbidden_tools):
    """Tool-trajectory check (any-order). Returns (passed, checks)."""
    checks = []
    events = T.load(transcript_path)
    calls = T.tool_calls(events)
    used = T.used_tool_names(events)
    checks.append({"check": "tools_used", "ok": True, "detail": ", ".join(used) or "(none)"})

    all_ok = True
    for spec in expected_tool_calls:
        kind = spec.get("kind")
        contains = spec.get("contains", "")
        found = any(T.call_matches(c, kind, contains) for c in calls)
        all_ok = all_ok and found
        checks.append({
            "check": f"expected_call[{kind}~{contains}]",
            "ok": found,
            "detail": spec.get("why", ""),
        })

    for tool in forbidden_tools or []:
        hit = tool in used
        if hit:
            all_ok = False
        checks.append({"check": f"forbidden[{tool}]", "ok": (not hit),
                       "detail": "used!" if hit else "not used"})

    return all_ok, checks


def grade(artifact_path, transcript_path, scenario_meta, schema_path):
    """Run Level 1 + Level 2 from a scenario meta dict. Returns a verdict dict."""
    g = scenario_meta.get("grading", {})
    l1cfg = g.get("level1", {})
    l2cfg = g.get("level2", {})

    l1_pass, l1_checks = grade_level1(
        artifact_path, schema_path, l1cfg.get("expected_stable_id"))
    l2_pass, l2_checks = grade_level2(
        transcript_path,
        l2cfg.get("expected_tool_calls", []),
        l2cfg.get("forbidden_tools", []),
    )
    return {
        "level1": {"passed": l1_pass, "checks": l1_checks},
        "level2": {"passed": l2_pass, "checks": l2_checks},
    }
