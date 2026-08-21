#!/usr/bin/env python3
"""Resolve a pilot infrastructure/client context file (P4, EPMCSAPAI-294) into per-connector
credential session files, the same shape a consultant would otherwise create by hand following
each connector's own "Wiring" section.

Usage:
    python3 tools/pilot_context.py --context platform/pilot-context/pilot-<id>.context.json [--check]

Validates the context file against platform/pilot-context/schema.json (if the `jsonschema`
package is installed; skipped with a warning otherwise -- this stays optional so the rest of
this factory's tooling doesn't gain a hard third-party dependency for one script). For each
`sapSystems[]` entry, resolves its `credentialRef` from the current process environment and
writes `abap-mcp`'s session env file for it -- never prints or logs the resolved secret values.

Only `abap-mcp` is wired today, since `sapSystems[]` is the only system-shaped block the schema
defines; `btp` isn't consumed by any connector yet. See "authType and systemType" in
platform/pilot-context/README.md for the credentialRef convention this assumes for `basic` auth
(two env vars, `<credentialRef>_USERNAME` / `<credentialRef>_PASSWORD`) -- not part of the P4
schema itself, a convention this resolver documents and owns.
"""
import argparse
import json
import os
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
CONTEXT_SCHEMA = FACTORY_ROOT / "platform" / "pilot-context" / "schema.json"

# Matches connectors/abap-mcp/server.json's destinationEnvFile.variables choices.
ABAP_MCP_AUTH_TYPES = {"basic", "jwt", "xsuaa"}


def die(msg):
    raise SystemExit(f"error: {msg}")


def load_context(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    try:
        import jsonschema
    except ImportError:
        print("warning: jsonschema not installed, skipping schema validation", file=sys.stderr)
        return data
    schema = json.loads(CONTEXT_SCHEMA.read_text(encoding="utf-8"))
    jsonschema.validate(data, schema)
    return data


def abap_mcp_session_path(destination):
    if os.name == "nt":
        return Path(os.environ["USERPROFILE"]) / "Documents" / "mcp-abap-adt" / "sessions" / f"{destination}.env"
    return Path.home() / ".config" / "mcp-abap-adt" / "sessions" / f"{destination}.env"


def resolve_abap_system(system):
    """Returns (destination, env_dict) for one sapSystems[] entry, or dies with a clear error
    naming the missing env var if credentialRef doesn't resolve. Never returns partial env."""
    system_id = system["systemId"]
    destination = system_id.lower()
    auth_type = system["authType"]
    if auth_type not in ABAP_MCP_AUTH_TYPES:
        die(
            f"system '{system_id}': authType '{auth_type}' isn't supported by abap-mcp "
            f"(supports {sorted(ABAP_MCP_AUTH_TYPES)}) -- this system can't be wired to abap-mcp"
        )
    system_type = system.get("systemType")
    if not system_type:
        die(f"system '{system_id}': no systemType set -- required to resolve abap-mcp's SAP_SYSTEM_TYPE")

    host = system["host"]
    https_port = system.get("ports", {}).get("https")
    url = f"https://{host}:{https_port}" if https_port else f"https://{host}"

    env = {
        "SAP_URL": url,
        "SAP_CLIENT": system["client"],
        "SAP_AUTH_TYPE": auth_type,
        "SAP_SYSTEM_TYPE": system_type,
    }

    credential_ref = system["credentialRef"]
    if auth_type == "basic":
        username_var, password_var = f"{credential_ref}_USERNAME", f"{credential_ref}_PASSWORD"
        username, password = os.environ.get(username_var), os.environ.get(password_var)
        missing = [v for v, val in ((username_var, username), (password_var, password)) if not val]
        if missing:
            die(f"system '{system_id}': missing env var(s) {', '.join(missing)} for basic auth")
        env["SAP_USERNAME"], env["SAP_PASSWORD"] = username, password
    else:  # jwt, xsuaa
        token = os.environ.get(credential_ref)
        if not token:
            die(f"system '{system_id}': missing env var '{credential_ref}' for {auth_type} auth")
        env["SAP_JWT_TOKEN"] = token

    return destination, env


def write_env_file(path, env):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(f"{k}={v}\n" for k, v in env.items()), encoding="utf-8")
    try:
        path.chmod(0o600)
    except (NotImplementedError, OSError):
        pass  # chmod is a no-op/unsupported on some Windows filesystems; not fatal.


def resolve_context(context_path, check=False):
    """Resolves every sapSystems[] entry in the context file. Returns the list of
    (systemId, destination) pairs resolved. With check=True, verifies credentials resolve
    without writing any file (a dry run)."""
    data = load_context(context_path)
    resolved = []
    for system in data.get("sapSystems", []):
        destination, env = resolve_abap_system(system)
        if not check:
            write_env_file(abap_mcp_session_path(destination), env)
        resolved.append((system["systemId"], destination))
    return resolved, data


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--context", required=True, help="path to a pilot *.context.json file")
    parser.add_argument("--check", action="store_true", help="verify credentials resolve, write nothing")
    args = parser.parse_args(argv)

    resolved, _ = resolve_context(args.context, check=args.check)
    if args.check:
        print(f"Would resolve {len(resolved)} system(s): " + ", ".join(f"{sid}->{dest}" for sid, dest in resolved))
    else:
        print(f"Resolved {len(resolved)} system(s): " + ", ".join(f"{sid}->{dest}" for sid, dest in resolved))


if __name__ == "__main__":
    main()
