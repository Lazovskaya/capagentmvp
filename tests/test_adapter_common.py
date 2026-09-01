"""Tests for tools/adapter_common.py."""
import importlib
import json
import sys
from pathlib import Path

import pytest

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import adapter_common as ac


# ---------------------------------------------------------------------------
# translate_env_placeholders
# ---------------------------------------------------------------------------

class TestTranslateEnvPlaceholders:
    def test_claude_code_single_var(self):
        assert ac.translate_env_placeholders("${MY_VAR}", "claude-code") == "${MY_VAR}"

    def test_cursor_translates_to_env_syntax(self):
        assert ac.translate_env_placeholders("${MY_VAR}", "cursor") == "${env:MY_VAR}"

    def test_github_copilot_translates(self):
        assert ac.translate_env_placeholders("${TOKEN}", "github-copilot") == "${env:TOKEN}"

    def test_multiple_vars_in_one_string(self):
        result = ac.translate_env_placeholders("${A} and ${B}", "cursor")
        assert result == "${env:A} and ${env:B}"

    def test_unknown_tool_is_noop(self):
        val = "${SOME_VAR}"
        assert ac.translate_env_placeholders(val, "unknown-tool") == val

    def test_non_string_value_is_noop(self):
        assert ac.translate_env_placeholders(42, "cursor") == 42
        assert ac.translate_env_placeholders(None, "cursor") is None
        assert ac.translate_env_placeholders(["${X}"], "cursor") == ["${X}"]

    def test_no_placeholders_unchanged(self):
        assert ac.translate_env_placeholders("plain string", "cursor") == "plain string"

    def test_partial_placeholder_not_matched(self):
        assert ac.translate_env_placeholders("${123_BAD}", "cursor") == "${123_BAD}"

    def test_underscore_and_digits_in_var_name(self):
        assert ac.translate_env_placeholders("${MY_VAR_2}", "cursor") == "${env:MY_VAR_2}"


# ---------------------------------------------------------------------------
# parse_names
# ---------------------------------------------------------------------------

class TestParseNames:
    def test_empty_string_returns_empty(self):
        assert ac.parse_names("") == []

    def test_none_returns_empty(self):
        assert ac.parse_names(None) == []

    def test_single_name(self):
        assert ac.parse_names("foo") == ["foo"]

    def test_csv(self):
        assert ac.parse_names("foo,bar,baz") == ["foo", "bar", "baz"]

    def test_whitespace_around_tokens(self):
        assert ac.parse_names(" foo , bar ") == ["foo", "bar"]

    def test_star_sentinel_preserved(self):
        assert ac.parse_names("*") == ["*"]

    def test_star_in_csv_preserved(self):
        assert ac.parse_names("foo,*") == ["foo", "*"]

    def test_empty_tokens_between_commas_skipped(self):
        assert ac.parse_names("foo,,bar") == ["foo", "bar"]

    def test_whitespace_only_tokens_skipped(self):
        assert ac.parse_names("foo, ,bar") == ["foo", "bar"]


# ---------------------------------------------------------------------------
# resolve_names
# ---------------------------------------------------------------------------

class TestResolveNames:
    def test_star_returns_all_available(self):
        available = ["a", "b", "c"]
        result = ac.resolve_names(["*"], available, "skill", "hint")
        assert result == available

    def test_deduplication(self):
        result = ac.resolve_names(["a", "a", "b"], ["a", "b", "c"], "skill", "hint")
        assert result == ["a", "b"]

    def test_order_preserved(self):
        result = ac.resolve_names(["b", "a"], ["a", "b"], "skill", "hint")
        assert result == ["b", "a"]

    def test_unknown_skill_no_index_yaml(self, tmp_path, monkeypatch):
        monkeypatch.setattr(ac, "SKILLS_DIR", tmp_path / "skills")
        (tmp_path / "skills").mkdir()
        with pytest.raises(SystemExit, match="unknown skill"):
            ac.resolve_names(["ghost"], [], "skill", "myhint")

    def test_unknown_skill_in_index_yaml_shows_adopt_hint(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills"
        skills_dir.mkdir()
        (skills_dir / "index.yaml").write_text("- adopt-skill\n")
        monkeypatch.setattr(ac, "SKILLS_DIR", skills_dir)
        with pytest.raises(SystemExit, match="adopt-posture"):
            ac.resolve_names(["adopt-skill"], [], "skill", "myhint")

    def test_unknown_connector_no_server_json(self, tmp_path, monkeypatch):
        connectors_dir = tmp_path / "connectors"
        connectors_dir.mkdir()
        monkeypatch.setattr(ac, "CONNECTORS_DIR", connectors_dir)
        with pytest.raises(SystemExit, match="No connectors/ghost/server.json"):
            ac.resolve_names(["ghost"], [], "connector", "hint")

    def test_unknown_connector_with_stub_server_json(self, tmp_path, monkeypatch):
        connectors_dir = tmp_path / "connectors"
        (connectors_dir / "stubcon").mkdir(parents=True)
        (connectors_dir / "stubcon" / "server.json").write_text("{}")
        monkeypatch.setattr(ac, "CONNECTORS_DIR", connectors_dir)
        with pytest.raises(SystemExit, match="no real wiring yet"):
            ac.resolve_names(["stubcon"], [], "connector", "hint")

    def test_valid_subset_returned(self):
        result = ac.resolve_names(["a", "c"], ["a", "b", "c"], "skill", "hint")
        assert result == ["a", "c"]

    def test_unknown_agent_no_agent_md(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        agents_dir.mkdir()
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        with pytest.raises(SystemExit, match="No agents/ghost/agent.md found"):
            ac.resolve_names(["ghost"], [], "agent", "hint")


# ---------------------------------------------------------------------------
# agents
# ---------------------------------------------------------------------------

class TestAllOwnAgentNames:
    def test_discovers_agents_with_agent_md(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        (agents_dir / "b-agent").mkdir(parents=True)
        (agents_dir / "b-agent" / "agent.md").write_text("# b-agent\n")
        (agents_dir / "a-agent").mkdir(parents=True)
        (agents_dir / "a-agent" / "agent.md").write_text("# a-agent\n")
        (agents_dir / "no-agent-md").mkdir(parents=True)
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        assert ac.all_own_agent_names() == ["a-agent", "b-agent"]


class TestAgentOutputBytes:
    def test_synthesizes_frontmatter_with_name_and_desc(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        (agents_dir / "sample").mkdir(parents=True)
        (agents_dir / "sample" / "agent.md").write_text("# sample\n\nBody text.\n")
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        monkeypatch.setattr(ac, "component_desc", lambda kind, name: "A simple description.")

        output = ac.agent_output_bytes("sample").decode("utf-8")
        assert output.startswith("---\nname: sample\ndescription: \"A simple description.\"\n---\n\n")
        assert output.endswith("# sample\n\nBody text.\n")

    def test_escapes_colon_containing_desc(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        (agents_dir / "sample").mkdir(parents=True)
        (agents_dir / "sample" / "agent.md").write_text("# sample\n")
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        monkeypatch.setattr(ac, "component_desc", lambda kind, name: "Quality: checks completeness.")

        output = ac.agent_output_bytes("sample").decode("utf-8")
        # The colon-bearing desc must stay inside the quotes, not break out into a second key.
        assert 'description: "Quality: checks completeness."' in output
        assert output.count("---") == 2  # frontmatter fence still intact, not corrupted

    def test_escapes_embedded_quotes(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        (agents_dir / "sample").mkdir(parents=True)
        (agents_dir / "sample" / "agent.md").write_text("# sample\n")
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        monkeypatch.setattr(ac, "component_desc", lambda kind, name: 'Says "hello" to the user.')

        output = ac.agent_output_bytes("sample").decode("utf-8")
        assert 'description: "Says \\"hello\\" to the user."' in output

    def test_falls_back_when_no_desc_recorded(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        (agents_dir / "sample").mkdir(parents=True)
        (agents_dir / "sample" / "agent.md").write_text("# sample\n")
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        monkeypatch.setattr(ac, "component_desc", lambda kind, name: None)

        output = ac.agent_output_bytes("sample").decode("utf-8")
        assert 'description: "Bounded agent: sample"' in output


class TestCopyAgent:
    def test_writes_output_bytes_to_dest_path(self, tmp_path, monkeypatch):
        agents_dir = tmp_path / "agents"
        (agents_dir / "sample").mkdir(parents=True)
        (agents_dir / "sample" / "agent.md").write_text("# sample\n\nBody.\n")
        monkeypatch.setattr(ac, "AGENTS_DIR", agents_dir)
        monkeypatch.setattr(ac, "component_desc", lambda kind, name: "d")

        dest = tmp_path / "project" / ".claude" / "agents" / "sample.md"
        result = ac.copy_agent("sample", dest)
        assert result == dest
        assert dest.exists()
        assert dest.read_bytes() == ac.agent_output_bytes("sample")


# ---------------------------------------------------------------------------
# normalize_connector
# ---------------------------------------------------------------------------

class TestNormalizeConnector:
    def _write_connector(self, tmp_path, name, data):
        d = tmp_path / "connectors" / name
        d.mkdir(parents=True)
        (d / "server.json").write_text(json.dumps(data))
        return d

    def test_mcpconfig_shape(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "mymcp", {
            "mcpConfig": {"mymcp": {"command": "npx", "args": ["-y", "pkg", "--env=<destination>"]}}
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, dest = ac.normalize_connector("mymcp", {"mymcp": "prod"})
        assert result["mymcp"]["command"] == "npx"
        assert "--env=prod" in result["mymcp"]["args"]
        assert dest == "prod"

    def test_name_keyed_shape(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "jiralike", {
            "jiralike": {"type": "stdio", "command": "python3", "args": ["./script.py"]}
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, _ = ac.normalize_connector("jiralike", {})
        assert result["jiralike"]["command"] == "python3"

    def test_flat_shape(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "flat", {
            "command": "npx", "args": ["some-pkg"]
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, _ = ac.normalize_connector("flat", {})
        assert result["flat"]["command"] == "npx"

    def test_todo_command_raises(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "stub", {"command": "TODO", "args": []})
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        with pytest.raises(SystemExit, match="no real wiring yet"):
            ac.normalize_connector("stub", {})

    def test_documentation_keys_stripped(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "clean", {
            "mcpConfig": {"clean": {"command": "run", "args": [], "note": "docs only", "description": "also docs"}}
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, _ = ac.normalize_connector("clean", {})
        assert "note" not in result["clean"]
        assert "description" not in result["clean"]

    def test_type_defaults_to_stdio(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "notype", {
            "mcpConfig": {"notype": {"command": "run", "args": []}}
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, _ = ac.normalize_connector("notype", {})
        assert result["notype"]["type"] == "stdio"

    def test_env_vars_translated_per_tool(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "envcon", {
            "mcpConfig": {"envcon": {"command": "run", "args": [], "env": {"MY_VAR": "${MY_VAR}"}}}
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, _ = ac.normalize_connector("envcon", {}, tool="cursor")
        assert result["envcon"]["env"]["MY_VAR"] == "${env:MY_VAR}"

    def test_destination_default_is_default(self, tmp_path, monkeypatch):
        self._write_connector(tmp_path, "dest", {
            "mcpConfig": {"dest": {"command": "cmd", "args": ["--env=<destination>"]}}
        })
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        result, _, dest = ac.normalize_connector("dest", {})
        assert dest == "default"
        assert "--env=default" in result["dest"]["args"]

    def test_missing_server_json_raises(self, tmp_path, monkeypatch):
        (tmp_path / "connectors" / "ghost").mkdir(parents=True)
        monkeypatch.setattr(ac, "CONNECTORS_DIR", tmp_path / "connectors")
        with pytest.raises(SystemExit, match="not found"):
            ac.normalize_connector("ghost", {})


# ---------------------------------------------------------------------------
# hash_tree
# ---------------------------------------------------------------------------

class TestHashTree:
    def test_deterministic(self, tmp_path):
        (tmp_path / "a.txt").write_text("hello")
        (tmp_path / "b.txt").write_text("world")
        assert ac.hash_tree(tmp_path) == ac.hash_tree(tmp_path)

    def test_changes_on_content_change(self, tmp_path):
        f = tmp_path / "file.txt"
        f.write_text("v1")
        h1 = ac.hash_tree(tmp_path)
        f.write_text("v2")
        assert ac.hash_tree(tmp_path) != h1

    def test_changes_on_new_file(self, tmp_path):
        (tmp_path / "a.txt").write_text("x")
        h1 = ac.hash_tree(tmp_path)
        (tmp_path / "b.txt").write_text("y")
        assert ac.hash_tree(tmp_path) != h1

    def test_prefixed_with_sha256(self, tmp_path):
        (tmp_path / "f.txt").write_text("data")
        assert ac.hash_tree(tmp_path).startswith("sha256:")

    def test_two_trees_same_content_same_hash(self, tmp_path):
        a = tmp_path / "a"
        b = tmp_path / "b"
        for d in (a, b):
            d.mkdir()
            (d / "file.txt").write_text("same")
        assert ac.hash_tree(a) == ac.hash_tree(b)


# ---------------------------------------------------------------------------
# seed_reference_dir
# ---------------------------------------------------------------------------

class TestSeedReferenceDir:
    def test_copies_when_dest_missing(self, tmp_path):
        src = tmp_path / "src"
        src.mkdir()
        (src / "file.txt").write_text("content")
        dest = tmp_path / "dest"
        result = ac.seed_reference_dir(src, dest)
        assert result is True
        assert (dest / "file.txt").read_text() == "content"

    def test_noop_when_dest_exists(self, tmp_path):
        src = tmp_path / "src"
        src.mkdir()
        (src / "file.txt").write_text("new content")
        dest = tmp_path / "dest"
        dest.mkdir()
        (dest / "file.txt").write_text("original")
        result = ac.seed_reference_dir(src, dest)
        assert result is False
        assert (dest / "file.txt").read_text() == "original"

    def test_creates_parent_dirs(self, tmp_path):
        src = tmp_path / "src"
        src.mkdir()
        (src / "x.txt").write_text("x")
        dest = tmp_path / "deep" / "nested" / "dest"
        ac.seed_reference_dir(src, dest)
        assert dest.exists()


# ---------------------------------------------------------------------------
# load_lock / write_lock
# ---------------------------------------------------------------------------

class TestLock:
    def test_load_lock_missing_file_returns_defaults(self, tmp_path):
        lock = ac.load_lock(tmp_path)
        assert lock == {"skills": {}, "agents": {}, "connectors": {}, "knowledge": {}, "artifacts": {}}

    def test_load_lock_existing_file_preserved(self, tmp_path):
        (tmp_path / "factory-lock.json").write_text(
            json.dumps({"skills": {"foo": "sha256:abc"}, "connectors": {}, "knowledge": {}, "artifacts": {}})
        )
        lock = ac.load_lock(tmp_path)
        assert lock["skills"] == {"foo": "sha256:abc"}

    def test_load_lock_fills_missing_sections(self, tmp_path):
        (tmp_path / "factory-lock.json").write_text(json.dumps({"skills": {"x": "y"}}))
        lock = ac.load_lock(tmp_path)
        assert "connectors" in lock
        assert "knowledge" in lock
        assert "artifacts" in lock

    def test_write_lock_sets_required_fields(self, tmp_path):
        lock = {"skills": {}, "connectors": {}, "knowledge": {}, "artifacts": {}}
        ac.write_lock(tmp_path, lock, "1.2.3", "claude-code")
        written = json.loads((tmp_path / "factory-lock.json").read_text())
        assert written["factoryVersion"] == "1.2.3"
        assert written["tool"] == "claude-code"
        assert "generatedAt" in written
        assert written["generatedBy"] == "tools/claude-code/adapter/install.py"

    def test_write_lock_roundtrip(self, tmp_path):
        lock = {"skills": {"s": "h"}, "connectors": {}, "knowledge": {}, "artifacts": {}}
        ac.write_lock(tmp_path, lock, "0.1", "cursor")
        loaded = ac.load_lock(tmp_path)
        assert loaded["skills"] == {"s": "h"}


# ---------------------------------------------------------------------------
# find_activity
# ---------------------------------------------------------------------------

class TestFindActivity:
    @pytest.fixture
    def patched_data(self, tmp_path, monkeypatch):
        data = {
            "activities": [
                {"title": "Readiness Analysis", "file": "activities/discover/readiness-analysis.md", "uses": []},
                {"title": "Workshop Prep",       "file": "activities/explore/workshop-prep.md",       "uses": []},
                {"title": "Fit-Gap Analysis",    "file": "activities/explore/fit-gap.md",             "uses": []},
            ]
        }
        p = tmp_path / "factory-data.json"
        p.write_text(json.dumps(data))
        monkeypatch.setattr(ac, "FACTORY_DATA_JSON", p)
        return data["activities"]

    def test_exact_title_match_case_insensitive(self, patched_data):
        a = ac.find_activity("readiness analysis")
        assert a["title"] == "Readiness Analysis"

    def test_file_stem_match(self, patched_data):
        a = ac.find_activity("workshop-prep")
        assert a["title"] == "Workshop Prep"

    def test_full_file_path_match(self, patched_data):
        a = ac.find_activity("activities/explore/fit-gap.md")
        assert a["title"] == "Fit-Gap Analysis"

    def test_substring_match_unique(self, patched_data):
        a = ac.find_activity("Readiness")
        assert a["title"] == "Readiness Analysis"

    def test_ambiguous_substring_raises(self, patched_data):
        with pytest.raises(SystemExit, match="matches multiple"):
            ac.find_activity("a")  # matches all three titles

    def test_no_match_raises_with_known_list(self, patched_data):
        with pytest.raises(SystemExit, match="no activity matches"):
            ac.find_activity("nonexistent-activity-xyz")


# ---------------------------------------------------------------------------
# activity_uses
# ---------------------------------------------------------------------------

class TestActivityUses:
    def _act(self, uses):
        return {"uses": uses}

    def test_extracts_skill_names(self):
        a = self._act([["skill", ["foo", "bar"]], ["mcp", ["conn1"]]])
        assert ac.activity_uses(a, "skill") == ["foo", "bar"]

    def test_extracts_mcp_names(self):
        a = self._act([["skill", ["foo"]], ["mcp", ["c1", "c2"]]])
        assert ac.activity_uses(a, "mcp") == ["c1", "c2"]

    def test_deduplication_across_entries(self):
        a = self._act([["skill", ["foo", "bar"]], ["skill", ["bar", "baz"]]])
        assert ac.activity_uses(a, "skill") == ["foo", "bar", "baz"]

    def test_empty_uses(self):
        assert ac.activity_uses({"uses": []}, "skill") == []

    def test_missing_uses_key(self):
        assert ac.activity_uses({}, "skill") == []

    def test_wrong_kind_ignored(self):
        a = self._act([["agent", ["an-agent"]]])
        assert ac.activity_uses(a, "skill") == []


# ---------------------------------------------------------------------------
# referenced_names
# ---------------------------------------------------------------------------

class TestReferencedNames:
    def test_finds_knowledge_references(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills"
        skill = skills_dir / "my-skill"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text(
            "Uses ../../../knowledge/clean-core and ../../../knowledge/testing"
        )
        monkeypatch.setattr(ac, "SKILLS_DIR", skills_dir)
        result = ac.referenced_names(["my-skill"], "knowledge")
        assert result == ["clean-core", "testing"]

    def test_finds_artifact_references(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills"
        skill = skills_dir / "my-skill"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("See ../../../artifacts/fit-gap-report")
        monkeypatch.setattr(ac, "SKILLS_DIR", skills_dir)
        result = ac.referenced_names(["my-skill"], "artifacts")
        assert result == ["fit-gap-report"]

    def test_deduplication_across_skills(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills"
        for name in ("s1", "s2"):
            d = skills_dir / name
            d.mkdir(parents=True)
            (d / "SKILL.md").write_text("../../../knowledge/shared-bucket")
        monkeypatch.setattr(ac, "SKILLS_DIR", skills_dir)
        result = ac.referenced_names(["s1", "s2"], "knowledge")
        assert result == ["shared-bucket"]

    def test_missing_skill_md_skipped(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills"
        skills_dir.mkdir()
        monkeypatch.setattr(ac, "SKILLS_DIR", skills_dir)
        result = ac.referenced_names(["no-such-skill"], "knowledge")
        assert result == []

    def test_no_references_returns_empty(self, tmp_path, monkeypatch):
        skills_dir = tmp_path / "skills"
        skill = skills_dir / "plain"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("No references here at all.")
        monkeypatch.setattr(ac, "SKILLS_DIR", skills_dir)
        assert ac.referenced_names(["plain"], "knowledge") == []
