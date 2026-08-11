---
name: backlog-drafting
description: Convert a design-record and extensibility-record into sized, owned work items in Jira/Cloud ALM, each carrying an explicit backlink to the fit-to-standard decision that caused it. Use after solution-design has routed a delta to a tier, before any build work starts — this is where traceability is either established or permanently lost.
---

# Backlog drafting

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in `../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

Traceability is established here or not at all. Every work item this skill drafts must carry a
backlink chain — decision-log row → design-record → extensibility-record → work item — because
`defect-triage` downstream has no other way to tell a bug from a spec flaw: it works by walking this
chain backward to find who accepted what, and why. A work item with a missing link is a future
unresolvable defect dispute, not a shortcut.

## When to use

- After `solution-design` has produced a `design-record` and `extensibility-record` for a delta
- When splitting a design into multiple work items (a design rarely maps 1:1 to one ticket)
- When a work item is proposed *without* an upstream design/extensibility decision — this is the
  moment to catch that and send it back, not to draft it anyway

## Inputs needed

- `design-record` and `extensibility-record` for the delta being drafted
- The originating `fit-to-standard` decision-log row (Row ID, requirement, justification, Delta owner)
- Access to the work-intent system (`jira` and/or `cloud-alm` connectors) — if not wired, produce the
  same structure as a document ready to paste in

## Workflow

1. **Refuse to draft a work item with no upstream decision.** If someone asks for a ticket for a
   requirement that never went through fit-to-standard/solution-design, that's a signal to route it
   back, not to backfill a plausible-sounding design record after the fact.

2. **Size the work item(s) from the target design**, not from the original requirement description —
   the design-record is what determines scope; re-deriving size from the business ask alone tends to
   under- or over-size the work.

3. **Split by extensibility tier, not by convenience.** If a delta's design spans two tiers (e.g. a
   side-by-side BTP piece plus a key-user config piece), draft separate work items per tier — mixing
   tiers in one ticket hides which owner/skill each part actually needs.

4. **Assign the build owner by tier**, not by whoever's free: standard config → functional; key-user
   extension → functional/citizen developer; side-by-side BTP → developer (BTP); developer
   extensibility → developer; classic modification → developer plus the escalation owner named in the
   extensibility-record. This role is distinct from the decision log's Delta owner and the sign-off
   record's signer — don't merge the fields even if it's the same name.

5. **Embed the backlink fields explicitly** in every work item — see
   `references/work-item-template.md`. None are optional:
   - Decision-log Row ID (copy it verbatim — don't re-describe "which row, which session" in free text)
   - Design-record reference (same Row ID)
   - Extensibility-record reference (same Row ID; tier + justification)
   - Sign-off-record reference

6. **State the acceptance criteria from the target design**, not from memory of the workshop
   conversation — if the design-record doesn't contain enough to write acceptance criteria, that's a
   gap in the design-record to fix before drafting, not something to paper over here. This is a
   coarse, one-sentence-level restatement for the work item, not an executable test — `test-case-
   design` is the skill that expands the same `test_approach` field into a real positive/negative/
   boundary test set, and it also covers Standard rows this skill never touches. Don't treat this
   step as having already done that job.

## Outputs

- Work items in `jira`/`cloud-alm`, or an equivalent drafted document, each fully backlinked
- `process` knowledge bucket note if drafting surfaced a design gap that needs to go back upstream
- Feeds the `explore→realize` Q-gate and is the traceability anchor `defect-triage` reads later

## Judgment calls worth stating out loud

- **A missing backlink is not a documentation nicety — it's the exact failure mode that makes
  hypercare/defect-triage unable to tell "bug" from "change request."** Treat it as a blocking gap, not
  a follow-up task.
- **Don't retro-fit a design-record to justify a ticket that already exists.** If a work item was
  created out of process, the honest move is flagging it as untraceable and routing it back through
  fit-to-standard, not writing a design-record that makes it look like it always had one.
- **Splitting by tier costs a little ceremony now and saves a lot of ambiguity later** — resist
  merging tiers into one ticket even when the business owner sees it as "one ask."
