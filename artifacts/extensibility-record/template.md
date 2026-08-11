# Extensibility record — solution-design

One of these per delta, paired with its design-record by the same Row ID. This is the clean-core
decision — it sets the client's upgrade cost, so every rejected tier needs its own stated reason, not
just the winning tier.

- **Decision-log Row ID:** <same Row ID as the paired design-record>
- **Extensibility-assessor agent consulted?** Y/N. <If Y: state its recommended tier and whether this
  record agrees or diverges — a silent override is not acceptable; if the human decision differs from
  the agent's, say why. If N: say so explicitly rather than leaving it blank — an unconsulted agent
  should be a visible fact, not an invisible gap.>

## Tier ladder walk (state a reason at every tier, not just the chosen one)

The **Rejection basis** column matters as much as the reason itself: a rejection based on something
known before the walk started (e.g. "this data model has no customizing field, full stop") is
different from one triggered by a red flag *discovered while walking the ladder* (e.g. "we assumed
tier 2 would work, but the required condition needs an API that turns out not to be released"). Mark
which kind each rejection is — a chain of "known" rejections is a clean routing; a "discovered"
rejection mid-walk is worth a second look at whether the same red flag should have disqualified this
delta earlier, back in fit-to-standard.

| Tier | Considered? | Why rejected (or why chosen) | Rejection basis: known upfront / discovered during walk |
|---|---|---|---|
| 1 — Standard configuration | | | |
| 2 — Key-user extension | | | |
| 3 — Side-by-side (BTP) | | | |
| 4 — Developer extensibility (ABAP Cloud) | | | |
| 5 — Classic modification (last resort) | | | — (chosen tier, not rejected) |

- **Chosen tier:**
- **Red flags surfaced during the walk:** <e.g. reliance on a non-released API, a requirement that
  only a specific released BAdI can satisfy — name them even if they didn't change the outcome, and
  cross-reference which tier row's "discovered during walk" mark they correspond to>

## If chosen tier is 5 (classic modification) — mandatory escalation block

- **Escalation addendum Row ID:** <the `-esc-N` addendum row created in the fit-to-standard decision
  log per its "Escalation addenda" section — this record is not final without that addendum existing.
  **If this delta was assembled via Mode B with no decision-log Row ID**, anchor this on the
  design-record's own minted ID instead (`<design-record-id>-esc-1`) and separately note the
  recommended retroactive fit-to-standard row as a follow-up, not a precondition for this field.>
- **Escalation owner (name):** <distinct from the decision log's Delta owner and the sign-off record's
  signer — this is the person who explicitly accepted the tier-5 upgrade-cost consequence, once it was
  known>
- **Escalation date:**

## Handoff

Feeds `backlog-drafting`, which cites this record's Row ID and chosen tier directly — it does not
re-derive the tier decision, only reads it.
