"""Shared logic for this factory's per-tool install adapters.

Not a factory component itself -- lives in tools/ alongside the adapters
(tools/<tool>/adapter/install.py) that import it. Kept tool-agnostic: connector
normalization and skill discovery don't change per target tool, only where the
adapter writes them and how the entry file/mcp file are shaped.
"""
import datetime
import hashlib
import json
import re
import shutil
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent
FACTORY_JSON = FACTORY_ROOT / "factory.json"
FACTORY_DATA_JSON = FACTORY_ROOT / "factory-data.json"
SKILLS_DIR = FACTORY_ROOT / "skills"
AGENTS_DIR = FACTORY_ROOT / "agents"
CONNECTORS_DIR = FACTORY_ROOT / "connectors"
KNOWLEDGE_DIR = FACTORY_ROOT / "knowledge"
ARTIFACTS_DIR = FACTORY_ROOT / "artifacts"

FUNCTIONAL_KEYS = {"type", "command", "args", "env"}

# A connector's server.json writes env-var *references* (not secret values -- see each
# connector's connector.md, real secrets always live outside the project) using this one
# canonical placeholder syntax: ${VAR_NAME}. Each tool's own MCP config expects env-var
# references in its own interpolation syntax, so this translates the canonical form into
# whichever syntax the target tool actually reads at runtime. Pattern ported from
# dyoshikawa/rulesync's per-tool env-var formatters (projects/rulesync's mcp-env-var-format.ts),
# which solves the same normalize-one-source-into-many-shapes problem this factory has for MCP
# config in general.
ENV_VAR_PLACEHOLDER = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")
ENV_VAR_SYNTAX = {
    "claude-code": "${{{var}}}",
    "github-copilot": "${{env:{var}}}",
    "cursor": "${{env:{var}}}",
}


def translate_env_placeholders(value, tool):
    """Rewrites ${VAR} references in a string into `tool`'s own env-var interpolation syntax.
    No-op for tools not in ENV_VAR_SYNTAX (treat as unverified rather than guessing) or for
    non-string values."""
    template = ENV_VAR_SYNTAX.get(tool)
    if not template or not isinstance(value, str):
        return value
    return ENV_VAR_PLACEHOLDER.sub(lambda m: template.format(var=m.group(1)), value)


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


def all_own_agent_names():
    return sorted(p.parent.name for p in AGENTS_DIR.glob("*/agent.md"))


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
    merged from whatever CLI sources contributed them (--skills/--connectors/--agents,
    --activity, ...). kind is 'skill', 'connector', or 'agent'; adopt_hint is the CLI invocation
    to point at for names this adapter doesn't handle (adopt-posture skills, unwired connectors).
    Dies on the first name that isn't installable -- callers rely on this to fail loudly rather
    than partially install."""
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
            elif kind == "agent":
                hint = f"No agents/{n}/agent.md found."
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


def hash_tree(path, ignore_suffixes=()):
    """Hashes every file under path, skipping any whose name ends with one of ignore_suffixes.
    Callers hashing a skill source dir must pass the same suffixes copy_skill()'s
    META_SIDECAR_IGNORE excludes (currently ".meta.md") -- otherwise the source hash includes
    files the installed copy never gets, and drift detection reports every unchanged skill as
    "hand-edited" on every run after the first."""
    h = hashlib.sha256()
    for f in sorted(p for p in path.rglob("*") if p.is_file()):
        if any(f.name.endswith(suf) for suf in ignore_suffixes):
            continue
        rel = f.relative_to(path).as_posix()
        h.update(rel.encode("utf-8"))
        h.update(f.read_bytes())
    return "sha256:" + h.hexdigest()


# ---------- skills ----------

# Defensive, ahead of EPMCSAPAI-291: *.meta.md sidecars don't exist in this repo yet, but once
# they do they carry internal-only governance tags (risk, status, distribution-class) that must
# never reach a client-facing copy. Every copytree below excludes them now so nothing has to
# remember to add this later, the day someone adds the first real *.meta.md file.
META_SIDECAR_IGNORE = shutil.ignore_patterns("*.meta.md")


def copy_skill(name, dest_root):
    """Copies skills/<name>/ into dest_root/<name>/, overwriting. dest_root is the
    tool-specific skills directory (e.g. <project>/.claude/skills or <project>/.agents/skills)."""
    src = SKILLS_DIR / name
    dest = dest_root / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=META_SIDECAR_IGNORE)
    return dest


# ---------- agents ----------

def agent_output_bytes(name):
    """Returns the exact bytes a Claude Code subagent file for this agent should contain.
    agents/<name>/agent.md itself carries no YAML frontmatter (confirmed across every agent in
    this factory) -- it's prose written for a human reading the factory source, not a file
    Claude Code can register as an invocable subagent as-is, despite factory-data.json's
    coverage table calling this "nat" (native, no rewrite needed). Claude Code requires at least
    name/description frontmatter, so this synthesizes it: name from the agent's own directory
    name, description from factory-data.json's existing desc for it (same temporary source used
    elsewhere until a real desc: field exists on agent.meta.md, see EPMCSAPAI-291) with a generic
    fallback if that's not yet recorded. The description is quoted and escaped because several
    real desc values contain a bare colon (e.g. readiness-analyst's), which breaks an unquoted
    YAML scalar -- the exact class of bug already hit once in this factory's own .gitlab-ci.yml."""
    src = AGENTS_DIR / name / "agent.md"
    body = src.read_text(encoding="utf-8")
    desc = component_desc("Agent", name) or f"Bounded agent: {name}"
    desc_escaped = desc.replace("\\", "\\\\").replace('"', '\\"')
    frontmatter = f'---\nname: {name}\ndescription: "{desc_escaped}"\n---\n\n'
    return (frontmatter + body).encode("utf-8")


def copy_agent(name, dest_path):
    """Writes the synthesized subagent file (see agent_output_bytes) to dest_path -- a single
    flat file, not a directory; Claude Code's subagent convention is one .md file per agent,
    unlike skills' own per-skill folder convention."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_bytes(agent_output_bytes(name))
    return dest_path


# ---------- connectors ----------

def normalize_connector(name, destinations, tool=None):
    """Reads connectors/<name>/server.json, detects its shape, and returns a plain
    {name: {type, command, args, ...}} mapping stripped of documentation-only keys, with any
    ${VAR} env-var references in "env" translated into `tool`'s own interpolation syntax (see
    ENV_VAR_SYNTAX; no-op if tool is None or unlisted -- args' <destination> substitution below
    is unaffected, that's a literal CLI value, not an env-var reference).
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
        if "env" in entry:
            entry["env"] = {
                k: translate_env_placeholders(v, tool) for k, v in entry["env"].items()
            }
        out[key] = entry
    return out, hash_tree(CONNECTORS_DIR / name), dest_name


def copy_connector(name, project):
    """Copies connectors/<name>/ (connector.md, server.json, and any helper scripts, e.g. jira's
    scripts/start-mcp-atlassian.py launcher) verbatim into <project>/connectors/<name>/ --
    mirrors copy_skill()'s treatment of skills. Two things this fixes: a server.json entry's
    relative args path (e.g. "./connectors/jira/scripts/start-mcp-atlassian.py") only resolves if
    that script actually exists inside the client project, not just inside this factory repo; and
    the generated entry file's pointer at "connectors/<name>/connector.md" for the credential
    Wiring step needs that file to actually be there for a project that doesn't also have this
    whole factory checked out alongside it."""
    src = CONNECTORS_DIR / name
    dest = project / "connectors" / name
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=META_SIDECAR_IGNORE)
    return dest


# ---------- knowledge / artifacts (seeded once, then the project's own to edit) ----------

_REF_RE = {
    "knowledge": re.compile(r"\.\./\.\./\.\./knowledge/([A-Za-z0-9_-]+)"),
    "artifacts": re.compile(r"\.\./\.\./\.\./artifacts/([A-Za-z0-9_-]+)"),
}


def referenced_names(skill_names, category):
    """Scans each installed skill's SKILL.md for ../../../{category}/<name> references (the
    depth a skill sees once installed one level under a tool's skill root, e.g.
    .claude/skills/<skill>/) and returns the deduped set of immediate <name> segments --
    the knowledge bucket, or the artifact's own directory name. category is 'knowledge' or
    'artifacts'."""
    pattern = _REF_RE[category]
    out, seen = [], set()
    for skill in skill_names:
        f = SKILLS_DIR / skill / "SKILL.md"
        if not f.exists():
            continue
        for m in pattern.finditer(f.read_text(encoding="utf-8")):
            name = m.group(1)
            if name not in seen:
                seen.add(name)
                out.append(name)
    return out


def seed_reference_dir(src, dest):
    """Copies src into dest only if dest doesn't exist yet. Unlike copy_skill/copy_connector,
    this never re-syncs an existing destination back to the factory source -- knowledge/ (and
    artifacts/ instances) are explicitly meant to be overridden per project once seeded, see the
    root README's "each ships a central default a project can override per file". Returns True
    if it actually copied, False if dest already existed (left untouched)."""
    if dest.exists():
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=META_SIDECAR_IGNORE)
    return True


# ---------- lock file ----------

def load_lock(project):
    lock = load_json(project / "factory-lock.json", {})
    lock.setdefault("skills", {})
    lock.setdefault("agents", {})
    lock.setdefault("connectors", {})
    lock.setdefault("knowledge", {})
    lock.setdefault("artifacts", {})
    return lock


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


def resolve_selection(skills_csv, connectors_csv, agents_csv, activity_queries, adopt_hint):
    """Merges --skills/--connectors/--agents with one or more --activity's skill/mcp/agent
    components (if given), then validates the combined set through resolve_names -- so any
    activity that references a skill, connector, or agent this adapter can't install fails the
    whole run immediately, same as naming that component directly would (no partial install of
    the others). activity_queries is a list (possibly empty) since --activity is repeatable.
    Returns (skill_names, connector_names, agent_names, activities).

    Agent discovery/resolution is tool-agnostic (agents/<name>/agent.md exists regardless of
    which tool is installing), so this always resolves agent_names the same way. Whether a given
    tool actually supports installing them is that tool's own install.py's call -- Cursor and
    GitHub Copilot don't have a verified agent convention yet (factory-data.json's own coverage
    table records this as an open gap), so their install.py refuses a non-empty agent_names
    rather than silently doing nothing or guessing at a convention."""
    skill_tokens = parse_names(skills_csv)
    connector_tokens = parse_names(connectors_csv)
    agent_tokens = parse_names(agents_csv)
    activities = [find_activity(q) for q in (activity_queries or [])]
    for activity in activities:
        skill_tokens += activity_uses(activity, "skill")
        connector_tokens += activity_uses(activity, "mcp")
        agent_tokens += activity_uses(activity, "agent")

    if not skill_tokens and not connector_tokens and not agent_tokens:
        if activities:
            names = ", ".join(f"'{a['title']}'" for a in activities)
            die(
                f"activit{'y' if len(activities) == 1 else 'ies'} {names} ha{'s' if len(activities) == 1 else 've'} "
                "no skill, connector, or agent components -- this adapter only installs "
                "skills/connectors/agents, not artifacts/knowledge/gates"
            )
        die("nothing requested -- pass --skills, --connectors, --agents, and/or --activity")

    skill_names = resolve_names(skill_tokens, all_own_skill_names(), "skill", adopt_hint) if skill_tokens else []
    connector_names = (
        resolve_names(connector_tokens, all_wired_connector_names(), "connector", adopt_hint)
        if connector_tokens else []
    )
    agent_names = resolve_names(agent_tokens, all_own_agent_names(), "agent", adopt_hint) if agent_tokens else []
    return skill_names, connector_names, agent_names, activities
