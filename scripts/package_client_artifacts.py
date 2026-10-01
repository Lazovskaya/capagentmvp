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

*.meta.md sidecars are excluded from every copy -- they carry internal-only governance tags that
must not reach client packages. See scripts/adapter_common.py's META_SIDECAR_IGNORE.
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "scripts"))
import adapter_common as common  # noqa: E402

ADOPT_HINT = "npx skills add /path/to/sap-ai-factory -a <tool> -s '*' --copy -y"

# Never ship these to a client (EPMCSAPAI-330): tool.md documents a Tool's contract for
# us/future maintainers, not something a coding agent reads at runtime (the Skill's own
# instructions already say which script to run and how); schema.json is unused by any of our
# own scripts and duplicates what each artifact's template.md already documents in prose.
CLIENT_TOOL_IGNORE = shutil.ignore_patterns("*.meta.md", "tool.md")
CLIENT_ARTIFACT_IGNORE = shutil.ignore_patterns("*.meta.md", "schema.json")


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


def copy_factory_shape_assistant(name, dest_root):
    """Copies assistants/<name>/ into dest_root/assistants/<name>/ verbatim -- mirrors
    copy_factory_shape_agent."""
    src = common.ASSISTANTS_DIR / name
    dest = dest_root / "assistants" / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=common.META_SIDECAR_IGNORE)


def copy_factory_shape_tool(name, dest_root):
    """Copies tools/<name>/ into dest_root/tools/<name>/ -- a Skill's own instructions
    reference its Tool's script at this factory-relative path (tools/<name>/scripts/...), so it
    must travel alongside any Skill that requires it. Drops tool.md -- see CLIENT_TOOL_IGNORE."""
    src = common.TOOLS_DIR / name
    dest = dest_root / "tools" / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=CLIENT_TOOL_IGNORE)


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
    """category 'artifacts' drops schema.json (CLIENT_ARTIFACT_IGNORE); 'knowledge' keeps
    everything (no schema.json to begin with there)."""
    dest = dest_root / category / name
    if dest.exists():
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    ignore = CLIENT_ARTIFACT_IGNORE if category == "artifacts" else common.META_SIDECAR_IGNORE
    shutil.copytree(src, dest, ignore=ignore)
    return True


def package(skill_names, connector_names, agent_names, assistant_names, tool_names,
            knowledge_source_ids, artifact_names, out_dir):
    """Materializes the filtered (already fully expanded -- see expand_selection) selection into
    out_dir, in the factory's own layout. Returns (packaged_skills, packaged_connectors,
    packaged_agents, packaged_assistants, packaged_tools, packaged_knowledge,
    packaged_artifacts)."""
    for name in skill_names:
        copy_factory_shape_skill(name, out_dir)
    for name in connector_names:
        copy_factory_shape_connector(name, out_dir)
    for name in agent_names:
        copy_factory_shape_agent(name, out_dir)
    for name in assistant_names:
        copy_factory_shape_assistant(name, out_dir)
    for name in tool_names:
        copy_factory_shape_tool(name, out_dir)

    knowledge, seen_knowledge = [], set()
    for bucket in common.referenced_names(skill_names, "knowledge"):
        copy_factory_shape_reference(common.KNOWLEDGE_DIR / bucket, out_dir, "knowledge", bucket)
        if bucket not in seen_knowledge:
            seen_knowledge.add(bucket)
            knowledge.append(bucket)
    for source_id, src_path in common.knowledge_source_paths(knowledge_source_ids):
        rel = str(src_path.relative_to(common.KNOWLEDGE_DIR))
        copy_factory_shape_reference(src_path, out_dir, "knowledge", rel)
        if rel not in seen_knowledge:
            seen_knowledge.add(rel)
            knowledge.append(rel)

    artifacts = list(dict.fromkeys(list(common.referenced_names(skill_names, "artifacts")) + list(artifact_names)))
    for name in artifacts:
        copy_factory_shape_reference(common.ARTIFACTS_DIR / name, out_dir, "artifacts", name)

    return skill_names, connector_names, agent_names, assistant_names, tool_names, knowledge, artifacts


def expand_selection(skill_names, connector_names, agent_names, assistant_names):
    """Complete-path expansion (EPMCSAPAI-330/AI Artifacts v0.3): whatever resolve_selection
    validated is just the seed set -- everything each seed's own Dependency graph names
    (Assistant -> Agent -> Skill -> Tool -> Connector/Artifact/Knowledge Source) is pulled in
    automatically from here on, so e.g. --assistants alone is enough to package everything it
    needs. Returns (skill_names, connector_names, agent_names, assistant_names, tool_names,
    knowledge_source_ids, artifact_names)."""
    expanded = common.expand_dependencies(
        skill_names=skill_names, agent_names=agent_names, assistant_names=assistant_names,
        connector_names=connector_names,
    )
    return (
        expanded["skills"], expanded["connectors"], expanded["agents"], expanded["assistants"],
        expanded["tools"], expanded["knowledge_sources"], expanded["artifacts"],
    )


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
    parser.add_argument("--assistants", default="", help="comma-separated assistant names, or '*' for all own-posture assistants")
    parser.add_argument("--activity", action="append", default=[], metavar="TITLE",
                         help="package everything a Delivery-pipeline activity uses; repeatable")
    parser.add_argument("--use-case", action="append", default=[], metavar="USE_CASE_ID",
                         help="package every Assistant/Agent whose use_case_ids includes this stable ID, plus everything they need; repeatable")
    parser.add_argument("--out-dir", help="directory to write the archive into (default: current directory)")
    parser.add_argument("--no-zip", action="store_true",
                         help="write the staged client-artifacts-<name>/ directory directly into --out-dir instead of "
                              "zipping it (useful when the caller -- e.g. GitLab CI job artifacts -- already wraps "
                              "the output in its own archive, so a nested zip would just add an extra unzip step)")
    parser.add_argument("--dry-run", action="store_true",
                         help="validate the selection and report what would be packaged; write nothing, produce no archive")
    args = parser.parse_args(argv)

    skill_names, connector_names, agent_names, assistant_names, activities = common.resolve_selection(
        args.skills, args.connectors, args.agents, args.activity, ADOPT_HINT,
        assistants_csv=args.assistants, use_case_queries=args.use_case,
    )
    for activity in activities:
        print(f"Activity: {activity['title']} ({activity['file']})")

    skill_names, connector_names, agent_names, assistant_names, tool_names, knowledge_source_ids, artifact_names = \
        expand_selection(skill_names, connector_names, agent_names, assistant_names)

    existing, missing = common.split_existing({
        "skills": skill_names, "connectors": connector_names, "agents": agent_names,
        "assistants": assistant_names, "tools": tool_names,
        "knowledge_sources": knowledge_source_ids, "artifacts": artifact_names,
    })
    for kind, names in missing.items():
        if names:
            print(f"Note: {kind} not yet built, skipped (forward-declared): {', '.join(names)}")
    skill_names, connector_names, agent_names, assistant_names, tool_names, knowledge_source_ids, artifact_names = (
        existing["skills"], existing["connectors"], existing["agents"], existing["assistants"],
        existing["tools"], existing["knowledge_sources"], existing["artifacts"],
    )

    if args.dry_run:
        knowledge = list(dict.fromkeys(
            list(common.referenced_names(skill_names, "knowledge"))
            + [str(p.relative_to(common.KNOWLEDGE_DIR)) for _id, p in common.knowledge_source_paths(knowledge_source_ids)]
        ))
        artifacts = list(dict.fromkeys(list(common.referenced_names(skill_names, "artifacts")) + artifact_names))
        print(f"Would package for '{args.client_name}':")
        print(f"  Skills: {', '.join(skill_names) or '(none)'}")
        print(f"  Connectors: {', '.join(connector_names) or '(none)'}")
        print(f"  Agents: {', '.join(agent_names) or '(none)'}")
        print(f"  Assistants: {', '.join(assistant_names) or '(none)'}")
        print(f"  Tools: {', '.join(tool_names) or '(none)'}")
        print(f"  Knowledge: {', '.join(knowledge) or '(none)'}")
        print(f"  Artifacts: {', '.join(artifacts) or '(none)'}")
        print("Dry run -- no archive written.")
        return

    out_dir_arg = Path(args.out_dir) if args.out_dir else Path.cwd()
    out_dir_arg.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="package-client-artifacts-") as tmp:
        staging = Path(tmp) / "staged"
        staging.mkdir()
        skills, connectors, agents, assistants, tools, knowledge, artifacts = package(
            skill_names, connector_names, agent_names, assistant_names, tool_names,
            knowledge_source_ids, artifact_names, staging
        )
        if args.no_zip:
            archive = out_dir_arg / f"client-artifacts-{args.client_name}"
            if archive.exists():
                shutil.rmtree(archive)
            shutil.copytree(staging, archive)
        else:
            zip_stub = out_dir_arg / f"client-artifacts-{args.client_name}"
            archive = make_zip(staging, zip_stub)

    print(f"Packaged for '{args.client_name}': {archive}")
    print(f"  Skills: {', '.join(skills) or '(none)'}")
    print(f"  Connectors: {', '.join(connectors) or '(none)'}")
    print(f"  Agents: {', '.join(agents) or '(none)'}")
    print(f"  Assistants: {', '.join(assistants) or '(none)'}")
    print(f"  Tools: {', '.join(tools) or '(none)'}")
    print(f"  Knowledge: {', '.join(knowledge) or '(none)'}")
    print(f"  Artifacts: {', '.join(artifacts) or '(none)'}")


if __name__ == "__main__":
    main()
