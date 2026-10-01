#!/usr/bin/env python3
"""Lints own-posture component meta.md files for three kinds of issues:

  1. Drift (skills only): knowledge_source/artifact rows declared in skill.meta.md but not
     referenced in SKILL.md body text, or referenced in body text but not declared.
  2. Vocabulary: any row in any meta.md whose Type or Relation is not in the v0.3 allowed set.
  3. Path intersection: a component in the dependency chain from an assistant whose
     project_types or sdlc_phases have no overlap with the assistant's own declared sets.

Usage:
    python3 scripts/lint_dependencies.py [--fix] [--strict]

Covers: skills/, agents/, assistants/, tools/. Connectors and artifacts don't have walkable
Dependency graph tables themselves (they appear as leaves in others' graphs), so they're not
scanned as primary targets here.

Missing *.meta.md files always exit 1 regardless of --strict, since that check has no caveats.
Vocabulary and intersection issues exit 1 only with --strict, same as skill drift.
--fix only applies to skills (body-text cross-check has no equivalent for other kinds).

FORWARD_DECLARED_KNOWLEDGE_SOURCES: knowledge_source IDs a consumer is allowed to declare
with no registered knowledge.meta.md yet. Remove an entry only once its knowledge.meta.md
actually exists or the consuming row is repointed at a real source.
"""
import argparse
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "scripts"))
import adapter_common as common  # noqa: E402

parse_dependency_graph = common.parse_dependency_graph
load_knowledge_sources = common.load_knowledge_sources

FORWARD_DECLARED_KNOWLEDGE_SOURCES = {
    # assistants/solution-architect/assistant.meta.md -- "managed role boundary and routing
    # context". No content describing role boundary/routing exists under knowledge/ yet.
    "solution-architect-role-context",
    # agents/brownfield-sad-authoring-agent/agent.meta.md -- Brownfield SAD authoring
    # methodology. No knowledge_source describing this exists under knowledge/ yet.
    # Reverted from `standards` (2026-09-11): that bucket's content is unrelated.
    "brownfield-sad-authoring-methodology",
    # skill.meta.md files -- similarly forward-declared methodology sources
    "conversion-scoping-methodology",
    "sizing-methodology",
}

# v0.3 dependency-graph vocabulary
VALID_TYPES = {
    "assistant", "agent", "skill", "tool", "connector",
    "artifact", "knowledge_source", "q-gate",
}
VALID_RELATIONS = {
    "requires", "optional", "routes-to", "chains-to",
    "produces", "consumes", "gates-at", "related",
}


# ---------- vocabulary check (all kinds) ----------

def check_vocabulary(rows):
    """Returns a list of issue strings for any row with an unknown type or relation."""
    issues = []
    for row_type, ref, relation, _notes in rows:
        t = row_type.strip().lower()
        r = relation.strip().lower()
        if t not in VALID_TYPES:
            issues.append(f"unknown type '{t}' (ref: {ref.strip()})")
        if r not in VALID_RELATIONS:
            issues.append(f"unknown relation '{r}' (ref: {ref.strip()}, type: {t})")
    return issues


def check_forward_declared(rows, known_sources):
    """Returns issue strings for knowledge_source rows referencing IDs that are neither
    registered in known_sources nor in FORWARD_DECLARED_KNOWLEDGE_SOURCES."""
    issues = []
    for row_type, ref, _relation, _notes in rows:
        if row_type.strip().lower() != "knowledge_source":
            continue
        for source_id in (r.strip("`").strip() for r in ref.split(",")):
            if (source_id
                    and source_id not in known_sources
                    and source_id not in FORWARD_DECLARED_KNOWLEDGE_SOURCES):
                issues.append(
                    f"knowledge_source '{source_id}' is neither registered "
                    "nor in FORWARD_DECLARED_KNOWLEDGE_SOURCES"
                )
    return issues


def check_meta(kind, name, meta_path, known_sources):
    """Checks a non-skill meta.md for: existence, vocabulary validity, and unregistered
    knowledge_source rows. Returns a result dict."""
    result = {
        "kind": kind, "name": name,
        "no_meta": not meta_path.exists(),
        "vocab_issues": [],
        "forward_decl_issues": [],
    }
    if result["no_meta"]:
        return result
    rows = parse_dependency_graph(meta_path)
    result["vocab_issues"] = check_vocabulary(rows)
    result["forward_decl_issues"] = check_forward_declared(rows, known_sources)
    return result


# ---------- path intersection check (assistants) ----------

def check_path_intersection(assistant_name):
    """Returns issue strings for components in the dependency chain from this assistant
    whose project_types or sdlc_phases don't overlap with the assistant's own declared sets."""
    meta = common.ASSISTANTS_DIR / assistant_name / "assistant.meta.md"
    fields = common.read_frontmatter_fields(meta)
    asst_types = set(fields.get("project_types", []))
    asst_phases = set(fields.get("sdlc_phases", []))
    if not asst_types or not asst_phases:
        return []

    expanded = common.expand_dependencies(assistant_names=[assistant_name])
    issues = []

    checks = [
        ("agent", expanded["agents"],
         lambda n: common.AGENTS_DIR / n / "agent.meta.md"),
        ("skill", expanded["skills"],
         lambda n: common.SKILLS_DIR / n / "skill.meta.md"),
        ("tool", expanded["tools"],
         lambda n: common.TOOLS_DIR / n / "tool.meta.md"),
    ]
    for kind, names, meta_fn in checks:
        for n in names:
            f = common.read_frontmatter_fields(meta_fn(n))
            comp_types = set(f.get("project_types", []))
            comp_phases = set(f.get("sdlc_phases", []))
            if comp_types and not (comp_types & asst_types):
                issues.append(
                    f"{kind} '{n}': project_types {sorted(comp_types)} has no overlap "
                    f"with assistant '{assistant_name}' {sorted(asst_types)}"
                )
            if comp_phases and not (comp_phases & asst_phases):
                issues.append(
                    f"{kind} '{n}': sdlc_phases {sorted(comp_phases)} has no overlap "
                    f"with assistant '{assistant_name}' {sorted(asst_phases)}"
                )
    return issues


# ---------- skill-specific drift check (knowledge/artifact cross-check vs SKILL.md body) ----------

def knowledge_bucket(source_location):
    parts = source_location.strip("/").split("/")
    if parts and parts[0] == "knowledge":
        parts = parts[1:]
    return parts[0] if parts else source_location


def declared_knowledge_buckets(rows, known_sources):
    out = []
    seen = set()
    for source_id in declared_refs(rows, "knowledge_source"):
        if source_id not in known_sources and source_id in FORWARD_DECLARED_KNOWLEDGE_SOURCES:
            continue
        bucket = knowledge_bucket(known_sources.get(source_id, source_id))
        if bucket not in seen:
            seen.add(bucket)
            out.append(bucket)
    return out


def declared_refs(rows, kind):
    out = []
    seen = set()
    for row_type, ref, _relation, _notes in rows:
        if row_type.strip().lower() != kind:
            continue
        for name in (n.strip("`").strip() for n in ref.split(",")):
            if name and name not in seen:
                seen.add(name)
                out.append(name)
    return out


def check_skill(name, known_sources):
    """Returns a dict describing this skill's drift, or None if it has no skill.meta.md."""
    meta_path = common.SKILLS_DIR / name / "skill.meta.md"
    if not meta_path.exists():
        return {"skill": name, "no_meta": True}

    rows = parse_dependency_graph(meta_path)
    result = {
        "skill": name, "no_meta": False,
        "vocab_issues": check_vocabulary(rows),
        "forward_decl_issues": check_forward_declared(rows, known_sources),
    }
    for kind, category in (("knowledge_source", "knowledge"), ("artifact", "artifacts")):
        if kind == "knowledge_source":
            declared = set(declared_knowledge_buckets(rows, known_sources))
        else:
            declared = set(declared_refs(rows, kind))
        actual = set(common.referenced_names([name], category))
        result[f"{kind}_declared_not_referenced"] = sorted(declared - actual)
        result[f"{kind}_referenced_not_declared"] = sorted(actual - declared)
    return result


def has_skill_drift(result):
    if result.get("no_meta"):
        return True
    return any(
        result.get(f"{kind}_{direction}")
        for kind in ("knowledge_source", "artifact")
        for direction in ("declared_not_referenced", "referenced_not_declared")
    )


def has_meta_issues(result):
    return result.get("no_meta") or result.get("vocab_issues") or result.get("forward_decl_issues")


# ---------- reporting ----------

def format_skill_report(results):
    lines = []
    for r in results:
        if not has_skill_drift(r) and not r.get("vocab_issues") and not r.get("forward_decl_issues"):
            continue
        lines.append(f"skill '{r['skill']}':")
        if r.get("no_meta"):
            lines.append("  no skill.meta.md file")
            continue
        for issue in r.get("vocab_issues", []):
            lines.append(f"  vocab: {issue}")
        for issue in r.get("forward_decl_issues", []):
            lines.append(f"  {issue}")
        for kind in ("knowledge_source", "artifact"):
            for names, label in (
                (r.get(f"{kind}_declared_not_referenced", []),
                 f"{kind} declared but not found in SKILL.md"),
                (r.get(f"{kind}_referenced_not_declared", []),
                 f"{kind} referenced in SKILL.md but not declared"),
            ):
                if names:
                    lines.append(f"  {label}: {', '.join(names)}")
    return "\n".join(lines)


def format_meta_report(results):
    lines = []
    for r in results:
        if not has_meta_issues(r):
            continue
        kind, name = r["kind"], r["name"]
        lines.append(f"{kind} '{name}':")
        if r.get("no_meta"):
            lines.append(f"  no {kind}.meta.md file")
            continue
        for issue in r.get("vocab_issues", []):
            lines.append(f"  vocab: {issue}")
        for issue in r.get("forward_decl_issues", []):
            lines.append(f"  {issue}")
    return "\n".join(lines)


# ---------- fix (skills only) ----------

def apply_fix(name, result, known_sources):
    meta_path = common.SKILLS_DIR / name / "skill.meta.md"
    text = meta_path.read_text(encoding="utf-8")
    bucket_to_sources = {}
    for source_id, source_location in known_sources.items():
        bucket_to_sources.setdefault(knowledge_bucket(source_location), []).append(source_id)
    new_lines = []
    for kind, key in (("knowledge_source", "knowledge_source_referenced_not_declared"),
                      ("artifact", "artifact_referenced_not_declared")):
        for ref in result.get(key, []):
            relation = "consumes"
            if kind == "knowledge_source":
                candidates = bucket_to_sources.get(ref, [])
                if len(candidates) == 1:
                    ref, note = candidates[0], "TODO: describe this relation"
                else:
                    note = (f"TODO: bucket `{ref}` -- resolve to the real "
                            "knowledge_source ID(s) and describe this relation")
            else:
                note = "TODO: describe this relation"
            new_lines.append(f"| {kind} | {ref} | {relation} | {note} |")
    if not new_lines:
        return False
    if not text.endswith("\n"):
        text += "\n"
    text += "\n".join(new_lines) + "\n"
    meta_path.write_text(text, encoding="utf-8")
    return True


# ---------- main ----------

def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--fix", action="store_true",
                        help="append rows for referenced-but-undeclared knowledge/artifacts in skills")
    parser.add_argument("--strict", action="store_true", help=(
        "also exit 1 on vocabulary issues, path-intersection issues, and skill drift "
        "(in addition to the unconditional exit 1 for any missing *.meta.md file)"
    ))
    args = parser.parse_args(argv)

    known_sources = load_knowledge_sources()

    # Skills: full drift + vocab check
    skill_names = common.all_own_skill_names()
    skill_results = [check_skill(name, known_sources) for name in skill_names]

    if args.fix:
        fixed = []
        for r in skill_results:
            if r.get("no_meta"):
                continue
            if apply_fix(r["skill"], r, known_sources):
                fixed.append(r["skill"])
        if fixed:
            print(f"Added missing rows for: {', '.join(fixed)}")
            skill_results = [check_skill(name, known_sources) for name in skill_names]

    # Agents, assistants, tools: vocab + forward-declared check
    agent_results = [
        check_meta("agent", n, common.AGENTS_DIR / n / "agent.meta.md", known_sources)
        for n in common.all_own_agent_names()
    ]
    assistant_results = [
        check_meta("assistant", n, common.ASSISTANTS_DIR / n / "assistant.meta.md", known_sources)
        for n in common.all_own_assistant_names()
    ]
    tool_results = [
        check_meta("tool", n, common.TOOLS_DIR / n / "tool.meta.md", known_sources)
        for n in common.all_own_tool_names()
    ]

    # Path intersection check (per assistant)
    path_issues = []
    for n in common.all_own_assistant_names():
        path_issues.extend(check_path_intersection(n))

    # Report
    skill_report = format_skill_report(skill_results)
    meta_report = format_meta_report(agent_results + assistant_results + tool_results)
    path_report = (
        "path intersection issues:\n" + "\n".join(f"  {i}" for i in path_issues)
        if path_issues else ""
    )

    all_reports = [r for r in [skill_report, meta_report, path_report] if r]
    total = (len(skill_names) + len(agent_results)
             + len(assistant_results) + len(tool_results))
    if all_reports:
        print("\n".join(all_reports))
    else:
        print(
            f"Checked {total} components "
            f"({len(skill_names)} skills, {len(agent_results)} agents, "
            f"{len(assistant_results)} assistants, {len(tool_results)} tools), "
            "no issues found."
        )

    any_missing_meta = (
        any(r.get("no_meta") for r in skill_results)
        or any(r.get("no_meta") for r in agent_results + assistant_results + tool_results)
    )
    any_strict_issues = (
        any(has_skill_drift(r) and not r.get("no_meta") for r in skill_results)
        or any(has_meta_issues(r) and not r.get("no_meta")
               for r in agent_results + assistant_results + tool_results)
        or bool(path_issues)
    )

    if any_missing_meta or (args.strict and any_strict_issues):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
