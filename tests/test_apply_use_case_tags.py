"""Tests for tools/apply_use_case_tags.py."""
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import apply_use_case_tags as uc  # noqa: E402


SKILL_META = """---
skill: sample
title: Sample skill
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress
target-role: [functional]
engagement: [G, B]

distribution-class: client-shippable
---
"""

AGENT_META = """---
agent: sample
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress

distribution-class: client-shippable
---
"""


class TestFormatUseCaseLine:
    def test_single_title(self):
        assert uc.format_use_case_line(["Defect triage"]) == 'use-case: ["Defect triage"]'

    def test_multiple_titles(self):
        line = uc.format_use_case_line(["Defect triage", "Hypercare & incident triage"])
        assert line == 'use-case: ["Defect triage", "Hypercare & incident triage"]'


class TestBuildUseCaseMap:
    def test_merges_skill_and_agent_uses_across_activities(self, tmp_path, monkeypatch):
        data_path = tmp_path / "factory-data.json"
        data_path.write_text(
            '{"activities": ['
            '{"title": "A1", "uses": [["skill", ["s1", "s2"]], ["agent", ["a1"]]]},'
            '{"title": "A2", "uses": [["skill", ["s1"]], ["mcp", ["jira"]]]}'
            "]}",
            encoding="utf-8",
        )
        monkeypatch.setattr(uc.common, "FACTORY_DATA_JSON", data_path)
        skill_map, agent_map = uc.build_use_case_map()
        assert skill_map["s1"] == ["A1", "A2"]
        assert skill_map["s2"] == ["A1"]
        assert agent_map["a1"] == ["A1"]
        assert "jira" not in skill_map and "jira" not in agent_map

    def test_no_duplicate_title_if_listed_twice(self, tmp_path, monkeypatch):
        data_path = tmp_path / "factory-data.json"
        data_path.write_text(
            '{"activities": ['
            '{"title": "A1", "uses": [["skill", ["s1"]]]},'
            '{"title": "A1", "uses": [["skill", ["s1"]]]}'
            "]}",
            encoding="utf-8",
        )
        monkeypatch.setattr(uc.common, "FACTORY_DATA_JSON", data_path)
        skill_map, _ = uc.build_use_case_map()
        assert skill_map["s1"] == ["A1"]


class TestApplyToFile:
    def test_inserts_after_engagement_when_present(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(SKILL_META, encoding="utf-8")
        status = uc.apply_to_file(meta, ["Fit-to-standard workshops"], check=False)
        assert status == "added"
        text = meta.read_text(encoding="utf-8")
        lines = text.splitlines()
        engagement_idx = next(i for i, l in enumerate(lines) if l.startswith("engagement:"))
        assert lines[engagement_idx + 1] == 'use-case: ["Fit-to-standard workshops"]'

    def test_inserts_after_sdlc_stage_when_no_engagement(self, tmp_path):
        meta = tmp_path / "agent.meta.md"
        meta.write_text(AGENT_META, encoding="utf-8")
        status = uc.apply_to_file(meta, ["Defect triage"], check=False)
        assert status == "added"
        text = meta.read_text(encoding="utf-8")
        lines = text.splitlines()
        sdlc_idx = next(i for i, l in enumerate(lines) if l.startswith("sdlc-stage:"))
        assert lines[sdlc_idx + 1] == 'use-case: ["Defect triage"]'

    def test_check_mode_does_not_write(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(SKILL_META, encoding="utf-8")
        status = uc.apply_to_file(meta, ["X"], check=True)
        assert status == "added"
        assert "use-case:" not in meta.read_text(encoding="utf-8")

    def test_updates_existing_use_case_line(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(SKILL_META.replace(
            "engagement: [G, B]\n", 'engagement: [G, B]\nuse-case: ["Old title"]\n'
        ), encoding="utf-8")
        status = uc.apply_to_file(meta, ["New title"], check=False)
        assert status == "updated"
        text = meta.read_text(encoding="utf-8")
        assert 'use-case: ["New title"]' in text
        assert "Old title" not in text

    def test_unchanged_when_already_correct(self, tmp_path):
        meta = tmp_path / "skill.meta.md"
        meta.write_text(SKILL_META.replace(
            "engagement: [G, B]\n", 'engagement: [G, B]\nuse-case: ["Same"]\n'
        ), encoding="utf-8")
        status = uc.apply_to_file(meta, ["Same"], check=False)
        assert status == "unchanged"

    def test_no_anchor_returns_none(self, tmp_path):
        meta = tmp_path / "weird.meta.md"
        meta.write_text("---\nskill: sample\n---\n", encoding="utf-8")
        assert uc.apply_to_file(meta, ["X"], check=False) is None


class TestMainSmoke:
    def test_check_runs_against_the_real_repo_without_crashing(self, capsys):
        uc.main(["--check"])
        out = capsys.readouterr().out
        assert "use-case" in out.lower()
