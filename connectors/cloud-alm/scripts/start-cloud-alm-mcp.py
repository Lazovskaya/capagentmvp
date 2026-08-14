#!/usr/bin/env python3
"""Start SAP Cloud ALM MCP with an external credential profile."""
import argparse
import os
import re
import shutil
import sys
from pathlib import Path

DEFAULT_PROFILE = "default"
PROFILE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", default=os.environ.get("MCP_CLOUD_ALM_PROFILE", DEFAULT_PROFILE))
    parser.add_argument("--config", default=os.environ.get("MCP_CLOUD_ALM_CONFIG"))
    parser.add_argument("--binary", default=os.environ.get("MCP_CLOUD_ALM_BIN"))
    return parser.parse_known_args()


def profile_path(profile):
    if not PROFILE_NAME.fullmatch(profile):
        raise SystemExit("Invalid Cloud ALM profile name; use letters, numbers, '.', '_' or '-'.")
    return Path.home() / ".config" / "sap-cloud-alm-mcp" / "profiles" / f"{profile}.json"


def resolve_config(args):
    path = Path(args.config).expanduser() if args.config else profile_path(args.profile)
    if not path.is_file():
        print(f"Cloud ALM config profile not found: {path}", file=sys.stderr)
        print("Create it outside the repository or set MCP_CLOUD_ALM_CONFIG.", file=sys.stderr)
        raise SystemExit(1)
    return path


def resolve_binary(args):
    candidates = []
    if args.binary:
        candidates.append(Path(args.binary).expanduser())
    env_binary = os.environ.get("MCP_CLOUD_ALM_BIN")
    if env_binary:
        candidates.append(Path(env_binary).expanduser())
    found = shutil.which("sap-cloud-alm-mcp")
    if found:
        candidates.append(Path(found))

    for candidate in candidates:
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return candidate

    print("SAP Cloud ALM MCP binary not found.", file=sys.stderr)
    print("Build or install sap-cloud-alm-mcp, then set MCP_CLOUD_ALM_BIN.", file=sys.stderr)
    raise SystemExit(1)


def main():
    args, server_args = parse_args()
    config = resolve_config(args)
    binary = resolve_binary(args)
    command = [str(binary), "--config", str(config)]
    command.extend(server_args)
    os.execv(command[0], command)


if __name__ == "__main__":
    main()