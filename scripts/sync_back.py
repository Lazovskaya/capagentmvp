#!/usr/bin/env python3
"""Sync an SME's edits made in a generated install (e.g. `sap-ai-factory-test`) back into this
factory repo (`sap-ai-factory`), the repo this script itself lives in and is committed to.

Usage:
    python3 scripts/sync_back.py --project /path/to/sap-ai-factory-test [--check|--apply]
            [--include knowledge,artifacts] [--commit] [--branch NAME] [--open-mr]
            [--protect BRANCH] [--yes] [--dotenv-out PATH]

`--project` points at the *install* to read from (e.g. an `sap-ai-factory-test` checkout) --
this script only ever reads that path, never writes into it. Everything this script writes goes
into the factory checkout it itself lives in (`adapter_common.FACTORY_ROOT`), never into a path
passed on the command line -- see "Which repo is which" in
staff/sme-contribution-roundtrip-plan.md for the full rationale.

Default mode is `--check`: read-only, prints the verdict tables below. Exit code reflects
whether a human needs to look, not whether there's anything to do: LOCAL-EDIT/NEW is the normal,
expected result of checking a branch with real edits -- not a failure -- so it exits 0, with
`--dotenv-out PATH` additionally writing `MR_REQUIRED=true` there for a CI job's `artifacts:
reports: dotenv:` to hand to a later job (`MR_REQUIRED=false` if there's nothing to contribute).
Only a CONFLICT (something no automation should resolve on its own) exits 1, regardless of
`--dotenv-out`. `--apply` writes the LOCAL-EDIT/NEW content it finds into the factory working
tree and stops; nothing is committed unless `--commit` is also passed. `--open-mr` additionally
pushes using GitLab push options (no `glab`/`gh` needed).

Per-component drift verdicts (skills, tools, agents, assistants; knowledge/artifacts are
evaluated per file within their governed directory instead, see below):

    baseline == installed | baseline == source | Verdict         | Action
    ----------------------|---------------------|-----------------|------------------
    yes                   | yes                 | UNCHANGED       | nothing
    yes                   | no                  | UPSTREAM-AHEAD  | re-run install.py
    no                    | yes                 | LOCAL-EDIT      | contribute upstream
    no                    | no                  | CONFLICT        | show both diffs, ask

`baseline` is the install's factory-lock.json contentHash *only once verified reachable* from
either repo's own git history -- an unverifiable (poisoned) baseline is downgraded to
NO-BASELINE rather than trusted, since trusting it blind can misreport a real edit as
UNCHANGED (the worst-direction failure). Structural verdicts, generalized across every kind:
NEW (on disk, no lock entry, no factory source), REMOVED (factory source + prior evidence of
install exist, install copy now gone -- report-only, NEVER applied, see below), ORPHANED-LOCK
(lock entry whose factory source no longer exists), NO-BASELINE (on disk, factory source exists,
but no verified baseline to arbitrate direction).

Safety rules (non-negotiable, see the plan doc for the incidents behind each one):
  - Never rmtree a factory source directory -- inbound is a file-by-file overlay; a factory file
    absent from the install (skill.meta.md, tool.md, schema.json, ...) is left untouched.
  - REMOVED is report-only, always -- --apply never deletes anything from the factory, no matter
    how convincing the git-history annotation looks.
  - Writes only ever land in this script's own FACTORY_ROOT checkout, never in --project.
  - Refuses to run --apply against a dirty factory working tree (so `git diff`/`git checkout .`
    stay a reliable before/after), and asks for confirmation before writing to a protected branch.
  - Connectors are structurally reported (NEW/REMOVED/ORPHANED-LOCK) but never overlaid -- the
    inverse would leak client config (see CLAUDE.md's connector credential pattern) and a known
    latent bug (normalize_connector hashes connector.meta.md, copy_connector excludes it) makes
    their content-hash comparison unreliable anyway; both are explicitly out of scope here.
"""
import argparse
import datetime
import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

sys.path.insert(0, str(Path(__file__).resolve().parent))
import adapter_common as common  # noqa: E402

# Branches this script always asks for confirmation before writing to, on top of whatever
# --protect adds at the CLI. Deliberately a set, not a hardcoded pair, and deliberately does not
# include this session's own throwaway "-sync-test" branches -- see the plan's discussion of why
# an unattended verification run on those branches must not trip this guard.
PROTECTED_BRANCHES = {"main", "feature/architecture-assistant"}

REVERSIBLE_KINDS = ("skill", "tool", "agent", "assistant")


# ---------- git plumbing (both repos: FACTORY_ROOT for reachability, --project for the SME's
# own branch history) ----------

def run_git(repo, *args, check=False):
    res = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=False)
    if check and res.returncode != 0:
        common.die(f"git {' '.join(args)} in {repo} failed: {res.stderr.decode(errors='replace')}")
    return res


def current_branch(repo):
    res = run_git(repo, "rev-parse", "--abbrev-ref", "HEAD")
    branch = res.stdout.decode().strip() if res.returncode == 0 else None
    if branch == "HEAD":
        # Detached HEAD -- a GitLab CI checkout always does this, even when the pipeline is
        # running against a real branch. CI_COMMIT_REF_NAME still names it; without this, both
        # the printed "Writing into factory branch: HEAD" message and the protected-branch
        # confirmation check below are silently defeated (the literal string "HEAD" never
        # matches "main" or "feature/architecture-assistant").
        branch = os.environ.get("CI_COMMIT_REF_NAME", branch)
    return branch


def is_dirty(repo):
    res = run_git(repo, "status", "--porcelain")
    return bool(res.stdout.strip())


def git_log_revs(repo, rel_path, limit=200):
    """Every commit reachable from any ref that touched rel_path, newest first."""
    res = run_git(repo, "log", "--all", f"-{limit}", "--format=%H", "--", rel_path)
    if res.returncode != 0:
        return []
    return [l for l in res.stdout.decode().splitlines() if l]


def git_tree_hash_at(repo, rel_path, rev, ignore_suffixes=()):
    """Recomputes adapter_common.hash_tree's exact digest for rel_path as of `rev`, reading file
    content from git blobs rather than the filesystem. None if rel_path doesn't exist at rev."""
    ls = run_git(repo, "ls-tree", "-r", "--name-only", rev, "--", rel_path)
    if ls.returncode != 0:
        return None
    files = [l for l in ls.stdout.decode().splitlines() if l]
    if not files:
        return None
    h = hashlib.sha256()
    base = PurePosixPath(rel_path)
    for f in sorted(files):
        if any(PurePosixPath(f).name.endswith(suf) for suf in ignore_suffixes):
            continue
        show = run_git(repo, "show", f"{rev}:{f}")
        if show.returncode != 0:
            return None
        relf = PurePosixPath(f).relative_to(base).as_posix()
        h.update(relf.encode("utf-8"))
        h.update(show.stdout)
    return "sha256:" + h.hexdigest()


def git_file_hash_at(repo, rel_path, rev):
    show = run_git(repo, "show", f"{rev}:{rel_path}")
    if show.returncode != 0:
        return None
    return common.hash_bytes(show.stdout)


def git_agent_output_hash_at(repo, kind, name, rev):
    """Reconstructs agent_output_bytes/assistant_output_bytes as of `rev`, reading the raw
    agent.md/assistant.md blob from git history and re-deriving the same synthesized frontmatter
    agent_output_bytes/assistant_output_bytes would -- needed because the installed file's hash
    covers that synthesized frontmatter too, not just the raw body a plain git_file_hash_at
    would read."""
    rel = f"agents/{name}/agent.md" if kind == "agent" else f"assistants/{name}/assistant.md"
    show = run_git(repo, "show", f"{rev}:{rel}")
    if show.returncode != 0:
        return None
    body = show.stdout.decode("utf-8")
    desc = common._first_paragraph(body) or (
        f"Bounded agent: {name}" if kind == "agent" else f"Role-scoped entry point: {name}"
    )
    desc_escaped = desc.replace("\\", "\\\\").replace('"', '\\"')
    frontmatter = f'---\nname: {name}\ndescription: "{desc_escaped}"\n---\n\n'
    return common.hash_bytes((frontmatter + body).encode("utf-8"))


def is_reachable(target_hash, checks):
    """checks: list of (repo, rel_path, kind, ignore_suffixes) where kind is 'tree', 'file',
    'agent', or 'assistant'. Returns (True, "repo@rev") for the first historical revision whose
    recomputed hash matches target_hash, else (False, None)."""
    for repo, rel_path, kind, ignore_suffixes in checks:
        for rev in git_log_revs(repo, rel_path):
            if kind == "tree":
                h = git_tree_hash_at(repo, rel_path, rev, ignore_suffixes)
            elif kind == "file":
                h = git_file_hash_at(repo, rel_path, rev)
            else:
                h = git_agent_output_hash_at(repo, kind, rel_path, rev)
            if h == target_hash:
                return True, f"{repo}@{rev[:8]}"
    return False, None


def git_dir_children(repo, rel_dir, rev):
    """Immediate child names of rel_dir as of rev, or None if rel_dir doesn't exist at rev."""
    tree = rev if rel_dir in (".", "") else f"{rev}:{rel_dir}"
    res = run_git(repo, "ls-tree", "--name-only", tree)
    if res.returncode != 0:
        return None
    return {l for l in res.stdout.decode().splitlines() if l}


# ---------- classification ----------

def classify(baseline_hash, installed_hash, source_hash, has_baseline, reachable):
    if not has_baseline:
        if installed_hash is not None and source_hash is None:
            return "NEW"
        if installed_hash is None and source_hash is not None:
            return "NOT-INSTALLED"
        return "NO-BASELINE"
    if source_hash is None:
        return "ORPHANED-LOCK"
    if installed_hash is None:
        return "REMOVED"
    if not reachable:
        return "NO-BASELINE"
    if baseline_hash == installed_hash and baseline_hash == source_hash:
        return "UNCHANGED"
    if baseline_hash == installed_hash:
        return "UPSTREAM-AHEAD"
    if baseline_hash == source_hash:
        return "LOCAL-EDIT"
    return "CONFLICT"


# Split for --check's exit code / --dotenv-out, not just one "needs attention" bucket: a
# CONFLICT is a genuine "a human must resolve this before anything can be contributed
# automatically" signal (exit 1, pipeline stops there); LOCAL-EDIT/NEW are the normal, expected
# outcome of running --check on a branch with real edits -- not a failure, just something worth
# contributing (exit 0, MR_REQUIRED=true). REMOVED/ORPHANED-LOCK/NO-BASELINE are report-only --
# --apply never acts on them, so they affect neither the exit code nor MR_REQUIRED.
HARD_BLOCKING_VERDICTS = {"CONFLICT"}
ACTIONABLE_VERDICTS = {"LOCAL-EDIT", "NEW"}


# ---------- per-kind hashing ----------

def skill_hashes(project, name):
    src, dst = common.SKILLS_DIR / name, project / ".claude" / "skills" / name
    return (
        common.hash_tree(src, ignore_suffixes=(".meta.md",)) if src.is_dir() else None,
        common.hash_tree(dst) if dst.is_dir() else None,
    )


def tool_hashes(project, name):
    src, dst = common.TOOLS_DIR / name, project / "tools" / name
    return (
        common.hash_tree(src, ignore_suffixes=(".meta.md",)) if src.is_dir() else None,
        common.hash_tree(dst) if dst.is_dir() else None,
    )


def agent_hashes(project, name):
    src, dst = common.AGENTS_DIR / name / "agent.md", project / ".claude" / "agents" / f"{name}.md"
    return (
        common.hash_bytes(common.agent_output_bytes(name)) if src.exists() else None,
        common.hash_file(dst) if dst.exists() else None,
    )


def assistant_hashes(project, name):
    src, dst = common.ASSISTANTS_DIR / name / "assistant.md", project / ".claude" / "agents" / f"{name}.md"
    return (
        common.hash_bytes(common.assistant_output_bytes(name)) if src.exists() else None,
        common.hash_file(dst) if dst.exists() else None,
    )


HASH_FN = {"skill": skill_hashes, "tool": tool_hashes, "agent": agent_hashes, "assistant": assistant_hashes}
FACTORY_REL = {
    "skill": lambda n: f".claude/skills/{n}",
    "tool": lambda n: f"tools/{n}",
    "agent": lambda n: f".claude/agents/{n}.md",
    "assistant": lambda n: f".claude/agents/{n}.md",
}
SOURCE_REL_GIT = {
    "skill": lambda n: f"skills/{n}",
    "tool": lambda n: f"tools/{n}",
    "agent": lambda n: n,
    "assistant": lambda n: n,
}
REACHABILITY_KIND = {"skill": "tree", "tool": "tree", "agent": "agent", "assistant": "assistant"}


# ---------- discovery ----------

def discover_names(kind, project, lock):
    factory_names = {
        "skill": common.all_own_skill_names, "tool": common.all_own_tool_names,
    }[kind]()
    root = project / (".claude/skills" if kind == "skill" else "tools")
    installed = {p.name for p in root.iterdir() if p.is_dir()} if root.is_dir() else set()
    locked = set(lock[kind + "s"].keys())
    return sorted(set(factory_names) | installed | locked)


def discover_agent_like(project, lock):
    """Returns (resolved, ambiguous): resolved is [(name, "agent"|"assistant")]; ambiguous is
    names installed as a bare .claude/agents/<name>.md with no lock entry and no matching
    factory source on either side -- Agents and Assistants share that directory, so a brand-new
    file there is genuinely ambiguous between the two kinds and must be asked about, not guessed
    (see the plan's safety rules)."""
    factory_agents, factory_assistants = set(common.all_own_agent_names()), set(common.all_own_assistant_names())
    locked_agents, locked_assistants = set(lock["agents"].keys()), set(lock["assistants"].keys())
    agents_dir = project / ".claude" / "agents"
    installed = {p.stem for p in agents_dir.glob("*.md")} if agents_dir.is_dir() else set()

    names = factory_agents | factory_assistants | locked_agents | locked_assistants | installed
    resolved, ambiguous = [], []
    for n in sorted(names):
        if n in locked_agents or n in factory_agents:
            resolved.append((n, "agent"))
        elif n in locked_assistants or n in factory_assistants:
            resolved.append((n, "assistant"))
        else:
            ambiguous.append(n)
    return resolved, ambiguous


def discover_connectors(project, lock):
    factory_names = {p.parent.name for p in common.CONNECTORS_DIR.glob("*/server.json")}
    root = project / "connectors"
    installed = {p.name for p in root.iterdir() if p.is_dir()} if root.is_dir() else set()
    locked = set(lock["connectors"].keys())
    return sorted(factory_names | installed | locked)


def removed_via_history(project, rel_dir, on_disk_names, default_branch="main", strip_suffix=None):
    """Names present under rel_dir in the install's own `default_branch` tip but absent from the
    live filesystem now -- the second baseline the plan calls for, independent of whatever the
    current factory-lock.json says (an SME can hand-rewrite/drop lock entries, as 2b0ad70's own
    factory-lock.json did, without the removal being any less real)."""
    at_main = git_dir_children(project, rel_dir, default_branch)
    if at_main is None:
        return set()
    if strip_suffix:
        at_main = {n[: -len(strip_suffix)] if n.endswith(strip_suffix) else n for n in at_main}
    return at_main - on_disk_names


# ---------- component-level classification (skill/tool/agent/assistant) ----------

def classify_component(kind, name, project, lock):
    source_hash, installed_hash = HASH_FN[kind](project, name)
    lock_section = lock["agents"] if kind == "agent" else lock["assistants"] if kind == "assistant" else lock[kind + "s"]
    entry = lock_section.get(name)
    baseline_hash = entry.get("contentHash") if entry else None
    has_baseline = baseline_hash is not None

    reachable, evidence = True, None
    if has_baseline and baseline_hash not in (source_hash, installed_hash):
        rkind = REACHABILITY_KIND[kind]
        checks = []
        if rkind == "tree":
            checks = [
                (common.FACTORY_ROOT, SOURCE_REL_GIT[kind](name), "tree", (".meta.md",)),
                (project, FACTORY_REL[kind](name), "tree", ()),
            ]
        else:
            checks = [
                (common.FACTORY_ROOT, name, rkind, ()),
                (project, FACTORY_REL[kind](name), "file", ()),
            ]
        reachable, evidence = is_reachable(baseline_hash, checks)
    elif has_baseline:
        evidence = "matches current source or installed content"

    verdict = classify(baseline_hash, installed_hash, source_hash, has_baseline, reachable)
    poisoned = has_baseline and not reachable and source_hash is not None and installed_hash is not None

    result = {
        "kind": kind, "name": name, "verdict": verdict,
        "baseline": baseline_hash, "installed": installed_hash, "source": source_hash,
        "reachability_evidence": evidence, "poisoned": poisoned,
    }

    if kind in ("agent", "assistant") and verdict in ("LOCAL-EDIT", "CONFLICT"):
        src = (common.AGENTS_DIR if kind == "agent" else common.ASSISTANTS_DIR) / name / (
            "agent.md" if kind == "agent" else "assistant.md")
        dst = project / ".claude" / "agents" / f"{name}.md"
        if src.exists() and dst.exists():
            if strip_installed_body(dst) == src.read_text(encoding="utf-8"):
                result["frontmatter_only_edit"] = True

    return result


_FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n\n", re.DOTALL)


def strip_installed_body(path):
    text = path.read_text(encoding="utf-8")
    m = _FRONTMATTER_RE.match(text)
    return text[m.end():] if m else text


# ---------- knowledge / artifact: per-file classification within a governed directory ----------

def classify_seeded_dir(kind, name, factory_dir, installed_dir, lock_entry):
    """kind is 'knowledge' or 'artifact'. Walks every file under factory_dir/installed_dir
    (union), classifying each independently against lock_entry's per-file contentHash map --
    unlike skills/tools, these directories are explicitly "seeded once, then yours to edit per
    file" (see adapter_common.seed_reference_dir), so a single whole-tree hash can't tell a
    brand-new file (NEW) from an edit to a file that was already there (LOCAL-EDIT/CONFLICT)."""
    baseline_map = (lock_entry or {}).get("contentHash", {})
    results = []
    if not factory_dir.is_dir() and not installed_dir.is_dir():
        if lock_entry:
            results.append({
                "kind": kind, "name": name, "file": None, "verdict": "ORPHANED-LOCK",
                "reachability_evidence": None,
            })
        return results
    if not factory_dir.is_dir():
        results.append({
            "kind": kind, "name": name, "file": None, "verdict": "ORPHANED-LOCK",
            "reachability_evidence": "factory source directory no longer exists",
        })
        return results
    if not installed_dir.is_dir():
        if lock_entry:
            results.append({
                "kind": kind, "name": name, "file": None, "verdict": "REMOVED",
                "reachability_evidence": None,
            })
        return results

    rels = set()
    for base in (factory_dir, installed_dir):
        rels |= {p.relative_to(base).as_posix() for p in base.rglob("*") if p.is_file() and not p.name.endswith(".meta.md")}

    factory_rel = factory_dir.relative_to(common.FACTORY_ROOT).as_posix()
    for rel in sorted(rels):
        src_f, dst_f = factory_dir / rel, installed_dir / rel
        source_hash = common.hash_file(src_f) if src_f.exists() else None
        installed_hash = common.hash_file(dst_f) if dst_f.exists() else None
        baseline_hash = baseline_map.get(rel)
        has_baseline = baseline_hash is not None
        reachable, evidence = True, None
        if has_baseline and baseline_hash not in (source_hash, installed_hash):
            reachable, evidence = is_reachable(baseline_hash, [
                (common.FACTORY_ROOT, f"{factory_rel}/{rel}", "file", ()),
            ])
        verdict = classify(baseline_hash, installed_hash, source_hash, has_baseline, reachable)
        if verdict == "NOT-INSTALLED":
            continue  # seeded dir exists but this particular factory file was never copied in -- not our concern
        results.append({
            "kind": kind, "name": name, "file": rel, "verdict": verdict,
            "baseline": baseline_hash, "installed": installed_hash, "source": source_hash,
            "reachability_evidence": evidence,
        })
    return results


def discover_seeded(kind, project, lock):
    """kind 'knowledge' or 'artifact'. Returns [(name, factory_dir, installed_dir, lock_entry)]
    -- one per governed directory found via the lock, or on disk under project/knowledge or
    project/artifacts with a matching factory directory (so a directory the SME seeded before
    step 2's backfill existed, or one install.py's own lock inconsistency never tracked, still
    gets checked instead of silently skipped)."""
    out = {}
    if kind == "artifact":
        for name, entry in lock["artifacts"].items():
            out[name] = (name, common.ARTIFACTS_DIR / name, project / "artifacts" / name, entry)
        root = project / "artifacts"
        if root.is_dir():
            for p in root.iterdir():
                if p.is_dir() and p.name not in out and (common.ARTIFACTS_DIR / p.name).is_dir():
                    out[p.name] = (p.name, common.ARTIFACTS_DIR / p.name, p, None)
        return list(out.values())

    # knowledge: lock keys are either a bucket name ("methodology") or a knowledge_source id
    # ("readiness-check-interpretation") whose "source" field carries the real relative path.
    for key, entry in lock["knowledge"].items():
        rel = entry.get("source", f"knowledge/{key}")
        rel = rel[len("knowledge/"):] if rel.startswith("knowledge/") else rel
        out[key] = (key, common.KNOWLEDGE_DIR / rel, project / "knowledge" / rel, entry)
    root = project / "knowledge"
    if root.is_dir():
        for p in sorted(root.rglob("*")):
            if not p.is_dir():
                continue
            rel = p.relative_to(root).as_posix()
            factory_p = common.KNOWLEDGE_DIR / rel
            already = any(str(fd) == str(factory_p) for _n, fd, _idir, _e in out.values())
            if factory_p.is_dir() and not already and any(f.is_file() for f in p.iterdir()):
                out[rel] = (rel, factory_p, p, None)
    return list(out.values())


# ---------- graph impact report (for a likely skill split) ----------

def graph_impact_files():
    files = []
    for pattern in (
        "skills/*/*.meta.md", "skills/*/SKILL.md", "agents/*/*.meta.md", "agents/*/agent.md",
        "assistants/*/*.meta.md", "assistants/*/assistant.md", "tools/*/*.meta.md", "tools/*/tool.md",
        "artifacts/*/*.meta.md", "gates/*/gate.md", "gates/*/gate.meta.md", "activities/*/*.md",
    ):
        files.extend(sorted(common.FACTORY_ROOT.glob(pattern)))
    if common.FACTORY_DATA_JSON.exists():
        files.append(common.FACTORY_DATA_JSON)
    return files


def graph_impact_report(names):
    """Every factory-only file (gates, *.meta.md, factory-data.json, activity pointers, ...)
    that mentions one of `names` by exact word -- the checklist an SME finishing a split/rename
    in their factory branch needs, since about half of it is invisible from the test repo where
    they actually worked (see the plan's reversibility table)."""
    hits = {n: [] for n in names}
    for f in graph_impact_files():
        try:
            text = f.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        rel = f.relative_to(common.FACTORY_ROOT).as_posix()
        for n in names:
            if re.search(rf"\b{re.escape(n)}\b", text):
                hits[n].append(rel)
    return hits


def load_contribution_intent(project):
    """Tolerant reader for .factory-contribution.yaml's `split:` list. Deliberately not a real
    YAML parser (no PyYAML dependency anywhere else in this repo's CI image) -- only understands
    the one shape the plan/factory-contribution skill document:
        split:
          - from: <name>
            into: [a, b, c]
            parent_survives: true
    Returns [] if the file doesn't exist or has no split: section."""
    path = project / ".factory-contribution.yaml"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").splitlines()
    splits, current, in_split, i = [], None, False, 0
    while i < len(lines):
        stripped = lines[i].strip()
        i += 1
        if not stripped or stripped.startswith("#"):
            continue
        if stripped == "split:":
            in_split = True
            continue
        if not in_split:
            continue
        if stripped.startswith("- from:") or (stripped.startswith("from:") and current is None):
            if current:
                splits.append(current)
            current = {"from": stripped.split(":", 1)[1].strip(), "into": [], "parent_survives": False}
        elif stripped.startswith("from:") and current is not None:
            current["from"] = stripped.split(":", 1)[1].strip()
        elif stripped.startswith("into:") and current is not None:
            buf = stripped.split(":", 1)[1].strip()
            while "]" not in buf and i < len(lines):
                buf += " " + lines[i].strip()
                i += 1
            if buf.startswith("[") and buf.endswith("]"):
                current["into"] = [v.strip().strip("\"'") for v in buf[1:-1].split(",") if v.strip()]
        elif stripped.startswith("parent_survives:") and current is not None:
            current["parent_survives"] = stripped.split(":", 1)[1].strip().lower() in ("true", "yes")
    if current:
        splits.append(current)
    return splits


def parent_for_child(declared, name):
    """Looks up which declared split (if any) lists `name` in its `into` -- lets a single
    .factory-contribution.yaml with several `split:` entries name a different parent per split,
    so one MR can mix multiple splits instead of being limited to one global parent."""
    for split in declared:
        if name in split["into"]:
            return split["from"]
    return None


def detect_likely_splits(skill_results, project):
    """Fires whenever any NEW skill appears, with or without a matching REMOVED (the parent can
    survive as a thinned orchestrator, per 2b0ad70) -- and separately flags a co-occurring
    LOCAL-EDIT skill whose installed SKILL.md shrank materially as a likely split parent (higher
    confidence). Either signal is a hint requiring human confirmation, never acted on
    automatically; an explicit .factory-contribution.yaml overrides guessing entirely.

    The graph impact report's search names must include every LOCAL-EDIT skill, not just the
    "shrunk" ones or the new children themselves -- a brand-new child name by definition appears
    nowhere in the factory yet (nothing to search for), while the real parent worth chasing
    through gates/*.meta.md/factory-data.json is whichever existing skill the SME actually
    edited, shrunk or not."""
    new_skills = [r["name"] for r in skill_results if r["verdict"] == "NEW"]
    edited = [r["name"] for r in skill_results if r["verdict"] == "LOCAL-EDIT"]
    shrunk = []
    for name in edited:
        src = common.SKILLS_DIR / name / "SKILL.md"
        dst = project / ".claude" / "skills" / name / "SKILL.md"
        if not (src.exists() and dst.exists()):
            continue
        src_len, dst_len = len(src.read_text(encoding="utf-8")), len(dst.read_text(encoding="utf-8"))
        if src_len > 0 and dst_len < src_len * 0.6:
            shrunk.append(name)
    declared = load_contribution_intent(project)
    return new_skills, edited, shrunk, declared


# ---------- reporting ----------

def print_component_table(results):
    # NOT-INSTALLED means "this factory component exists but was never selected for this
    # install" -- not a verdict about anything the SME did, so it's noise here the same way
    # print_connector_table already excludes it for connectors.
    results = [r for r in results if r["verdict"] != "NOT-INSTALLED"]
    if not results:
        return
    width = max(len(f"{r['kind']} '{r['name']}'") for r in results)
    for r in sorted(results, key=lambda r: (r["kind"], r["name"])):
        label = f"{r['kind']} '{r['name']}'".ljust(width)
        line = f"  {label}  {r['verdict']}"
        if r.get("poisoned"):
            line += "  (lock contentHash unreachable in either repo's git history -- treated as poisoned, downgraded from a false UNCHANGED)"
        if r.get("frontmatter_only_edit"):
            line += "  [frontmatter-only edit -- description: would be silently dropped by --apply]"
        print(line)


def print_file_table(results):
    if not results:
        return
    for r in sorted(results, key=lambda r: (r["kind"], r["name"], r.get("file") or "")):
        loc = f"{r['kind']} '{r['name']}'" + (f" :: {r['file']}" if r.get("file") else "")
        print(f"  {loc}  {r['verdict']}")


def print_connector_table(results):
    if not results:
        return
    for r in sorted(results, key=lambda r: r["name"]):
        if r["verdict"] not in ("REMOVED", "ORPHANED-LOCK", "NEW"):
            note = "  (content-hash comparison unreliable -- see connector.meta.md hashing bug, out of scope)"
        elif r.get("reachability_evidence"):
            note = f"  ({r['reachability_evidence']})"
        else:
            note = ""
        print(f"  connector '{r['name']}'  {r['verdict']}{note}")


# ---------- --apply: inverse transforms ----------

def apply_skill_or_tool(kind, name, project):
    """File-by-file overlay from the install back into the factory -- never rmtree's the factory
    dir first (unlike the outbound copy_skill/copy_tool), so *.meta.md and any other
    factory-only file survive untouched."""
    src_root = project / (".claude/skills" if kind == "skill" else "tools") / name
    dest_root = (common.SKILLS_DIR if kind == "skill" else common.TOOLS_DIR) / name
    dest_root.mkdir(parents=True, exist_ok=True)
    changed = []
    for f in sorted(p for p in src_root.rglob("*") if p.is_file()):
        rel = f.relative_to(src_root)
        dest = dest_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or dest.read_bytes() != f.read_bytes():
            dest.write_bytes(f.read_bytes())
            changed.append(str(rel))
    return changed


def apply_agent_or_assistant(kind, name, project):
    src_dir = common.AGENTS_DIR if kind == "agent" else common.ASSISTANTS_DIR
    dest = src_dir / name / ("agent.md" if kind == "agent" else "assistant.md")
    installed = project / ".claude" / "agents" / f"{name}.md"
    body = strip_installed_body(installed)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(body, encoding="utf-8")


# ---------- step 3: minimal sidecar scaffolding ----------

def scaffold_skill_meta_text(name, owner, project_types, sdlc_phases, risk_freedom, provenance_source):
    lines = [
        "---", f"skill: {name}", 'namespace: "@epam/sap"', "version: 0.1.0", f"owner: {owner}",
        f"project_types: [{', '.join(project_types)}]", f"sdlc_phases: [{', '.join(sdlc_phases)}]",
        f"risk_freedom: {risk_freedom}", "provenance:", f"  source: {provenance_source}",
        "---", "", "## Dependency graph", "", "| Type | Ref | Relation | Notes |", "|---|---|---|---|", "",
    ]
    return "\n".join(lines)


def scaffold_missing_sidecar(name, owner, project_types, sdlc_phases, risk_freedom, provenance_source):
    """Writes skills/<name>/skill.meta.md if it doesn't already exist -- the minimal-viable
    sidecar lint_dependencies.py's unconditional missing-meta.md check requires (the same gate
    step 5 adds to CI). Governance fields the SME never sees while working in the test repo (see
    the plan): owner, project_types, sdlc_phases, risk_freedom, provenance. A standalone function
    -- both this script (--scaffold-sidecars) and, later, the sme-sync-back skill's
    conversational flow (step 6) call it; the skill just collects the same fields by asking
    instead of via CLI flags. False if the sidecar already exists (left untouched)."""
    meta_path = common.SKILLS_DIR / name / "skill.meta.md"
    if meta_path.exists():
        return False
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(
        scaffold_skill_meta_text(name, owner, project_types, sdlc_phases, risk_freedom, provenance_source) + "\n",
        encoding="utf-8",
    )
    return True


def parent_governance_fields(parent_name):
    """Reads owner/project_types/sdlc_phases/risk_freedom straight off an existing skill's own
    skill.meta.md frontmatter -- used to carry a split parent's governance forward to each child
    per the plan's declared-intent handling, so the SME doesn't have to retype what the parent
    already declared."""
    fields = common.read_frontmatter_fields(common.SKILLS_DIR / parent_name / "skill.meta.md")
    return {
        "owner": fields.get("owner"),
        "project_types": fields.get("project_types", []),
        "sdlc_phases": fields.get("sdlc_phases", []),
        "risk_freedom": fields.get("risk_freedom"),
    }


# ---------- main ----------

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project", default=None, help="path to the install to read SME edits from (e.g. sap-ai-factory-test); not needed for --scaffold-sidecars alone")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="read-only (default): report, write nothing")
    mode.add_argument("--apply", action="store_true", help="write LOCAL-EDIT/NEW content into the factory working tree")
    parser.add_argument("--include", default="", help="comma-separated extra kinds for --apply to touch beyond skill,tool,agent,assistant (e.g. knowledge,artifact)")
    parser.add_argument("--dotenv-out", default=None, metavar="PATH", help="write MR_REQUIRED=true|false to PATH in dotenv format, for a CI job's `artifacts: reports: dotenv:` to pass to a later job")
    parser.add_argument("--commit", action="store_true", help="commit the applied changes (requires --apply)")
    parser.add_argument("--branch", default=None, help="branch name to commit onto (default: sync-back/<timestamp>)")
    parser.add_argument("--open-mr", action="store_true", help="push with GitLab MR-creation push options (requires --commit)")
    parser.add_argument("--target-branch", default="feature/architecture-assistant", help="MR target branch for --open-mr")
    parser.add_argument("--protect", action="append", default=[], metavar="BRANCH", help="additional branch name to require confirmation before writing to; repeatable")
    parser.add_argument("--yes", action="store_true", help="skip the protected-branch confirmation prompt (needed for non-interactive/CI use)")
    parser.add_argument("--scaffold-sidecars", action="store_true", help="write missing skill.meta.md sidecars for --scaffold-skills, then continue (or exit if --project wasn't given)")
    parser.add_argument("--scaffold-skills", default="", help="comma-separated skill names to scaffold a sidecar for")
    parser.add_argument("--scaffold-parent", default=None, help="inherit owner/project_types/sdlc_phases/risk_freedom from this existing skill's sidecar, and record it as each scaffolded skill's provenance.source")
    parser.add_argument("--owner", default=None, help="owner: for --scaffold-sidecars when --scaffold-parent isn't given")
    parser.add_argument("--project-types", default=None, help="comma-separated project_types: for --scaffold-sidecars when --scaffold-parent isn't given")
    parser.add_argument("--sdlc-phases", default=None, help="comma-separated sdlc_phases: for --scaffold-sidecars when --scaffold-parent isn't given")
    parser.add_argument("--risk-freedom", default=None, help="risk_freedom: for --scaffold-sidecars when --scaffold-parent isn't given")
    args = parser.parse_args(argv)

    if args.commit and not args.apply:
        common.die("--commit requires --apply")
    if args.open_mr and not args.commit:
        common.die("--open-mr requires --commit")

    if args.scaffold_sidecars:
        # Unlike --apply, no dirty-tree guard here: scaffold_missing_sidecar only ever writes a
        # brand-new skill.meta.md that doesn't exist yet (never overwrites), and the plan's own
        # workflow is --apply (which legitimately leaves the tree dirty) followed immediately by
        # scaffolding the new skill(s) it just copied in -- requiring a clean tree in between
        # would break that sequence for no safety benefit.
        skill_names = common.parse_names(args.scaffold_skills)
        if not skill_names:
            common.die("--scaffold-sidecars requires --scaffold-skills")
        if args.scaffold_parent:
            fields = parent_governance_fields(args.scaffold_parent)
            if not fields["owner"]:
                common.die(f"--scaffold-parent '{args.scaffold_parent}' has no owner: in its own skill.meta.md")
            provenance_source = args.scaffold_parent
        else:
            missing = [f for f, v in (("--owner", args.owner), ("--project-types", args.project_types),
                                       ("--sdlc-phases", args.sdlc_phases), ("--risk-freedom", args.risk_freedom)) if not v]
            if missing:
                common.die(f"--scaffold-sidecars needs --scaffold-parent, or all of: {', '.join(missing)}")
            fields = {
                "owner": args.owner, "project_types": common.parse_names(args.project_types),
                "sdlc_phases": common.parse_names(args.sdlc_phases), "risk_freedom": args.risk_freedom,
            }
            provenance_source = "internal"
        scaffolded = [
            n for n in skill_names
            if scaffold_missing_sidecar(n, fields["owner"], fields["project_types"], fields["sdlc_phases"], fields["risk_freedom"], provenance_source)
        ]
        if scaffolded:
            print(f"Scaffolded skill.meta.md for: {', '.join(scaffolded)}")
        skipped = [n for n in skill_names if n not in scaffolded]
        if skipped:
            print(f"Already had a skill.meta.md, left untouched: {', '.join(skipped)}")
        if not args.project:
            return 0
    elif not args.project:
        common.die("--project is required (unless using --scaffold-sidecars alone)")

    project = Path(args.project).resolve()
    if not (project / "factory-lock.json").exists() and not (project / ".claude").exists():
        common.die(f"--project '{project}' doesn't look like a generated install (no factory-lock.json or .claude/)")

    if args.apply:
        if is_dirty(common.FACTORY_ROOT):
            common.die(
                "factory working tree is dirty -- refusing to --apply. Commit or stash first, "
                "so `git diff`/`git checkout .` stay a reliable record of what this run did."
            )
        branch = current_branch(common.FACTORY_ROOT)
        protected = PROTECTED_BRANCHES | set(args.protect)
        print(f"Writing into factory branch: {branch}")
        if branch in protected and not args.yes:
            reply = input(f"'{branch}' is a protected branch -- type its name to confirm: ").strip()
            if reply != branch:
                common.die("confirmation did not match -- aborting")

    lock = common.load_lock(project)
    include = set(common.parse_names(args.include))
    apply_kinds = set(REVERSIBLE_KINDS) | include

    exit_code = 0
    all_component_results = []

    # ---- skills, tools ----
    for kind in ("skill", "tool"):
        results = [classify_component(kind, n, project, lock) for n in discover_names(kind, project, lock)]
        removed_now = removed_via_history(
            project, ".claude/skills" if kind == "skill" else "tools",
            {r["name"] for r in results if r["installed"] is not None},
        )
        for r in results:
            if r["verdict"] == "NOT-INSTALLED" and r["name"] in removed_now and r["source"] is not None:
                r["verdict"] = "REMOVED"
                reachable, evidence = True, f"present in {project.name}'s own main tip, absent now"
                r["reachability_evidence"] = evidence
        all_component_results.extend(results)
        print(f"\n{kind.capitalize()}s:")
        print_component_table(results)

    # ---- agents, assistants ----
    resolved, ambiguous = discover_agent_like(project, lock)
    agent_assistant_results = [classify_component(k, n, project, lock) for n, k in resolved]
    removed_now = removed_via_history(
        project, ".claude/agents",
        {n for n, _k in resolved if (project / ".claude" / "agents" / f"{n}.md").exists()},
        strip_suffix=".md",
    )
    for r in agent_assistant_results:
        if r["verdict"] == "NOT-INSTALLED" and r["name"] in removed_now and r["source"] is not None:
            r["verdict"] = "REMOVED"
            r["reachability_evidence"] = f"present in {project.name}'s own main tip, absent now"
    all_component_results.extend(agent_assistant_results)
    print("\nAgents / Assistants:")
    print_component_table(agent_assistant_results)
    if ambiguous:
        print("  AMBIGUOUS -- new file(s) in .claude/agents/ with no lock entry and no matching "
              "factory Agent or Assistant; this adapter never guesses which kind these are:")
        for n in ambiguous:
            print(f"    '{n}'.md -- ask the SME whether this is a new Agent or a new Assistant")

    # ---- connectors (report-only) ----
    connector_names = discover_connectors(project, lock)
    on_disk_connectors = {p.name for p in (project / "connectors").iterdir() if p.is_dir()} if (project / "connectors").is_dir() else set()
    connectors_removed_via_history = removed_via_history(project, "connectors", on_disk_connectors)
    connector_results = []
    for name in connector_names:
        factory_server = common.CONNECTORS_DIR / name / "server.json"
        installed_dir = project / "connectors" / name
        entry = lock["connectors"].get(name)
        evidence = None
        if not factory_server.exists():
            verdict = "ORPHANED-LOCK" if entry else "NEW" if installed_dir.is_dir() else "NOT-INSTALLED"
        elif not installed_dir.is_dir():
            if entry:
                verdict = "REMOVED"
            elif name in connectors_removed_via_history:
                verdict, evidence = "REMOVED", f"present in {project.name}'s own main tip, absent now"
            else:
                verdict = "NOT-INSTALLED"
        else:
            verdict = "PRESENT"
        connector_results.append({"kind": "connector", "name": name, "verdict": verdict, "reachability_evidence": evidence})
    reportable_connectors = [r for r in connector_results if r["verdict"] != "NOT-INSTALLED"]
    print("\nConnectors (report-only -- never applied, see module docstring):")
    print_connector_table(reportable_connectors)

    mcp_json_removed = (
        ".mcp.json" in (git_dir_children(project, ".", "main") or set())
        and not (project / ".mcp.json").exists()
    )
    if mcp_json_removed:
        print("  .mcp.json  REMOVED  (present on main, absent now -- follows from the connector(s) "
              "above that supplied its mcpServers entries; report-only, never re-created by --apply)")

    # ---- knowledge, artifacts ----
    file_results = []
    seeded_map = {}  # (kind, name) -> (factory_dir, installed_dir), reused by --apply below
    for kind in ("knowledge", "artifact"):
        for name, factory_dir, installed_dir, entry in discover_seeded(kind, project, lock):
            seeded_map[(kind, name)] = (factory_dir, installed_dir)
            file_results.extend(classify_seeded_dir(kind, name, factory_dir, installed_dir, entry))
    print("\nKnowledge / Artifacts (per file):")
    print_file_table(file_results)

    # ---- split detection ----
    skill_results_only = [r for r in all_component_results if r["kind"] == "skill"]
    new_skills, edited_skills, shrunk_parents, declared = detect_likely_splits(skill_results_only, project)
    if new_skills:
        print(f"\nPossible skill split/rename detected: new skill(s) {', '.join(new_skills)}"
              + (f", alongside shrunk existing skill(s) {', '.join(shrunk_parents)}" if shrunk_parents else ""))
        print("This is a hint requiring human confirmation, not an automatic verdict.")
        if declared:
            print("Declared intent found in .factory-contribution.yaml:")
            for s in declared:
                print(f"  {s['from']} -> {', '.join(s['into'])} (parent_survives={s['parent_survives']})")
        impacted_names = list(dict.fromkeys(new_skills + edited_skills + [s["from"] for s in declared]))
        impact = graph_impact_report(impacted_names)
        print("Graph impact report -- files that mention these names and may need hand-updating in the factory repo:")
        for n, files in impact.items():
            print(f"  {n}:")
            for f in files:
                print(f"    {f}")

    # ---- REMOVED annotation (report-only, never auto-applied regardless of this finding) ----
    removed_results = [r for r in all_component_results if r["verdict"] == "REMOVED"]
    if removed_results:
        print("\nREMOVED components (report-only -- --apply will never delete anything for these):")
        for r in removed_results:
            print(f"  {r['kind']} '{r['name']}' -- {r.get('reachability_evidence') or 'no lock/history detail available'}")

    hard_blocking = [r for r in all_component_results + file_results if r["verdict"] in HARD_BLOCKING_VERDICTS]
    mr_required = any(r["verdict"] in ACTIONABLE_VERDICTS for r in all_component_results)
    if hard_blocking:
        exit_code = 1
        print(f"\n{len(hard_blocking)} CONFLICT(s) above require human resolution before this "
              "can be contributed automatically.")
    elif mr_required:
        print("\nThere are changes worth contributing (see LOCAL-EDIT/NEW above).")
    else:
        print("\nNothing worth contributing.")

    if args.dotenv_out:
        with open(args.dotenv_out, "w", encoding="utf-8") as f:
            f.write(f"MR_REQUIRED={'true' if mr_required and not hard_blocking else 'false'}\n")

    if args.check or not args.apply:
        return exit_code

    # ---- apply ----
    # CONFLICT is deliberately never auto-applied here, same as REMOVED -- the plan's own verdict
    # table calls for "show both diffs, human decides", and blindly copying the install's content
    # over the factory source would silently discard whatever the factory side changed since the
    # (possibly stale) baseline. Only LOCAL-EDIT and NEW are unambiguous "the install is strictly
    # ahead of the factory" cases safe to copy without a human looking first.
    print("\nApplying...")
    applied, conflicts, applied_new_skills = [], [], []
    for r in all_component_results:
        if r["kind"] not in apply_kinds or r["verdict"] not in ("LOCAL-EDIT", "CONFLICT", "NEW"):
            continue
        if r["verdict"] == "CONFLICT":
            conflicts.append(r)
            continue
        if r["kind"] in ("skill", "tool"):
            changed = apply_skill_or_tool(r["kind"], r["name"], project)
            if changed:
                applied.append(f"{r['kind']} '{r['name']}': {', '.join(changed)}")
                if r["kind"] == "skill" and r["verdict"] == "NEW":
                    applied_new_skills.append(r["name"])
        elif r["kind"] in ("agent", "assistant"):
            if r.get("frontmatter_only_edit"):
                print(f"  skipping {r['kind']} '{r['name']}': body unchanged, only the synthesized "
                      f"description: frontmatter differs -- edit agent.md's opening paragraph by hand instead")
                continue
            apply_agent_or_assistant(r["kind"], r["name"], project)
            applied.append(f"{r['kind']} '{r['name']}'")

    for r in file_results:
        if r["kind"] not in apply_kinds or r["verdict"] not in ("LOCAL-EDIT", "CONFLICT", "NEW"):
            continue
        if r["verdict"] == "CONFLICT":
            conflicts.append(r)
            continue
        pair = seeded_map.get((r["kind"], r["name"]))
        if pair is None:
            continue
        factory_dir, installed_dir = pair
        dest_file, src_file = factory_dir / r["file"], installed_dir / r["file"]
        if not src_file.exists():
            continue
        dest_file.parent.mkdir(parents=True, exist_ok=True)
        dest_file.write_bytes(src_file.read_bytes())
        applied.append(f"{r['kind']} '{r['name']}' :: {r['file']}")

    for r in conflicts:
        loc = f"{r['kind']} '{r['name']}'" + (f" :: {r['file']}" if r.get("file") else "")
        print(f"  NOT applied (CONFLICT -- human must resolve): {loc}")
        print(f"    baseline={r.get('baseline')}  installed={r.get('installed')}  source={r.get('source')}")

    if not applied:
        print("Nothing to apply." if not conflicts else "Nothing applied -- everything eligible was a CONFLICT (see above).")
        return 0
    for line in applied:
        print(f"  applied: {line}")

    if args.commit:
        # Refuse to commit a NEW skill with no skill.meta.md -- lint_dependencies.py's
        # missing-sidecar check is unconditional, so committing (and, with --open-mr, pushing)
        # one anyway just opens an MR guaranteed to fail CI. Each missing skill's parent is
        # resolved independently -- declared_split's .factory-contribution.yaml entries (already
        # parsed into `declared`) can name a different parent per split, so one MR can freely mix
        # several splits; --scaffold-parent/--owner (CLI-only, not exposed as a CI variable,
        # since neither can express more than one split on its own) cover a single manual split
        # or ad hoc local use for whatever the declared file doesn't. Anything neither source
        # resolves refuses by name -- never guessed, same rule as everywhere else in this script.
        missing_sidecars = [n for n in applied_new_skills if not (common.SKILLS_DIR / n / "skill.meta.md").exists()]
        unresolved = []
        for n in missing_sidecars:
            parent = parent_for_child(declared, n)
            if parent:
                fields = parent_governance_fields(parent)
                if not fields["owner"]:
                    common.die(f"declared parent '{parent}' (for '{n}') has no owner: in its own skill.meta.md")
                provenance_source = parent
            elif args.scaffold_parent:
                fields = parent_governance_fields(args.scaffold_parent)
                if not fields["owner"]:
                    common.die(f"--scaffold-parent '{args.scaffold_parent}' has no owner: in its own skill.meta.md")
                provenance_source = args.scaffold_parent
            elif args.owner:
                needed = [f for f, v in (("--project-types", args.project_types),
                                          ("--sdlc-phases", args.sdlc_phases), ("--risk-freedom", args.risk_freedom)) if not v]
                if needed:
                    common.die(f"new skill '{n}' needs a skill.meta.md -- --owner was given but also need: {', '.join(needed)}")
                fields = {
                    "owner": args.owner, "project_types": common.parse_names(args.project_types),
                    "sdlc_phases": common.parse_names(args.sdlc_phases), "risk_freedom": args.risk_freedom,
                }
                provenance_source = "internal"
            else:
                unresolved.append(n)
                continue
            scaffold_missing_sidecar(n, fields["owner"], fields["project_types"], fields["sdlc_phases"], fields["risk_freedom"], provenance_source)
            applied.append(f"skill '{n}': scaffolded skill.meta.md (provenance.source={provenance_source})")
            print(f"  applied: skill '{n}': scaffolded skill.meta.md (provenance.source={provenance_source})")
        if unresolved:
            common.die(
                f"new skill(s) {', '.join(unresolved)} have no skill.meta.md and no declared parent -- "
                "refusing to --commit content that lint_dependencies.py will unconditionally fail on. "
                "Declare the split in .factory-contribution.yaml (in the install), or pass "
                "--scaffold-parent <name> / --owner (--project-types/--sdlc-phases/--risk-freedom) directly."
            )

        branch = args.branch or f"sync-back/{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')}"
        run_git(common.FACTORY_ROOT, "checkout", "-b", branch, check=True)
        run_git(common.FACTORY_ROOT, "add", "-A", "--", "skills", "tools", "agents", "assistants", "knowledge", "artifacts")
        subject = f"EPMCSAPAI-NNN: sync back SME edits from {project.name}"
        run_git(common.FACTORY_ROOT, "commit", "-m", subject, check=True)
        print(f"Committed on branch '{branch}'.")
        if args.open_mr:
            push_opts = [
                "-o", "merge_request.create",
                # The real GitLab push option is "merge_request.target", not
                # "merge_request.target_branch" -- confirmed by a real run: the wrong name was
                # silently ignored (GitLab doesn't error on an unrecognized push option) and the
                # MR was created against the project's default branch (main) instead.
                "-o", f"merge_request.target={args.target_branch}",
            ]
            # GitLab's CI_JOB_TOKEN can read (clone/fetch) but cannot push by default -- a
            # deliberate GitLab security restriction, confirmed for real: an SME's own git
            # remote already has push access, so "origin" is correct there, but a CI job needs
            # an explicit token with write_repository scope on THIS project instead.
            push_token = os.environ.get("SYNC_BACK_PUSH_TOKEN")
            if push_token:
                server, project_path = os.environ.get("CI_SERVER_HOST"), os.environ.get("CI_PROJECT_PATH")
                if not server or not project_path:
                    common.die("SYNC_BACK_PUSH_TOKEN is set but CI_SERVER_HOST/CI_PROJECT_PATH aren't -- can't build the push URL")
                remote = f"https://gitlab-ci-token:{push_token}@{server}/{project_path}.git"
            else:
                remote = "origin"
            res = run_git(common.FACTORY_ROOT, "push", *push_opts, remote, branch)
            if res.returncode != 0:
                common.die(f"git push failed: {res.stderr.decode(errors='replace')}")
            print(res.stdout.decode())
    return 0


if __name__ == "__main__":
    sys.exit(main())
