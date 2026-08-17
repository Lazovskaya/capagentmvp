---
name: knowledge-harvest
description: After a run (or on a routed trigger from another skill), propose targeted knowledge-bucket deltas — what changed, what was learned, which guidance turned out wrong — for a named human to accept, reject, or defer. Never auto-merges. This is the step most likely to be skipped under delivery pressure, which is exactly why every cycle gets logged even when nothing gets harvested.
---

# Knowledge harvest

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in `../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

Make the next engagement — or the next phase of this one — start from what was actually learned,
not from the same starting point every time. This is the only activity that closes the loop back into
the knowledge buckets after delivery work happens. It proposes; **it never merges on its own.** A
named human decides every delta, even the ones that look obviously right — the review step is what
keeps the knowledge base honest over many cycles, not a formality to speed past.

## When to use

- End of a Run cycle: hypercare wrap-up, sprint close, or end of engagement
- Whenever another skill routes a delta here as a **case-2** gap (see `knowledge-discovery` and
  `onboarding-guide`: an accretive addition to a bucket that's already `Validated` and still holding
  up fine — not a bucket whose validation itself was wrong)
- Periodically, deliberately, even with no specific trigger — because this activity is the one most
  likely to be skipped under delivery pressure, it needs a scheduled cadence, not just reactive
  triggers, or it quietly stops happening

## The boundary this skill must hold: harvest vs. reopen

This is the single most important judgment call here. Not every delta candidate belongs to this
skill:

- **Harvest-appropriate (case 2):** the bucket's existing content is still correct; something is
  *missing* or *thin*, and adding it doesn't contradict anything already validated.
- **Reopen-appropriate (case 1), NOT this skill's job:** the delta candidate actually **contradicts or
  undermines** something the bucket claims as `Validated` — the original validation missed something
  real. That is a job for `knowledge-discovery`'s reopen path (`Status: Reopened — prior validation
  didn't hold`), not a harvest merge. **Do not accept a case-1-shaped delta here just because it
  arrived through the harvest pipeline** — redirect it, and say explicitly why it's a reopen candidate
  rather than a harvest candidate.

If in doubt: ask "does accepting this delta mean the bucket's current content was wrong, or just
incomplete?" Wrong → reopen. Incomplete → harvest.

## Inputs needed

- Delta candidates from any source: routed case-2 gaps from `knowledge-discovery`/`onboarding-guide`,
  resolved CR referrals from `defect-triage` that produced a new decision worth generalizing, direct
  observations from the run (what changed, what broke, what a retrospective surfaced), **recurring
  resolved-ticket patterns worth reusing as a known-issue/FAQ entry** (absorbed from `sap-ai-cons`'s
  `known-issues-kb` stub — a distinct target bucket for this delta type, not a separate skill; see
  step 2)
- The `knowledge-harvester` agent's proposed deltas, if wired — a starting point, not a final list
- The current `bucket-validation-log` — to confirm which buckets are `Validated` (safe for an
  accretive edit) vs. `Reopened` (already flagged as needing a full revisit, not a quick addition)

## Workflow

1. **Collect every delta candidate** for this cycle from all sources — don't only process the ones
   that arrived pre-routed; ask whether the run surfaced anything nobody explicitly flagged yet.

2. **Sort each candidate against the harvest-vs-reopen boundary** above before doing anything else —
   and write down the answer to "wrong, or just incomplete?" in words, not just the resulting sort. A
   candidate that's actually reopen-shaped gets redirected to `knowledge-discovery` now, not processed
   further here. Assign a **Substance key** (a short, stable tag for the underlying suggestion,
   independent of exact wording) before checking it against the recurrence tracker — this is what makes
   a reworded repeat of a previously-rejected delta findable later.

   **Generalizing a resolved CR (e.g. from `defect-triage`) into a bucket delta needs its own care.** A
   CR resolution is client-specific and event-shaped ("we added X because of ticket Y"); a harvest
   delta should keep the client-specific fact but strip the ticket-specific narrative — write it as a
   durable statement the bucket can hold going forward, with the originating Row ID/CR ID cited as
   evidence, not as the sentence itself. Choose the bucket by what kind of lesson it is: a fact about
   *this client's process* → `process`; a fact about *how we run fit-to-standard/solution-design
   sessions in general* (a facilitation lesson, not a client fact) → `standards`; **a recurring
   resolved-ticket resolution worth reusing verbatim as a known-issue/FAQ entry** (not a process fact,
   a "here's how we fixed this exact recurring thing before") → `operations`, as a dedicated
   known-issues entry — same accept/reject/defer review as any other delta, just a distinct target
   shape (symptom → resolution → originating ticket reference, not prose). When unsure which bucket,
   default to the narrower, more client-specific bucket (`process`) rather than generalizing further
   than the evidence supports.

3. **Consult the `knowledge-harvester` agent's recommendation, if wired**, and state whether this
   review agrees or diverges — same rule as every other agent-assisted skill in this factory.

4. **Route each remaining candidate to a named reviewer.** For every one, the reviewer decides:
   - **Accept** — merge into the bucket, log the change with its source, and note it in the bucket's
     own history (see `references/harvest-log-template.md`). Accepting does **not** reset the bucket's
     `Validated` status or require a full re-review — it's an accretive edit, not a revalidation.
   - **Reject** — with a stated reason. A rejected delta is not discarded; it's logged. A delta that
     gets rejected once is normal noise. **A delta rejected in more than one harvest cycle for the same
     substance is a signal**, not a repeat of noise — something is generating the same wrong
     suggestion repeatedly, and that's worth investigating on its own, separate from the bucket content
     itself.
   - **Defer** — needs more evidence or a wider discussion; carries forward to the next cycle rather
     than silently disappearing.

5. **Never auto-merge, even the obviously-correct ones.** The review is not a rubber stamp on
   agent-generated suggestions — a human states, for each delta, why it's being accepted, in their own
   words, not just "approved."

6. **If this cycle produces zero accepted deltas, or the cycle is skipped entirely under delivery
   pressure, log that too.** A missing harvest-log entry for a cycle should be visible as a gap, not
   indistinguishable from "nothing needed harvesting" — see `references/harvest-log-template.md`'s
   cycle-header requirement.

## Outputs

- **Updated bucket content** for every accepted delta — additive, without disturbing the bucket's
  `Validated` status
- **`harvest-log` artifact**: one entry per delta candidate (source, bucket, harvest-vs-reopen sort,
  agent recommendation if consulted, reviewer decision and reasoning, date) — see
  `references/harvest-log-template.md`
- Redirected reopen candidates, handed to `knowledge-discovery`
- Feeds the `run-exit` Q-gate — that gate should read whether a harvest cycle actually ran for the
  period, not just whether buckets look fine

## Judgment calls worth stating out loud

## Run-loop intake contract

Accept candidates from `defect-pattern-analysis` with incident references,
Substance key, confirmed cause, applicability, target bucket, owner and review
date. For a closing cycle named `<Period> Closing Harvest`, reconcile candidates
from triage and pattern analysis before sorting them into harvest, reopen or
reject.

The cycle emits a durable header, candidate dispositions, accepted knowledge
references and rejected/reopened reasons. If triage or pattern analysis did not
run, record that as an explicit gap; an empty candidate list is not proof that
the upstream step completed.

- **"It's obviously right" is not a reason to skip logging the review** — the discipline of writing
  down why, every time, is what prevents this step from degrading into an unreviewed auto-merge in
  practice even while nominally requiring review.
- **A delta that contradicts validated content must never be quietly folded in as if it were just an
  addition** — that's exactly how a knowledge base accumulates undetected rot: small "corrections"
  that are actually reopens in disguise, merged without anyone re-checking the original validation.
- **A harvest cycle that gets skipped under delivery pressure is itself the finding this activity's own
  description warns about** — log the skip, don't let it vanish silently; a project with no harvest-log
  entries for several cycles running is a visible signal, not an absence of signal.
- **Recurring rejections are data, not friction.** Don't tune them out just because they keep getting
  rejected — ask why the same wrong suggestion keeps surfacing.
