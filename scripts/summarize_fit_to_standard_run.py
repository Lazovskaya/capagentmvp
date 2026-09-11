#!/usr/bin/env python3
"""Validate a Fit-to-Standard accelerator manifest and write a run summary."""

import argparse
import datetime as dt
import json
from pathlib import Path

REQUIRED = {
    "prepare": ["process_scope", "workshop_preparation"],
    "post-workshop": ["process_scope", "workshop_preparation", "decision_log", "fit_gap_analysis"],
    "full": ["process_scope", "workshop_preparation", "decision_log", "fit_gap_analysis", "transcript_candidates"],
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    mode = manifest.get("mode")
    if mode not in REQUIRED:
        parser.error("manifest mode must be prepare, post-workshop or full")
    inputs = manifest.get("inputs", {})
    gaps = [f"Missing required output: {name}" for name in REQUIRED[mode] if not inputs.get(name)]
    if mode == "prepare":
        status = "READY_FOR_WORKSHOP" if not gaps else "GAPS"
        next_steps = ["Run fit-to-standard with named attendees and workshop timing."]
    else:
        status = "READY_FOR_REVIEW" if not gaps else "GAPS"
        next_steps = ["Review Fit/Gap outcomes and route confirmed Delta rows to solution-design."]
    if inputs.get("process_app_mapping") is None:
        gaps.append("No process-to-app mapping supplied; application coverage remains unverified.")
    payload = {"mode": mode, "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "inputs": inputs, "status": status, "gaps": gaps, "next_steps": next_steps}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {status} summary for {mode} mode to {args.output}")


if __name__ == "__main__":
    main()