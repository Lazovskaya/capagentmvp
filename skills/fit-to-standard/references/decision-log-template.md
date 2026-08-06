# Decision log — fit-to-standard

One of these per process/sub-process walked through in a workshop. Feeds the `process` knowledge
bucket. Every row must be filled — a blank Requirement/Justification cell on a Delta row is the gap,
not a formatting choice to fix later.

- **Process:** <name, e.g. "Order to Cash — Credit Block Handling">
- **Variant:** <if applicable>
- **Engagement:** G / B
- **Workshop date(s):**
- **Facilitator:**
- **Business process owner(s) present:**
- **Log ID prefix:** `FTS-<YYYY-MM-DD>-<process-slug>` — e.g. `FTS-2026-08-04-credit-block-handling`.
  **The date is the first workshop day**, fixed at scoping time (step 1 of the workflow), even if the
  session runs multiple days or reconvenes later — a prefix must not shift mid-session just because
  the calendar did. If a reconvened session is materially a new session (new scope, new attendees,
  weeks later), give it a new prefix rather than continuing the old one.
  Every row gets `<prefix>-row-<NN>` as its **Row ID**. This ID, not a free-text description of "which
  workshop, which step," is what every downstream artifact (design-record, extensibility-record,
  work item) must cite verbatim — copy the key, don't re-describe the location.

| Row ID | Process step | SAP standard behavior | Decision | Requirement (reframed, not historical process) | Standard already meets reframed requirement? | Upgrade / clean-core cost (one line) | Delta owner (name — accepted this decision) | Notes |
|---|---|---|---|---|---|---|---|---|
| `<prefix>-row-01` | | | Standard | — | — | — | | |
| `<prefix>-row-02` | | | Delta | | Y/N — if Y, why delta still chosen | | | |
| `<prefix>-row-03` | | | Workaround → resolved as: Standard/Delta | | | | | must not stay "Workaround" at close-out |

## Rules for filling this in

- **Standard rows still get recorded.** A process bucket with only deltas listed is unauditable —
  silence about a step looks like an oversight two years later, not a deliberate "no deviation."
- **"We've always done it this way" is not a Requirement.** Ask why the process works that way; put
  the answer in the Requirement column, not the historical description.
- **If "Standard already meets reframed requirement?" is Y, the Decision should usually be Standard,
  not Delta.** If the room still chooses Delta anyway, the Notes column must say why standard was
  rejected despite meeting the underlying need — that's the sentence that gets tested at the next
  upgrade.
- **No Workaround rows survive to sign-off.** Every Workaround must resolve to Standard or Delta
  before the session closes, or it moves to the backlog as an open question — not into this log as a
  pending state.
- **Delta owner is a name, not a role or team.** This is what lets defect-triage later distinguish
  "the spec was wrong" (this person accepted it) from "this is a bug" (nobody accepted this behavior).
  This is a distinct role from the **signer** on the sign-off-record (who accepts the whole session's
  scope) and the **build owner** assigned later in backlog-drafting (who implements it) — the same
  person may hold more than one of these roles, but the fields are never merged, because
  defect-triage needs to know which hat was worn for which decision.

## Handoff

Rows marked Delta go to `solution-design` for extensibility-tier routing. This log records *whether*
and *why* to deviate; it does not decide *where the change lives* (config, key-user extension,
side-by-side BTP, developer extensibility, or classic modification).

## Escalation addenda (tier-5 reopen)

If `solution-design` routes a Delta row to tier 5 (classic modification) and reopens the underlying
decision, do not create a new, disconnected decision — append an **addendum row** using the same
Row ID with an `-esc-1` suffix (e.g. `<prefix>-row-02-esc-1`), stating what changed in light of the
now-known upgrade cost, and re-confirm with the original Delta owner (or their named delegate) before
`solution-design` finalizes the tier-5 extensibility-record. The addendum row is what closes the loop
`solution-design`'s SKILL.md refers to as "go back to fit-to-standard" — without it, that instruction
has no artifact to land in.

**If the Delta owner does not re-confirm** (declines, is unreachable, or reduces the requirement once
the tier-5 cost is known): the addendum row's Decision becomes the outcome of that conversation, not
an assumed carry-forward of the original Delta — record it as `Standard` (if the owner backs off the
requirement) or `Delta — unresolved, escalated to `[named sponsor/steering role]`` (if the owner still
wants it but won't personally own the tier-5 cost). A tier-5 extensibility-record must never cite an
addendum whose Decision is still blank or silently defaults to "confirmed."
