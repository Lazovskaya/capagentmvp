"""
Human adjudication / sign-off of runs (human-in-the-loop).

--generate : from a completed run set, build a review sheet (input + each run's output
             + the harness verdict + judge scores) and a blank human-verdict.json for a
             person to confirm or override each run.
--summarize: read a filled human-verdict.json and print / write a sign-off summary
             (all confirmed? any overrides? net human status).

Usage:
  python make_review_sheet.py --generate --scenario <TS-dir> --run-set <live-dir> --out <dir>
  python make_review_sheet.py --summarize --verdict <human-verdict.json>
"""
import argparse
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from lib import scenario as scn    # noqa: E402


def _load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def generate(args):
    scenario = pathlib.Path(args.scenario).resolve()
    meta = scn.load_meta(scenario)
    output_artifact = meta["harness"]["output_artifact"]
    input_fixture = scenario / "fixtures" / meta["harness"]["fixtures"][0]
    run_set = pathlib.Path(args.run_set).resolve()
    out = pathlib.Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    run_dirs = sorted((run_set / "with-bundle").glob("run-*"))
    if not run_dirs:
        raise SystemExit(f"no run-* found under {run_set}/with-bundle")

    verdict_entries = []
    md = ["# Human review sheet",
          f"\nScenario: **{meta['test_scenario']}**  |  run set: `{run_set.name}`",
          f"\nInput (`{input_fixture.name}`):\n",
          "```", input_fixture.read_text(encoding="utf-8").strip(), "```", ""]

    for rd in run_dirs:
        grading = _load(rd / "grading.json")
        art = rd / "work" / output_artifact
        out_json = _load(art) if art.exists() else {}
        j = grading.get("level3_judge") or {}
        md += [f"## {rd.name} — harness verdict: {grading.get('verdict')}",
               f"- judge average: {j.get('average')}  scores: {j.get('scores')}",
               "",
               f"Output (`{output_artifact}`):", "```json",
               json.dumps(out_json, indent=2, ensure_ascii=False), "```",
               "",
               "Your review: set `human_verdict` to `Confirm` or `Override`, add a note.",
               ""]
        verdict_entries.append({
            "run": rd.name,
            "harness_verdict": grading.get("verdict"),
            "human_verdict": None,   # <- fill: "Confirm" or "Override"
            "note": "",
        })

    (out / "review.md").write_text("\n".join(md), encoding="utf-8")
    (out / "human-verdict.json").write_text(
        json.dumps({"scenario": meta["test_scenario"], "run_set": run_set.name,
                    "reviews": verdict_entries}, indent=2, ensure_ascii=False),
        encoding="utf-8")
    print(f"[make_review_sheet] wrote {out/'review.md'} and {out/'human-verdict.json'}")
    print("  Read review.md, then set each human_verdict to Confirm/Override in human-verdict.json.")


def summarize(args):
    data = _load(args.verdict)
    reviews = data.get("reviews", [])
    missing = [r["run"] for r in reviews if r.get("human_verdict") in (None, "")]
    if missing:
        raise SystemExit(f"human_verdict not filled for: {missing}")
    confirms = [r for r in reviews if r["human_verdict"].lower() == "confirm"]
    overrides = [r for r in reviews if r["human_verdict"].lower() == "override"]
    net = "Accepted" if not overrides else "Rejected by human"
    summary = {
        "scenario": data.get("scenario"),
        "run_set": data.get("run_set"),
        "reviews": len(reviews),
        "confirmed": len(confirms),
        "overridden": len(overrides),
        "human_signoff": net,
    }
    out = pathlib.Path(args.verdict).with_name("signoff-summary.json")
    out.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[make_review_sheet] human sign-off: {net} "
          f"(confirmed {len(confirms)}, overridden {len(overrides)}) -> {out}")
    sys.exit(0 if not overrides else 100)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--generate", action="store_true")
    ap.add_argument("--summarize", action="store_true")
    ap.add_argument("--scenario")
    ap.add_argument("--run-set")
    ap.add_argument("--out")
    ap.add_argument("--verdict")
    args = ap.parse_args()
    if args.generate:
        if not (args.scenario and args.run_set and args.out):
            ap.error("--generate needs --scenario, --run-set, --out")
        generate(args)
    elif args.summarize:
        if not args.verdict:
            ap.error("--summarize needs --verdict")
        summarize(args)
    else:
        ap.error("choose --generate or --summarize")


if __name__ == "__main__":
    main()
