"""Tests for tools/package_client_artifacts.py."""
import sys
import zipfile
from pathlib import Path

import pytest

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import package_client_artifacts as pca  # noqa: E402


class TestPackage:
    def test_packages_skill_connector_and_referenced_knowledge(self, tmp_path):
        skills, connectors, knowledge, artifacts = pca.package(
            ["fit-to-standard"], ["jira"], tmp_path
        )
        assert skills == ["fit-to-standard"]
        assert connectors == ["jira"]
        assert (tmp_path / "skills" / "fit-to-standard" / "SKILL.md").exists()
        assert (tmp_path / "connectors" / "jira" / "connector.md").exists()
        assert (tmp_path / "connectors" / "jira" / "server.json").exists()
        for bucket in knowledge:
            assert (tmp_path / "knowledge" / bucket).is_dir()
        for name in artifacts:
            assert (tmp_path / "artifacts" / name).is_dir()

    def test_output_excludes_meta_sidecars(self, tmp_path):
        # No real *.meta.md exists yet anywhere in the factory (EPMCSAPAI-291 not built), but
        # the ignore pattern itself must be wired -- verified directly instead.
        ignored = pca.common.META_SIDECAR_IGNORE(str(tmp_path), ["SKILL.md", "x.meta.md"])
        assert "x.meta.md" in ignored
        assert "SKILL.md" not in ignored


class TestMakeZip:
    def test_creates_zip_with_staged_contents(self, tmp_path):
        staged = tmp_path / "staged"
        staged.mkdir()
        (staged / "skills").mkdir()
        (staged / "skills" / "hello.txt").write_text("hi")

        archive = pca.make_zip(staged, tmp_path / "out" / "client-artifacts-acme")
        assert archive.exists()
        assert archive.suffix == ".zip"
        with zipfile.ZipFile(archive) as zf:
            names = zf.namelist()
        assert "skills/hello.txt" in names

    def test_strips_extra_zip_suffix(self, tmp_path):
        staged = tmp_path / "staged"
        staged.mkdir()
        archive = pca.make_zip(staged, tmp_path / "out" / "client-artifacts-acme.zip")
        assert archive.name == "client-artifacts-acme.zip"
        assert archive.exists()


class TestMainCli:
    def test_dry_run_writes_no_archive(self, tmp_path, capsys):
        pca.main([
            "--client-name", "acme", "--skills", "fit-to-standard", "--connectors", "",
            "--out-dir", str(tmp_path), "--dry-run",
        ])
        out = capsys.readouterr().out
        assert "Would package" in out
        assert "Dry run" in out
        assert not any(tmp_path.iterdir())

    def test_full_run_writes_archive_in_out_dir(self, tmp_path):
        pca.main([
            "--client-name", "acme", "--skills", "fit-to-standard", "--connectors", "",
            "--out-dir", str(tmp_path),
        ])
        assert (tmp_path / "client-artifacts-acme.zip").exists()

    def test_nothing_requested_dies(self):
        with pytest.raises(SystemExit, match="nothing requested"):
            pca.main(["--client-name", "acme"])

    def test_unknown_skill_dies_before_writing_anything(self, tmp_path):
        with pytest.raises(SystemExit, match="totally-fake"):
            pca.main([
                "--client-name", "acme", "--skills", "totally-fake",
                "--out-dir", str(tmp_path),
            ])
        assert not any(tmp_path.iterdir())
