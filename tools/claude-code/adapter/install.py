#!/usr/bin/env python3
"""Install this factory's own-posture skills and connectors into a client project for Claude Code.

Usage:
    python3 tools/claude-code/adapter/install.py \\
        --project /path/to/client-project \\
        --skills fit-to-standard,defect-triage \\
        --connectors jira \\
        [--destination jira=myclient] \\
        [--check] [--force]

`--skills` and `--connectors` accept a comma-separated list or the literal '*' (all own-posture
skills / all connectors with real, non-placeholder wiring). Writes into <project>/.claude/skills/,
<project>/.mcp.json, <project>/CLAUDE.md, and <project>/factory-lock.json. Never touches this
repo's own skills/ or connectors/ trees -- see tools/claude-code/adapter/README.md for why that
matters (a real data-loss bug was found in the manual `skills add` process this replaces).
"""
import argparse
import datetime
import hashlib
import json
import shutil
import sys
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parents[3]
FACTORY_JSON = FACTORY_ROOT / "factory.json"
FACTORY_DATA_JSON = FACTORY_ROOT / "factory-data.json"
SKILLS_DIR = FACTORY_ROOT / "skills"
CONNECTORS_DIR = FACTORY_ROOT / "connectors"

DOC_ONLY_KEYS = {"note", "$schema", "description", "repository", "destinationEnvFile", "name"}
FUNCTIONAL_KEYS = {"type", "command", "args", "env"}


def die(msg):
    raise SystemExit(f"error: {msg}")


def load_json(path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def factory_version():
    data = load_json(FACTORY_JSON, {})
    return data.get("version", "unknown")


def component_desc(kind, name):
    data = load_json(FACTORY_DATA_JSON, {})
    for c in data.get("components", []):
        if c.get("kind") == kind and c.get("name") == name:
            return c.get("desc")
    return None


# ---------- discovery ----------

def all_own_skill_names():
    return sorted(
        p.parent.name for p in SKILLS_DIR.glob("*/SKILL.md")
    )


def all_wired_connector_names():
    out = []
    for d in sorted(p.parent.name for p in CONNECTORS_DIR.glob("*/server.json")):
        try:
            normalize_connector(d, destinations={})
        except SystemExit:
            continue
        out.append(d)
    return out


def resolve_names(requested, available, kind):
    if requested == "*":
        return list(available)
    names = [n.strip() for n in requested.split(",") if n.strip()]
    for n in names:
        if n not in available:
            hint = ""
            if kind == "skill":
                index_yaml = SKILLS_DIR / "index.yaml"
                if index_yaml.exists() and n in index_yaml.read_text(encoding="utf-8"):
                    hint = (
                        f" '{n}' looks like an adopt-posture skill (listed in skills/index.yaml, "
                        "no directory here) -- this adapter only installs own-posture skills; "
                        "use the manual `npx skills add` process from the root README for that."
                    )
                else:
                    hint = f" No skills/{n}/SKILL.md found."
            else:
                server = CONNECTORS_DIR / n / "server.json"
                if server.exists():
                    hint = f" connectors/{n}/server.json has no real wiring yet (see connectors/{n}/connector.md)."
                else:
                    hint = f" No connectors/{n}/server.json found."
            die(f"unknown {kind} '{n}'.{hint}")
    return names


# ---------- hashing ----------

def hash_bytes(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def hash_file(path):
    return hash_bytes(path.read_bytes())


def hash_tree(path):
    h = hashlib.sha256()
    for f in sorted(p for p in path.rglob("*") if p.is_file()):
        rel = f.relative_to(path).as_posix()
        h.update(rel.encode("utf-8"))
        h.update(f.read_bytes())
    return "sha256:" + h.hexdigest()


# ---------- skills ----------

def install_skill(name, project):
    src = SKILLS_DIR / name
    dest = project / ".claude" / "skills" / name
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    return dest


# ---------- connectors ----------

def normalize_connector(name, destinations):
    server = CONNECTORS_DIR / name / "server.json"
    if not server.exists():
        die(f"connectors/{name}/server.json not found")
    raw = load_json(server)
    dest_name = destinations.get(name, "default")

    if "mcpConfig" in raw:
        entries = raw["mcpConfig"]
    elif name in raw:
        entries = {name: raw[name]}
    else:
        entries = {name: raw}

    out = {}
    for key, cfg in entries.items():
        if cfg.get("command") == "TODO":
            die(
                f"connector '{name}' has no real wiring yet (connectors/{name}/server.json is a "
                f"placeholder) -- see connectors/{name}/connector.md, not installable by this "
                "adapter until it's wired for real"
            )
        entry = {k: v for k, v in cfg.items() if k in FUNCTIONAL_KEYS}
        entry.setdefault("type", "stdio")
        entry["args"] = [
            a.replace("<destination>", dest_name) if isinstance(a, str) else a
            for a in entry.get("args", [])
        ]
        out[key] = entry
    return out, hash_file(server), dest_name


def write_mcp_json(project, all_entries):
    path = project / ".mcp.json"
    existing = load_json(path, {})
    existing.update(all_entries)
    write_json(path, existing)
    return path


# ---------- entry file ----------

def write_claude_md(project, installed_skills, installed_connectors, version):
    lines = [
        "<!-- Generated by sap-ai-factory's Claude Code adapter",
        "     (tools/claude-code/adapter/install.py). Do not hand-edit -- rerun the adapter",
        "     instead; it will overwrite this file. -->",
        "",
        "# SAP AI Factory -- installed components",
        "",
        f"Factory version: `{version}`  ",
        f"Generated: {datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}",
        "",
        "## Skills",
        "",
    ]
    for name in installed_skills:
        desc = component_desc("Skill", name)
        lines.append(f"- **{name}** -- {desc}" if desc else f"- **{name}**")
    lines += ["", "## Connectors", ""]
    for name in installed_connectors:
        desc = component_desc("Connector", name)
        line = f"- **{name}** -- {desc}" if desc else f"- **{name}**"
        line += f" Credentials are not wired by this adapter -- follow the \"Wiring\" section in connectors/{name}/connector.md."
        lines.append(line)
    lines.append("")
    (project / "CLAUDE.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


# ---------- lock file ----------

def load_lock(project):
    return load_json(project / "factory-lock.json", {"skills": {}, "connectors": {}})


def write_lock(project, lock, version):
    lock["factoryVersion"] = version
    lock["generatedBy"] = "tools/claude-code/adapter/install.py"
    lock["generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    lock["tool"] = "claude-code"
    write_json(project / "factory-lock.json", lock)


# ---------- main ----------

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project", required=True, help="path to the client project to install into")
    parser.add_argument("--skills", required=True, help="comma-separated skill names, or '*' for all own-posture skills")
    parser.add_argument("--connectors", required=True, help="comma-separated connector names, or '*' for all with real wiring")
    parser.add_argument("--destination", action="append", default=[], metavar="CONNECTOR=NAME",
                         help="override the <destination> credential-file name for one connector; repeatable")
    parser.add_argument("--check", action="store_true", help="report drift against factory-lock.json, write nothing")
    parser.add_argument("--force", action="store_true", help="reinstall even if content hash is unchanged")
    args = parser.parse_args()

    project = Path(args.project).resolve()
    if project == FACTORY_ROOT.resolve():
        die("--project resolves to this factory repo itself -- refusing to install into the source repo")

    destinations = {}
    for item in args.destination:
        if "=" not in item:
            die(f"--destination must be CONNECTOR=NAME, got '{item}'")
        k, v = item.split("=", 1)
        destinations[k] = v

    skill_names = resolve_names(args.skills, all_own_skill_names(), "skill")
    connector_names = resolve_names(args.connectors, all_wired_connector_names(), "connector")

    version = factory_version()
    lock = load_lock(project)
    drift = []

    installed_skills = []
    for name in skill_names:
        src_hash = hash_tree(SKILLS_DIR / name)
        prior = lock["skills"].get(name, {})
        unchanged = prior.get("contentHash") == src_hash
        dest = project / ".claude" / "skills" / name
        dest_matches = dest.exists() and hash_tree(dest) == src_hash
        if unchanged and dest_matches and not args.force:
            installed_skills.append(name)
            continue
        if not unchanged:
            reason = "factory source changed"
        elif not dest.exists():
            reason = "not yet installed"
        else:
            reason = "local copy was hand-edited, overwriting with factory source"
        drift.append(f"skill '{name}': {reason}")
        if args.check:
            continue
        install_skill(name, project)
        lock["skills"][name] = {
            "source": f"skills/{name}",
            "contentHash": src_hash,
            "installedTo": f".claude/skills/{name}",
        }
        installed_skills.append(name)

    installed_connectors = []
    mcp_entries = {}
    for name in connector_names:
        entries, src_hash, dest_name = normalize_connector(name, destinations)
        mcp_entries.update(entries)
        prior = lock["connectors"].get(name, {})
        unchanged = prior.get("contentHash") == src_hash and prior.get("destination") == dest_name
        if not unchanged or args.force:
            drift.append(f"connector '{name}' wiring changed")
        if not args.check:
            lock["connectors"][name] = {
                "source": f"connectors/{name}/server.json",
                "contentHash": src_hash,
                "destination": dest_name,
            }
        installed_connectors.append(name)

    if args.check:
        if drift:
            print("Drift found:")
            for d in drift:
                print(f"  - {d}")
            sys.exit(1)
        print("Up to date.")
        return

    if mcp_entries:
        write_mcp_json(project, mcp_entries)
    write_claude_md(project, installed_skills, installed_connectors, version)
    write_lock(project, lock, version)

    if drift:
        print(f"Installed/updated: {', '.join(drift)}")
    else:
        print("Up to date -- nothing to reinstall (use --force to override).")
    print(f"Skills: {', '.join(installed_skills) or '(none)'}")
    print(f"Connectors: {', '.join(installed_connectors) or '(none)'}")


if __name__ == "__main__":
    main()
