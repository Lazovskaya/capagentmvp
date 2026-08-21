"""Tests for tools/pilot_context.py and tools/unpack.py's context wiring."""
import json
import sys
from pathlib import Path

import pytest

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
import pilot_context as pc  # noqa: E402

FACTORY_ROOT = Path(__file__).resolve().parent.parent
EXAMPLE_CONTEXT = FACTORY_ROOT / "platform" / "pilot-context" / "context.example.json"


# ---------------------------------------------------------------------------
# resolve_abap_system
# ---------------------------------------------------------------------------

class TestResolveAbapSystem:
    def test_basic_auth_resolves_from_two_env_vars(self, monkeypatch):
        monkeypatch.setenv("MY_CRED_USERNAME", "u1")
        monkeypatch.setenv("MY_CRED_PASSWORD", "p1")
        system = {
            "systemId": "DR1", "host": "h.example.com", "client": "100",
            "ports": {"https": 44300}, "authType": "basic", "systemType": "onprem",
            "credentialRef": "MY_CRED",
        }
        destination, env = pc.resolve_abap_system(system)
        assert destination == "dr1"
        assert env["SAP_URL"] == "https://h.example.com:44300"
        assert env["SAP_CLIENT"] == "100"
        assert env["SAP_AUTH_TYPE"] == "basic"
        assert env["SAP_SYSTEM_TYPE"] == "onprem"
        assert env["SAP_USERNAME"] == "u1"
        assert env["SAP_PASSWORD"] == "p1"

    def test_basic_auth_missing_env_vars_dies(self, monkeypatch):
        monkeypatch.delenv("MY_CRED_USERNAME", raising=False)
        monkeypatch.delenv("MY_CRED_PASSWORD", raising=False)
        system = {
            "systemId": "DR1", "host": "h", "client": "100",
            "authType": "basic", "systemType": "onprem", "credentialRef": "MY_CRED",
        }
        with pytest.raises(SystemExit, match="MY_CRED_USERNAME.*MY_CRED_PASSWORD"):
            pc.resolve_abap_system(system)

    def test_jwt_auth_resolves_from_one_env_var(self, monkeypatch):
        monkeypatch.setenv("MY_JWT", "token123")
        system = {
            "systemId": "CL1", "host": "h", "client": "100",
            "authType": "jwt", "systemType": "cloud", "credentialRef": "MY_JWT",
        }
        destination, env = pc.resolve_abap_system(system)
        assert env["SAP_JWT_TOKEN"] == "token123"
        assert "SAP_USERNAME" not in env

    def test_jwt_auth_missing_env_var_dies(self, monkeypatch):
        monkeypatch.delenv("MISSING_JWT", raising=False)
        system = {
            "systemId": "CL1", "host": "h", "client": "100",
            "authType": "jwt", "systemType": "cloud", "credentialRef": "MISSING_JWT",
        }
        with pytest.raises(SystemExit, match="MISSING_JWT"):
            pc.resolve_abap_system(system)

    def test_unsupported_auth_type_dies(self):
        system = {
            "systemId": "X1", "host": "h", "client": "100",
            "authType": "oauth2", "systemType": "cloud", "credentialRef": "X",
        }
        with pytest.raises(SystemExit, match="oauth2"):
            pc.resolve_abap_system(system)

    def test_missing_system_type_dies(self):
        system = {
            "systemId": "X1", "host": "h", "client": "100",
            "authType": "basic", "credentialRef": "X",
        }
        with pytest.raises(SystemExit, match="systemType"):
            pc.resolve_abap_system(system)

    def test_no_https_port_omits_it_from_url(self, monkeypatch):
        monkeypatch.setenv("MY_CRED_USERNAME", "u")
        monkeypatch.setenv("MY_CRED_PASSWORD", "p")
        system = {
            "systemId": "DR1", "host": "h.example.com", "client": "100",
            "authType": "basic", "systemType": "onprem", "credentialRef": "MY_CRED",
        }
        _, env = pc.resolve_abap_system(system)
        assert env["SAP_URL"] == "https://h.example.com"


# ---------------------------------------------------------------------------
# write_env_file
# ---------------------------------------------------------------------------

class TestWriteEnvFile:
    def test_writes_key_value_lines(self, tmp_path):
        path = tmp_path / "sessions" / "dr1.env"
        pc.write_env_file(path, {"SAP_URL": "https://h", "SAP_CLIENT": "100"})
        content = path.read_text(encoding="utf-8")
        assert "SAP_URL=https://h\n" in content
        assert "SAP_CLIENT=100\n" in content

    def test_creates_parent_dirs(self, tmp_path):
        path = tmp_path / "a" / "b" / "c.env"
        pc.write_env_file(path, {"K": "V"})
        assert path.exists()


# ---------------------------------------------------------------------------
# resolve_context (against the real, redacted example)
# ---------------------------------------------------------------------------

class TestResolveContext:
    def test_check_mode_writes_nothing(self, tmp_path, monkeypatch):
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL_USERNAME", "u")
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL_PASSWORD", "p")
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_QA1_CREDENTIAL_USERNAME", "u")
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_QA1_CREDENTIAL_PASSWORD", "p")
        monkeypatch.setattr(pc.Path, "home", staticmethod(lambda: tmp_path))
        resolved, _ = pc.resolve_context(EXAMPLE_CONTEXT, check=True)
        assert resolved == [("DR1", "dr1"), ("QA1", "qa1")]
        assert not (tmp_path / ".config").exists()

    def test_full_run_writes_session_files(self, tmp_path, monkeypatch):
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL_USERNAME", "u")
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL_PASSWORD", "p")
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_QA1_CREDENTIAL_USERNAME", "u")
        monkeypatch.setenv("SAP_AI_FACTORY_PILOT_QA1_CREDENTIAL_PASSWORD", "p")
        monkeypatch.setattr(pc.Path, "home", staticmethod(lambda: tmp_path))
        resolved, _ = pc.resolve_context(EXAMPLE_CONTEXT, check=False)
        assert len(resolved) == 2
        dr1 = tmp_path / ".config" / "mcp-abap-adt" / "sessions" / "dr1.env"
        assert dr1.exists()
        assert "SAP_USERNAME=u" in dr1.read_text(encoding="utf-8")

    def test_missing_creds_dies_before_writing_any_file(self, tmp_path, monkeypatch):
        monkeypatch.delenv("SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL_USERNAME", raising=False)
        monkeypatch.delenv("SAP_AI_FACTORY_PILOT_DR1_CREDENTIAL_PASSWORD", raising=False)
        monkeypatch.setattr(pc.Path, "home", staticmethod(lambda: tmp_path))
        with pytest.raises(SystemExit):
            pc.resolve_context(EXAMPLE_CONTEXT, check=False)


# ---------------------------------------------------------------------------
# The example context itself must actually validate (guards against schema drift)
# ---------------------------------------------------------------------------

def test_example_context_validates_against_schema():
    jsonschema = pytest.importorskip("jsonschema")
    schema = json.loads(pc.CONTEXT_SCHEMA.read_text(encoding="utf-8"))
    data = json.loads(EXAMPLE_CONTEXT.read_text(encoding="utf-8"))
    jsonschema.validate(data, schema)


def test_example_context_systems_have_system_type():
    data = json.loads(EXAMPLE_CONTEXT.read_text(encoding="utf-8"))
    for system in data["sapSystems"]:
        assert "systemType" in system, f"{system['systemId']} missing systemType"
