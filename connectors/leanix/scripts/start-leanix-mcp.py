#!/usr/bin/env python3
"""Start the SAP LeanIX MCP OAuth bridge for an external workspace profile."""
import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

DEFAULT_PROFILE = "default"
PROFILE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", default=os.environ.get("MCP_LEANIX_PROFILE", DEFAULT_PROFILE))
    parser.add_argument("--config", default=os.environ.get("MCP_LEANIX_CONFIG"))
    parser.add_argument("--endpoint", default=os.environ.get("MCP_LEANIX_ENDPOINT"))
    return parser.parse_args()


def profile_path(profile):
    if not PROFILE_NAME.fullmatch(profile):
        raise SystemExit("Invalid LeanIX profile name; use letters, numbers, '.', '_' or '-'.")
    return Path.home() / ".config" / "sap-leanix-mcp" / "profiles" / f"{profile}.json"


def load_profile(args):
    path = Path(args.config).expanduser() if args.config else profile_path(args.profile)
    if not path.is_file():
        print(f"LeanIX config profile not found: {path}", file=sys.stderr)
        print("Create it outside the repository or set MCP_LEANIX_CONFIG.", file=sys.stderr)
        raise SystemExit(1)
    try:
        profile = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        print(f"Invalid LeanIX profile JSON: {path}: {error}", file=sys.stderr)
        raise SystemExit(1) from error
    return profile


def endpoint_from_profile(args, profile):
    if args.endpoint:
        return args.endpoint
    subdomain = profile.get("subdomain")
    workspace = profile.get("workspace")
    if not subdomain or not workspace:
        print("LeanIX profile must contain subdomain and workspace.", file=sys.stderr)
        raise SystemExit(1)
    return (
        "https://mcp.leanix.net/services/mcp-server/v1/mcp/"
        f"instance/{subdomain}/workspace/{workspace}"
    )


def main():
    args = parse_args()
    profile = load_profile(args)
    endpoint = endpoint_from_profile(args, profile)
    npx = shutil.which("npx")
    if not npx:
        print("npx is required but was not found in PATH.", file=sys.stderr)
        raise SystemExit(1)
    os.execvpe(npx, [npx, "-y", "mcp-remote", endpoint], os.environ.copy())


if __name__ == "__main__":
    main()