"""
Judge validation (align the LLM-judge to a human).

Runs the L3 judge on a set of candidate outputs that a human has already scored with
the same rubric, then measures how well the judge agrees with the human. If agreement
is high enough the judge is considered trustworthy for this scenario; otherwise its
L3 verdicts should not be trusted until the rubric / judge is fixed.

This is NOT per-run. It calibrates the measuring instrument once (and again whenever
the rubric, judge model, or prompt changes).

Uses the same `harness.judge_model` from scenario.config.md as a live run's judge --
calibration must validate the exact model that will actually score real runs.

Inputs (under <scenario>/expected/human-evaluation/judge-validation/):
  human-labels.json   -- human scores per candidate (you fill this)
  candidates/*.json   -- candidate outputs of varying quality, referenced by labels

Output:
  alignment.json      -- per-dimension + overall agreement, and validated: true/false

Usage:
  python align_judge.py --scenario <TS-dir>
"""
import argparse
import datetime as dt
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from lib import scenario as scn    # noqa: E402
import judge as judge_mod          # noqa: E402

DIMENSIONS = ["grounding", "defensibility", "relevance"]
DEFAULT_OUT = pathlib.Path("C:/_WORK/Git/SAP-AI-Factory-Test-Run/runs")


def main():
    ap = argparse.ArgumentParser(description="Validate the L3 judge against human labels")
    ap.add_argument("--scenario", required=True)
    ap.add_argument("--judge-model", default=None,
                    help="override scenario.config.md harness.judge_model for this run")
    args = ap.parse_args()

    scenario = pathlib.Path(args.scenario).resolve()
    meta = scn.load_meta(scenario)
    h = meta["harness"]
    if args.judge_model:
        h["judge_model"] = args.judge_model
    input_fixture = scenario / "fixtures" / h["fixtures"][0]
    rubric = scenario / h["rubric"]
    min_agreement = float(meta.get("min_judge_agreement", 0.8))

    val_dir = scenario / "expected" / "human-evaluation" / "judge-validation"
    labels_path = val_dir / "human-labels.json"
    if not labels_path.exists():
        raise SystemExit(f"human-labels.json not found at {labels_path}")
    labels = json.loads(labels_path.read_text(encoding="utf-8"))

    runs_root = meta.get("runs_dir") or str(DEFAULT_OUT)
    ts = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    work_base = pathlib.Path(runs_root) / meta["test_scenario"] / f"align-{ts}"

    per_sample = []
    for s in labels.get("samples", []):
        sid = s["id"]
        human = s.get("human", {})
        missing = [d for d in DIMENSIONS if human.get(d) in (None, "")]
        if missing:
            raise SystemExit(f"sample '{sid}': human scores not filled for {missing}. "
                             f"Edit {labels_path} first.")
        candidate = (val_dir / s["candidate"]).resolve()
        if not candidate.exists():
            raise SystemExit(f"candidate not found: {candidate}")

        verdict = judge_mod.judge(
            str(input_fixture), str(candidate), str(rubric),
            pass_threshold=float(meta.get("judge_pass_threshold", 4.0)),
            min_dimension=int(meta.get("judge_min_dimension", 2)),
            run_dir=work_base / sid,
            model=h.get("judge_model"),
        )
        if verdict.get("error") or not verdict.get("scores"):
            raise SystemExit(f"judge failed on sample '{sid}': {verdict.get('error')}")
        j = verdict["scores"]
        per_sample.append({
            "id": sid,
            "human": {d: int(human[d]) for d in DIMENSIONS},
            "judge": {d: int(j[d]) for d in DIMENSIONS},
        })

    # Agreement metrics (stable for small N): exact %, within-1 %, mean abs error.
    def _metrics(pairs):
        n = len(pairs)
        exact = sum(1 for hh, jj in pairs if hh == jj) / n
        within1 = sum(1 for hh, jj in pairs if abs(hh - jj) <= 1) / n
        mae = sum(abs(hh - jj) for hh, jj in pairs) / n
        return {"exact": round(exact, 3), "within_1": round(within1, 3), "mae": round(mae, 3)}

    per_dim = {}
    all_pairs = []
    for d in DIMENSIONS:
        pairs = [(s["human"][d], s["judge"][d]) for s in per_sample]
        per_dim[d] = _metrics(pairs)
        all_pairs += pairs
    overall = _metrics(all_pairs)

    validated = overall["within_1"] >= min_agreement
    alignment = {
        "scenario": meta["test_scenario"],
        "generated": ts,
        "judge_model": h.get("judge_model"),
        "samples": len(per_sample),
        "min_judge_agreement": min_agreement,
        "overall": overall,
        "per_dimension": per_dim,
        "per_sample": per_sample,
        "validated": validated,
        "note": "validated = overall within-1 agreement >= min_judge_agreement",
    }
    out = val_dir / "alignment.json"
    out.write_text(json.dumps(alignment, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[align_judge] samples={len(per_sample)} overall within_1={overall['within_1']} "
          f"exact={overall['exact']} mae={overall['mae']}")
    for d in DIMENSIONS:
        print(f"  {d:14} within_1={per_dim[d]['within_1']} exact={per_dim[d]['exact']} mae={per_dim[d]['mae']}")
    print(f"[align_judge] VALIDATED={validated} (threshold within_1>={min_agreement}) -> {out}")
    sys.exit(0 if validated else 100)


if __name__ == "__main__":
    main()
