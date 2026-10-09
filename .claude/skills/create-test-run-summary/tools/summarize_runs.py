#!/usr/bin/env python3
"""
Tool: summarize-test-runs

Turn a scenario's completed live/replay run batches (under `runs_dir/<test_scenario>/`)
into one human-readable Markdown summary, then rotate the processed batches into
`Complete/` so the next run only picks up what is new.

What counts as "a batch": a `live-<ts>/` or `replay-<ts>/` directory directly under
`runs_dir/<test_scenario>/`. A batch is only picked up once it is FINISHED -- i.e. it
has a `grading.json` or `benchmark.json` at its own top level (not just inside a
`run-N/` subfolder) -- so a run still in progress is never picked up half-written.

`align-*/` batches (Level-3 judge calibration, Human eval Role A) are deliberately
NOT included: they test the judge, not the agent, and mixing their outcome into an
agent pass-rate would misrepresent both. Their `alignment.json` (if the scenario has
one) is surfaced as a single informational line instead.

Live and replay batches are reported in separate sections: replay is a free,
deterministic re-grade of the SAME frozen golden run, not independent evidence of
the agent's behaviour, so folding its pass-rate into live's would overstate how much
real evidence exists.

Uniqueness of `test_scenario` (the id in scenario.config.md, which is also the
`runs_dir` subfolder name) is NOT verified here -- if two different local scenario
copies share the same id, their run batches share one runs_dir folder, and this
tool cannot tell them apart. Keeping ids unique across scenarios is the user's
responsibility (see the scenario's own SKILL.md / runnability checklist).

Usage:
  python summarize_runs.py --scenario <TS-dir> [--out test-results]
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import shutil
import sys

import yaml

_METRICS_BLOCK = re.compile(
    r"##\s+Settings\b.*?```yaml\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def load_meta(scenario_dir):
    """Minimal, standalone re-read of scenario.config.md (frontmatter + Settings block).

    Duplicated from harness/lib/scenario.py rather than imported: this tool lives
    under .claude/skills/, outside any single scenario's own harness copy, and each
    scenario's harness is intentionally a separate, adaptable copy (see
    02-template-structure.md) -- this tool should not reach into one arbitrarily.
    """
    p = pathlib.Path(scenario_dir) / "scenario.config.md"
    text = p.read_text(encoding="utf-8")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise SystemExit(f"{p}: malformed frontmatter")
    meta = yaml.safe_load(parts[1]) or {}
    m = _METRICS_BLOCK.search(parts[2])
    if not m:
        raise SystemExit(f"{p}: no '## Settings' YAML block found")
    meta.update(yaml.safe_load(m.group(1)) or {})
    return meta


def business_task_line(scenario_dir):
    """Best-effort one-line business context, pulled from scenario.md."""
    p = pathlib.Path(scenario_dir) / "scenario.md"
    if not p.exists():
        return None
    text = p.read_text(encoding="utf-8")
    m = re.search(r"-\s+\*\*Task:\*\*\s*(.+?)(?:\n\n|\n-|\Z)", text, re.DOTALL)
    if m:
        return " ".join(m.group(1).split())
    m = re.search(r"^description:\s*(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else None


def _load_json(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def is_finished(batch_dir):
    return (batch_dir / "grading.json").exists() or (batch_dir / "benchmark.json").exists()


def find_batches(runs_root, complete_dir):
    if not runs_root.exists():
        return [], []
    live, replay = [], []
    for child in sorted(runs_root.iterdir()):
        if not child.is_dir() or child == complete_dir:
            continue
        if child.name.startswith("live-"):
            bucket = live
        elif child.name.startswith("replay-"):
            bucket = replay
        else:
            continue
        if is_finished(child):
            bucket.append(child)
    return live, replay


def condition_summary(batch_dir, condition):
    """Read a condition's aggregated grading.json (with-bundle/ or without-bundle/)."""
    p = batch_dir / condition / "grading.json"
    if not p.exists():
        return None
    return _load_json(p)["summary"]


def per_run_rows(batch_dir, condition, n_runs):
    rows = []
    for k in range(1, n_runs + 1):
        p = batch_dir / condition / f"run-{k}" / "grading.json"
        if not p.exists():
            continue
        r = _load_json(p)
        judge = r.get("level3_judge") or {}
        failing = []
        for level_name in ("level1", "level2"):
            for c in (r.get(level_name) or {}).get("checks", []):
                if not c["ok"]:
                    failing.append(f"{level_name}/{c['check']}: {c.get('detail', '')}")
        rows.append({
            "run": r["run"],
            "verdict": r["verdict"],
            "model": r.get("model") or "(default)",
            "judge_model": (r.get("judge_model") or "(default)") if judge else "-",
            "judge_avg": judge.get("average"),
            "judge_caveat": judge.get("caveat"),
            "turns": (r.get("metrics") or {}).get("num_turns"),
            "cost_usd": (r.get("metrics") or {}).get("total_cost_usd"),
            "failing": failing,
        })
    return rows


def _fmt(v, fmt=None):
    if v is None:
        return "-"
    return format(v, fmt) if fmt else str(v)


def render_condition(md, batch_dir, condition):
    summ = condition_summary(batch_dir, condition)
    if summ is None:
        return
    mean_cost = _fmt(summ.get("mean_cost_usd"), ".4f")
    md.append(f"**{condition}** — status **{summ['status']}**, "
              f"pass-rate {summ['pass_rate']} ({summ['passes']}/{summ['runs']}), "
              f"flaky={summ['flaky']}, mean cost/run ${mean_cost}")
    md.append("")
    rows = per_run_rows(batch_dir, condition, summ["runs"])
    if not rows:
        return
    md.append("| Run | Verdict | Model | Judge model | Judge avg | Turns | Cost |")
    md.append("|---|---|---|---|---|---|---|")
    for r in rows:
        md.append(f"| {r['run']} | {r['verdict']} | {r['model']} | "
                  f"{r['judge_model']} | {_fmt(r['judge_avg'])} | "
                  f"{_fmt(r['turns'])} | ${_fmt(r['cost_usd'], '.4f')} |")
    md.append("")
    failing_any = [r for r in rows if r["failing"]]
    if failing_any:
        md.append("Failure detail:")
        for r in failing_any:
            for f in r["failing"]:
                md.append(f"- run {r['run']}: {f}")
        md.append("")
    for r in rows:
        if r.get("judge_caveat"):
            md.append(f"- run {r['run']} judge caveat: {r['judge_caveat']}")
    md.append("")


def render_batch(md, batch_dir, runs_root):
    rel = batch_dir.relative_to(runs_root)
    md.append(f"### `{rel}/`")
    md.append("")
    if (batch_dir / "benchmark.json").exists():
        bench = _load_json(batch_dir / "benchmark.json")
        render_condition(md, batch_dir, "with-bundle")
        render_condition(md, batch_dir, "without-bundle")
        delta = bench["delta"]
        md.append(f"**Value proof (delta):** {delta['pass_rate']:+.3f} pass-rate "
                  f"({delta['interpretation']}).")
        md.append("")
    else:
        summ = _load_json(batch_dir / "grading.json")
        render_condition(md, batch_dir, summ["condition"])


def judge_validation_line(scenario_dir):
    p = (pathlib.Path(scenario_dir) / "expected" / "human-evaluation"
         / "judge-validation" / "alignment.json")
    if not p.exists():
        return ("Judge validation: not run yet (`align_judge.py`) — every Level-3 "
                "result above carries a \"not validated against humans\" caveat.")
    a = _load_json(p)
    status = "validated" if a["validated"] else "NOT validated"
    judge_model = a.get("judge_model") or "(default)"
    return (f"Judge validation: **{status}** (within_1={a['overall']['within_1']}, "
            f"judge_model={judge_model}, generated {a['generated']}).")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--scenario", required=True, help="path to the TS-<id> scenario directory")
    ap.add_argument("--out", default=None,
                    help="output dir for the summary (default: <scenario>/test-results)")
    args = ap.parse_args()

    scenario_dir = pathlib.Path(args.scenario).resolve()
    meta = load_meta(scenario_dir)
    test_scenario = meta["test_scenario"]
    runs_root = pathlib.Path(meta["runs_dir"]) / test_scenario
    complete_dir = runs_root / "Complete"

    live, replay = find_batches(runs_root, complete_dir)
    if not live and not replay:
        print(f"[summarize_runs] nothing new to summarize under {runs_root} "
              f"(everything already in Complete/, or no finished batches yet).")
        return

    out_dir = pathlib.Path(args.out).resolve() if args.out else (scenario_dir / "test-results")
    out_dir.mkdir(parents=True, exist_ok=True)
    gen_ts = dt.datetime.now().strftime("%Y%m%d-%H%M%S")

    md = [f"# Test run summary — {test_scenario}", "",
          f"Generated: {gen_ts}"]
    task = business_task_line(scenario_dir)
    if task:
        md.append(f"Scenario: {task}")
    md.append("")
    md.append("## Batches included")
    md.append("")
    md.append("| Mode | Batch |")
    md.append("|---|---|")
    for b in live:
        md.append(f"| live | `{b.name}` |")
    for b in replay:
        md.append(f"| replay | `{b.name}` |")
    md.append("")

    if live:
        md.append("## Live runs")
        md.append("")
        md.append("Real, non-deterministic evidence of the agent's behaviour.")
        md.append("")
        for b in live:
            render_batch(md, b, runs_root)

    if replay:
        md.append("## Replay runs")
        md.append("")
        md.append("Free, deterministic re-grade of the SAME frozen golden run in "
                   "`fixtures/golden-run/` — confirms the grader/schema/rubric still "
                   "agree with each other, not new evidence about the agent.")
        md.append("")
        for b in replay:
            render_batch(md, b, runs_root)

    md.append("## Judge validation")
    md.append("")
    md.append(judge_validation_line(scenario_dir))
    md.append("")

    md.append("## Raw files")
    md.append("")
    md.append(f"Per-run `grading.json` and `run-transcript.jsonl` are under "
              f"`{runs_root.as_posix()}/<batch>/<condition>/run-N/` (moved to "
              f"`{complete_dir.as_posix()}/<batch>/...` after this summary).")
    md.append("")

    out_file = out_dir / f"summary-{gen_ts}.md"
    out_file.write_text("\n".join(md), encoding="utf-8")

    complete_dir.mkdir(parents=True, exist_ok=True)
    moved = []
    for b in live + replay:
        dest = complete_dir / b.name
        shutil.move(str(b), str(dest))
        moved.append(b.name)

    print(f"[summarize_runs] wrote {out_file}")
    print(f"[summarize_runs] moved to {complete_dir}: {', '.join(moved)}")


if __name__ == "__main__":
    main()
