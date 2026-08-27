#!/usr/bin/env python3
"""Cross-checks each own-posture skill's skill.meta.md "Dependency graph" table against the
real textual references in its SKILL.md body (EPMCSAPAI-299).

Usage:
    python3 tools/lint_dependencies.py [--fix]

Scoped to `knowledge` and `artifact` rows only: those are the two categories SKILL.md has a
structural, regex-able reference convention for (../../../knowledge/<bucket>,
../../../artifacts/<name> -- see tools/adapter_common.py's referenced_names()). `connector`,
`skill`, `agent`, and `q-gate` rows are read (so a missing skill.meta.md file is still caught)
but not cross-checked -- there's no equivalent structural convention for those types in SKILL.md
yet, and guessing one here would just be a second, undocumented convention. See EPMCSAPAI-291's
"AI-artifacts-maintain-strategy.md" for the Dependency graph's own design; this deliberately
targets that table rather than inventing a separate `needs:` block (see EPMCSAPAI-299's Jira
comment for that reasoning).

Reports two kinds of drift per skill:
  - declared: a knowledge/artifact row names something SKILL.md's own body never references
    via the ../../../<category>/<name> path convention (could be a real gap in SKILL.md, or the
    convention just isn't how that reference happens to be written -- see caveat below).
  - undeclared: SKILL.md references a knowledge bucket or artifact the Dependency graph table
    never mentions.

Caveat: the regex convention only catches path-style references (`../../../knowledge/process/`).
A skill that mentions a bucket in bare prose (`knowledge/process/`, no `../../../` prefix) will
show as "declared but not referenced" here even though the reference is real -- this is a known
limitation of the existing regex scan, not a new one introduced by this script. Treat a flagged
skill's declared-but-not-found list as something to double-check by eye, not as an unconditional
bug.

`--fix` only ever adds rows for genuinely undeclared references (never removes or auto-explains
a declared-but-not-found row) -- for the reason above, removing or judging a declared row without
a human isn't safe to automate.
"""
import argparse
import re
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FACTORY_ROOT / "tools"))
import adapter_common as common  # noqa: E402

TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")


def parse_dependency_graph(meta_path):
    """Returns a list of (type, ref, relation, notes) tuples parsed from meta_path's
    "## Dependency graph" markdown table. Empty list if the file or section doesn't exist."""
    if not meta_path.exists():
        return []
    text = meta_path.read_text(encoding="utf-8")
    marker = "## Dependency graph"
    if marker not in text:
        return []
    section = text.split(marker, 1)[1]
    rows = []
    data_rows_started = False
    for line in section.splitlines():
        line = line.strip()
        if not line:
            if data_rows_started:
                break
            continue
        m = TABLE_ROW_RE.match(line)
        if not m:
            if data_rows_started:
                break
            continue
        cells = [c.strip() for c in m.group(1).split("|")]
        if len(cells) < 4:
            continue
        if set(cells[0]) <= {"-", " "}:  # the |---|---|---|---| separator row
            data_rows_started = True
            continue
        if cells[0].lower() == "type":  # header row
            continue
        data_rows_started = True
        rows.append(tuple(cells[:4]))
    return rows


def declared_refs(rows, kind):
    """kind is 'knowledge' or 'artifact' (singular, matching the table's Type column)."""
    out = []
    seen = set()
    for row_type, ref, _relation, _notes in rows:
        if row_type.strip().lower() != kind:
            continue
        for name in (n.strip() for n in ref.split(",")):
            if name and name not in seen:
                seen.add(name)
                out.append(name)
    return out


def check_skill(name):
    """Returns a dict describing this skill's drift, or None if it has no skill.meta.md at all
    (a separate, already-tracked gap -- see EPMCSAPAI-291's own status updates)."""
    meta_path = common.SKILLS_DIR / name / "skill.meta.md"
    if not meta_path.exists():
        return {"skill": name, "no_meta": True}

    rows = parse_dependency_graph(meta_path)
    result = {"skill": name, "no_meta": False}
    for kind, category in (("knowledge", "knowledge"), ("artifact", "artifacts")):
        declared = set(declared_refs(rows, kind))
        actual = set(common.referenced_names([name], category))
        result[f"{kind}_declared_not_referenced"] = sorted(declared - actual)
        result[f"{kind}_referenced_not_declared"] = sorted(actual - declared)
    return result


def has_drift(result):
    if result.get("no_meta"):
        return True
    return any(
        result[f"{kind}_{direction}"]
        for kind in ("knowledge", "artifact")
        for direction in ("declared_not_referenced", "referenced_not_declared")
    )


def format_report(results):
    lines = []
    for r in results:
        if not has_drift(r):
            continue
        lines.append(f"skill '{r['skill']}':")
        if r.get("no_meta"):
            lines.append("  no skill.meta.md file")
            continue
        for kind in ("knowledge", "artifact"):
            for names, label in (
                (r[f"{kind}_declared_not_referenced"], f"{kind} declared but not found in SKILL.md"),
                (r[f"{kind}_referenced_not_declared"], f"{kind} referenced in SKILL.md but not declared"),
            ):
                if names:
                    lines.append(f"  {label}: {', '.join(names)}")
    return "\n".join(lines)


def apply_fix(name, result):
    """Appends a new Dependency graph row for each referenced-but-undeclared knowledge/artifact.
    Never touches declared-but-not-found rows -- see module docstring."""
    meta_path = common.SKILLS_DIR / name / "skill.meta.md"
    text = meta_path.read_text(encoding="utf-8")
    new_lines = []
    for kind, key in (("knowledge", "knowledge_referenced_not_declared"),
                      ("artifact", "artifact_referenced_not_declared")):
        for ref in result[key]:
            relation = "consumes"
            new_lines.append(f"| {kind} | {ref} | {relation} | TODO: describe this relation |")
    if not new_lines:
        return False
    if not text.endswith("\n"):
        text += "\n"
    text += "\n".join(new_lines) + "\n"
    meta_path.write_text(text, encoding="utf-8")
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--fix", action="store_true",
                         help="append rows for referenced-but-undeclared knowledge/artifacts; never removes anything")
    args = parser.parse_args(argv)

    names = common.all_own_skill_names()
    results = [check_skill(name) for name in names]

    if args.fix:
        fixed = []
        for r in results:
            if r.get("no_meta"):
                continue
            if apply_fix(r["skill"], r):
                fixed.append(r["skill"])
        if fixed:
            print(f"Added missing rows for: {', '.join(fixed)}")
            results = [check_skill(name) for name in names]

    report = format_report(results)
    if report:
        print(report)
        return 1
    print(f"Checked {len(names)} skills, no drift found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
