#!/usr/bin/env python3
"""Cross-platform Confluence launcher for the project MCP config.

Credentials live in a .env file outside the project directory (never in this repo, never in
.mcp.json), at ~/.config/mcp-atlassian/sessions/<destination>.env on every OS.

Supports both Confluence Cloud and Confluence Server / Data Center:
  - Cloud:     CONFLUENCE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN
  - Server/DC: CONFLUENCE_URL, CONFLUENCE_PERSONAL_TOKEN

Detection is automatic: if CONFLUENCE_PERSONAL_TOKEN is present, Server/DC mode is used and
CONFLUENCE_USERNAME + CONFLUENCE_API_TOKEN are not required (and vice versa).

Destination defaults to "default"; override with --destination=<name> or
CONFLUENCE_DESTINATION env var.
"""
import os
import subprocess
import sys
from pathlib import Path

DEFAULT_DESTINATION = "default"


def destination_from_args():
    for arg in sys.argv[1:]:
        if arg.startswith("--destination="):
            return arg.split("=", 1)[1]
    return os.environ.get("CONFLUENCE_DESTINATION", DEFAULT_DESTINATION)


def env_file_path(destination):
    return Path.home() / ".config" / "mcp-atlassian" / "sessions" / f"{destination}.env"


def load_env_file(path):
    if not path.is_file():
        print(f"Confluence credentials file not found: {path}", file=sys.stderr)
        print(
            "Expected KEY=VALUE lines.\n"
            "  Cloud:     CONFLUENCE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN\n"
            "  Server/DC: CONFLUENCE_URL, CONFLUENCE_PERSONAL_TOKEN",
            file=sys.stderr,
        )
        sys.exit(1)
    values = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def main():
    destination = destination_from_args()
    path = env_file_path(destination)
    values = load_env_file(path)

    if not values.get("CONFLUENCE_URL"):
        print(f"Missing CONFLUENCE_URL in {path}", file=sys.stderr)
        sys.exit(1)

    if values.get("CONFLUENCE_PERSONAL_TOKEN"):
        # Server / Data Center path — PAT only, no username/token needed
        pass
    elif values.get("CONFLUENCE_API_TOKEN") and values.get("CONFLUENCE_USERNAME"):
        # Cloud path
        pass
    else:
        print(
            f"Incomplete credentials in {path}.\n"
            "  Cloud:     provide CONFLUENCE_USERNAME + CONFLUENCE_API_TOKEN\n"
            "  Server/DC: provide CONFLUENCE_PERSONAL_TOKEN",
            file=sys.stderr,
        )
        sys.exit(1)

    env = os.environ.copy()
    env.update(values)

    try:
        result = subprocess.run(["uvx", "mcp-atlassian"], env=env)
    except FileNotFoundError:
        print("uvx is required but was not found in PATH", file=sys.stderr)
        sys.exit(1)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
