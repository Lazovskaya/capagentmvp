#!/usr/bin/env python3
"""
Tool: capture-golden-run

Freeze one good live run as the scenario's replay fixture. Copies the run's
transcript and produced output artifact into `<scenario>/fixtures/golden-run/`,
which `runner.py --mode replay` then grades deterministically and for free.

Usage:
  python capture_golden.py --scenario <TS-dir> --run-dir <run-N-dir> \
      --output-artifact <filename>
"""
import argparse
import pathlib
import shutil


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenario", required=True, help="the TS-<id> scenario directory")
    ap.add_argument("--run-dir", required=True, help="a specific run-N directory to freeze")
    ap.add_argument("--output-artifact", required=True, help="output filename, e.g. result.json")
    a = ap.parse_args()

    scenario = pathlib.Path(a.scenario).resolve()
    run_dir = pathlib.Path(a.run_dir).resolve()
    rec = scenario / "fixtures" / "golden-run"
    rec.mkdir(parents=True, exist_ok=True)

    tx = run_dir / "run-transcript.jsonl"
    art = run_dir / "work" / a.output_artifact
    if not tx.exists():
        raise SystemExit(f"transcript not found: {tx}")
    if not art.exists():
        raise SystemExit(f"output artifact not found: {art}")

    shutil.copy2(tx, rec / "run-transcript.jsonl")
    shutil.copy2(art, rec / a.output_artifact)
    print(f"captured golden run into {rec}")
    print(f"  run-transcript.jsonl  <- {tx}")
    print(f"  {a.output_artifact}  <- {art}")


if __name__ == "__main__":
    main()
