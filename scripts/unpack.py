#!/usr/bin/env python3
"""Unified CLI entry point for this factory's per-tool adapters (EPMCSAPAI-301).

Usage:
    python3 scripts/unpack.py --target claude-code --project /path/to/client-project \\
        --skills '*' --connectors abap-mcp \\
        [--activity TITLE ...] [--destination CONNECTOR=NAME ...] [--check] [--force]

`--target` accepts `claude-code`, `github-copilot` (alias: `copilot`), or `cursor`; repeatable
to install for multiple tools in one call. All other flags pass straight through to the target
tool's own install.py (see that folder's README for the full reference); this script does not
reimplement or duplicate that logic.

Never overwrites end-user customization: relies entirely on the target install.py's own
content-hash skip logic (unchanged skills/connectors are left alone; knowledge/artifacts are
seeded once and never re-synced). This script adds no destructive behavior of its own.
"""
import argparse
import importlib.util
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = FACTORY_ROOT / "scripts"

sys.path.insert(0, str(SCRIPTS_DIR))
import adapter_common as common  # noqa: E402

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
    path = SCRIPTS_DIR / tool_dir / "adapter" / "install.py"
    spec = importlib.util.spec_from_file_location(f"unpack_{tool_dir.replace('-', '_')}_install", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, tool_dir


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--target", choices=sorted(set(TARGET_DIRS)), action="append", required=True,
                         help="target tool; repeatable.")
    parser.add_argument("--project", required=True, help="path to the client project to install into")
    parser.add_argument("--skills", default="", help="comma-separated skill names, or '*' for all own-posture skills")
    parser.add_argument("--connectors", default="", help="comma-separated connector names, or '*' for all with real wiring")
    parser.add_argument("--agents", default="", help="comma-separated agent names, or '*' for all own-posture agents")
    parser.add_argument("--assistants", default="", help="comma-separated assistant names, or '*' for all own-posture assistants")
    parser.add_argument("--activity", action="append", default=[], metavar="TITLE",
                         help="install everything a Delivery-pipeline activity uses; repeatable")
    parser.add_argument("--use-case", action="append", default=[], metavar="USE_CASE_ID",
                         help="install every Assistant/Agent whose use_case_ids includes this stable ID, plus everything they need; repeatable")
    parser.add_argument("--destination", action="append", default=[], metavar="CONNECTOR=NAME",
                         help="override the <destination> credential-file name for one connector; repeatable")
    parser.add_argument("--check", action="store_true", help="report drift, write nothing")
    parser.add_argument("--force", action="store_true", help="reinstall even if content hash is unchanged")
    args = parser.parse_args(argv)

    passthrough = [
        "--project", args.project, "--skills", args.skills,
        "--connectors", args.connectors, "--agents", args.agents,
        "--assistants", args.assistants,
    ]
    for title in args.activity:
        passthrough += ["--activity", title]
    for use_case_id in args.use_case:
        passthrough += ["--use-case", use_case_id]
    for dest in args.destination:
        passthrough += ["--destination", dest]
    if args.check:
        passthrough.append("--check")
    if args.force:
        passthrough.append("--force")

    for target in args.target:
        module, tool_dir = load_install_module(target)
        print(f"--- {target} ({tool_dir}) ---")
        module.main(passthrough)


if __name__ == "__main__":
    main()
