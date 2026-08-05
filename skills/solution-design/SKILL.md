---
name: solution-design
description: Turn each accepted fit-to-standard delta into a target design and route it to the cheapest extensibility tier that can actually carry it — standard config, key-user extension, side-by-side BTP, developer extensibility, or classic modification as a last resort. Use after a fit-to-standard decision log has Delta rows to route, before any backlog item or build work starts.
---

# Solution design & extensibility routing

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in `../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

Every accepted delta needs a home, and where it lives sets the client's upgrade cost for years. This
skill takes each `Delta` row from a `fit-to-standard` decision log and routes it to a tier — recording
*why every cheaper tier was rejected*, not just which tier was chosen. The tier decision is the
clean-core decision; treat it with the same rigor fit-to-standard used to decide the delta was
justified in the first place.

## When to use

- Immediately after a `fit-to-standard` session produces Delta rows with sign-off
- When a delta's implementation approach is being chosen or reconsidered
- Before `backlog-drafting` — a delta with no tier decision isn't ready to become a work item
- When reviewing whether an already-built extension actually matches its recorded tier (drift check)

## Inputs needed

- The `fit-to-standard` decision log, specifically its Delta rows (Row ID, requirement, justification,
  Delta owner) — cite each Row ID verbatim in the design-record and extensibility-record you produce
- The `extensibility` and `clean-core` knowledge buckets — SAP's published rules on in-app vs.
  side-by-side extensibility, released APIs, and upgrade-safety boundaries
- If an `extensibility-assessor` agent is wired, its verdict (tier, justification, red flags) as a
  starting recommendation to check, not to rubber-stamp

## The tier ladder

Work down from the top. Escalate to the next tier **only** when the requirement genuinely cannot be
met at the tier above — see `references/extensibility-ladder.md` for the full rubric, red flags per
tier, and worked examples.

1. **Standard configuration** — customizing only, no code. Cheapest, always try first.
2. **Key-user extension** — in-app extensibility (e.g. custom fields, custom logic, custom fields &
   logic tools) using released extension points. No custom code beyond configured rules.
3. **Side-by-side (BTP)** — extension built outside the core (CAP/RAP on BTP), calling only released
   APIs. Decouples the client's innovation from the core's upgrade cycle, at the cost of integration
   and operational overhead.
4. **Developer extensibility (in-app, ABAP Cloud)** — custom code inside the system, but constrained
   to released APIs and cloud extension points. Upgrade-safe if the constraint actually holds.
5. **Classic modification** — direct object modification, non-released API access, or SAP GUI
   transaction changes. Last resort. Breaks clean-core. Requires explicit escalation sign-off beyond
   the standard design-record, because this is the tier that makes the next upgrade expensive.

## Workflow

1. **Pull the Delta rows** from the referenced fit-to-standard decision log — requirement,
   justification, and owner travel with each delta into this step; don't re-derive them from memory.

2. **Start at tier 1 for every delta**, even ones that "obviously" need code. State explicitly why
   configuration alone can't meet the requirement before moving to tier 2, and so on. The record of
   rejected lower tiers is as important as the chosen tier — that's what makes the decision defensible
   at the next upgrade.

3. **Check each candidate tier against clean-core rules** before accepting it: does it rely on a
   released API? Does it stay in-app or genuinely belong side-by-side? A tier that looks right but
   depends on a non-released API is not that tier — it's a red flag pushing toward tier 5, and that
   should be visible, not smoothed over.

4. **If the answer is tier 5 (classic modification), stop and escalate — this has a defined
   mechanism, not just a general instruction to "go back."** Concretely: the fit-to-standard decision
   log's Row ID this delta came from gets an **escalation addendum row** (same Row ID, `-esc-1`
   suffix, per that template's "Escalation addenda" section), and the original Delta owner (or a named
   delegate) re-confirms the decision now that the tier-5 upgrade cost is known. The
   extensibility-record is not complete until that addendum exists — see its "mandatory escalation
   block."

5. **Write the target design** for the delta using `../../artifacts/design-record/template.md`: what
   changes, where, and how it's tested — enough for `backlog-drafting` to size it without
   re-interviewing the business owner.

6. **Record the extensibility decision** using `../../artifacts/extensibility-record/template.md` — the
   tier, a stated reason at *every* tier in the ladder (not just the chosen one), any red flags, and
   whether an `extensibility-assessor` agent was consulted (and whether this record agreed with it).

## Outputs

- **`design-record` artifact** (`../../artifacts/design-record/template.md`): target design per delta,
  citing the fit-to-standard decision-log Row ID it originated from
- **`extensibility-record` artifact** (`../../artifacts/extensibility-record/template.md`): chosen tier,
  a stated reason at every tier considered, red flags, extensibility-assessor consultation status, and
  (for tier 5) the escalation addendum reference and escalation owner
- Feeds `backlog-drafting` and the `explore→realize` Q-gate

## Judgment calls worth stating out loud

- **Tier choice is not a developer preference.** "I'd rather just write the ABAP" is not a reason to
  skip tiers 1–3; if a lower tier can carry the requirement, use it regardless of which tier is more
  familiar or faster to build today.
- **An extensibility-assessor agent's recommendation is a starting point, not the decision.** If its
  suggested tier and your own tier-ladder walk-through disagree, record both and state why you
  diverged — silent override defeats the point of having a second, tool-driven opinion.
- **Tier 5 should be rare enough that seeing it always triggers a second look at the underlying
  delta**, not treated as just another routing outcome.
