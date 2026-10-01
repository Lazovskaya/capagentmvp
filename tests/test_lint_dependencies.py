"""Tests for scripts/lint_dependencies.py."""
import sys
from pathlib import Path

# conftest.py adds scripts/ to sys.path
import lint_dependencies as ld

FACTORY_ROOT = Path(__file__).resolve().parent.parent


# ---------- check_vocabulary ----------

def test_valid_vocabulary_no_issues():
    """Known v0.3 types and relations produce no vocabulary issues."""
    rows = [
        ("skill", "`adr-log`", "requires", "cross-cutting skill"),
        ("artifact", "`brownfield-sad`", "produces", "output"),
        ("knowledge_source", "`standards`", "consumes", "guidance"),
        ("tool", "`fill-brownfield-sad-template`", "requires", ""),
        ("connector", "`confluence`", "requires", ""),
        ("agent", "`brownfield-sad-authoring-agent`", "routes-to", ""),
        ("assistant", "`solution-architect`", "routes-to", ""),
        ("q-gate", "`explore-realize`", "gates-at", ""),
    ]
    assert ld.check_vocabulary(rows) == []


def test_optional_relation_valid():
    """'optional' is a valid v0.3 relation."""
    rows = [("skill", "`confluence-document-publishing`", "optional", "")]
    assert ld.check_vocabulary(rows) == []


def test_unknown_type_flagged():
    """A row with an unknown type is flagged."""
    rows = [("gadget", "`foo`", "requires", "")]
    issues = ld.check_vocabulary(rows)
    assert len(issues) == 1
    assert "unknown type" in issues[0]
    assert "gadget" in issues[0]


def test_unknown_relation_flagged():
    """A row with an unknown relation is flagged."""
    rows = [("skill", "`foo`", "invokes", "")]
    issues = ld.check_vocabulary(rows)
    assert len(issues) == 1
    assert "unknown relation" in issues[0]
    assert "invokes" in issues[0]


def test_both_unknown_type_and_relation_flagged():
    """A row with both an unknown type and relation produces two issues."""
    rows = [("widget", "`bar`", "zaps", "")]
    issues = ld.check_vocabulary(rows)
    assert len(issues) == 2


def test_type_check_is_case_insensitive():
    """Type matching normalises to lowercase."""
    rows = [("Skill", "`foo`", "requires", "")]
    assert ld.check_vocabulary(rows) == []


# ---------- check_forward_declared ----------

def test_registered_source_not_flagged():
    """A knowledge_source ID that is registered is not flagged."""
    known = {"clean-core": "knowledge/clean-core/"}
    rows = [("knowledge_source", "`clean-core`", "consumes", "")]
    assert ld.check_forward_declared(rows, known) == []


def test_allowlisted_source_not_flagged():
    """A knowledge_source in FORWARD_DECLARED_KNOWLEDGE_SOURCES is not flagged."""
    rows = [("knowledge_source", "`solution-architect-role-context`", "consumes", "")]
    assert ld.check_forward_declared(rows, known_sources={}) == []


def test_unknown_unallowlisted_source_flagged():
    """A knowledge_source that is neither registered nor allowlisted is flagged."""
    rows = [("knowledge_source", "`mystery-source`", "consumes", "")]
    issues = ld.check_forward_declared(rows, known_sources={})
    assert len(issues) == 1
    assert "mystery-source" in issues[0]


# ---------- check_meta ----------

def test_check_meta_missing_file(tmp_path):
    """A missing meta.md is reported as no_meta=True."""
    result = ld.check_meta("agent", "ghost-agent", tmp_path / "ghost.meta.md", {})
    assert result["no_meta"] is True
    assert result["kind"] == "agent"
    assert result["name"] == "ghost-agent"


def test_check_meta_valid_file(tmp_path):
    """A valid meta.md with known vocabulary produces no issues."""
    meta = tmp_path / "agent.meta.md"
    meta.write_text(
        "---\nagent: test-agent\n---\n\n## Dependency graph\n\n"
        "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
        "| skill | `readiness-analysis` | requires | |\n",
        encoding="utf-8",
    )
    result = ld.check_meta("agent", "test-agent", meta, {})
    assert result["no_meta"] is False
    assert result["vocab_issues"] == []
    assert result["forward_decl_issues"] == []


def test_check_meta_bad_vocab(tmp_path):
    """A meta.md with an unknown type is reported in vocab_issues."""
    meta = tmp_path / "agent.meta.md"
    meta.write_text(
        "---\nagent: test-agent\n---\n\n## Dependency graph\n\n"
        "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
        "| widget | `foo` | requires | |\n",
        encoding="utf-8",
    )
    result = ld.check_meta("agent", "test-agent", meta, {})
    assert result["no_meta"] is False
    assert any("widget" in i for i in result["vocab_issues"])


# ---------- integration: linter runs cleanly against the real repo ----------

def test_linter_clean_against_repo():
    """Running the linter against the actual factory repo exits 0 (no missing meta files)."""
    exit_code = ld.main([])
    assert exit_code == 0


def test_linter_strict_runs_without_crash():
    """Running the linter with --strict against the actual factory repo returns 0 or 1
    (never a Python exception). Exit 1 is expected when skills have declared-but-not-found
    artifacts (a known caveat of the regex approach — see module docstring)."""
    exit_code = ld.main(["--strict"])
    assert exit_code in (0, 1)
