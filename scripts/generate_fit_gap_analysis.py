#!/usr/bin/env python3
"""Generate a fit-gap analysis from normalized Fit-to-Standard decisions."""

import argparse
import datetime as dt
import json
from pathlib import Path


def app_ids_for_step(step, mapping):
    if not mapping:
        return []
    normalized_step = step.strip().lower()
    for item in mapping.get("mappings", []):
        if item.get("process_name", "").strip().lower() == normalized_step:
            return [app["app_id"] for app in item.get("apps", [])]
    return []


def classify(decision, notes):
    normalized = decision.strip().lower()
    if normalized == "standard":
        return "FIT", "standard"
    if normalized == "delta":
        return "GAP", "solution-design-required"
    if normalized.startswith("workaround"):
        resolution = notes.lower()
        if "resolved as: standard" in resolution:
            return "FIT", "standard"
        if "resolved as: delta" in resolution:
            return "GAP", "solution-design-required"
        return "WORKAROUND", "open-question"
    return "TBC", "open-question"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--decision-log", type=Path, required=True)
    parser.add_argument("--process-app-mapping", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    log = json.loads(args.decision_log.read_text(encoding="utf-8"))
    rows = log.get("rows", [])
    if not log.get("log_id") or log.get("session_status") not in {"LIVE", "DRAFT"} or not rows:
        parser.error("decision log requires log_id, session_status LIVE/DRAFT, and at least one row")
    mapping = json.loads(args.process_app_mapping.read_text(encoding="utf-8")) if args.process_app_mapping else None
    items = []
    for row in rows:
        required = {"row_id", "process_step", "decision"}
        if not required.issubset(row):
            parser.error("every decision-log row requires row_id, process_step and decision")
        classification, disposition = classify(row["decision"], row.get("notes", ""))
        items.append({
            "row_id": row["row_id"],
            "process_step": row["process_step"],
            "classification": classification,
            "sap_standard_behavior": row.get("sap_standard_behavior", ""),
            "requirement": row.get("requirement", ""),
            "app_ids": app_ids_for_step(row["process_step"], mapping),
            "disposition": disposition,
            "rationale": row.get("notes", ""),
            "owner": row.get("delta_owner", ""),
            "status": "DRAFT" if log["session_status"] == "DRAFT" else "IN_REVIEW",
        })
    payload = {
        "source_decision_log": {
            "log_id": log["log_id"],
            "session_status": log["session_status"],
            "process": log.get("process", ""),
            "process_app_mapping_ref": str(args.process_app_mapping) if args.process_app_mapping else "",
        },
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "review_status": "DRAFT" if log["session_status"] == "DRAFT" else "IN_REVIEW",
        "items": items,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} fit-gap items to {args.output}")


if __name__ == "__main__":
    main()