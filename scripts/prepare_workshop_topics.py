#!/usr/bin/env python3
"""Group supplied process scope into coverage-checked workshop topics."""

import argparse
import datetime as dt
import json
from collections import defaultdict
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processes", type=Path, required=True)
    parser.add_argument("--impacts", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    processes = json.loads(args.processes.read_text(encoding="utf-8")).get("processes", [])
    if not processes:
        parser.error("processes JSON must contain at least one process")
    impact_ids = defaultdict(list)
    if args.impacts:
        for impact in json.loads(args.impacts.read_text(encoding="utf-8")).get("impacts", []):
            if impact.get("process_id") and impact.get("item_id"):
                impact_ids[impact["process_id"]].append(impact["item_id"])
    grouped = defaultdict(list)
    coverage = []
    for process in processes:
        if not process.get("process_id") or not process.get("name"):
            parser.error("every process requires process_id and name")
        module = process.get("module", "").strip()
        if not module:
            coverage.append({"process_id": process["process_id"], "process_name": process["name"], "status": "REVIEW_REQUIRED", "reason": "Module is missing from supplied process scope."})
            continue
        grouped[module].append(process)
        coverage.append({"process_id": process["process_id"], "process_name": process["name"], "status": "COVERED", "reason": "Grouped into module workshop topic."})
    topics = []
    for module, members in sorted(grouped.items()):
        process_ids = [member["process_id"] for member in members]
        topics.append({
            "module": module,
            "process_ids": process_ids,
            "topic": f"{module} Fit-to-Standard workshop",
            "simplification_item_ids": sorted({item for process_id in process_ids for item in impact_ids[process_id]}),
            "required_decisions": ["Standard versus Delta per process step", "Business owner for every proposed Delta", "Evidence gaps and open questions"],
        })
    payload = {"generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "topics": topics, "coverage": coverage}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(topics)} workshop topics covering {len(processes)} supplied processes to {args.output}")


if __name__ == "__main__":
    main()