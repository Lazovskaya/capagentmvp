#!/usr/bin/env python3
"""Cross-platform Jira launcher for the project MCP config.

Credentials live in a .env file outside the project directory (never in this repo, never in
.mcp.json), at ~/.config/mcp-atlassian/sessions/<destination>.env on every OS -- Path.home()
resolves to the right per-user profile directory on macOS, Linux, and Windows alike, so this one
script replaces the macOS-only Keychain launcher without needing a separate .ps1 for Windows.

Destination defaults to "default"; override with --destination=<name> or MCP_ATLASSIAN_DESTINATION.
"""
import os
import sys
from pathlib import Path

DEFAULT_DESTINATION = "default"


def destination_from_args():
    for arg in sys.argv[1:]:
        if arg.startswith("--destination="):
            return arg.split("=", 1)[1]
    return os.environ.get("MCP_ATLASSIAN_DESTINATION", DEFAULT_DESTINATION)


def env_file_path(destination):
    return Path.home() / ".config" / "mcp-atlassian" / "sessions" / f"{destination}.env"


def load_env_file(path):
    if not path.is_file():
        print(f"Jira credentials file not found: {path}", file=sys.stderr)
        print("Expected KEY=VALUE lines for JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN "
              "(full-line comments only, no inline comments).", file=sys.stderr)
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

    missing = [k for k in ("JIRA_URL", "JIRA_USERNAME", "JIRA_API_TOKEN") if not values.get(k)]
    if missing:
        print(f"Missing required key(s) in {path}: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    env = os.environ.copy()
    env.update(values)

    # Match the shell script's default JIRA_URL if the file didn't override it.
    env.setdefault("JIRA_URL", "https://jiraeu.epam.com/")

    try:
        os.execvpe("uvx", ["uvx", "mcp-atlassian"], env)
    except FileNotFoundError:
        print("uvx is required but was not found in PATH", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
