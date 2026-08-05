# knowledge-harvester

Returns proposed knowledge deltas after each run.

Ported from sap-ai-cons's `agents/knowledge-harvester.md`, itself a stub (target design, not
built) rather than a working agent, so there's no working logic to carry over beyond the intent
and the review discipline below, which is worth keeping.

## Purpose

Turn resolved work (RCA, fix, pattern-analysis, or any Run-phase output) into knowledge delta
proposals against this factory's nine knowledge buckets. Human review is mandatory before
anything enters committed `knowledge/`; deltas are proposed, never auto-merged.

## Reads

Run-phase artifacts (`triage-verdict`, and whatever else a project's `workspace/` accumulates).

## Returns

A knowledge delta proposal: which bucket, what changes, and why. Never a direct write.

## Called from

`skills/knowledge-harvest/SKILL.md`, this factory's Run-phase `knowledge-harvest` activity.

## Status

Not started. Ported as a stub matching sap-ai-cons's own stub, same as its source.
