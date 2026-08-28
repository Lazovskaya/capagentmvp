"""Tests for tools/lint_dependencies.py."""
import sys
from pathlib import Path

import pytest

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import lint_dependencies as ld  # noqa: E402


SAMPLE_META = """---
skill: sample
namespace: "@epam/sap"
---

## Notes
Irrelevant prose.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| knowledge | process, config | consumes | uses process and config context |
| artifact | sign-off-record | produces | names who accepted what |
| connector | jira | requires | work-item context |
"""


class TestParseDependencyGraph:
    def test_parses_all_rows(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(SAMPLE_META, encoding="utf-8")
        rows = ld.parse_dependency_graph(meta)
        assert rows == [
            ("knowledge", "process, config", "consumes", "uses process and config context"),
            ("artifact", "sign-off-record", "produces", "names who accepted what"),
            ("connector", "jira", "requires", "work-item context"),
        ]

    def test_missing_file_returns_empty(self, tmp_path):
        assert ld.parse_dependency_graph(tmp_path / "nope.md") == []

    def test_missing_section_returns_empty(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text("---\nskill: sample\n---\n\n## Notes\nNo dependency graph here.\n", encoding="utf-8")
        assert ld.parse_dependency_graph(meta) == []

    def test_placeholder_only_table_returns_empty(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(
            "---\nskill: sample\n---\n\n## Dependency graph\n(later)\n",
            encoding="utf-8",
        )
        assert ld.parse_dependency_graph(meta) == []


class TestDeclaredRefs:
    def test_splits_comma_separated_refs(self):
        rows = [("knowledge", "process, config", "consumes", "")]
        assert ld.declared_refs(rows, "knowledge") == ["process", "config"]

    def test_filters_by_type(self):
        rows = [
            ("knowledge", "process", "consumes", ""),
            ("artifact", "sign-off-record", "produces", ""),
        ]
        assert ld.declared_refs(rows, "artifact") == ["sign-off-record"]

    def test_dedupes_preserving_order(self):
        rows = [
            ("knowledge", "process", "consumes", ""),
            ("knowledge", "process, config", "produces", ""),
        ]
        assert ld.declared_refs(rows, "knowledge") == ["process", "config"]


class TestCheckSkill:
    def test_no_meta_file_flagged(self, monkeypatch, tmp_path):
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        (tmp_path / "ghost").mkdir()
        result = ld.check_skill("ghost")
        assert result == {"skill": "ghost", "no_meta": True}

    def test_matching_declarations_have_no_drift(self, monkeypatch, tmp_path):
        skill_dir = tmp_path / "sample"
        skill_dir.mkdir()
        (skill_dir / "skill.meta.md").write_text(
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n"
            "| artifact | sign-off-record | produces | x |\n",
            encoding="utf-8",
        )
        (skill_dir / "SKILL.md").write_text(
            "See ../../../knowledge/process/ and ../../../artifacts/sign-off-record/.\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        result = ld.check_skill("sample")
        assert not ld.has_drift(result)

    def test_undeclared_reference_is_flagged(self, monkeypatch, tmp_path):
        skill_dir = tmp_path / "sample"
        skill_dir.mkdir()
        (skill_dir / "skill.meta.md").write_text(
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            encoding="utf-8",
        )
        (skill_dir / "SKILL.md").write_text(
            "See ../../../knowledge/process/ and ../../../knowledge/config/.\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        result = ld.check_skill("sample")
        assert result["knowledge_referenced_not_declared"] == ["config"]
        assert ld.has_drift(result)

    def test_declared_but_not_referenced_is_flagged(self, monkeypatch, tmp_path):
        skill_dir = tmp_path / "sample"
        skill_dir.mkdir()
        (skill_dir / "skill.meta.md").write_text(
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            encoding="utf-8",
        )
        (skill_dir / "SKILL.md").write_text("No path-style references here.\n", encoding="utf-8")
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        result = ld.check_skill("sample")
        assert result["knowledge_declared_not_referenced"] == ["process"]
        assert ld.has_drift(result)


class TestApplyFix:
    def test_appends_only_undeclared_rows(self, monkeypatch, tmp_path):
        skill_dir = tmp_path / "sample"
        skill_dir.mkdir()
        meta_path = skill_dir / "skill.meta.md"
        meta_path.write_text(
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            encoding="utf-8",
        )
        (skill_dir / "SKILL.md").write_text(
            "See ../../../knowledge/process/ and ../../../knowledge/config/.\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        result = ld.check_skill("sample")
        assert ld.apply_fix("sample", result) is True
        text = meta_path.read_text(encoding="utf-8")
        assert "| knowledge | config |" in text
        assert text.count("| knowledge | process |") == 1  # untouched, not duplicated

    def test_returns_false_when_nothing_to_fix(self, monkeypatch, tmp_path):
        skill_dir = tmp_path / "sample"
        skill_dir.mkdir()
        (skill_dir / "skill.meta.md").write_text(
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            encoding="utf-8",
        )
        (skill_dir / "SKILL.md").write_text("../../../knowledge/process/\n", encoding="utf-8")
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        result = ld.check_skill("sample")
        assert ld.apply_fix("sample", result) is False


class TestMainExitCode:
    def _setup_skill(self, tmp_path, monkeypatch, meta_text, skill_text, has_meta=True):
        skill_dir = tmp_path / "sample"
        skill_dir.mkdir()
        if has_meta:
            (skill_dir / "skill.meta.md").write_text(meta_text, encoding="utf-8")
        (skill_dir / "SKILL.md").write_text(skill_text, encoding="utf-8")
        monkeypatch.setattr(ld.common, "SKILLS_DIR", tmp_path)
        monkeypatch.setattr(ld.common, "all_own_skill_names", lambda: ["sample"])

    def test_drift_without_strict_does_not_fail(self, tmp_path, monkeypatch):
        self._setup_skill(
            tmp_path, monkeypatch,
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            "no path-style references here\n",
        )
        assert ld.main([]) == 0

    def test_drift_with_strict_fails(self, tmp_path, monkeypatch):
        self._setup_skill(
            tmp_path, monkeypatch,
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            "no path-style references here\n",
        )
        assert ld.main(["--strict"]) == 1

    def test_missing_meta_fails_even_without_strict(self, tmp_path, monkeypatch):
        self._setup_skill(tmp_path, monkeypatch, "", "irrelevant\n", has_meta=False)
        assert ld.main([]) == 1

    def test_no_drift_no_missing_meta_passes(self, tmp_path, monkeypatch):
        self._setup_skill(
            tmp_path, monkeypatch,
            "---\nskill: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| knowledge | process | consumes | x |\n",
            "../../../knowledge/process/\n",
        )
        assert ld.main([]) == 0
        assert ld.main(["--strict"]) == 0


class TestMainSmoke:
    def test_runs_against_the_real_repo_without_crashing(self):
        exit_code = ld.main([])
        assert exit_code in (0, 1)
