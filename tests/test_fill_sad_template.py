"""Tests for tools/fill-brownfield-sad-template/scripts/fill_sad_template.py."""
import subprocess
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
SCRIPT = FACTORY_ROOT / "tools/fill-brownfield-sad-template/scripts/fill_sad_template.py"
REAL_TEMPLATE = FACTORY_ROOT / "artifacts/brownfield-sad/template.md"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
VALID_DECISIONS = FIXTURES / "sad-decisions-valid.json"
MISSING_KEY_DECISIONS = FIXTURES / "sad-decisions-missing-key.json"


def run_script(tmp_path, extra_args=(), decisions=None, template=None):
    """Helper: create minimal stub inputs and run the script. Returns CompletedProcess."""
    decisions = decisions or VALID_DECISIONS
    template = template or REAL_TEMPLATE

    adr_log = tmp_path / "adr-log.json"
    adr_log.write_text('{"entries": []}', encoding="utf-8")
    readiness = tmp_path / "readiness.md"
    readiness.write_text("# Readiness Assessment\nAll systems assessed.", encoding="utf-8")
    sizing = tmp_path / "sizing.md"
    sizing.write_text("# Sizing Recommendation\nSizing confirmed.", encoding="utf-8")
    scoping = tmp_path / "scoping.md"
    scoping.write_text("# Business Process Scope\nScope confirmed.", encoding="utf-8")
    out = tmp_path / "out.md"

    cmd = [
        sys.executable, str(SCRIPT),
        "--engagement-id", "test-engagement",
        "--readiness", str(readiness),
        "--sizing", str(sizing),
        "--scoping", str(scoping),
        "--adr-log", str(adr_log),
        "--decisions", str(decisions),
        "--template", str(template),
        "--out", str(out),
    ] + list(extra_args)

    return subprocess.run(cmd, capture_output=True, text=True), out


def test_happy_path(tmp_path):
    """Valid inputs: exit 0, output file created."""
    result, out = run_script(tmp_path)
    assert result.returncode == 0, result.stderr or result.stdout
    assert out.exists()
    content = out.read_text(encoding="utf-8")
    assert len(content.split()) > 500


def test_missing_required_decision_key(tmp_path):
    """Decisions JSON missing required keys: exit 1, message names the missing key."""
    result, _ = run_script(tmp_path, decisions=MISSING_KEY_DECISIONS)
    assert result.returncode != 0
    combined = (result.stderr + result.stdout).lower()
    assert "missing" in combined or "required" in combined


def test_missing_input_file(tmp_path):
    """A required input file that does not exist: exit 1."""
    adr_log = tmp_path / "adr-log.json"
    adr_log.write_text('{"entries": []}', encoding="utf-8")
    scoping = tmp_path / "scoping.md"
    scoping.write_text("# Scoping\n", encoding="utf-8")
    sizing = tmp_path / "sizing.md"
    sizing.write_text("# Sizing\n", encoding="utf-8")

    result = subprocess.run([
        sys.executable, str(SCRIPT),
        "--engagement-id", "test-engagement",
        "--readiness", str(tmp_path / "nonexistent.md"),
        "--sizing", str(sizing),
        "--scoping", str(scoping),
        "--adr-log", str(adr_log),
        "--decisions", str(VALID_DECISIONS),
        "--template", str(REAL_TEMPLATE),
        "--out", str(tmp_path / "out.md"),
    ], capture_output=True, text=True)
    assert result.returncode != 0
    combined = result.stderr + result.stdout
    assert "not found" in combined or "nonexistent" in combined


def test_word_count_too_low(tmp_path):
    """Template producing < 500 words after fill: exit 1 with word-count message."""
    tiny_template = tmp_path / "tiny.md"
    tiny_template.write_text("# SAD\nMinimal content.", encoding="utf-8")

    result, _ = run_script(tmp_path, template=tiny_template)
    assert result.returncode != 0
    combined = (result.stderr + result.stdout).lower()
    assert "word" in combined


def test_output_is_deterministic(tmp_path):
    """Running twice with the same inputs produces identical output."""
    result1, out1 = run_script(tmp_path)
    assert result1.returncode == 0
    content1 = out1.read_text(encoding="utf-8")

    tmp2 = tmp_path / "run2"
    tmp2.mkdir()
    result2, out2 = run_script(tmp2)
    assert result2.returncode == 0
    content2 = out2.read_text(encoding="utf-8")

    # Ignore generated_at line (contains today's date) and engagement_id — both are stable
    lines1 = [l for l in content1.splitlines() if "Generated:" not in l]
    lines2 = [l for l in content2.splitlines() if "Generated:" not in l]
    assert lines1 == lines2
