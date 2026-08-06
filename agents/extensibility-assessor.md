# extensibility-assessor

Returns the extensibility tier, its justification, and any red flags. The clean-core decision,
recorded.

Bounded-worker form of `solution-design`'s own tier-ladder walk (see that skill's "The tier ladder"
and workflow step 2-4) — this agent runs the same procedure and returns a typed verdict for the
skill to check, not to rubber-stamp.

## Reads

- The delta's requirement (from the fit-to-standard decision-log Row ID, or the Mode B
  source-synthesis design-record fields)
- `knowledge/extensibility/` and `knowledge/clean-core/` — released-API and upgrade-safety criteria
  (both still stubs in this factory; if consulted and empty, say so rather than inventing criteria)

## Procedure

1. **Start at tier 1** (standard configuration) and test the requirement against it: can this be met
   with customizing alone, no code? If yes, stop here — tier 1, no further tiers considered.
2. **If tier 1 fails, state why** (a specific, checkable reason — "no customizing field exists for
   this rule," not "seems complex") before testing tier 2 (key-user extension: released
   extension points, no code beyond configured rules).
3. **Continue down the ladder** (tier 3 side-by-side BTP, tier 4 developer extensibility/ABAP
   Cloud) the same way — one stated rejection reason per tier before moving to the next.
4. **At each tier, check specifically whether it depends on a released API or extension point.** A
   tier that looks right but needs a non-released API is not that tier — flag it as a **red flag**
   pushing toward tier 5, don't silently accept it at the tier it superficially resembles.
5. **Mark each rejection's basis:** `known upfront` (something that ruled the tier out before
   testing it, e.g. "this object has no customizing field, full stop") vs. `discovered during
   walk` (a red flag surfaced only while testing that tier). A `discovered` rejection is worth
   flagging back to whoever scoped the delta — the same red flag might have disqualified it earlier.
6. **If every tier through 4 is rejected, the verdict is tier 5** — flag this explicitly as requiring
   the mandatory escalation block (a named escalation owner accepting the upgrade-cost consequence),
   not just another routing outcome.

## Returns

- `tier`: 1-5
- `justification`: the stated reason for the chosen tier
- `rejected_tiers`: each lower tier considered, its rejection reason, and rejection basis
  (known-upfront / discovered-during-walk)
- `red_flags`: any non-released-API or similar dependency surfaced, even if it didn't change the
  outcome
- `escalation_required`: true if tier is 5

## Human-in-the-loop

This is a recommendation `solution-design` checks, not a final decision — the human walking the
ladder states explicitly whether they agree or diverge, and why, per that skill's own workflow. A
silent override defeats the point of a second, tool-driven opinion.

## Status

Progress. Procedure derived from `solution-design`'s own tier-ladder logic; not yet wired as a
standalone bounded agent or dry-run tested.
