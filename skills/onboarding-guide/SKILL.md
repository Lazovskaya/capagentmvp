---
name: onboarding-guide
description: Walk a new joiner through a role-shaped path across all nine knowledge buckets, ending at a recorded, tested "ready to take a ticket" checkpoint. Doubles as the knowledge base's own test harness — any point where the joiner needs a human to explain verbally instead of the bucket being self-sufficient is a knowledge-base defect to log, not normal onboarding friction. Use when a new team member joins an engagement, in any role.
---

# Team onboarding

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in `../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

Two outcomes, tracked separately, from one session: whether **this person** is ready to take a
ticket, and whether **the knowledge base** is actually good enough to make someone ready without a
human narrating it. The second outcome is why this activity reads all nine buckets regardless of role
depth — it is the knowledge base's own test harness. If a joiner can only get to "ready" because
someone in the room explained the real reason behind a config decision, that's not a successful
onboarding, it's a knowledge-base gap wearing a successful onboarding as a disguise.

## When to use

- Any new team member joining the engagement, in any role (`functional`, `developer`, `architect`,
  `delivery`, `basis`, `data`, `test`)
- Re-running a role's path after a significant knowledge-base change, to check the path still holds up
  without verbal patching
- **Not** a substitute for `knowledge-discovery` or `knowledge-harvest` — this activity *consumes* and
  *tests* the buckets; it doesn't build or refresh them. A gap it finds gets routed back to whichever
  of those two owns fixing it (see Outputs).

## Inputs needed

- The joiner's **role** — this determines path priority, not which buckets are in scope (all nine are
  in scope for everyone; depth differs)
- All nine knowledge buckets, each carrying its `knowledge-discovery` validation-status header
  (status, reviewer, open-findings flag) — **check this before walking a bucket**: an `Inferred` or
  `In review` bucket, or one with an unresolved open finding, is fair to walk, but say so to the
  joiner rather than presenting it with the same confidence as a clean `Validated` bucket
- Access to a real or representative ticket via the `jira` connector (or a synthetic one, clearly
  labeled as such, if no connector is wired) for the end-to-end readiness test

## Role-priority path (depth, not exclusion — every role still touches all nine)

- **functional** — deep: `process`, `config`, `testing`, `standards`. Light: the rest.
- **developer** — deep: `custom-code`, `extensibility`, `clean-core`, `standards`. Light: the rest.
- **architect** — deep: `extensibility`, `clean-core`, `process`, `standards`. Broadest required
  breadth of any role — architect decisions touch nearly every bucket.
- **delivery** — deep: `process`, `operations`, `standards`. Light: the rest.
- **basis** — deep: `operations`, `data`. Light: the rest.
- **data** — deep: `data`, `config`. Light: the rest.
- **test** — deep: `testing`, `process`, `config`. Light: the rest.

"Light" still means the joiner reads the bucket and it gets checked in the walkthrough — it means less
time and fewer follow-up questions expected, not a skip.

## Workflow

1. **Confirm role and derive the path** from the table above. State it before starting, so both the
   joiner and the facilitator know what "deep" vs. "light" means for this session.

2. **Walk each bucket in priority order.** For each one: have the joiner read it, then check
   understanding with a concrete question specific to this project (not "did you understand that" —
   something they'd need to actually apply, like "which extensibility tier would apply to X"). Carry
   forward any **Caveats** from the bucket's validation-log row (specific claims not fully verified,
   even on a `Validated` bucket) — these need calling out by name to the joiner, not just implied by
   the row's overall status. Negative claims ("no other extensions exist here") inside an `Inferred`
   bucket deserve particular skepticism; don't let the joiner walk away treating an unverified absence
   as a confirmed fact.

3. **Log every point where a human had to explain something verbally that the bucket itself should
   have covered.** This is the load-bearing step. Don't record it as "joiner needed clarification" —
   record it as a knowledge-base gap: which bucket, what was missing, and what should be added. A
   session with zero such gaps logged on a brownfield engagement's first onboarding is itself worth a
   second look — it's more likely the facilitator didn't press hard enough than that the knowledge
   base is already perfect.

4. **Run the end-to-end test.** Pull a real or representative ticket matching the joiner's role and
   have them work out, using only the knowledge base (not the facilitator), what they'd do with it —
   which bucket answers what, which process/config decision applies, who they'd need to loop in. This
   is the actual proof of readiness, not the bucket walkthrough alone; a joiner who can discuss every
   bucket in the abstract but stalls on a real ticket is not yet ready.

5. **Record two verdicts, not one:**
   - **Person readiness**: ready / not yet, with what's still missing if not yet
   - **Knowledge-base defects found**: the list from step 3, each routed onward using **three** cases,
     not two:
     1. A gap in a bucket that **is `Validated`, and the gap contradicts or undermines that
        validation** (the bucket claimed to be fine but wasn't) → back to `knowledge-discovery` as a
        validation to revisit.
     2. A gap in a bucket that's **already `Validated` and holding up fine, just incomplete on this one
        point** → `knowledge-harvest`, a normal content addition.
     3. A gap in a bucket that's **`Inferred`/`In review` and has no assigned reviewer yet** — this
        is not a harvest-sized tweak to an otherwise-good bucket, and it's not a validation that "didn't
        hold up" (it was never validated to begin with). Route it back to `knowledge-discovery` as
        input for that bucket's **first** validation pass, and say so explicitly rather than filing it
        as a harvest note that would sit queued behind buckets that already work.
   A joiner can be marked ready even when gaps were found and logged — readiness is about whether they
   can now operate (possibly having just been told the missing piece), not about the knowledge base
   being flawless. Don't let "the knowledge base has gaps" block a person who's otherwise capable, and
   don't let "the person is ready" bury the gaps that got them there.

6. **Close with a named checkpoint**, not just a completed document — who confirms this joiner is
   ready (typically their onboarding buddy or delivery lead, not the joiner self-certifying), date, and
   role.

## Outputs

- **`onboarding-record` artifact**: role, path taken, per-bucket check results, end-to-end ticket-test
  result, person-readiness verdict with confirmer name and date (see
  `../../../artifacts/onboarding-record/template.md`)
- **Knowledge-base defect list**, routed to `knowledge-harvest` (content gaps) or back to
  `knowledge-discovery` (a `Validated` bucket that turned out not to hold up)
- Feeds the `prepare→explore` Q-gate

## Judgment calls worth stating out loud

- **"I just explained it to them" is the finding, not a footnote.** The instinct is to solve the
  immediate friction and move on — resist that; the point of this activity is that the explanation
  should not have been necessary, and that gap needs to be logged even after it's been informally
  patched for this one joiner.
- **A perfect-looking first onboarding session is a signal to look harder, not a compliment to the
  knowledge base.** Real project knowledge bases have gaps; a session that surfaces none likely means
  the questions weren't concrete enough.
- **Readiness and knowledge-base health are genuinely independent outcomes** — don't let a strong
  candidate's ability to route around a bad knowledge base (asking good questions, inferring
  correctly) hide the gap just because they personally got to "ready" anyway.
- **A `Validated` bucket that fails the end-to-end ticket test is a more serious finding than an
  `Inferred` bucket that does** — the former means the validation gate itself missed something; route
  it back to `knowledge-discovery`, don't just patch it as a harvest note.
