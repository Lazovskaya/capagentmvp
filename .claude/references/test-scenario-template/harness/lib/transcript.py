"""
Parse a Claude Code `--output-format stream-json` transcript (JSONL).

The real message shapes (confirmed empirically against claude 2.1.x, since the
CLI JSON schema is not officially documented):

  {"type":"system","subtype":"init", ...}
  {"type":"assistant","message":{"content":[
       {"type":"tool_use","name":"Bash","input":{"command":"..."}},
       {"type":"text","text":"..."}]}}
  {"type":"user","message":{"content":[{"type":"tool_result","content":"..."}]}}
  {"type":"result","subtype":"success","is_error":false,
       "usage":{"input_tokens":..,"output_tokens":..,...},
       "total_cost_usd":..,"num_turns":..,"result":"...","duration_ms":..}

Everything the grader needs (tool-call trajectory + run metrics) is derived here,
so the fragile "which JSON field" knowledge lives in exactly one place.
"""
import json


def load(path):
    """Read a JSONL transcript into a list of event dicts (bad lines skipped)."""
    events = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def tool_calls(events):
    """Ordered list of {"name","input"} for every assistant tool_use block.

    The order across the stream is the tool-call trajectory (sequence). Note that
    a subagent's *internal* tool calls do not surface at top level; the parent's
    delegation shows up as a `Task` tool_use here, which is what we assert on.
    """
    calls = []
    for ev in events:
        if ev.get("type") != "assistant":
            continue
        content = ev.get("message", {}).get("content", []) or []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_use":
                calls.append({"name": block.get("name"), "input": block.get("input") or {}})
    return calls


def result_event(events):
    for ev in reversed(events):
        if ev.get("type") == "result":
            return ev
    return None


def metrics(events):
    """Per-run metrics: pass/fail signal + token/cost/turn/duration."""
    res = result_event(events) or {}
    usage = res.get("usage") or {}
    return {
        "subtype": res.get("subtype"),
        "is_error": res.get("is_error"),
        "terminal_reason": res.get("terminal_reason"),
        "num_turns": res.get("num_turns"),
        "duration_ms": res.get("duration_ms"),
        "total_cost_usd": res.get("total_cost_usd"),
        "input_tokens": usage.get("input_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "cache_read_input_tokens": usage.get("cache_read_input_tokens"),
        "cache_creation_input_tokens": usage.get("cache_creation_input_tokens"),
        "final_text": res.get("result"),
    }


def call_matches(call, kind, contains):
    """True if a tool call matches an expected (kind, contains) spec.

    kind -> tool name:  bash->Bash, task->Task, read->Read, write->Write, ...
    `contains` is matched case-insensitively against the serialized input.
    """
    name = (call.get("name") or "")
    if name.lower() != kind.lower():
        return False
    blob = json.dumps(call.get("input") or {}, ensure_ascii=False).lower()
    return contains.lower() in blob


def used_tool_names(events):
    return sorted({(c.get("name") or "") for c in tool_calls(events)})
