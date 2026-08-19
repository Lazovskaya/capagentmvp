"""Q-gate sequence tests for factory-data.json activities.

SAP Activate has a fixed phase order with one exit gate per phase:
  Discover → Prepare → Explore → Realize → Deploy → Run

Rules checked:
  1. Every gate reference uses valid arrow notation (→, not -)
  2. When an activity references a gate, the gate must exit the activity's own phase
     (no forward-jumping to a future gate, no backward reference to a past one)
  3. Every delivery phase has at least one activity that carries its exit gate
     (the factory must have a complete Activate lifecycle)
  4. No activity references more than one gate
     (each activity belongs to exactly one phase-exit point)
"""
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "factory-data.json"

# Canonical phase order and their exit gates (arrow form used in factory-data.json)
PHASE_EXIT_GATE = {
    "Discover": "discover→prepare",
    "Prepare":  "prepare→explore",
    "Explore":  "explore→realize",
    "Realize":  "realize→deploy",
    "Deploy":   "deploy→run",
    "Run":      "run-exit",
}

PHASE_ORDER = list(PHASE_EXIT_GATE.keys())

# Meta-activities explicitly exempt from needing a gate
# (factory-onboard says "no Q-gate evidence by itself" in its description)
GATE_EXEMPT = {"Factory onboarding (user entry)"}


def load_data():
    return json.loads(DATA.read_text(encoding="utf-8"))


def _activities():
    return load_data().get("activities", [])


def _gates_for(activity):
    return [n for kind, names in activity.get("uses", [])
            if kind == "q-gate" for n in names]


# ---------------------------------------------------------------------------
# Helper: collect (activity, gate) pairs for parametrized tests
# ---------------------------------------------------------------------------

def _activities_with_gates():
    return [
        pytest.param(a, g, id=f"{a['title']}:{g}")
        for a in _activities()
        for g in _gates_for(a)
    ]


# ---------------------------------------------------------------------------
# Rule 1: gate notation must use → (arrow), not - (dash)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity,gate", _activities_with_gates())
def test_gate_uses_arrow_notation(activity, gate):
    assert "→" in gate or gate == "run-exit", (
        f"activity '{activity['title']}' uses gate '{gate}' — "
        f"gates must use arrow notation (→), e.g. 'discover→prepare', not 'discover-prepare'. "
        f"'run-exit' is the only valid dash form."
    )


# ---------------------------------------------------------------------------
# Rule 2: gate must match the activity's own phase
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("activity,gate", _activities_with_gates())
def test_gate_matches_activity_phase(activity, gate):
    phase = activity["phase"]
    expected = PHASE_EXIT_GATE.get(phase)
    assert gate == expected, (
        f"activity '{activity['title']}' is in phase '{phase}' "
        f"but references gate '{gate}' — "
        f"expected '{expected}'. "
        f"Activities must only reference the exit gate of their own phase."
    )


# ---------------------------------------------------------------------------
# Rule 3: every delivery phase must have at least one gated activity
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("phase,expected_gate", PHASE_EXIT_GATE.items())
def test_phase_has_exit_gate_activity(phase, expected_gate):
    activities = _activities()
    gated = [
        a["title"] for a in activities
        if a["phase"] == phase and expected_gate in _gates_for(a)
    ]
    assert gated, (
        f"phase '{phase}' has no activity referencing its exit gate '{expected_gate}'. "
        f"Every SAP Activate phase needs at least one activity that produces gate evidence."
    )


# ---------------------------------------------------------------------------
# Rule 4: no activity references more than one gate
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "activity",
    [a for a in _activities() if len(_gates_for(a)) > 1],
    ids=lambda a: a["title"],
)
def test_activity_has_at_most_one_gate(activity):
    gates = _gates_for(activity)
    pytest.fail(
        f"activity '{activity['title']}' references {len(gates)} gates: {gates}. "
        f"An activity belongs to exactly one phase-exit point."
    )


# ---------------------------------------------------------------------------
# Informational: activities with no gate (not a failure, reported as skipped)
# Useful to know which activities are mid-phase vs phase-exit.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "activity",
    [a for a in _activities()
     if not _gates_for(a) and a["title"] not in GATE_EXEMPT],
    ids=lambda a: a["title"],
)
def test_non_exempt_activity_without_gate(activity):
    pytest.skip(
        f"'{activity['title']}' ({activity['phase']}) has no q-gate — "
        f"mid-phase activity or gate not yet assigned. "
        f"Add to GATE_EXEMPT if intentional."
    )
