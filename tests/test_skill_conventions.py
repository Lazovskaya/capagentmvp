"""Convention compliance tests for own-posture skills (skills/*/SKILL.md).

Checks are intentionally mechanical — they catch the *absence* of required
patterns, not whether the prose is good. Each skill is a separate parametrized
test case so failures are named and actionable.

Conventions source: docs/skill-design-conventions.md
"""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = ROOT / "skills"

VALID_KNOWLEDGE_BUCKETS = {
    "clean-core", "config", "custom-code", "data", "domain-packs",
    "extensibility", "operations", "process", "standards", "testing",
}

# Connectors that expose write operations (not read-only)
WRITE_CAPABLE_CONNECTORS = {
    "abap-mcp", "jira", "cloud-alm", "gcts-abapgit", "ai-agent-hub", "joule-studio",
}

# Words that indicate the skill intends to mutate remote state
WRITE_INTENT_PATTERN = re.compile(
    r"\b(create|update|push|mutate|submit|send|sync|write back|write to|post)\b",
    re.IGNORECASE,
)

# Acceptable guards: dry-run / preview / --apply / explicit approval
WRITE_GUARD_PATTERN = re.compile(
    r"(--apply|apply_writes|preview|dry.run|explicit approval|stop for approval"
    r"|requires.*approval|never create|never update|never write|never push"
    r"|never comment|hard boundary|not.*write|read.only)",
    re.IGNORECASE,
)

# Status-progression enums: a Markdown table or list whose rows contain
# status-like words such as Draft, Approved, Done, Validated, Pass, etc.
STATUS_PROGRESSION_PATTERN = re.compile(
    r"\b(Draft|Approved|Done|Validated|Pass(?:ed)?|Accepted|Reviewed|Complete[d]?"
    r"|In[_\s]?[Rr]eview|In[_\s]?[Pp]rogress|retire|remediate|investigate)\b",
)

REOPEN_ESCALATION_PATTERN = re.compile(
    r"\b(Reopen|Escalat|Reject|Block|Revert|Revisit)",
    re.IGNORECASE,
)

KNOWLEDGE_REF_RE = re.compile(r"\.\./\.\./\.\./knowledge/([A-Za-z0-9_-]+)")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def own_skills():
    """All own-posture skills: those that have a SKILL.md in skills/<name>/."""
    return sorted(p.parent for p in SKILLS_DIR.glob("*/SKILL.md"))


def skill_text(skill_dir):
    return (skill_dir / "SKILL.md").read_text(encoding="utf-8")


def skill_name(skill_dir):
    return skill_dir.name


# ---------------------------------------------------------------------------
# Check 1 — Frontmatter: name + description required
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_frontmatter_name_and_description(skill_dir):
    text = skill_text(skill_dir)
    assert text.startswith("---"), "SKILL.md must start with YAML frontmatter (---)"
    fm_end = text.index("---", 3)
    frontmatter = text[3:fm_end]
    assert re.search(r"^name:\s*\S", frontmatter, re.MULTILINE), \
        "frontmatter missing 'name:' field"
    assert re.search(r"^description:\s*\S", frontmatter, re.MULTILINE), \
        "frontmatter missing 'description:' field"


# ---------------------------------------------------------------------------
# Check 2 — Convention link present
# Convention doc says every own-posture skill should link to skill-design-conventions.md
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_convention_link_present(skill_dir):
    text = skill_text(skill_dir)
    assert "skill-design-conventions.md" in text, (
        f"skills/{skill_dir.name}/SKILL.md does not reference skill-design-conventions.md. "
        f"Add a link per docs/skill-design-conventions.md §How to use."
    )


# ---------------------------------------------------------------------------
# Check 3 — Required structural sections
# Every skill needs: "When to use" and "Inputs" (any heading level)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_required_section_when_to_use(skill_dir):
    text = skill_text(skill_dir)
    assert re.search(r"##?\s+When to use", text, re.IGNORECASE), (
        f"skills/{skill_dir.name}/SKILL.md missing '## When to use' section. "
        f"Every skill needs a clear trigger condition."
    )


@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_required_section_inputs(skill_dir):
    text = skill_text(skill_dir)
    assert re.search(r"##?\s+Inputs?", text, re.IGNORECASE), (
        f"skills/{skill_dir.name}/SKILL.md missing '## Inputs' section. "
        f"Skills must declare their required inputs explicitly."
    )


# ---------------------------------------------------------------------------
# Check 4 — MCP write guard (convention §6)
# If a skill references a write-capable connector AND uses write-intent verbs,
# it must also mention an explicit guard (--apply / preview / dry-run / etc.)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_write_guard_when_write_connector_used(skill_dir):
    text = skill_text(skill_dir)

    used_write_connectors = [c for c in WRITE_CAPABLE_CONNECTORS if c in text]
    if not used_write_connectors:
        pytest.skip("no write-capable connector referenced")

    if not WRITE_INTENT_PATTERN.search(text):
        pytest.skip("write connector referenced but no write-intent verbs found")

    assert WRITE_GUARD_PATTERN.search(text), (
        f"skills/{skill_dir.name}/SKILL.md references write connector(s) "
        f"({', '.join(used_write_connectors)}) and write-intent verbs, "
        f"but no write guard found (--apply / preview / dry-run / explicit approval). "
        f"See convention §6: MCP mutations are dry-run unless --apply."
    )


# ---------------------------------------------------------------------------
# Check 5 — Status enum has reopen/escalation path (convention §2)
# If a status progression is defined, it must include a reopen/blocked state.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_status_enum_has_reopen_path(skill_dir):
    text = skill_text(skill_dir)

    status_hits = STATUS_PROGRESSION_PATTERN.findall(text)
    if len(set(s.lower() for s in status_hits)) < 2:
        pytest.skip("no multi-value status progression enum detected")

    assert REOPEN_ESCALATION_PATTERN.search(text), (
        f"skills/{skill_dir.name}/SKILL.md defines a status progression enum "
        f"but has no reopen/escalation/blocked state. "
        f"See convention §2: status enums need an explicit reopen path."
    )


# ---------------------------------------------------------------------------
# Check 6 — Knowledge references use valid bucket names
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("skill_dir", own_skills(), ids=skill_name)
def test_knowledge_refs_use_valid_buckets(skill_dir):
    text = skill_text(skill_dir)
    invalid = [
        name for name in KNOWLEDGE_REF_RE.findall(text)
        if name not in VALID_KNOWLEDGE_BUCKETS
    ]
    assert not invalid, (
        f"skills/{skill_dir.name}/SKILL.md references unknown knowledge bucket(s): "
        f"{invalid}. Valid buckets: {sorted(VALID_KNOWLEDGE_BUCKETS)}"
    )
