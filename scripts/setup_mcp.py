#!/usr/bin/env python3
"""Write or merge .mcp.json for live connectors (jira + abap-mcp).

Reads optional .factory/config.yaml (or config.example defaults) for destination names.
Never writes secrets — only command/args pointing at out-of-tree .env sessions.

Usage:
  python3 scripts/setup_mcp.py              # write .mcp.json in repo root
  python3 scripts/setup_mcp.py --project /path/to/client-repo
  DEST_JIRA=default DEST_ABAP=sandbox python3 scripts/setup_mcp.py
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_config(project: Path) -> dict:
    cfg: dict = {
        "jira_destination": os.environ.get("DEST_JIRA", "default"),
        "abap_destination": os.environ.get("DEST_ABAP", "default"),
        "connectors": ["jira", "abap-mcp"],
    }
    for candidate in (
        project / ".factory" / "config.yaml",
        ROOT / ".factory" / "config.yaml",
        ROOT / ".factory" / "config.example.yaml",
    ):
        if not candidate.is_file():
            continue
        # Minimal YAML subset (key: value) — avoid PyYAML dependency
        for line in candidate.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if not line or line.startswith("-") or ":" not in line:
                continue
            key, _, val = line.partition(":")
            key, val = key.strip(), val.strip().strip("\"'")
            if key == "jira_destination" and val:
                cfg["jira_destination"] = val
            elif key == "abap_destination" and val:
                cfg["abap_destination"] = val
            elif key == "jira_project" and val:
                cfg["jira_project"] = val
        break
    return cfg


def mcp_servers(project: Path, cfg: dict) -> dict:
    """Build mcpServers map. Paths are relative to project when under ROOT; else absolute."""
    jira_script = ROOT / "connectors" / "jira" / "scripts" / "start-mcp-atlassian.py"
    if not jira_script.is_file():
        raise SystemExit(f"missing jira launcher: {jira_script}")

    # Prefer path relative to project for portability when project is this repo
    try:
        jira_arg = str(jira_script.relative_to(project))
        if not jira_arg.startswith("."):
            jira_arg = "./" + jira_arg
    except ValueError:
        jira_arg = str(jira_script)

    dest_j = cfg["jira_destination"]
    dest_a = cfg["abap_destination"]
    return {
        "jira": {
            "command": "python3",
            "args": [jira_arg, f"--destination={dest_j}"],
        },
        "abap-mcp": {
            "command": "npx",
            "args": ["-y", "@mcp-abap-adt/core", f"--env={dest_a}"],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--project",
        type=Path,
        default=ROOT,
        help="Directory that receives .mcp.json (default: factory root)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the JSON that would be written, do not write",
    )
    args = parser.parse_args()
    project = args.project.resolve()
    cfg = load_config(project)
    servers = mcp_servers(project, cfg)
    # Only include connectors selected in config list if present
    wanted = set(cfg.get("connectors") or ["jira", "abap-mcp"])
    servers = {k: v for k, v in servers.items() if k in wanted}

    payload = {"mcpServers": servers}
    text = json.dumps(payload, indent=2) + "\n"
    out = project / ".mcp.json"

    if args.dry_run:
        print(text)
        return 0

    if out.is_file():
        existing = json.loads(out.read_text(encoding="utf-8"))
        merged = existing.get("mcpServers") or existing
        if isinstance(merged, dict) and "mcpServers" not in existing:
            # unusual shape — replace carefully
            existing = {"mcpServers": {**merged, **servers}}
        else:
            existing.setdefault("mcpServers", {}).update(servers)
            # drop note-only keys from server.json fragments if any
        text = json.dumps(existing, indent=2) + "\n"

    out.write_text(text, encoding="utf-8")
    print(f"Wrote {out}")
    print(
        "Secrets stay out of tree: "
        f"~/.config/mcp-atlassian/sessions/{cfg['jira_destination']}.env and "
        f"~/.config/mcp-abap-adt/sessions/{cfg['abap_destination']}.env"
    )
    print("MCP writes are dry-run unless a skill is invoked with --apply.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
