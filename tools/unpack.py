#!/usr/bin/env python3
"""Unified CLI entry point for this factory's per-tool adapters (EPMCSAPAI-301).

Usage:
    python3 tools/unpack.py --target claude-code --project /path/to/client-project \\
        --skills '*' --connectors abap-mcp \\
        [--context platform/pilot-context/pilot-<id>.context.json] \\
        [--activity TITLE ...] [--destination CONNECTOR=NAME ...] [--check] [--force]

`--target` accepts `claude-code`, `github-copilot` (alias: `copilot`), or `cursor`. If omitted,
runs once per tool listed in `--context`'s `toolEnvironments` (that field is required in that
case). `--context`, if given, resolves the pilot infrastructure context (P4, EPMCSAPAI-294) via
tools/pilot_context.py *before* installing -- this is what turns a filled-in context file into
working `abap-mcp` session credentials, instead of a consultant creating them by hand. All other
flags pass straight through to the target tool's own install.py (see that folder's README for the
full reference); this script does not reimplement or duplicate that logic.

Post-unpack validation (this script's own addition, not delegated to install.py): after
installing, re-runs each target with --check to confirm nothing is missing, and additionally
confirms that any abap-mcp destination resolved from --context now has a readable session file
with the expected keys. This is scoped to credential completeness, not full declared-dependency
validation (that depends on EPMCSAPAI-291's needs: schema, not yet built) -- see this script's own
README section for that boundary.

Never overwrites end-user customization: relies entirely on the target install.py's own
content-hash skip logic (unchanged skills/connectors are left alone; knowledge/artifacts are
seeded once and never re-synced). This script adds no destructive behavior of its own.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = FACTORY_ROOT / "tools"

sys.path.insert(0, str(TOOLS_DIR))
import adapter_common as common  # noqa: E402
import pilot_context  # noqa: E402

TARGET_DIRS = {
    "claude-code": "claude-code",
    "github-copilot": "github-copilot",
    "copilot": "github-copilot",  # alias, matches this ticket's own AC wording
    "cursor": "cursor",
}


def die(msg):
    raise SystemExit(f"error: {msg}")


def load_install_module(target):
    tool_dir = TARGET_DIRS.get(target)
    if not tool_dir:
        die(f"unknown --target '{target}', expected one of {sorted(set(TARGET_DIRS))}")
    path = TOOLS_DIR / tool_dir / "adapter" / "install.py"
    spec = importlib.util.spec_from_file_location(f"unpack_{tool_dir.replace('-', '_')}_install", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, tool_dir


def targets_from_context(context_path):
    data = json.loads(Path(context_path).read_text(encoding="utf-8"))
    tools = data.get("toolEnvironments")
    if not tools:
        die(
            f"--target was not given and '{context_path}' has no toolEnvironments -- "
            "pass --target explicitly or add toolEnvironments to the context file"
        )
    return tools


def check_abap_mcp_sessions(resolved_systems):
    """Post-unpack validation for context-resolved credentials: confirm each destination's
    session file exists and every value written last time is still non-empty. Never prints
    the values themselves."""
    problems = []
    for system_id, destination in resolved_systems:
        path = pilot_context.abap_mcp_session_path(destination)
        if not path.exists():
            problems.append(f"{system_id} ({destination}): session file missing at {path}")
            continue
        values = {}
        for line in path.read_text(encoding="utf-8").splitlines():
            if "=" in line:
                k, _, v = line.partition("=")
                values[k] = v
        empty = [k for k, v in values.items() if not v]
        if empty:
            problems.append(f"{system_id} ({destination}): empty value(s) for {', '.join(empty)}")
    return problems


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--target", choices=sorted(set(TARGET_DIRS)), action="append",
                         help="target tool; repeatable. Defaults to --context's toolEnvironments if omitted.")
    parser.add_argument("--context", help="path to a pilot *.context.json file (P4, EPMCSAPAI-294)")
    parser.add_argument("--project", required=True, help="path to the client project to install into")
    parser.add_argument("--skills", default="", help="comma-separated skill names, or '*' for all own-posture skills")
    parser.add_argument("--connectors", default="", help="comma-separated connector names, or '*' for all with real wiring")
    parser.add_argument("--activity", action="append", default=[], metavar="TITLE",
                         help="install everything a Delivery-pipeline activity uses; repeatable")
    parser.add_argument("--destination", action="append", default=[], metavar="CONNECTOR=NAME",
                         help="override the <destination> credential-file name for one connector; repeatable")
    parser.add_argument("--check", action="store_true", help="report drift, write nothing")
    parser.add_argument("--force", action="store_true", help="reinstall even if content hash is unchanged")
    args = parser.parse_args(argv)

    targets = args.target or targets_from_context(args.context)

    resolved_systems = []
    if args.context:
        resolved_systems, _ = pilot_context.resolve_context(args.context, check=args.check)
        verb = "Would resolve" if args.check else "Resolved"
        print(f"{verb} {len(resolved_systems)} pilot-context system(s): "
              + ", ".join(f"{sid}->{dest}" for sid, dest in resolved_systems))

    passthrough = ["--project", args.project, "--skills", args.skills, "--connectors", args.connectors]
    for title in args.activity:
        passthrough += ["--activity", title]
    for dest in args.destination:
        passthrough += ["--destination", dest]
    if args.check:
        passthrough.append("--check")
    if args.force:
        passthrough.append("--force")

    for target in targets:
        module, tool_dir = load_install_module(target)
        print(f"--- {target} ({tool_dir}) ---")
        module.main(passthrough)

    if not args.check and resolved_systems:
        problems = check_abap_mcp_sessions(resolved_systems)
        if problems:
            die("post-unpack credential check failed:\n  " + "\n  ".join(problems))
        print(f"Post-unpack check: {len(resolved_systems)} abap-mcp session(s) verified complete.")


if __name__ == "__main__":
    main()
