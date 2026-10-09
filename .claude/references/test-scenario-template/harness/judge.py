"""
Level 3 -- LLM-judge. Scores the produced report against the source card using a
rubric, in a SEPARATE fresh context (its own isolated `claude -p` process). The
judge never sees how the report was produced.

Reason-before-score, small integer scale (1-5), rubric-driven -- the standard
guardrails from the research chapter (Anthropic/Google/Microsoft). `model` (see
`judge()` below, sourced from `scenario.config.md`'s `harness.judge_model`) lets
the judge run on a different model than the agent under test, which is the
stronger setup for avoiding self-preference bias; leave it unset to fall back
to the account's managed model pin.
"""
import json
import pathlib
import re
import tempfile

from lib import isolation
from lib import runclaude
from lib import transcript as T


JUDGE_PROMPT = """You are an impartial evaluator. Score the ANALYSIS REPORT below \
against the SOURCE CUSTOMER CARD, using the RUBRIC. You did not produce the report \
and must not assume it is correct.

For each rubric dimension: write a one-sentence reason FIRST, then an integer \
score 1-5. Return ONLY the JSON block specified by the rubric, inside a ```json \
fenced block. Do not use any tools.

=== RUBRIC ===
{rubric}

=== SOURCE CUSTOMER CARD ===
{card}

=== ANALYSIS REPORT (JSON) ===
{report}
"""


def _extract_json(text):
    if not text:
        return None
    m = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if not m:
        m = re.search(r"(\{.*\})", text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def judge(card_path, report_path, rubric_path, pass_threshold, min_dimension,
          run_dir, timeout=300, model=None):
    """Run the judge. Returns a verdict dict (never raises for a bad verdict)."""
    card = pathlib.Path(card_path).read_text(encoding="utf-8")
    report = pathlib.Path(report_path).read_text(encoding="utf-8")
    rubric = pathlib.Path(rubric_path).read_text(encoding="utf-8")
    prompt = JUDGE_PROMPT.format(rubric=rubric, card=card, report=report)

    run_dir = pathlib.Path(run_dir)
    work = run_dir / "work"
    cfg = run_dir / "cfg"
    work.mkdir(parents=True, exist_ok=True)
    cfg.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copy2(isolation.credentials_path(), cfg / ".credentials.json")

    transcript_path = run_dir / "judge-transcript.jsonl"
    res = runclaude.run(
        prompt, work, isolation.child_env(cfg), transcript_path,
        allowed_tools=None, disallowed_tools="Bash,Task,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch",
        permission_mode="acceptEdits", timeout=timeout, model=model,
    )

    events = T.load(transcript_path)
    m = T.metrics(events)
    verdict = {
        "passed": False,
        "error": None,
        "scores": None,
        "average": None,
        "min_dimension": None,
        "raw_text": m.get("final_text"),
        "cost_usd": m.get("total_cost_usd"),
        "model": model,
    }
    if res["timed_out"]:
        verdict["error"] = "judge timed out"
        return verdict
    parsed = _extract_json(m.get("final_text"))
    if not parsed:
        verdict["error"] = "could not parse judge JSON"
        return verdict

    dims = ["grounding", "defensibility", "relevance"]
    try:
        scores = {d: int(parsed[d]["score"]) for d in dims}
    except (KeyError, TypeError, ValueError) as exc:
        verdict["error"] = f"malformed judge output: {exc}"
        return verdict

    avg = sum(scores.values()) / len(scores)
    lo = min(scores.values())
    verdict.update({
        "scores": scores,
        "reasons": {d: parsed[d].get("reason") for d in dims},
        "average": round(avg, 2),
        "min_dimension": lo,
        "passed": (avg >= pass_threshold and lo >= min_dimension),
    })
    return verdict
