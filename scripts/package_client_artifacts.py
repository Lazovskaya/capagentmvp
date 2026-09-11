#!/usr/bin/env python3
"""Package a filtered set of this factory's own-posture skills, agents, connectors, knowledge,
and artifacts into a standalone .zip archive -- the "Client AI Artifacts" repo (EPMCSAPAI-300),
one step upstream of the per-tool unpack adapters (tools/unpack.py). Unlike those adapters,
this script's output keeps the factory's own directory layout (skills/<name>/, agents/<name>/,
connectors/<name>/, knowledge/<bucket>/, artifacts/<name>/) rather than any one tool's shape --
it's meant to be unzipped, `git init`'d, and only later run through tools/unpack.py for a
specific target tool. Agents copy verbatim in this factory's own shape here; the transformation
into a target tool's actual convention (e.g. Claude Code's synthesized single-file subagent,
see adapter_common.py's agent_output_bytes) happens at unpack.py time, per tool.

Usage:
    python3 tools/package_client_artifacts.py --client-name acme \\
        --skills fit-to-standard,defect-triage --agents defect-classifier --connectors jira \\
        [--activity TITLE ...] [--out-dir path/to/output] [--dry-run]

Selection works exactly like tools/unpack.py: --skills/--agents/--connectors take a
comma-separated list or '*', --activity is repeatable and pulls in a Delivery-pipeline activity's
own skill/agent/connector set, and all sources are merged. Fails the whole run, rather than
partially packaging, on any name this factory can't install (same guarantee tools/unpack.py
already gives) -- see tools/adapter_common.py's resolve_selection.

Scope note (EPMCSAPAI-300 vs. its follow-up): this script filters by explicit skill/connector/
activity name. It does NOT filter by business domain, technical domain, or risk tier -- those
tags don't exist anywhere in this factory yet (they're EPMCSAPAI-291's sidecar-metadata work,
not done). Tag-based filtering is deliberately deferred to a follow-up once that metadata exists,
rather than guessed at here; see this script's own README section (root README.md) for the
tracking ticket.

*.meta.md sidecars (also not built yet, same dependency) are excluded from every copy on general
principle even though none exist today -- see tools/adapter_common.py's META_SIDECAR_IGNORE.
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "tools"))
import adapter_common as common  # noqa: E402

ADOPT_HINT = "npx skills add /path/to/sap-ai-factory -a <tool> -s '*' --copy -y"


def copy_factory_shape_skill(name, dest_root):
    """Copies skills/<name>/ into dest_root/skills/<name>/ verbatim -- the factory's own layout,
    not any one tool's install shape (contrast with adapter_common.copy_skill)."""
    src = common.SKILLS_DIR / name
    dest = dest_root / "skills" / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=common.META_SIDECAR_IGNORE)


def copy_factory_shape_agent(name, dest_root):
    """Copies agents/<name>/ into dest_root/agents/<name>/ verbatim, same shape as the factory
    repo itself -- no frontmatter synthesis here, that's a per-tool unpack.py concern."""
    src = common.AGENTS_DIR / name
    dest = dest_root / "agents" / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=common.META_SIDECAR_IGNORE)


def copy_factory_shape_connector(name, dest_root):
    """Copies connectors/<name>/ into dest_root/connectors/<name>/ verbatim, same shape as the
    factory repo itself -- no MCP-config normalization here, that's tools/unpack.py's job later."""
    src = common.CONNECTORS_DIR / name
    dest = dest_root / "connectors" / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=common.META_SIDECAR_IGNORE)


def copy_factory_shape_reference(src, dest_root, category, name):
    dest = dest_root / category / name
    if dest.exists():
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=common.META_SIDECAR_IGNORE)
    return True


def package(skill_names, connector_names, agent_names, out_dir):
    """Materializes the filtered selection into out_dir, in the factory's own layout. Returns
    (packaged_skills, packaged_connectors, packaged_agents, packaged_knowledge, packaged_artifacts)."""
    for name in skill_names:
        copy_factory_shape_skill(name, out_dir)
    for name in connector_names:
        copy_factory_shape_connector(name, out_dir)
    for name in agent_names:
        copy_factory_shape_agent(name, out_dir)

    knowledge = common.referenced_names(skill_names, "knowledge")
    for bucket in knowledge:
        copy_factory_shape_reference(common.KNOWLEDGE_DIR / bucket, out_dir, "knowledge", bucket)
    artifacts = common.referenced_names(skill_names, "artifacts")
    for name in artifacts:
        copy_factory_shape_reference(common.ARTIFACTS_DIR / name, out_dir, "artifacts", name)

    return skill_names, connector_names, agent_names, knowledge, artifacts


def make_zip(out_dir, zip_path):
    zip_path = Path(zip_path)
    if zip_path.suffix == ".zip":
        zip_path = zip_path.with_suffix("")
    archive = shutil.make_archive(str(zip_path), "zip", root_dir=out_dir)
    return Path(archive)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--client-name", required=True, help="identifier used to name the output archive")
    parser.add_argument("--skills", default="", help="comma-separated skill names, or '*' for all own-posture skills")
    parser.add_argument("--connectors", default="", help="comma-separated connector names, or '*' for all with real wiring")
    parser.add_argument("--agents", default="", help="comma-separated agent names, or '*' for all own-posture agents")
    parser.add_argument("--activity", action="append", default=[], metavar="TITLE",
                         help="package everything a Delivery-pipeline activity uses; repeatable")
    parser.add_argument("--out-dir", help="directory to write the archive into (default: current directory)")
    parser.add_argument("--dry-run", action="store_true",
                         help="validate the selection and report what would be packaged; write nothing, produce no archive")
    args = parser.parse_args(argv)

    skill_names, connector_names, agent_names, activities = common.resolve_selection(
        args.skills, args.connectors, args.agents, args.activity, ADOPT_HINT
    )
    for activity in activities:
        print(f"Activity: {activity['title']} ({activity['file']})")

    if args.dry_run:
        knowledge = common.referenced_names(skill_names, "knowledge")
        artifacts = common.referenced_names(skill_names, "artifacts")
        print(f"Would package for '{args.client_name}':")
        print(f"  Skills: {', '.join(skill_names) or '(none)'}")
        print(f"  Connectors: {', '.join(connector_names) or '(none)'}")
        print(f"  Agents: {', '.join(agent_names) or '(none)'}")
        print(f"  Knowledge: {', '.join(knowledge) or '(none)'}")
        print(f"  Artifacts: {', '.join(artifacts) or '(none)'}")
        print("Dry run -- no archive written.")
        return

    out_dir_arg = Path(args.out_dir) if args.out_dir else Path.cwd()
    out_dir_arg.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="package-client-artifacts-") as tmp:
        staging = Path(tmp) / "staged"
        staging.mkdir()
        skills, connectors, agents, knowledge, artifacts = package(skill_names, connector_names, agent_names, staging)
        zip_stub = out_dir_arg / f"client-artifacts-{args.client_name}"
        archive = make_zip(staging, zip_stub)

    print(f"Packaged for '{args.client_name}': {archive}")
    print(f"  Skills: {', '.join(skills) or '(none)'}")
    print(f"  Connectors: {', '.join(connectors) or '(none)'}")
    print(f"  Agents: {', '.join(agents) or '(none)'}")
    print(f"  Knowledge: {', '.join(knowledge) or '(none)'}")
    print(f"  Artifacts: {', '.join(artifacts) or '(none)'}")


if __name__ == "__main__":
    main()
