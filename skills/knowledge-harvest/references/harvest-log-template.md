# Harvest log — knowledge-harvest

One cycle-header per harvest run (end of a Run cycle, or a scheduled/routed trigger), with one row per
delta candidate underneath. **A cycle-header must exist for every expected cycle, even if nothing was
harvested or the cycle was skipped** — an absent header is the gap; an empty candidate table under a
present header just means nothing needed harvesting that time. Never let "skipped" and "ran clean"
look the same.

## Cycle header

- **Cycle:** <e.g. "Hypercare wrap-up, Sprint 14" or "Scheduled monthly harvest, 2026-08">
- **Date:**
- **Facilitator:**
- **Cycle status:** Ran / Skipped — <if Skipped, state why (e.g. "delivery pressure, deferred to next
  cycle") — this is itself the finding SKILL.md warns about, don't leave it unrecorded>
- **`knowledge-harvester` agent consulted this cycle?** Y/N

## Delta candidates this cycle

**Before sorting, answer the SKILL.md test explicitly, in words, per row** — "does accepting this
delta mean the bucket's current content was wrong, or just incomplete?" The sort column is the
*conclusion* of that answer, not a substitute for writing it down; a row that jumps straight to
"Harvest" without the stated answer is not complete, however obvious the case looks.

**Substance key**: a short, stable tag (not the ticket ID, not the exact wording) that identifies the
*underlying suggestion* — e.g. `hardcode-region-map-in-code` — so this candidate can be matched against
the recurrence tracker below regardless of how differently it's phrased next time. Assign this before
checking the tracker, not after.

| # | Source ref (CR/Row ID or ticket, verbatim) | Substance key | Bucket | Proposed delta (one line) | Wrong-or-incomplete? (stated answer) | Harvest-vs-reopen sort | Agent recommendation (if consulted) | Reviewer decision | Reasoning (in the reviewer's own words) | Reviewer (name) | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | Harvest (accretive) / **Redirected to knowledge-discovery as reopen** | | Accept / Reject / Defer | | | |

## Rejected-delta recurrence tracker

Carry forward any delta whose *substance* has been rejected before, even if the wording differs. **Look
this table up by Substance key, not by re-reading the wording of past entries** — before recording a
new Reject in the candidates table above, check whether its Substance key already has a row here; if
so, increment it here instead of treating it as a fresh, unrelated rejection.

| Substance key | Plain-language description | Times rejected | Cycles | Worth escalating as its own finding? |
|---|---|---|---|---|

## Deferred from this cycle (carried to the next)

| # | Delta candidate | Why deferred | Target cycle to revisit |
|---|---|---|---|

## Rules for filling this in

- **Every delta candidate gets a harvest-vs-reopen sort before a reviewer decision is recorded.** A
  candidate sorted "redirected to knowledge-discovery" does not get an Accept/Reject/Defer decision
  here — it exits this log and enters `knowledge-discovery`'s reopen flow instead.
- **Accept never resets the bucket's Validated status.** This log's Accept entries are the audit trail
  of accretive changes to a bucket that remains `Validated` throughout — don't conflate this with
  `knowledge-discovery`'s Reopen history, which tracks a different kind of event (validation failure).
- **A cycle-header with "Skipped" status is a complete, valid log entry** — it is not a missing log
  entry to backfill later with fabricated content. State the skip and move on; don't invent deltas to
  make the cycle look like it ran.
- **The recurrence tracker is not optional bookkeeping** — a delta rejected three cycles running for
  the same underlying reason is a stronger finding than most single accepted deltas, and should be
  escalated (to the relevant knowledge-bucket owner, or as its own discussion) rather than quietly
  rejected a fourth time.

## Validity checklist before this log entry is considered complete

- [ ] A cycle-header exists, with an honest Ran/Skipped status
- [ ] Every delta candidate has the wrong-or-incomplete answer stated in words, and a harvest-vs-reopen
      sort derived from it — not just the sort column filled in
- [ ] Every delta candidate has a Substance key assigned before it's checked against the recurrence
      tracker
- [ ] No delta contradicting existing Validated content was Accepted here rather than redirected
- [ ] Rejected deltas are logged with reasoning, not silently dropped
- [ ] Every new Reject was checked against the recurrence tracker by Substance key before being
      recorded as a fresh entry
