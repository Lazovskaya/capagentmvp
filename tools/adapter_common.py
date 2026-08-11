"""Shared logic for this factory's per-tool install adapters.

Not a factory component itself -- lives in tools/ alongside the adapters
(tools/<tool>/adapter/install.py) that import it. Kept tool-agnostic: connector
normalization and skill discovery don't change per target tool, only where the
adapter writes them and how the entry file/mcp file are shaped.
"""
import datetime
import hashlib
import json
import shutil
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
FACTORY_JSON = FACTORY_ROOT / "factory.json"
FACTORY_DATA_JSON = FACTORY_ROOT / "factory-data.json"
SKILLS_DIR = FACTORY_ROOT / "skills"
CONNECTORS_DIR = FACTORY_ROOT / "connectors"

FUNCTIONAL_KEYS = {"type", "command", "args", "env"}


def die(msg):
    raise SystemExit(f"error: {msg}")


def load_json(path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def factory_version():
    return load_json(FACTORY_JSON, {}).get("version", "unknown")


def component_desc(kind, name):
    data = load_json(FACTORY_DATA_JSON, {})
    for c in data.get("components", []):
        if c.get("kind") == kind and c.get("name") == name:
            return c.get("desc")
    return None


# ---------- discovery ----------

def all_own_skill_names():
    return sorted(p.parent.name for p in SKILLS_DIR.glob("*/SKILL.md"))


def all_wired_connector_names():
    out = []
    for d in sorted(p.parent.name for p in CONNECTORS_DIR.glob("*/server.json")):
        try:
            normalize_connector(d, destinations={})
        except SystemExit:
            continue
        out.append(d)
    return out


def parse_names(csv):
    """Splits a comma-separated CLI value into tokens. '' -> []. '*' stays a single token,
    resolved later by resolve_names."""
    if not csv:
        return []
    return [n.strip() for n in csv.split(",") if n.strip()]


def resolve_names(tokens, available, kind, adopt_hint):
    """tokens is a list of names (possibly containing the sentinel '*' for "all"), already
    merged from whatever CLI sources contributed them (--skills/--connectors, --activity, ...).
    kind is 'skill' or 'connector'; adopt_hint is the CLI invocation to point at for names this
    adapter doesn't handle (adopt-posture skills, unwired connectors). Dies on the first name
    that isn't installable -- callers rely on this to fail loudly rather than partially install."""
    if any(t == "*" for t in tokens):
        return list(available)
    names, seen = [], set()
    for n in tokens:
        if n not in seen:
            seen.add(n)
            names.append(n)
    for n in names:
        if n not in available:
            if kind == "skill":
                index_yaml = SKILLS_DIR / "index.yaml"
                if index_yaml.exists() and n in index_yaml.read_text(encoding="utf-8"):
                    hint = (
                        f"'{n}' looks like an adopt-posture skill (listed in skills/index.yaml, "
                        f"no directory here) -- this adapter only installs own-posture skills; "
                        f"use `{adopt_hint}` for that."
                    )
                else:
                    hint = f"No skills/{n}/SKILL.md found."
            else:
                server = CONNECTORS_DIR / n / "server.json"
                if server.exists():
                    hint = (
                        f"connectors/{n}/server.json has no real wiring yet "
                        f"(see connectors/{n}/connector.md)."
                    )
                else:
                    hint = f"No connectors/{n}/server.json found."
            die(f"unknown {kind} '{n}'. {hint}")
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

def copy_skill(name, dest_root):
    """Copies skills/<name>/ into dest_root/<name>/, overwriting. dest_root is the
    tool-specific skills directory (e.g. <project>/.claude/skills or <project>/.agents/skills)."""
    src = SKILLS_DIR / name
    dest = dest_root / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest)
    return dest


# ---------- connectors ----------

def normalize_connector(name, destinations):
    """Reads connectors/<name>/server.json, detects its shape, and returns a plain
    {name: {type, command, args, ...}} mapping stripped of documentation-only keys.
    Raises if the connector has no real wiring yet ("command": "TODO" placeholder)."""
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


# ---------- lock file ----------

def load_lock(project):
    return load_json(project / "factory-lock.json", {"skills": {}, "connectors": {}})


def write_lock(project, lock, version, tool):
    lock["factoryVersion"] = version
    lock["generatedBy"] = f"tools/{tool}/adapter/install.py"
    lock["generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    lock["tool"] = tool
    write_json(project / "factory-lock.json", lock)


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def check_project_path(project):
    project = Path(project).resolve()
    if project == FACTORY_ROOT.resolve():
        die("--project resolves to this factory repo itself -- refusing to install into the source repo")
    return project


# ---------- activities (Delivery pipeline groups) ----------

def find_activity(query):
    """Matches --activity against factory-data.json's activities by title (case-insensitive
    exact, then substring) or by file path/stem. Dies with the full activity list if nothing
    or more than one thing matches, rather than guessing."""
    activities = load_json(FACTORY_DATA_JSON, {}).get("activities", [])
    q = query.strip().lower()
    for a in activities:
        if a["title"].strip().lower() == q:
            return a
    for a in activities:
        if q == a["file"].lower() or q == Path(a["file"]).stem.lower():
            return a
    matches = [a for a in activities if q in a["title"].strip().lower()]
    if len(matches) == 1:
        return matches[0]
    titles = "; ".join(a["title"] for a in activities)
    if len(matches) > 1:
        die(f"'{query}' matches multiple activities ({', '.join(a['title'] for a in matches)}) -- be more specific")
    die(f"no activity matches '{query}'. Known activities: {titles}")


def activity_uses(activity, kind):
    """kind is factory-data.json's own vocabulary here: 'skill' or 'mcp' (not 'connector')."""
    out, seen = [], set()
    for u in activity.get("uses", []):
        if u[0] == kind:
            for n in u[1]:
                if n not in seen:
                    seen.add(n)
                    out.append(n)
    return out


def resolve_selection(skills_csv, connectors_csv, activity_query, adopt_hint):
    """Merges --skills/--connectors with an --activity's skill/mcp components (if given), then
    validates the combined set through resolve_names -- so an activity that references a skill
    or connector this adapter can't install fails the whole run immediately, same as naming that
    component directly would. Returns (skill_names, connector_names, activity_or_None)."""
    skill_tokens = parse_names(skills_csv)
    connector_tokens = parse_names(connectors_csv)
    activity = find_activity(activity_query) if activity_query else None
    if activity:
        skill_tokens += activity_uses(activity, "skill")
        connector_tokens += activity_uses(activity, "mcp")

    if not skill_tokens and not connector_tokens:
        if activity:
            die(
                f"activity '{activity['title']}' has no skill or connector components -- this "
                "adapter only installs skills/connectors, not agents/artifacts/knowledge/gates"
            )
        die("nothing requested -- pass --skills, --connectors, and/or --activity")

    skill_names = resolve_names(skill_tokens, all_own_skill_names(), "skill", adopt_hint) if skill_tokens else []
    connector_names = (
        resolve_names(connector_tokens, all_wired_connector_names(), "connector", adopt_hint)
        if connector_tokens else []
    )
    return skill_names, connector_names, activity
