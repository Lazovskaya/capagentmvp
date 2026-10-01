"""Shared logic for this factory's per-tool install adapters.

Not a factory component itself -- lives in scripts/ alongside the adapters
(scripts/<tool>/adapter/install.py) that import it. Kept tool-agnostic: connector
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
ASSISTANTS_DIR = FACTORY_ROOT / "assistants"
CONNECTORS_DIR = FACTORY_ROOT / "connectors"
KNOWLEDGE_DIR = FACTORY_ROOT / "knowledge"
ARTIFACTS_DIR = FACTORY_ROOT / "artifacts"
TOOLS_DIR = FACTORY_ROOT / "tools"
GATES_DIR = FACTORY_ROOT / "gates"

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


def _first_paragraph(text):
    """Returns the first prose paragraph following a file's leading `# Title` line, its lines
    joined into one sentence-flow string. Used for Agent/Assistant/Connector bodies, none of
    which carry their own frontmatter description -- their opening paragraph already reads as
    a one-line summary by convention, so this reuses it instead of inventing a second copy."""
    lines = text.splitlines()
    i = 0
    while i < len(lines) and not lines[i].startswith("# "):
        i += 1
    i += 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    para = []
    while i < len(lines) and lines[i].strip():
        para.append(lines[i].strip())
        i += 1
    return " ".join(para) or None


def _skill_frontmatter_description(name):
    path = SKILLS_DIR / name / "SKILL.md"
    if not path.exists():
        return None
    match = re.match(r"^---\n(.*?)\n---", path.read_text(encoding="utf-8"), re.DOTALL)
    if not match:
        return None
    for line in match.group(1).splitlines():
        if line.startswith("description:"):
            return line[len("description:"):].strip() or None
    return None


_SENTENCE_END_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z`*(\"])")


def _first_sentence(text):
    if not text:
        return None
    return _SENTENCE_END_RE.split(text.strip(), maxsplit=1)[0] or None


def _artifact_schema_description(name):
    path = ARTIFACTS_DIR / name / "schema.json"
    if not path.exists():
        return None
    return _first_sentence(json.loads(path.read_text(encoding="utf-8")).get("description"))


def _knowledge_notes_description(name):
    for meta_path in KNOWLEDGE_DIR.glob("**/knowledge.meta.md"):
        if read_frontmatter_fields(meta_path).get("knowledge_source") != name:
            continue
        text = meta_path.read_text(encoding="utf-8")
        if "## Notes" not in text:
            return None
        para = []
        for line in text.split("## Notes", 1)[1].splitlines()[1:]:
            if line.startswith("## ") or (not line.strip() and para):
                break
            if line.strip():
                para.append(line.strip())
        return _first_sentence(" ".join(para))
    return None


def component_desc(kind, name):
    """Derives a one-line description straight from the component's own source file -- Skill
    from SKILL.md's own `description:` frontmatter; Agent/Assistant/Connector/Tool/Q-gate from
    their body's opening paragraph; Artifact from the first sentence of schema.json's
    `description`; Knowledge from the first sentence of its sidecar's `## Notes`. Deliberately
    never reads factory-data.json: that file is *generated from* these sources, not read from."""
    if kind == "Skill":
        return _skill_frontmatter_description(name)
    if kind == "Artifact":
        return _artifact_schema_description(name)
    if kind == "Knowledge":
        return _knowledge_notes_description(name)
    path = {
        "Agent": AGENTS_DIR / name / "agent.md",
        "Assistant": ASSISTANTS_DIR / name / "assistant.md",
        "Connector": CONNECTORS_DIR / name / "connector.md",
        "Tool": TOOLS_DIR / name / "tool.md",
        "Q-gate": GATES_DIR / name / "gate.md",
    }.get(kind)
    if path is None or not path.exists():
        return None
    return _first_paragraph(path.read_text(encoding="utf-8"))


# ---------- discovery ----------

def all_own_skill_names():
    return sorted(p.parent.name for p in SKILLS_DIR.glob("*/SKILL.md"))


def all_own_agent_names():
    return sorted(p.parent.name for p in AGENTS_DIR.glob("*/agent.md"))


def all_own_assistant_names():
    return sorted(p.parent.name for p in ASSISTANTS_DIR.glob("*/assistant.md"))


def all_own_tool_names():
    return sorted(p.parent.name for p in TOOLS_DIR.glob("*/tool.md"))


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
            elif kind == "assistant":
                hint = f"No assistants/{n}/assistant.md found."
            elif kind == "tool":
                hint = f"No tools/{n}/tool.md found."
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


def hash_dir_files(path, ignore_suffixes=()):
    """Returns {relpath: contentHash} for every file under path, skipping names ending in
    ignore_suffixes. Unlike hash_tree's single combined digest, callers syncing knowledge/
    artifacts back out of an install need to know which individual file changed -- those kinds
    are seeded once and then explicitly "yours to edit per file" (see seed_reference_dir), so a
    single whole-tree hash can't tell a brand-new file from an edit to an existing one."""
    out = {}
    if not path.is_dir():
        return out
    for f in sorted(p for p in path.rglob("*") if p.is_file()):
        if any(f.name.endswith(suf) for suf in ignore_suffixes):
            continue
        out[f.relative_to(path).as_posix()] = hash_file(f)
    return out


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

# *.meta.md sidecars carry internal-only governance tags (risk, status, distribution-class)
# that must never reach a client-facing copy. Every copytree below excludes them.
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
    name from the agent's directory name, description from the opening paragraph of agent.md
    (via component_desc), with a generic fallback if none is found. A desc: field on agent.meta.md
    would be more reliable but hasn't been added yet. The description is quoted and escaped because several
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


# ---------- assistants ----------

def assistant_output_bytes(name):
    """Returns the exact bytes a Claude Code subagent file for this Assistant should contain.
    Same synthesis as agent_output_bytes -- assistants/<name>/assistant.md carries no YAML
    frontmatter either, and Claude Code has no native "Assistant" primitive distinct from a
    subagent, so an Assistant is delivered the same way an Agent is: one synthesized .md file."""
    src = ASSISTANTS_DIR / name / "assistant.md"
    body = src.read_text(encoding="utf-8")
    desc = component_desc("Assistant", name) or f"Role-scoped entry point: {name}"
    desc_escaped = desc.replace("\\", "\\\\").replace('"', '\\"')
    frontmatter = f'---\nname: {name}\ndescription: "{desc_escaped}"\n---\n\n'
    return (frontmatter + body).encode("utf-8")


def copy_assistant(name, dest_path):
    """Writes the synthesized subagent file (see assistant_output_bytes) to dest_path -- mirrors
    copy_agent."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_bytes(assistant_output_bytes(name))
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
    if raw.get("pattern") == "credentials-only":
        # Connector uses direct REST/CLI tools — no MCP wiring needed. Skip .mcp.json entry.
        return {}, hash_tree(CONNECTORS_DIR / name), destinations.get(name, "default")
    if raw.get("pattern") in {"script", "cli", "documented-only"}:
        die(
            f"connector '{name}' is {raw['pattern']}, not an MCP connector; "
            f"run the documented command in connectors/{name}/connector.md"
        )
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


# ---------- Dependency graph parsing (shared with lint_dependencies.py) ----------

DEP_TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")


def parse_dependency_graph(meta_path):
    """Returns a list of (type, ref, relation, notes) tuples parsed from meta_path's
    "## Dependency graph" markdown table. Empty list if the file or section doesn't exist.
    Shared by lint_dependencies.py (drift checking) and this module's own
    expand_dependencies() (transitive packaging resolution) -- kept in one place so both read
    the exact same table shape."""
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
        m = DEP_TABLE_ROW_RE.match(line)
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


def load_knowledge_sources():
    """Returns {knowledge_source_id: source_location} for every governed knowledge.meta.md
    sidecar under knowledge/ (knowledge-template-MVP.md v0.3, EPMCSAPAI-291/332).
    source_location is the repo-relative path declared in the sidecar's own frontmatter, e.g.
    'knowledge/domain-packs/sap-best-practices/'. Uses the same tolerant, indentation-stripping
    line scan as read_frontmatter_fields() below -- no real YAML parser, because these
    hand-authored files carry inline comments."""
    field_re = re.compile(r'^([a-z][a-z0-9_-]*):\s*(.+?)\s*(?:#.*)?$')
    sources = {}
    for meta_path in sorted(KNOWLEDGE_DIR.glob("**/knowledge.meta.md")):
        text = meta_path.read_text(encoding="utf-8")
        parts = text.split("---", 2)
        if len(parts) < 3:
            continue
        fields = {}
        for line in parts[1].splitlines():
            m = field_re.match(line.strip())
            if m:
                fields[m.group(1)] = m.group(2)
        source_id = fields.get("knowledge_source")
        source_location = fields.get("source_location")
        if source_id and source_location:
            sources[source_id] = source_location
    return sources


# ---------- use case resolution (v0.3's own axis: Assistant/Agent use_case_ids, distinct from
# factory-data.json's older activities[] used by --activity above) ----------

_FRONTMATTER_FIELD_RE = re.compile(r'^([a-z][a-z0-9_-]*):\s*(.+?)\s*(?:#.*)?$')


def read_frontmatter_fields(meta_path):
    """Tolerant scalar/list frontmatter reader -- same non-YAML line scan as
    load_knowledge_sources(), extended to also split a `[a, b, c]` bracketed list value into a
    real list. Returns {} if meta_path doesn't exist or has no frontmatter block."""
    if not meta_path.exists():
        return {}
    text = meta_path.read_text(encoding="utf-8")
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}
    fields = {}
    for line in parts[1].splitlines():
        m = _FRONTMATTER_FIELD_RE.match(line.strip())
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if val.startswith("[") and val.endswith("]"):
            fields[key] = [v.strip().strip("\"'") for v in val[1:-1].split(",") if v.strip()]
        else:
            fields[key] = val
    return fields


def resolve_use_case(use_case_id):
    """Returns (assistant_names, agent_names): every own-posture Assistant/Agent whose
    assistant.meta.md/agent.meta.md declares use_case_id in its own `use_case_ids` list. This is
    the v0.3 metadata's own axis for "what implements this use case" -- distinct from
    factory-data.json's older activities[] (matched by --activity), which predates use_case_ids
    and is keyed by activity title, not a stable ID."""
    assistants = [
        n for n in all_own_assistant_names()
        if use_case_id in read_frontmatter_fields(ASSISTANTS_DIR / n / "assistant.meta.md").get("use_case_ids", [])
    ]
    agents = [
        n for n in all_own_agent_names()
        if use_case_id in read_frontmatter_fields(AGENTS_DIR / n / "agent.meta.md").get("use_case_ids", [])
    ]
    return assistants, agents


def all_known_use_case_ids():
    """Every use_case_id declared by any own-posture Assistant or Agent, for a resolve_use_case
    failure's error message."""
    ids = set()
    for kind_dir, kind_glob, meta_name in (
        (ASSISTANTS_DIR, "*/assistant.md", "assistant.meta.md"),
        (AGENTS_DIR, "*/agent.md", "agent.meta.md"),
    ):
        for p in kind_dir.glob(kind_glob):
            fields = read_frontmatter_fields(p.parent / meta_name)
            ids.update(fields.get("use_case_ids", []))
    return sorted(ids)


# ---------- transitive dependency expansion (Assistant -> Agent -> Skill -> Tool ->
# Connector/Knowledge Source, per the v0.3 "complete-path" packaging/runtime contract in
# assistant/agent/skill/tool-template-MVP.md) ----------

_META_PATH = {
    "assistant": lambda n: ASSISTANTS_DIR / n / "assistant.meta.md",
    "agent": lambda n: AGENTS_DIR / n / "agent.meta.md",
    "skill": lambda n: SKILLS_DIR / n / "skill.meta.md",
    "tool": lambda n: TOOLS_DIR / n / "tool.meta.md",
    "connector": lambda n: CONNECTORS_DIR / n / "connector.meta.md",
    "artifact": lambda n: ARTIFACTS_DIR / n / "artifact.meta.md",
}
# Dependency-graph types that name a walkable component (has its own meta.md to recurse into).
# knowledge_source is a leaf (its own graph is always empty, per knowledge-template-MVP.md) and
# q-gate isn't a shippable file -- both are collected but never recursed into.
_WALKABLE_KINDS = set(_META_PATH)


def expand_dependencies(skill_names=(), agent_names=(), assistant_names=(), tool_names=(),
                         connector_names=()):
    """Walks the Dependency graph transitively from every given seed component (of whichever
    kinds were explicitly requested), returning a dict of ordered, deduped name lists:
    {"skills", "agents", "assistants", "tools", "connectors", "artifacts", "knowledge_sources"}.
    Every explicit seed is always included even if nothing else references it (so a bare
    --skills request with no owning Agent/Assistant still works, matching this adapter's
    existing single-component test/debug usage) -- this only ever adds to the seed sets, never
    removes from them.

    This is the "complete-path" resolution the v0.3 templates describe (e.g.
    assistant-template-MVP.md: "The Agent's downstream Skills, Tools, transitive Connectors, and
    Knowledge Sources retain one valid common applicability path") -- specify the top of the
    chain (an Assistant) and everything it needs follows automatically, rather than requiring
    every level named independently."""
    out = {
        "assistant": list(dict.fromkeys(assistant_names)),
        "agent": list(dict.fromkeys(agent_names)),
        "skill": list(dict.fromkeys(skill_names)),
        "tool": list(dict.fromkeys(tool_names)),
        "connector": list(dict.fromkeys(connector_names)),
        "artifact": [],
        "knowledge_source": [],
    }
    seen = {kind: set(names) for kind, names in out.items()}
    queue = [(kind, name) for kind, names in out.items() for name in names]

    while queue:
        kind, name = queue.pop()
        if kind not in _WALKABLE_KINDS:
            continue
        meta_path = _META_PATH[kind](name)
        for row_type, ref, _relation, _notes in parse_dependency_graph(meta_path):
            row_type = row_type.strip().lower()
            if row_type not in out:
                continue  # q-gate, or an unrecognized type -- not a shippable component here
            for ref_name in (r.strip("`").strip() for r in ref.split(",")):
                if not ref_name or ref_name in seen[row_type]:
                    continue
                seen[row_type].add(ref_name)
                out[row_type].append(ref_name)
                if row_type in _WALKABLE_KINDS:
                    queue.append((row_type, ref_name))

    return {
        "skills": out["skill"],
        "agents": out["agent"],
        "assistants": out["assistant"],
        "tools": out["tool"],
        "connectors": out["connector"],
        "artifacts": out["artifact"],
        "knowledge_sources": out["knowledge_source"],
    }


def split_existing(expanded):
    """Splits an expand_dependencies() result into (existing, missing) dicts of the same shape.
    A component can be legitimately forward-declared in another's Dependency graph before it's
    actually built (e.g. EPMCSAPAI-321's agent.meta.md declares Skills that land in later
    subtasks) -- packaging/install must skip those, not crash trying to copy a directory that
    doesn't exist yet, while still reporting them so the gap stays visible rather than silently
    disappearing."""
    known_sources = load_knowledge_sources()
    exists_check = {
        "skills": lambda n: (SKILLS_DIR / n / "SKILL.md").exists(),
        "agents": lambda n: (AGENTS_DIR / n / "agent.md").exists(),
        "assistants": lambda n: (ASSISTANTS_DIR / n / "assistant.md").exists(),
        "tools": lambda n: (TOOLS_DIR / n / "tool.md").exists(),
        "connectors": lambda n: (CONNECTORS_DIR / n / "server.json").exists(),
        "artifacts": lambda n: (ARTIFACTS_DIR / n).is_dir(),
        "knowledge_sources": lambda n: n in known_sources,
    }
    existing, missing = {}, {}
    for kind, names in expanded.items():
        check = exists_check[kind]
        existing[kind] = [n for n in names if check(n)]
        missing[kind] = [n for n in names if not check(n)]
    return existing, missing


def knowledge_source_paths(knowledge_source_ids):
    """Resolves each governed knowledge_source ID to its real KNOWLEDGE_DIR-relative directory
    Path, via load_knowledge_sources()'s source_location. Silently skips an ID with no
    registered knowledge.meta.md (e.g. a forward-declared one -- see
    lint_dependencies.py's FORWARD_DECLARED_KNOWLEDGE_SOURCES) rather than raising; packaging
    something that references unregistered knowledge is a known, separately-tracked gap
    (EPMCSAPAI-332), not a reason to fail the whole install."""
    known = load_knowledge_sources()
    paths = []
    for source_id in knowledge_source_ids:
        location = known.get(source_id)
        if not location:
            continue
        paths.append((source_id, FACTORY_ROOT / location))
    return paths


def copy_tool(name, dest_root):
    """Copies tools/<name>/ into dest_root/<name>/, overwriting -- mirrors copy_skill. dest_root
    is the project's tools/ directory; a Tool has no per-tool install convention of its own (it
    isn't a Claude Code/Cursor/Copilot primitive), so every adapter places it at the same
    factory-relative path (<project>/tools/<name>/) that a Skill's own SKILL.md/scripts already
    assume."""
    src = TOOLS_DIR / name
    dest = dest_root / name
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


def prose_referenced_knowledge_buckets(skill_names, graph_knowledge_source_ids):
    """referenced_names(skill_names, "knowledge") filtered to drop any top-level bucket already
    covered more precisely by a knowledge_source declared in a Skill's own Dependency graph
    (resolved via knowledge_source_paths). Without this, a leaf-grain source living two or more
    directories deep (e.g. knowledge/methodology/brownfield-conversion/) still matches the
    regex's single-segment capture as its parent bucket (`methodology`) and would otherwise seed
    that whole bucket -- every unrelated sibling source under it included -- on top of the
    already-correct, precise seeding the dependency graph produces on its own."""
    precise_top_buckets = {
        str(src_path.relative_to(KNOWLEDGE_DIR)).split("/")[0]
        for _sid, src_path in knowledge_source_paths(graph_knowledge_source_ids)
    }
    return [b for b in referenced_names(skill_names, "knowledge") if b not in precise_top_buckets]


def seed_reference_dir(src, dest):
    """Copies src into dest only if dest doesn't exist yet. Unlike copy_skill/copy_connector,
    this never re-syncs an existing destination back to the factory source -- knowledge/ (and
    artifacts/ instances) are explicitly meant to be overridden per project once seeded, see the
    root README's "each ships a central default a project can override per file".

    Returns (copied, content_hash): copied is True if this call actually did the copy, False if
    dest already existed (left untouched); content_hash is src's current hash_dir_files() map
    either way, used by the caller as the lock's baseline -- for a fresh copy that's trivially
    src's own hash, and for backfilling a destination seeded before this bookkeeping existed,
    hashing src (never dest) is deliberate: it's the factory source's hash *now*, so already-
    diverged local content correctly reports as LOCAL-EDIT/CONFLICT on the next sync-back check
    instead of that divergence being silently enshrined as the new baseline."""
    copied = False
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(src, dest, ignore=META_SIDECAR_IGNORE)
        copied = True
    return copied, hash_dir_files(src, ignore_suffixes=(".meta.md",))


# ---------- lock file ----------

def load_lock(project):
    lock = load_json(project / "factory-lock.json", {})
    lock.setdefault("skills", {})
    lock.setdefault("agents", {})
    lock.setdefault("assistants", {})
    lock.setdefault("connectors", {})
    lock.setdefault("knowledge", {})
    lock.setdefault("artifacts", {})
    lock.setdefault("tools", {})
    return lock


def write_lock(project, lock, version, tool):
    lock["factoryVersion"] = version
    lock["generatedBy"] = f"scripts/{tool}/adapter/install.py"
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


def resolve_selection(skills_csv, connectors_csv, agents_csv, activity_queries, adopt_hint,
                       assistants_csv="", use_case_queries=None):
    """Merges --skills/--connectors/--agents/--assistants with one or more --activity's
    skill/mcp/agent components and one or more --use-case's Assistant/Agent matches (if given),
    then validates the combined set through resolve_names -- so any activity or use case that
    references a skill, connector, agent, or assistant this adapter can't install fails the
    whole run immediately, same as naming that component directly would (no partial install of
    the others). activity_queries/use_case_queries are lists (possibly empty), since --activity
    and --use-case are both repeatable. Returns (skill_names, connector_names, agent_names,
    assistant_names, activities).

    --activity (factory-data.json's older activities[], keyed by title) and --use-case (v0.3's
    own `use_case_ids` field on Assistant/Agent sidecars, keyed by stable ID) are two distinct,
    parallel resolution paths -- see resolve_use_case()'s docstring. Both just contribute more
    seed tokens; the actual complete-path expansion from those seeds (Assistant -> Agent ->
    Skill -> Tool -> ...) is expand_dependencies()'s job, called separately after this.

    Agent/Assistant discovery/resolution is tool-agnostic (agents/<name>/agent.md and
    assistants/<name>/assistant.md exist regardless of which tool is installing), so this always
    resolves them the same way. Whether a given tool actually supports installing them is that
    tool's own install.py's call. assistants_csv defaults to "" (optional keyword) so existing
    call sites that don't pass it keep working unchanged; activities don't carry an "assistant"
    component in factory-data.json's own vocabulary, so --activity never contributes to
    assistant_names (--use-case does, when a matching Assistant exists)."""
    skill_tokens = parse_names(skills_csv)
    connector_tokens = parse_names(connectors_csv)
    agent_tokens = parse_names(agents_csv)
    assistant_tokens = parse_names(assistants_csv)
    activities = [find_activity(q) for q in (activity_queries or [])]
    for activity in activities:
        skill_tokens += activity_uses(activity, "skill")
        connector_tokens += activity_uses(activity, "mcp")
        agent_tokens += activity_uses(activity, "agent")

    for use_case_id in (use_case_queries or []):
        uc_assistants, uc_agents = resolve_use_case(use_case_id)
        if not uc_assistants and not uc_agents:
            known = ", ".join(all_known_use_case_ids())
            die(f"no Assistant or Agent declares use_case_ids including '{use_case_id}'. Known use case IDs: {known}")
        assistant_tokens += uc_assistants
        agent_tokens += uc_agents

    if not skill_tokens and not connector_tokens and not agent_tokens and not assistant_tokens:
        if activities:
            names = ", ".join(f"'{a['title']}'" for a in activities)
            die(
                f"activit{'y' if len(activities) == 1 else 'ies'} {names} ha{'s' if len(activities) == 1 else 've'} "
                "no skill, connector, or agent components -- this adapter only installs "
                "skills/connectors/agents/assistants, not artifacts/knowledge/gates"
            )
        die("nothing requested -- pass --skills, --connectors, --agents, --assistants, --use-case, and/or --activity")

    skill_names = resolve_names(skill_tokens, all_own_skill_names(), "skill", adopt_hint) if skill_tokens else []
    connector_names = (
        resolve_names(connector_tokens, all_wired_connector_names(), "connector", adopt_hint)
        if connector_tokens else []
    )
    agent_names = resolve_names(agent_tokens, all_own_agent_names(), "agent", adopt_hint) if agent_tokens else []
    assistant_names = (
        resolve_names(assistant_tokens, all_own_assistant_names(), "assistant", adopt_hint)
        if assistant_tokens else []
    )
    return skill_names, connector_names, agent_names, assistant_names, activities
