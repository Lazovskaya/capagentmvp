#!/usr/bin/env python3
"""Generates factory-data.json's `components[]` and `assistants[]` from the *.meta.md sidecar
files, instead of hand-maintaining them (EPMCSAPAI-291/299/300).

Usage:
    python3 scripts/generate_factory_data.py            # print a diff against the current file
    python3 scripts/generate_factory_data.py --check     # same, but exit 1 if anything differs
    python3 scripts/generate_factory_data.py --write     # write components[] and assistants[] back
    python3 build.py --regenerate                        # --write, then re-render index.html

The static taxonomy blocks (phases, bands, roles, roleOrder, engagements, statuses, postures,
rows, coverage, tools, scaffold, groups) are carried over verbatim -- they are the vocabulary the
sidecars use, not something derived from them. `activities[]` is the legacy name of
`assistants[]` and is dropped on --write.

components[] -- one entry per sidecar (Skill, Agent, Tool, Connector, Artifact, Q-gate,
Assistant, Knowledge):
  - kind / name: which directory, and the sidecar's own id field (skill:, q_gate:, ...).
  - posture: "own" if provenance source is internal, else "adopt"; Connectors are always "adopt".
  - status: sidecar `readiness` via READINESS_TO_STATUS. Knowledge has no readiness field
    (knowledge-template-MVP.md forbids one): _tmp/factory-data.json if present, then the current
    factory-data.json, else "notstarted".
  - phases: sidecar `sdlc_phases` in SAP Activate order; an empty list means Discover.
    phase: the first (earliest) entry, for index.html's one-column-per-phase layout.
  - desc: adapter_common.component_desc() -- always from the component's own source files.
  - pattern (Connector): connector_type. operation / permission_scope (Tool): as declared.
Entries in the current file with no matching sidecar on disk are dropped on --write: components[]
reflects what actually exists in the repo, not a target model of what should eventually exist.

assistants[] -- one entry per use_case_id of every assistant.meta.md: owner = role_scope,
engagement = project_types, phase/phases/status as above, title = the use_case_id, uses = the
Assistant's routes-to Agents that themselves declare that use_case_id.
"""
import argparse
import json
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "scripts"))
import adapter_common as common  # noqa: E402

FACTORY_DATA_PATH = FACTORY_ROOT / "factory-data.json"
# Older snapshot, gitignored; preferred over factory-data.json for Knowledge status when present.
LEGACY_SNAPSHOT_PATH = FACTORY_ROOT / "_tmp" / "factory-data.json"

# sidecar `readiness:` value -> factory-data.json `statuses` key (what index.html keys off)
READINESS_TO_STATUS = {
    "not-started": "notstarted",
    "in-progress": "progress",
    "in-test": "in-test",
    "ready": "ready",
}

KIND_DIRS = {
    "Skill": ("skills", "skill.meta.md", "skill"),
    "Agent": ("agents", "agent.meta.md", "agent"),
    "Tool": ("tools", "tool.meta.md", "tool"),
    "Connector": ("connectors", "connector.meta.md", "connector"),
    "Artifact": ("artifacts", "artifact.meta.md", "artifact"),
    "Q-gate": ("gates", "gate.meta.md", "q_gate"),
    "Assistant": ("assistants", "assistant.meta.md", "assistant"),
    "Knowledge": ("knowledge", "knowledge.meta.md", "knowledge_source"),
}


def component_phases(fields, meta_path, phase_order):
    """Returns the sidecar's sdlc_phases as display names, in SAP Activate order. An empty list
    means "not tied to a phase" and defaults to the first phase (Discover)."""
    raw = fields.get("sdlc_phases")
    if not isinstance(raw, list):
        raise SystemExit(f"error: {meta_path}: sdlc_phases missing or not a [list]")
    by_key = {p.lower(): p for p in phase_order}
    unknown = [v for v in raw if v.lower() not in by_key]
    if unknown:
        raise SystemExit(f"error: {meta_path}: unknown sdlc_phases value(s) {unknown}")
    wanted = {v.lower() for v in raw}
    phases = [p for p in phase_order if p.lower() in wanted]
    return phases or phase_order[:1]


def parse_pattern(raw):
    if isinstance(raw, list):
        return raw
    return raw.strip()


def knowledge_status_sources(current_data):
    """knowledge-template-MVP.md forbids a lifecycle field on knowledge.meta.md, so Knowledge
    status can't come from the sidecar. Lookup order: the legacy _tmp snapshot (if present),
    then the current factory-data.json; generate_components() falls back to "notstarted"."""
    datasets = []
    if LEGACY_SNAPSHOT_PATH.exists():
        datasets.append(json.loads(LEGACY_SNAPSHOT_PATH.read_text(encoding="utf-8")))
    datasets.append(current_data)
    return [{(c["kind"], c["name"]): c.get("status") for c in d.get("components", [])} for d in datasets]


def component_status(kind, name, fields, meta_path, knowledge_sources):
    if kind == "Knowledge":
        for lookup in knowledge_sources:
            if lookup.get((kind, name)):
                return lookup[(kind, name)]
        return "notstarted"
    readiness = fields.get("readiness")
    if readiness not in READINESS_TO_STATUS:
        raise SystemExit(f"error: {meta_path}: readiness must be one of "
                         f"{sorted(READINESS_TO_STATUS)}, got {readiness!r}")
    return READINESS_TO_STATUS[readiness]


def generate_components(current_data):
    phase_order = current_data["phases"]
    knowledge_sources = knowledge_status_sources(current_data)
    components = []
    for kind, (root_name, meta_name, field_name) in KIND_DIRS.items():
        root = FACTORY_ROOT / root_name
        if not root.exists():
            continue
        if kind == "Knowledge":
            # Unlike every other kind, a governed knowledge.meta.md does not sit exactly one
            # level under its root: bucket-grain sources do (knowledge/clean-core/), but
            # leaf-grain sources are nested two levels deep (e.g.
            # knowledge/domain-packs/sap-best-practices/knowledge.meta.md) -- so this kind needs
            # a recursive glob instead of the single iterdir() every other kind uses.
            meta_paths = sorted(root.glob(f"**/{meta_name}"))
        else:
            meta_paths = [child / meta_name for child in sorted(root.iterdir())]
        for meta_path in meta_paths:
            child = meta_path.parent
            if not meta_path.exists():
                continue
            if kind == "Assistant" and not (child / "assistant.md").exists():
                continue
            fields = common.read_frontmatter_fields(meta_path)
            name = fields.get(field_name, child.name)
            source = fields.get("source", "")
            # Every current Connector is posture "adopt" regardless of its own source: value --
            # even a connector whose wiring script we wrote ourselves still integrates an
            # external system, so "own" (this factory's own authored content) never applies to
            # the kind itself. source: internal means something different for a Connector than
            # for a Skill/Agent, where it correctly does mean own-authored. For Knowledge, source:
            # comes from the sidecar's nested provenance.source (this line-based, indentation-
            # stripping scan picks that scalar up correctly, same as every other nested
            # provenance.source already in this repo) and the own/adopt meaning matches: SAP-
            # sourced content (e.g. clean-core, sap-best-practices-taxonomy) is "adopt", EPAM-
            # authored content is "own".
            posture = "adopt" if kind == "Connector" else ("own" if source == "internal" else "adopt")
            status = component_status(kind, name, fields, meta_path, knowledge_sources)
            phases = component_phases(fields, meta_path, phase_order)
            desc = common.component_desc(kind, name)
            entry = {
                "kind": kind,
                "name": name,
                "posture": posture,
                "status": status,
                "phase": phases[0],
                "phases": phases,
                "desc": desc,
            }
            if kind == "Connector":
                entry["pattern"] = parse_pattern(fields.get("connector_type", ""))
            if kind == "Tool":
                entry["operation"] = fields.get("operation")
                entry["permission_scope"] = fields.get("permission_scope")
            components.append(entry)
    components.sort(key=lambda item: (item.get("kind", ""), item.get("name", "")))
    return components


def _graph_refs(meta_path, row_type, relation):
    refs = []
    for t, ref, rel, _notes in common.parse_dependency_graph(meta_path):
        if t.strip().lower() == row_type and rel.strip().lower() == relation:
            refs += [r.strip("`").strip() for r in ref.split(",") if r.strip("`").strip()]
    return refs


def generate_assistants(current_data):
    """One entry per use_case_id of every assistants/<n>/assistant.meta.md. `uses` lists the
    Assistant's routes-to Agents that themselves declare that use_case_id (the template's
    exposure rule), so no parsing of assistant.md's routing table is needed."""
    phase_order = current_data["phases"]
    entries = []
    for meta_path in sorted(common.ASSISTANTS_DIR.glob("*/assistant.meta.md")):
        child = meta_path.parent
        if not (child / "assistant.md").exists():
            continue
        fields = common.read_frontmatter_fields(meta_path)
        name = fields.get("assistant", child.name)
        for required in ("role_scope", "use_case_ids", "project_types"):
            if required not in fields:
                raise SystemExit(f"error: {meta_path}: missing {required}")
        phases = component_phases(fields, meta_path, phase_order)
        status = component_status("Assistant", name, fields, meta_path, [])
        routed = _graph_refs(meta_path, "agent", "routes-to")
        for use_case in fields["use_case_ids"]:
            agents = [a for a in routed if use_case in common.read_frontmatter_fields(
                common.AGENTS_DIR / a / "agent.meta.md").get("use_case_ids", [])]
            entries.append({
                "phase": phases[0],
                "phases": phases,
                "owner": fields["role_scope"],
                "engagement": fields["project_types"],
                "status": status,
                "file": f"assistants/{child.name}/assistant.md",
                "title": use_case,
                "desc": common.component_desc("Assistant", name),
                "uses": [["agent", agents]] if agents else [],
            })
    return entries


def diff_assistants(generated, current):
    cur = {a["title"]: a for a in current}
    gen = {a["title"]: a for a in generated}
    lines = []
    for title in sorted(set(cur) | set(gen)):
        if title not in cur:
            lines.append(f"+ assistants/{title}: new")
        elif title not in gen:
            lines.append(f"- assistants/{title}: missing (no assistant.meta.md declares it)")
        else:
            for field in sorted(set(cur[title]) | set(gen[title])):
                if cur[title].get(field) != gen[title].get(field):
                    lines.append(f"~ assistants/{title}.{field}: {_short(cur[title].get(field))} "
                                 f"-> {_short(gen[title].get(field))}")
    return lines


def with_assistants(data, assistants):
    """Returns data with `assistants` in place of the legacy `activities` key, same position."""
    out = {}
    for key, value in data.items():
        if key in ("activities", "assistants"):
            out["assistants"] = assistants
        else:
            out[key] = value
    out.setdefault("assistants", assistants)
    return out


def diff_components(generated, current):
    current_by_key = {(c["kind"], c["name"]): c for c in current}
    generated_by_key = {(c["kind"], c["name"]): c for c in generated}
    lines = []
    for key in sorted(set(current_by_key) | set(generated_by_key)):
        cur = current_by_key.get(key)
        gen = generated_by_key.get(key)
        if cur is None:
            lines.append(f"+ {key[0]}/{key[1]}: new (in meta files, not in factory-data.json)")
            continue
        if gen is None:
            lines.append(f"- {key[0]}/{key[1]}: missing (in factory-data.json, no meta file found)")
            continue
        for field in ("posture", "status", "phase", "phases", "desc", "pattern",
                      "operation", "permission_scope"):
            if field in cur or field in gen:
                if cur.get(field) != gen.get(field):
                    lines.append(f"~ {key[0]}/{key[1]}.{field}: {_short(cur.get(field))} -> {_short(gen.get(field))}")
    return lines


def _short(value, limit=70):
    text = repr(value)
    return text if len(text) <= limit else text[:limit - 3] + "..."


def load_factory_data():
    return json.loads(FACTORY_DATA_PATH.read_text(encoding="utf-8"))


def dump_factory_data(data):
    # indent=2 + default ensure_ascii=True is the file's canonical on-disk form (non-ASCII kept
    # as \uXXXX); any other settings rewrite every escaped line and bury the real change.
    return json.dumps(data, indent=2) + "\n"


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="exit 1 if the generated data differs")
    mode.add_argument("--write", action="store_true", help="write components[] and assistants[] back into factory-data.json")
    args = parser.parse_args(argv)

    current_data = load_factory_data()
    components = generate_components(current_data)
    assistants = generate_assistants(current_data)
    diffs = (diff_components(components, current_data["components"])
             + diff_assistants(assistants, current_data.get("assistants", [])))
    if "activities" in current_data:
        diffs.append(f"- activities: legacy key ({len(current_data['activities'])} entries), "
                     f"replaced by assistants[]")

    if args.write:
        current_data["components"] = components
        FACTORY_DATA_PATH.write_text(dump_factory_data(with_assistants(current_data, assistants)),
                                     encoding="utf-8")
        print(f"Wrote {len(components)} components and {len(assistants)} assistants into {FACTORY_DATA_PATH}")
        return 0

    if diffs:
        print("\n".join(diffs))
        print(f"\n{len(diffs)} difference(s) between generated and current factory-data.json.")
    else:
        print(f"Generated {len(components)} components and {len(assistants)} assistants, "
              f"matches factory-data.json exactly.")

    return 1 if (args.check and diffs) else 0


if __name__ == "__main__":
    sys.exit(main())
