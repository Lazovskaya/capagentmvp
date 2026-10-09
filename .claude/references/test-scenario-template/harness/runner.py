"""
Scenario test runner (harness orchestrator).

Runs a scenario N times in isolated sessions (live `claude -p` or offline replay),
grades each run (Level 1/2 deterministic + optional Level 3 LLM-judge), applies the
grading routing, and aggregates into a scenario verdict with per-run metrics.

Usage:
  python runner.py --scenario ../test-scenarios/TS-<name> --mode replay
  python runner.py --scenario ../test-scenarios/TS-<name> --mode live --runs 3 --with-judge
  python runner.py --scenario ... --mode live --runs 3 --with-judge --benchmark

Modes:
  live    -- spawn a real nested `claude -p` per run (genuine, non-deterministic).
  replay  -- grade the golden run captured in fixtures/golden-run/ (deterministic, free).

Model: harness.model / harness.judge_model in scenario.config.md pick the agent's
and the judge's model; --model / --judge-model override them for one invocation.

Verdicts (per run): Pass | Fail (level1) | Fail (trajectory) | Fail (quality) | Blocked
Scenario status: Passing if pass-rate >= pass_threshold, else Failing (flaky flag if mixed).

Where runs are written (highest precedence first):
  --out  >  scenario.config.md `## Settings` runs_dir  >  DEFAULT_OUT
"""
import argparse
import datetime as dt
import json
import pathlib
import shutil
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from lib import isolation          # noqa: E402
from lib import runclaude          # noqa: E402
from lib import scenario as scn    # noqa: E402
from lib import transcript as T    # noqa: E402
from lib import bundlesync         # noqa: E402
import grader                      # noqa: E402
import judge as judge_mod          # noqa: E402

DEFAULT_OUT = pathlib.Path("C:/_WORK/Git/SAP-AI-Factory-Test-Run/runs")
STALE_EXIT = 3


def judge_validated(scenario_dir):
    """Has the L3 judge been validated against humans for this scenario?"""
    p = (pathlib.Path(scenario_dir) / "expected" / "human-evaluation"
         / "judge-validation" / "alignment.json")
    if not p.exists():
        return False, "judge not validated against humans (no alignment.json)"
    try:
        a = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return False, "judge not validated against humans (alignment.json unreadable)"
    if a.get("validated"):
        return True, f"judge validated (within_1={a.get('overall', {}).get('within_1')})"
    return False, "judge NOT validated against humans (alignment below threshold)"


def route(grade_res, judge_res, run_error):
    """Apply the scenario's grading routing to one run. Returns a verdict string."""
    if run_error:
        return f"Blocked ({run_error})"
    if not grade_res["level1"]["passed"]:
        return "Fail (level1)"
    if not grade_res["level2"]["passed"]:
        return "Fail (trajectory)"
    if judge_res is not None:
        if judge_res.get("error"):
            return "Blocked (judge)"
        if not judge_res.get("passed"):
            return "Fail (quality)"
    return "Pass"


def do_run(k, base, meta, paths, with_bundle, mode, want_judge):
    """Execute + grade one run. Returns a per-run result dict."""
    run_dir = base / f"run-{k}"
    run_dir.mkdir(parents=True, exist_ok=True)
    h = meta["harness"]
    run_error = None
    metrics = {}

    if mode == "live":
        work, cfg = isolation.prepare(
            run_dir, paths["bundle_dir"], paths["fixtures"], with_bundle=with_bundle)
        transcript_path = run_dir / "run-transcript.jsonl"
        res = runclaude.run(
            h["task_prompt"], work, isolation.child_env(cfg), transcript_path,
            allowed_tools=h.get("allowed_tools"),
            permission_mode=h.get("permission_mode", "acceptEdits"),
            model=h.get("model"),
        )
        metrics = T.metrics(T.load(transcript_path))
        artifact_path = work / h["output_artifact"]
        if res["timed_out"]:
            run_error = "timeout"
        elif metrics.get("is_error") and not artifact_path.exists():
            run_error = "api_error"
    else:  # replay
        rec = pathlib.Path(paths["scenario"]) / "fixtures" / "golden-run"
        rec_tx = rec / "run-transcript.jsonl"
        rec_art = rec / h["output_artifact"]
        if not rec_tx.exists() or not rec_art.exists():
            run_error = "no golden run (run once in live mode to capture it)"
            transcript_path = rec_tx
            artifact_path = rec_art
        else:
            transcript_path = run_dir / "run-transcript.jsonl"
            artifact_path = run_dir / h["output_artifact"]
            shutil.copy2(rec_tx, transcript_path)
            shutil.copy2(rec_art, artifact_path)
            metrics = T.metrics(T.load(transcript_path))

    if run_error:
        verdict = route(None, None, run_error)
        result = {"run": k, "verdict": verdict, "error": run_error,
                  "with_bundle": with_bundle, "metrics": metrics}
        (run_dir / "grading.json").write_text(
            json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        return result

    grade_res = grader.grade(artifact_path, transcript_path, meta, paths["schema"])

    judge_res = None
    if want_judge and grade_res["level1"]["passed"] and grade_res["level2"]["passed"]:
        judge_res = judge_mod.judge(
            paths["card"], artifact_path, paths["rubric"],
            pass_threshold=float(meta.get("judge_pass_threshold", 4.0)),
            min_dimension=int(meta.get("judge_min_dimension", 2)),
            run_dir=run_dir / "judge",
            model=h.get("judge_model"),
        )
        # Caveat (separate from the verdict): is the judge itself trustworthy yet?
        ok, msg = judge_validated(paths["scenario"])
        judge_res["validated_against_humans"] = ok
        if not ok:
            judge_res["caveat"] = msg

    verdict = route(grade_res, judge_res, None)
    result = {
        "run": k,
        "verdict": verdict,
        "with_bundle": with_bundle,
        "model": h.get("model"),
        "judge_model": h.get("judge_model") if want_judge else None,
        "level1": grade_res["level1"],
        "level2": grade_res["level2"],
        "level3_judge": judge_res,
        "metrics": metrics,
    }
    (run_dir / "grading.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    return result


def run_condition(label, with_bundle, base, meta, paths, mode, runs, want_judge):
    cond_base = base / label
    cond_base.mkdir(parents=True, exist_ok=True)
    results = [do_run(k + 1, cond_base, meta, paths, with_bundle, mode, want_judge)
               for k in range(runs)]

    passes = sum(1 for r in results if r["verdict"] == "Pass")
    blocked = sum(1 for r in results if r["verdict"].startswith("Blocked"))
    pass_rate = passes / runs if runs else 0.0
    threshold = float(meta.get("pass_threshold", 0.66))
    non_pass = [r for r in results if r["verdict"] != "Pass" and not r["verdict"].startswith("Blocked")]
    flaky = passes > 0 and len(non_pass) > 0
    costs = [r["metrics"].get("total_cost_usd") for r in results if r.get("metrics")]
    costs = [c for c in costs if isinstance(c, (int, float))]

    summary = {
        "condition": label,
        "with_bundle": with_bundle,
        "model": meta["harness"].get("model"),
        "judge_model": meta["harness"].get("judge_model") if want_judge else None,
        "runs": runs,
        "passes": passes,
        "blocked": blocked,
        "pass_rate": round(pass_rate, 3),
        "pass_threshold": threshold,
        "status": "Passing" if pass_rate >= threshold else "Failing",
        "flaky": flaky,
        "verdicts": [r["verdict"] for r in results],
        "total_cost_usd": round(sum(costs), 4) if costs else None,
        "mean_cost_usd": round(sum(costs) / len(costs), 4) if costs else None,
    }
    (cond_base / "grading.json").write_text(
        json.dumps({"summary": summary, "runs": results}, indent=2, ensure_ascii=False),
        encoding="utf-8")
    return summary


def check_bundle_freshness(meta, paths, args):
    """Compare bundle/ against its original source; act per flags. May exit(STALE_EXIT)."""
    source = paths.get("bundle_source")
    if not source:
        return
    if not bundlesync.is_stale(source, paths["bundle_dir"]):
        return
    diffs = bundlesync.diff(source, paths["bundle_dir"])
    print(f"[runner] BUNDLE STALE: the source component changed since it was copied "
          f"into bundle/ ({len(diffs)} diff(s)):")
    for d in diffs[:10]:
        print(f"           - {d}")
    if args.update_bundle:
        bundlesync.refresh(source, paths["bundle_dir"])
        print("[runner] bundle refreshed from source (--update-bundle).")
    elif args.keep_bundle:
        print("[runner] keeping the existing tested bundle (--keep-bundle).")
    else:
        print("[runner] Re-run with --update-bundle (refresh from source) or "
              "--keep-bundle (test the existing copy).")
        sys.exit(STALE_EXIT)


def main():
    ap = argparse.ArgumentParser(description="AI scenario test runner")
    ap.add_argument("--scenario", required=True, help="path to a scenario directory")
    ap.add_argument("--mode", choices=["live", "replay"], default="replay")
    ap.add_argument("--runs", type=int, default=None, help="override runs_required")
    ap.add_argument("--with-judge", action="store_true", help="enable Level 3 LLM-judge")
    ap.add_argument("--without-bundle", action="store_true",
                    help="run the bare baseline (no bundle) instead of with-bundle")
    ap.add_argument("--benchmark", action="store_true",
                    help="run BOTH with-bundle and without-bundle, write benchmark.json")
    ap.add_argument("--update-bundle", action="store_true",
                    help="if bundle drifted from its source, refresh it before running")
    ap.add_argument("--keep-bundle", action="store_true",
                    help="if bundle drifted from its source, keep the existing copy")
    ap.add_argument("--out", default=None, help="base runs directory (overrides runs_dir)")
    ap.add_argument("--model", default=None,
                    help="override scenario.config.md harness.model for this run")
    ap.add_argument("--judge-model", default=None,
                    help="override scenario.config.md harness.judge_model for this run")
    args = ap.parse_args()

    scenario_dir = pathlib.Path(args.scenario).resolve()
    meta = scn.load_meta(scenario_dir)
    runs = args.runs if args.runs is not None else int(meta.get("runs_required", 3))
    h = meta["harness"]
    if args.model:
        h["model"] = args.model
    if args.judge_model:
        h["judge_model"] = args.judge_model
    workspace_root = (scenario_dir / ".." / "..").resolve()

    def _resolve(p):
        p = pathlib.Path(p)
        return p if p.is_absolute() else (workspace_root / p).resolve()

    fixtures = [(scenario_dir / "fixtures" / f, f) for f in h.get("fixtures", [])]
    paths = {
        "scenario": str(scenario_dir),
        "bundle_dir": str(_resolve(h["bundle_dir"])),
        "bundle_source": str(_resolve(h["bundle_source"])) if h.get("bundle_source") else None,
        "fixtures": fixtures,
        "schema": str(scenario_dir / h["schema"]),
        "rubric": str(scenario_dir / h["rubric"]),
        "card": str(scenario_dir / "fixtures" / h["fixtures"][0]),
    }

    # runs_dir precedence: --out  >  meta runs_dir  >  DEFAULT_OUT
    runs_root = args.out or meta.get("runs_dir") or str(DEFAULT_OUT)

    if args.mode == "live" and not args.without_bundle:
        check_bundle_freshness(meta, paths, args)

    ts = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    base = pathlib.Path(runs_root) / meta["test_scenario"] / f"{args.mode}-{ts}"
    base.mkdir(parents=True, exist_ok=True)

    print(f"[runner] scenario={meta['test_scenario']} mode={args.mode} runs={runs} "
          f"judge={args.with_judge} model={h.get('model') or '(default)'} "
          f"judge_model={h.get('judge_model') or '(default)'} out={base}")

    if args.benchmark:
        with_s = run_condition("with-bundle", True, base, meta, paths, args.mode, runs, args.with_judge)
        without_s = run_condition("without-bundle", False, base, meta, paths, args.mode, runs, False)
        benchmark = {
            "scenario": meta["test_scenario"],
            "mode": args.mode,
            "with_bundle": with_s,
            "without_bundle": without_s,
            "delta": {
                "pass_rate": round(with_s["pass_rate"] - without_s["pass_rate"], 3),
                "interpretation": "bundle adds value if with-bundle pass-rate is materially higher",
            },
        }
        (base / "benchmark.json").write_text(
            json.dumps(benchmark, indent=2, ensure_ascii=False), encoding="utf-8")
        _print_summary(with_s)
        _print_summary(without_s)
        print(f"[runner] benchmark.json written: with={with_s['pass_rate']} "
              f"without={without_s['pass_rate']}")
        sys.exit(0 if with_s["status"] == "Passing" else 100)
    else:
        with_bundle = not args.without_bundle
        label = "with-bundle" if with_bundle else "without-bundle"
        summary = run_condition(label, with_bundle, base, meta, paths, args.mode, runs, args.with_judge)
        (base / "grading.json").write_text(
            json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
        _print_summary(summary)
        sys.exit(0 if summary["status"] == "Passing" else 100)


def _print_summary(s):
    print(f"  [{s['condition']}] status={s['status']} pass_rate={s['pass_rate']} "
          f"({s['passes']}/{s['runs']}) flaky={s['flaky']} "
          f"verdicts={s['verdicts']} mean_cost_usd={s['mean_cost_usd']}")


if __name__ == "__main__":
    main()
