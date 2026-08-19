"""Activity completeness tests for factory-data.json.

Checks that every activity carries enough metadata to be useful and
that its uses list is structurally sound. Complements test_factory_integrity.py
(which checks that references resolve to real files) by checking the
semantic quality of the activity record itself.

Checks:
  1. owner is a known role from the factory vocabulary
  2. status is a known status from the factory vocabulary
  3. engagement code contains only valid characters (G / B / A / R)
  4. desc is non-empty
  5. uses includes at least one skill or agent (something that executes)
  6. Informational skip: gated activity with no artifact
     (gate evidence needs somewhere to land)
"""
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "factory-data.json"


def load_data():
    return json.loads(DATA.read_text(encoding="utf-8"))


def _activities():
    return load_data().get("activities", [])


def _vocab():
    d = load_data()
    return {
        "roles":       set(d.get("roles", {}).keys()),
        "statuses":    set(d.get("statuses", {}).keys()),
        "eng_chars":   set("GBAR"),
    }


def _uses_kinds(activity):
    return {u[0] for u in activity.get("uses", [])}


def _gates(activity):
    return [n for k, ns in activity.get("uses", []) if k == "q-gate" for n in ns]


# ---------------------------------------------------------------------------
# Check 1 — owner must be a known role
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a["title"])
def test_owner_is_valid_role(activity):
    vocab = _vocab()["roles"]
    owner = activity.get("owner", "")
    assert owner in vocab, (
        f"activity '{activity['title']}' has owner='{owner}' "
        f"which is not in the roles vocabulary: {sorted(vocab)}"
    )


# ---------------------------------------------------------------------------
# Check 2 — status must be a known status
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a["title"])
def test_status_is_valid(activity):
    vocab = _vocab()["statuses"]
    status = activity.get("status", "")
    assert status in vocab, (
        f"activity '{activity['title']}' has status='{status}' "
        f"which is not in the statuses vocabulary: {sorted(vocab)}"
    )


# ---------------------------------------------------------------------------
# Check 3 — engagement code uses only G / B / A / R
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a["title"])
def test_engagement_code_chars_valid(activity):
    valid = _vocab()["eng_chars"]
    code = activity.get("engagement", "")
    bad = [c for c in code if c not in valid]
    assert not bad, (
        f"activity '{activity['title']}' has engagement='{code}' "
        f"with invalid character(s) {bad}. Valid chars: {sorted(valid)}"
    )


# ---------------------------------------------------------------------------
# Check 4 — desc must be non-empty
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a["title"])
def test_desc_is_non_empty(activity):
    desc = activity.get("desc", "").strip()
    assert desc, (
        f"activity '{activity['title']}' has an empty desc field. "
        f"Every activity needs a human-readable description."
    )


# ---------------------------------------------------------------------------
# Check 5 — uses must include at least one skill or agent
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity", _activities(), ids=lambda a: a["title"])
def test_uses_has_skill_or_agent(activity):
    kinds = _uses_kinds(activity)
    assert "skill" in kinds or "agent" in kinds, (
        f"activity '{activity['title']}' has no skill or agent in uses. "
        f"An activity must invoke at least one skill or agent to be executable."
    )


# ---------------------------------------------------------------------------
# Check 6 — gated activity should have at least one artifact (informational)
# Gate evidence needs somewhere to land; activities with a gate but no artifact
# are surfaced as skips so the gap is visible without blocking CI.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "activity",
    [a for a in _activities() if _gates(a) and "artifact" not in _uses_kinds(a)],
    ids=lambda a: a["title"],
)
def test_gated_activity_has_artifact(activity):
    pytest.skip(
        f"'{activity['title']}' ({activity['phase']}) has gate "
        f"'{_gates(activity)[0]}' but no artifact. "
        f"Gate evidence normally lands in a durable artifact — "
        f"add one or mark this skip as intentional."
    )
