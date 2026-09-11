#!/usr/bin/env python3
"""Generates factory-data.json's `components[]` array from the *.meta.md sidecar files, instead
of hand-maintaining it (long-term direction discussed for EPMCSAPAI-291/299/300).

Usage:
    python3 tools/generate_factory_data.py            # print a diff against the current file
    python3 tools/generate_factory_data.py --check     # same, but exit 1 if anything differs
    python3 tools/generate_factory_data.py --write     # write the generated components[] back
                                                        # into factory-data.json (only that key;
                                                        # everything else untouched)

Scope: `components[]` only. `activities[]` is deliberately out of scope for now -- it depends on
a `use-case:` tag that doesn't exist in any meta file yet (see the day's Jira thread on
EPMCSAPAI-291 for the open question about where a use case's own owner/engagement/status will
live once activities/*.md's role changes). The static taxonomy blocks (phases, bands, roles,
engagements, statuses, postures, rows, coverage, tools, scaffold, groups) are read from the
current file and carried over verbatim -- they're the vocabulary meta files use, not something
derived from them.

Field derivation:
  - kind / name: which meta file, and its own skill:/agent:/connector:/artifact:/gate: field.
  - posture: "own" if source: internal, else "adopt".
  - status: sdlc-stage mapped through not-ready->notstarted, in-progress->progress,
    in-test->in-test, ready->ready.
  - phase (skill/agent): parsed from category: "SAP Activate / <Phase>".
  - phase (connector/gate): always "all" -- confirmed against every current instance, no
    exceptions found; these two kinds have no category field to derive it from anyway.
  - phase (artifact): computed from the artifact's own Dependency graph "produced-by" rows --
    look up each producing skill/agent's own phase (via *its* category field) and take the set.
    One producer (or several agreeing) -> that phase. Several disagreeing, or none at all -> "all".
    This matches the real data far better than reading the artifact's own category field
    directly, which only names a single "primary" phase even for artifacts explicitly documented
    (in their own Notes) as produced across several -- see e.g. sign-off-record.
  - pattern (connector only): connector-type value, as a string or list exactly as written.
  - desc: TEMPORARY passthrough from the current factory-data.json's own value, keyed by
    (kind, name) -- no meta kind has a short structured description field yet (see EPMCSAPAI-291's
    Jira thread proposing `desc:`). Once that field exists, this script should read it from the
    meta file instead of this lookup. A component with no current entry gets desc: null and shows
    up in the diff, since there's nothing to source it from yet.

Known, expected divergence from the current file: Q-gate names. factory-data.json still uses the
old arrow slugs ("explore→realize"); gate.meta.md and the gates/ directories were already renamed
to hyphenated slugs ("explore-realize") in a prior commit. This script emits the hyphenated form,
which is correct going forward -- the arrow form is what's actually stale (also the reason
tests/test_factory_integrity.py currently has 69 failures unrelated to this change).
"""
import argparse
import json
import re
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "tools"))
import adapter_common as common  # noqa: E402
import lint_dependencies as ld  # noqa: E402

FACTORY_DATA_PATH = FACTORY_ROOT / "factory-data.json"

STATUS_MAP = {
    "not-ready": "notstarted",
    "in-progress": "progress",
    "in-test": "in-test",
    "ready": "ready",
}

KIND_DIRS = {
    "Skill": ("skills", "skill.meta.md", "skill"),
    "Agent": ("agents", "agent.meta.md", "agent"),
    "Connector": ("connectors", "connector.meta.md", "connector"),
    "Artifact": ("artifacts", "artifact.meta.md", "artifact"),
    "Q-gate": ("gates", "gate.meta.md", "gate"),
    "Assistant": ("assistants", "assistant.meta.md", "assistant"),
}

CATEGORY_RE = re.compile(r'"SAP Activate / ([A-Za-z]+)"')
FIELD_RE = re.compile(r'^([a-z][a-z-]*):\s*(.+?)\s*(?:#.*)?$')


def read_frontmatter(meta_path):
    """Returns {field: raw_value_string} for the simple `key: value` lines in meta_path's
    frontmatter (between the two `---` markers). Doesn't attempt full YAML parsing -- these
    files are hand-authored with inline comments a real YAML parser would choke on far less
    gracefully than this factory's own tooling already tolerates elsewhere (see
    adapter_common.py's own light-touch parsing precedent)."""
    text = meta_path.read_text(encoding="utf-8")
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}
    fields = {}
    for line in parts[1].splitlines():
        m = FIELD_RE.match(line.strip())
        if m:
            fields[m.group(1)] = m.group(2)
    return fields


def parse_phase_from_category(fields):
    m = CATEGORY_RE.search(fields.get("category", ""))
    return m.group(1) if m else None


def component_phase(kind, name, fields, meta_path):
    if kind in ("Connector", "Q-gate", "Assistant"):
        return "all"
    if kind in ("Skill", "Agent"):
        phase = parse_phase_from_category(fields)
        return phase or "all"
    if kind == "Artifact":
        rows = ld.parse_dependency_graph(meta_path)
        phases = set()
        for row_type, ref, relation, _notes in rows:
            if relation.strip().lower() != "produced-by":
                continue
            for producer in (r.strip() for r in ref.split(",")):
                producer_phase = _lookup_producer_phase(row_type.strip().lower(), producer)
                if producer_phase:
                    phases.add(producer_phase)
        if len(phases) == 1:
            return next(iter(phases))
        return "all"
    raise ValueError(kind)


def _lookup_producer_phase(producer_kind, name):
    if producer_kind == "skill":
        meta_path = FACTORY_ROOT / "skills" / name / "skill.meta.md"
    elif producer_kind == "agent":
        meta_path = FACTORY_ROOT / "agents" / name / "agent.meta.md"
    else:
        return None
    if not meta_path.exists():
        return None
    return parse_phase_from_category(read_frontmatter(meta_path))


def parse_pattern(raw):
    raw = raw.strip()
    if raw.startswith("["):
        return [v.strip() for v in raw.strip("[]").split(",") if v.strip()]
    return raw


def load_desc_lookup():
    data = json.loads(FACTORY_DATA_PATH.read_text(encoding="utf-8"))
    return {(c["kind"], c["name"]): c.get("desc") for c in data["components"]}


def assistant_description(assistant_path):
    """Return the first prose paragraph from an assistant.md sidecar."""
    content_path = assistant_path / "assistant.md"
    if not content_path.exists():
        return None
    lines = content_path.read_text(encoding="utf-8").splitlines()
    in_frontmatter = False
    paragraph = []
    for line in lines:
        stripped = line.strip()
        if stripped == "---":
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter or stripped.startswith("#"):
            if paragraph:
                break
            continue
        if not stripped:
            if paragraph:
                break
            continue
        paragraph.append(stripped)
    return " ".join(paragraph) or None


def generate_components():
    desc_lookup = load_desc_lookup()
    components = []
    generated_keys = set()
    for kind, (root_name, meta_name, field_name) in KIND_DIRS.items():
        root = FACTORY_ROOT / root_name
        if not root.exists():
            continue
        for child in sorted(root.iterdir()):
            meta_path = child / meta_name
            if not meta_path.exists():
                continue
            if kind == "Assistant" and not (child / "assistant.md").exists():
                continue
            fields = read_frontmatter(meta_path)
            name = fields.get(field_name, child.name)
            source = fields.get("source", "")
            # Every current Connector is posture "adopt" regardless of its own source: value --
            # even a connector whose wiring script we wrote ourselves still integrates an
            # external system, so "own" (this factory's own authored content) never applies to
            # the kind itself. source: internal means something different for a Connector than
            # for a Skill/Agent, where it correctly does mean own-authored.
            posture = "adopt" if kind == "Connector" else ("own" if source == "internal" else "adopt")
            status = STATUS_MAP.get(fields.get("sdlc-stage", ""), "notstarted")
            phase = component_phase(kind, name, fields, meta_path)
            desc = assistant_description(child) if kind == "Assistant" else desc_lookup.get((kind, name))
            entry = {
                "kind": kind,
                "name": name,
                "posture": posture,
                "status": status,
                "phase": phase,
                "desc": desc,
            }
            if kind == "Connector":
                entry["pattern"] = parse_pattern(fields.get("connector-type", ""))
            components.append(entry)
            generated_keys.add((kind, name))
    # Keep legacy/adopted entries that intentionally have no local sidecar. Removing these
    # silently makes activities refer to components that disappear from the canonical model.
    current = json.loads(FACTORY_DATA_PATH.read_text(encoding="utf-8"))
    for entry in current.get("components", []):
        key = (entry.get("kind"), entry.get("name"))
        if key not in generated_keys:
            components.append(entry)
    components.sort(key=lambda item: (item.get("kind", ""), item.get("name", "")))
    return components


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
        for field in ("posture", "status", "phase", "pattern"):
            if field in cur or field in gen:
                if cur.get(field) != gen.get(field):
                    lines.append(f"~ {key[0]}/{key[1]}.{field}: {cur.get(field)!r} -> {gen.get(field)!r}")
    return lines


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="exit 1 if the generated components[] differs")
    parser.add_argument("--write", action="store_true", help="write the generated components[] back into factory-data.json")
    args = parser.parse_args(argv)

    current_data = json.loads(FACTORY_DATA_PATH.read_text(encoding="utf-8"))
    generated = generate_components()
    diffs = diff_components(generated, current_data["components"])

    if args.write:
        current_data["components"] = generated
        FACTORY_DATA_PATH.write_text(json.dumps(current_data, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {len(generated)} components into {FACTORY_DATA_PATH}")
        return 0

    if diffs:
        print("\n".join(diffs))
        print(f"\n{len(diffs)} difference(s) between generated and current components[].")
    else:
        print(f"Generated {len(generated)} components, matches factory-data.json exactly.")

    return 1 if (args.check and diffs) else 0


if __name__ == "__main__":
    sys.exit(main())
