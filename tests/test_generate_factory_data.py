"""Tests for tools/generate_factory_data.py."""
import json
import sys
from pathlib import Path

import pytest

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import generate_factory_data as g  # noqa: E402


class TestReadFrontmatter:
    def test_parses_simple_fields(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(
            '---\nskill: sample\ncategory: "SAP Activate / Explore"\nsdlc-stage: in-progress\n---\n\n## Notes\n',
            encoding="utf-8",
        )
        fields = g.read_frontmatter(meta)
        assert fields["skill"] == "sample"
        assert fields["category"] == '"SAP Activate / Explore"'
        assert fields["sdlc-stage"] == "in-progress"

    def test_strips_inline_comments(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(
            "---\nskill: sample\nq-gate: [explore-realize]          # TEMP: some note\n---\n",
            encoding="utf-8",
        )
        fields = g.read_frontmatter(meta)
        assert fields["q-gate"] == "[explore-realize]"

    def test_no_frontmatter_returns_empty(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text("no frontmatter here\n", encoding="utf-8")
        assert g.read_frontmatter(meta) == {}


class TestParsePhaseFromCategory:
    def test_extracts_phase(self):
        fields = {"category": '"SAP Activate / Realize"'}
        assert g.parse_phase_from_category(fields) == "Realize"

    def test_missing_category_returns_none(self):
        assert g.parse_phase_from_category({}) is None


class TestComponentPhase:
    def test_connector_always_all(self):
        assert g.component_phase("Connector", "jira", {}, None) == "all"

    def test_qgate_always_all(self):
        assert g.component_phase("Q-gate", "explore-realize", {}, None) == "all"

    def test_skill_from_category(self):
        fields = {"category": '"SAP Activate / Explore"'}
        assert g.component_phase("Skill", "fit-to-standard", fields, None) == "Explore"

    def test_skill_no_category_defaults_all(self):
        assert g.component_phase("Skill", "x", {}, None) == "all"

    def test_artifact_single_producer_phase(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills" / "produces-it"
        skills_dir.mkdir(parents=True)
        (skills_dir / "skill.meta.md").write_text(
            '---\nskill: produces-it\ncategory: "SAP Activate / Discover"\n---\n', encoding="utf-8"
        )
        monkeypatch.setattr(g, "FACTORY_ROOT", tmp_path)

        artifact_meta = tmp_path / "artifact.meta.md"
        artifact_meta.write_text(
            "---\nartifact: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| skill | produces-it | produced-by | x |\n",
            encoding="utf-8",
        )
        assert g.component_phase("Artifact", "sample", {}, artifact_meta) == "Discover"

    def test_artifact_multiple_disagreeing_producers_is_all(self, tmp_path, monkeypatch):
        for skill_name, phase in (("a", "Explore"), ("b", "Deploy")):
            d = tmp_path / "skills" / skill_name
            d.mkdir(parents=True)
            (d / "skill.meta.md").write_text(
                f'---\nskill: {skill_name}\ncategory: "SAP Activate / {phase}"\n---\n', encoding="utf-8"
            )
        monkeypatch.setattr(g, "FACTORY_ROOT", tmp_path)

        artifact_meta = tmp_path / "artifact.meta.md"
        artifact_meta.write_text(
            "---\nartifact: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| skill | a | produced-by | x |\n"
            "| skill | b | produced-by | x |\n",
            encoding="utf-8",
        )
        assert g.component_phase("Artifact", "sample", {}, artifact_meta) == "all"

    def test_artifact_no_producer_rows_is_all(self, tmp_path):
        artifact_meta = tmp_path / "artifact.meta.md"
        artifact_meta.write_text(
            "---\nartifact: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| skill | x | related | not a producer |\n",
            encoding="utf-8",
        )
        assert g.component_phase("Artifact", "sample", {}, artifact_meta) == "all"

    def test_artifact_producer_missing_meta_file_is_all(self, tmp_path, monkeypatch):
        monkeypatch.setattr(g, "FACTORY_ROOT", tmp_path)
        artifact_meta = tmp_path / "artifact.meta.md"
        artifact_meta.write_text(
            "---\nartifact: sample\n---\n\n## Dependency graph\n"
            "| Type | Ref | Relation | Notes |\n|---|---|---|---|\n"
            "| skill | ghost-skill | produced-by | that skill has no skill.meta.md yet |\n",
            encoding="utf-8",
        )
        assert g.component_phase("Artifact", "sample", {}, artifact_meta) == "all"


class TestParsePattern:
    def test_single_value(self):
        assert g.parse_pattern("mcp") == "mcp"

    def test_list_value(self):
        assert g.parse_pattern("[mcp, script]") == ["mcp", "script"]


class TestDiffComponents:
    def test_no_diff_when_identical(self):
        current = [{"kind": "Skill", "name": "x", "posture": "own", "status": "ready", "phase": "Explore"}]
        generated = [dict(current[0])]
        assert g.diff_components(generated, current) == []

    def test_detects_new_and_missing(self):
        current = [{"kind": "Skill", "name": "old", "posture": "own", "status": "ready", "phase": "all"}]
        generated = [{"kind": "Skill", "name": "new", "posture": "own", "status": "ready", "phase": "all"}]
        diffs = g.diff_components(generated, current)
        assert any("new (in meta files" in d for d in diffs)
        assert any("missing (in factory-data.json" in d for d in diffs)

    def test_detects_field_change(self):
        current = [{"kind": "Skill", "name": "x", "posture": "own", "status": "notstarted", "phase": "all"}]
        generated = [{"kind": "Skill", "name": "x", "posture": "own", "status": "progress", "phase": "all"}]
        diffs = g.diff_components(generated, current)
        assert len(diffs) == 1
        assert "status" in diffs[0]


class TestMainSmoke:
    def test_check_runs_against_real_repo_without_crashing(self):
        exit_code = g.main(["--check"])
        assert exit_code in (0, 1)

    def test_default_run_never_writes_the_real_file(self):
        before = g.FACTORY_DATA_PATH.read_text(encoding="utf-8")
        g.main([])
        after = g.FACTORY_DATA_PATH.read_text(encoding="utf-8")
        assert before == after
