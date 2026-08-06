# Skill design conventions

Patterns discovered independently, and fixed, in multiple skills across seven rounds of dry-run
testing (background-agent walkthroughs of realistic scenarios against each skill's templates, before
this factory had this repo as its home). Every new own-posture skill should be checked against this
list **at design time**, before dry-running it — the point of writing this down is to stop
re-discovering the same bugs one skill at a time.

This file is not itself a skill the model invokes — it's a design-time reference for whoever authors
or reviews a skill in `skills/`. Each skill that follows these conventions should link to this file
directly from its own `SKILL.md` (per Claude Code's Skill authoring guidance: reference files should be
linked from SKILL.md so the model reliably reads them in full, not partially, when it matters).

## 1. Stable, copyable IDs — not free-text descriptions

Every artifact that another skill will cite later needs a **stable key**, assigned at creation time,
that downstream artifacts copy verbatim rather than re-describing the source in prose.

- **Why:** free-text re-description drifts. Two artifacts describing "the credit-block workshop, the
  regional routing step" will eventually disagree on wording even when they mean the same row; a copied
  key (`FTS-2026-08-04-credit-block-handling-row-02`) cannot drift because there's nothing to reword.
- **Applied in:** `fit-to-standard`'s Row ID (decision-log), carried verbatim through `solution-design`,
  `backlog-drafting`, `defect-triage`; `defect-triage`'s CR referral ID; `knowledge-harvest`'s Substance
  key.
- **When designing a new skill:** if it produces something a later skill will need to point back to,
  give it an ID scheme in the very first reference template you write, not as an afterthought once a
  downstream skill turns out to need one.

## 2. Status enums need an explicit reopen/escalation path, not just forward motion

A status field that only moves forward (`Draft → Reviewed → Done`) has no way to represent "this was
marked Done, but it turned out to be wrong" without destroying the history of the original decision.

- **Why:** silently resetting a completed status back to an earlier state erases *who* validated it
  and *when* — exactly the information needed to understand why it was wrong in the first place.
- **Applied in:** `knowledge-discovery`'s `Reopened — prior validation didn't hold` status (distinct
  from `Inferred`, which means "never validated" — not the same failure mode); `fit-to-standard`'s
  escalation-addendum row scheme for tier-5 reopens.
- **When designing a new skill:** if a status field exists, ask "what happens when something marked
  final turns out to be wrong?" before shipping the template — don't wait for a dry-run to surface it.

## 3. Distinct roles get distinct names, even when the same person holds more than one

"Owner," "approver," "reviewer" used loosely across several templates for genuinely different
responsibilities will get silently merged by whoever fills the templates in — especially when one
person happens to hold two of the roles on a given delta.

- **Why:** the whole point of separating these roles is traceability — knowing which hat someone wore
  for which decision (e.g. distinguishing "who accepted this specific delta" from "who signed off the
  whole workshop" from "who builds it") is what lets `defect-triage` later work at all.
- **Applied in:** `fit-to-standard`'s Delta owner vs. Signer vs. `backlog-drafting`'s Build owner;
  `solution-design`'s Escalation owner as a fourth, tier-5-only role.
- **When designing a new skill:** if a template has more than one "who decided/approved/did this"
  field, name each one for the specific responsibility, and state explicitly (in the template, not
  just in your head) that they're not to be merged even when the name is the same.

## 4. A "Caveats" or similar fine-grained flag, separate from a coarse Status field

A single status value (`Validated`, `Pass`, `Accepted`) can't carry a specific unverified claim buried
inside otherwise-good content — especially a *negative* claim ("no other extensions found"), which is
exactly the kind of assertion a scan or a first pass is least reliable at and a reader is most likely
to take on faith.

- **Why:** a reader who only glances at the Status column should still get an actionable "don't fully
  trust this one specific thing" signal, without having to read the entire artifact's prose to find it.
- **Applied in:** `knowledge-discovery`'s Caveats column and `knowledge-discovery`'s Open-findings flag
  (a related but distinct pattern: Open findings marks a known issue that's fine to proceed with;
  Caveats marks a specific claim not yet independently verified).
- **When designing a new skill:** if a status/verdict field can be `Validated`/`Pass`/`Accepted` while
  still containing something a downstream reader shouldn't take fully at face value, give that
  something its own field — don't rely on prose buried in a Notes cell.

## 5. N-way routing needs an explicit, written decision test — not just a routing table

A routing decision with more than two outcomes (e.g. harvest / reopen / defer, or bug / spec-flaw /
untraceable / blocked) needs the *test* that produces the routing decision written out in words, not
just a table mapping conditions to destinations — otherwise the boundary between adjacent outcomes
gets fuzzy exactly where it matters most (the case that looks like it could go either way).

- **Why:** a routing table alone tempts a reviewer to pattern-match against the closest-looking row
  instead of actually re-deriving the answer; a stated test ("does accepting this mean the content was
  *wrong*, or just *incomplete*?") forces the actual judgment call every time, including the edge cases
  a table's categories don't cleanly cover.
- **Applied in:** `defect-triage`'s bug/spec-flaw/untraceable/blocked test; `knowledge-harvest`'s
  harvest-vs-reopen test ("wrong, or just incomplete?").
- **When designing a new skill:** if a workflow step routes an item to more than two possible next
  steps, write the literal question a human should ask themselves before landing on a bucket — put
  that question in the template as a required field, not just in the SKILL.md's prose.

## How to use this file when designing a new skill

Before writing a new skill's first draft, read this file and ask, for each of the five patterns,
whether the skill you're about to design will produce or consume: an ID other skills will cite, a
status field, more than one kind of "who decided" role, a verdict that can hide an unverified claim, or
a routing decision with more than two outcomes. If yes to any, apply the pattern from the start —
don't wait for a dry-run to find the same bug again.
