#!/usr/bin/env python3
"""Deterministic implementation behind the `reconcile-brownfield-sad-state` Tool.
Two modes:

    diff    Compare known artifact files on disk against the engagement's latest
            checkpoint. Read-only -- writes nothing.
    commit  Persist a new checkpoint from a reconciled artifact list, after the
            Agent has classified changes and resolved conflicts.

Usage:
    python3 reconcile_state.py --engagement-id <id> --workspace-root <path> \\
        --mode diff --known-artifacts-json <path>
    python3 reconcile_state.py --engagement-id <id> --workspace-root <path> \\
        --mode commit --reconciled-artifacts-json <path>

Both `--known-artifacts-json` and `--reconciled-artifacts-json` point at a local JSON
file containing a list of {"artifact_id": str, "path": str} objects (commit's entries
also carry "review_status", "reviewer", "review_date", "source_origin" -- see
tool.md's Input contract). Output is a single JSON object printed to stdout.

Confluence-linked reconciliation (comparing a checkpoint's synced page version/hash
against the live page) is out of this Tool's scope -- that's the
`brownfield-sad-state-reconciliation` Skill's own direct use of the `read-confluence-page`
Tool. This Tool only ever reads/writes local workspace
files.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

CHECKPOINT_RE = re.compile(r"^CHK-(?P<engagement>.+)-(?P<seq>\d+)\.json$")


def die(code, message):
    print(json.dumps({"error": code, "message": message}), file=sys.stderr)
    raise SystemExit(1)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def engagement_dir(workspace_root, engagement_id):
    return Path(workspace_root) / engagement_id / "brownfield-sad"


def checkpoints_dir(workspace_root, engagement_id):
    return engagement_dir(workspace_root, engagement_id) / "checkpoints"


def latest_checkpoint(workspace_root, engagement_id):
    """Returns (seq:int, path:Path, data:dict) for the highest-numbered checkpoint,
    or (0, None, None) if none exist yet -- a fresh engagement, not an error."""
    cdir = checkpoints_dir(workspace_root, engagement_id)
    if not cdir.exists():
        return 0, None, None
    best_seq, best_path = 0, None
    for p in cdir.glob("CHK-*.json"):
        m = CHECKPOINT_RE.match(p.name)
        if not m or m.group("engagement") != engagement_id:
            continue
        seq = int(m.group("seq"))
        if seq > best_seq:
            best_seq, best_path = seq, p
    if best_path is None:
        return 0, None, None
    return best_seq, best_path, json.loads(best_path.read_text(encoding="utf-8"))


def run_diff(workspace_root, engagement_id, known_artifacts):
    seq, ckpt_path, ckpt = latest_checkpoint(workspace_root, engagement_id)
    checkpoint_artifacts = {a["artifact_id"]: a for a in (ckpt or {}).get("artifacts", [])}

    changed_ids, conflict_ids, unreadable = [], [], []
    for entry in known_artifacts:
        artifact_id, path = entry["artifact_id"], entry["path"]
        p = Path(path)
        if not p.is_file():
            unreadable.append(artifact_id)
            continue
        current_hash = sha256_file(p)
        prior = checkpoint_artifacts.get(artifact_id)
        if prior is None:
            changed_ids.append(artifact_id)
            continue
        if prior.get("hash") != current_hash:
            changed_ids.append(artifact_id)
            if prior.get("review_status") == "approved":
                # A file already reviewed and approved by a human changed on disk
                # since the last checkpoint -- authoritative content may have been
                # overwritten. Flag rather than silently accept.
                conflict_ids.append(artifact_id)

    if unreadable:
        reconciliation_status = "blocked"
    elif conflict_ids:
        reconciliation_status = "conflict"
    elif changed_ids:
        reconciliation_status = "changes_detected"
    else:
        reconciliation_status = "clean"

    return {
        "resume_status": "fresh" if ckpt_path is None else "resumed",
        "reconciliation_status": reconciliation_status,
        "last_valid_checkpoint": None if ckpt_path is None else ckpt_path.stem,
        "changed_artifact_ids": changed_ids,
        "conflict_ids": conflict_ids,
        "unreadable_artifact_ids": unreadable,
    }


def run_commit(workspace_root, engagement_id, reconciled_artifacts):
    seq, _, _ = latest_checkpoint(workspace_root, engagement_id)
    new_seq = seq + 1
    cdir = checkpoints_dir(workspace_root, engagement_id)
    cdir.mkdir(parents=True, exist_ok=True)

    artifacts = []
    for entry in reconciled_artifacts:
        p = Path(entry["path"])
        if not p.is_file():
            die("artifact_unreadable", f"{entry['artifact_id']}: no file at {entry['path']}")
        artifacts.append({
            "artifact_id": entry["artifact_id"],
            "path": entry["path"],
            "hash": sha256_file(p),
            "review_status": entry.get("review_status", "unreviewed"),
            "reviewer": entry.get("reviewer"),
            "review_date": entry.get("review_date"),
            "source_origin": entry.get("source_origin", "agent-generated"),
        })

    checkpoint_id = f"CHK-{engagement_id}-{new_seq}"
    checkpoint = {"checkpoint_id": checkpoint_id, "engagement_id": engagement_id, "artifacts": artifacts}
    (cdir / f"{checkpoint_id}.json").write_text(json.dumps(checkpoint, indent=2) + "\n", encoding="utf-8")

    state_path = engagement_dir(workspace_root, engagement_id) / "state.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {"engagement_id": engagement_id}
    state["last_valid_checkpoint"] = checkpoint_id
    state_path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")

    return {
        "resume_status": "resumed",
        "reconciliation_status": "clean",
        "last_valid_checkpoint": checkpoint_id,
        "changed_artifact_ids": [],
        "conflict_ids": [],
        "new_checkpoint_id": checkpoint_id,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--engagement-id", required=True)
    parser.add_argument("--workspace-root", required=True, help="usually the repo's gitignored workspace/ dir")
    parser.add_argument("--mode", required=True, choices=["diff", "commit"])
    parser.add_argument("--known-artifacts-json", help="required for --mode diff")
    parser.add_argument("--reconciled-artifacts-json", help="required for --mode commit")
    args = parser.parse_args(argv)

    if args.mode == "diff":
        if not args.known_artifacts_json:
            die("invalid_mode", "--mode diff requires --known-artifacts-json")
        known = json.loads(Path(args.known_artifacts_json).read_text(encoding="utf-8"))
        result = run_diff(args.workspace_root, args.engagement_id, known)
    else:
        if not args.reconciled_artifacts_json:
            die("invalid_mode", "--mode commit requires --reconciled-artifacts-json")
        reconciled = json.loads(Path(args.reconciled_artifacts_json).read_text(encoding="utf-8"))
        result = run_commit(args.workspace_root, args.engagement_id, reconciled)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
