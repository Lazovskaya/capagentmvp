# Sign-off record — fit-to-standard

> **Reused by `cutover-plan` / `go-live-readiness`** for the `deploy→run` gate, with a different
> shape below the header: swap "Decision log Row ID range" for "Go-live checklist reference"
> (the per-process-area checklist `go-live-readiness` tracked) and "Deltas accepted/rejected" for
> "Checklist items closed / items open with named risk acceptance". Same acceptance discipline —
> a named signer, a stated authority to accept, one current record per scope — different source
> artifact underneath. See the "Deploy go-live" variant fields at the end of this template.

This is the artifact the `explore→realize` Q-gate actually checks. The decision log is the evidence;
this record is the acceptance. No entry here, no gate pass — a completed workshop with no sign-off is
the same as an open item for gate purposes.

- **Decision log Row ID range (source of truth for scope):** <e.g.
  `FTS-2026-08-04-credit-block-handling-row-01..07` — this range, not the process-name line below, is
  what the `explore→realize` gate and every downstream artifact treat as the actual scope. If the
  range and the process/variant description ever disagree, the Row ID range wins and the prose line
  must be corrected to match — never the other way around.>
- **Process / scope covered (prose, must restate the row range above, not substitute for it):** <name,
  variant, e.g. "Order to Cash — Credit Block Handling" — this is a human-readable label for the range
  above, not an independent scope definition>
- **Signed by:** <full name, title — not "Business" or "the client team". This is the **signer** role:
  accepts the whole session's scope. It is distinct from each row's **Delta owner** in the decision
  log (who accepted that specific decision) even when it's the same person — don't collapse the two
  fields into one just because the name matches.>
- **Role/authority to accept:** <state explicitly why this person can accept — e.g. "Process Owner,
  Order to Cash" — if the person in the room wasn't actually authorized to sign, say so here rather
  than implying authority that wasn't there>
- **Date:**
- **Deltas accepted in this scope:** <count, and list the Row IDs from the decision log>
- **Deltas explicitly rejected (standard adopted instead):** <count — a session with zero rejections
  across a large process is a signal to re-check whether pushback actually happened>
- **Open items deferred to backlog (not "Workaround" rows — see decision log rules):**
- **Superseded records:** <if this sign-off replaces an earlier one for the same scope, link it — a
  process should have one current sign-off, not a stack of ambiguous ones>

## Validity checklist before this record is considered complete

- [ ] Every row in the referenced decision log is Standard or Delta — no Workaround rows remain
- [ ] Every Delta row has a non-empty Requirement, Owner, and upgrade-cost note
- [ ] Signed-by person's authority to accept is stated, not assumed
- [ ] The Row ID range is present and is what defines scope — the prose process/variant line agrees
      with it, not the other way around

## Deploy go-live variant (`cutover-plan` / `go-live-readiness`)

Same record shape, different source fields — do not open a second artifact for this, substitute
these into the fields above:

- **Go-live checklist reference (source of truth for scope, replaces the Row ID range):** which
  `go-live-readiness` checklist run this sign-off closes — process areas covered, checklist date.
- **Checklist items closed / items open with named risk acceptance (replaces deltas
  accepted/rejected):** every open item at go-live needs a named person accepting the risk, not a
  silent gap — an unacknowledged open item is not neutral, it's the same as an unsigned decision.
- **Cutover rehearsal reference:** the `cutover-plan` dress-rehearsal run this sign-off also covers
  — a plan that was never rehearsed doesn't get folded into this sign-off as if it had been.
- Everything else (Signed by, Role/authority, Date, Superseded records) is unchanged.
