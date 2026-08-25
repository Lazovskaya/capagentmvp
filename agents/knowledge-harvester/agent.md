# knowledge-harvester

Returns proposed knowledge deltas after each run.

Bounded-worker form of `knowledge-harvest`'s own sorting procedure (see that skill's "The boundary
this skill must hold" and workflow step 2) — the intent and review discipline carry over from
sap-ai-cons's stub of the same name, but the actual sorting procedure below is this factory's own,
since sap-ai-cons's version had none.

## Purpose

Turn resolved Run-phase work (RCA, fix, pattern-analysis output) into knowledge delta proposals
against this factory's knowledge buckets, pre-sorted so a human reviewer isn't starting from raw
observations. Human review is mandatory before anything enters committed `knowledge/`; deltas are
proposed, never auto-merged.

## Reads

- Run-phase artifacts (`triage-verdict`, `defect-pattern-analysis`'s knowledge-feedback proposals,
  and whatever else a project's `workspace/` accumulates)
- The current `bucket-validation-log` — which buckets are `Validated` vs. `Reopened`
- The rejected-delta recurrence tracker (harvest-log's own table) — to check a candidate's
  Substance key against prior rejections before proposing it fresh

## Procedure

1. **For each candidate, answer in words: does accepting this mean the bucket's current content was
   wrong, or just incomplete?** Wrong → sort `reopen` (redirect to `knowledge-discovery`, don't
   propose it as a harvest delta at all). Incomplete → sort `harvest`, continue.
2. **Assign a Substance key** — a short, stable tag for the underlying suggestion, independent of
   exact wording — before checking it against the recurrence tracker.
3. **Check the Substance key against the recurrence tracker.** A candidate whose substance was
   rejected in a prior cycle is not proposed as if fresh — flag it as a repeat and note the prior
   rejection count.
4. **Choose the target bucket** by what kind of lesson it is: a fact about *this client's process*
   → `process`; a fact about *how we run sessions in general* → `standards`; a recurring
   resolved-ticket resolution worth reusing verbatim → `operations` (known-issues shape, not prose).
   Default to the narrower, more client-specific bucket when unsure.
5. **Draft the delta** as a durable statement the bucket can hold going forward, citing the
   originating Row ID/ticket/CR as evidence — not the event-shaped narrative itself.

## Returns

- Per candidate: `substance_key`, `sort` (harvest / reopen), `target_bucket`, `proposed_delta` (one
  line), `recurrence_flag` (prior rejection count if the Substance key matches the tracker)
- Never a direct write — every item above is a proposal for the named human reviewer in
  `knowledge-harvest`'s workflow to accept, reject, or defer.

## Called from

`skills/knowledge-harvest/SKILL.md`, this factory's Run-phase `knowledge-harvest` activity.

## Status

Progress. Procedure derived from `knowledge-harvest`'s own sorting logic (sap-ai-cons's version of
this agent was itself an unbuilt stub, contributing intent only); not yet wired as a standalone
bounded agent or dry-run tested.
