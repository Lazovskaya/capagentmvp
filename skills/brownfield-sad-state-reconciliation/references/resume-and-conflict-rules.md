# Resume and conflict rules

Condensed from the plan's "Resume And Manual Change Reconciliation" and "Artifact
Status And Reopen Rules" sections -- read this before changing how this Skill
classifies a change.

## What counts as authoritative

- A manual source is authoritative **only** when its checkpoint entry records a
  reviewer, a review date, and an `approved` or `approved_with_caveats` state.
  Content that merely changed is not automatically approved.
- Unreviewed manual content stays `in_review` evidence and blocks any stage
  progression that requires approval -- it does not silently become usable input.
- Human-reviewed content always outranks a stale agent-generated version of the same
  artifact. Never overwrite a human-reviewed source with a regenerated one.

## What creates a conflict

- Editing a file whose last checkpoint entry was already `approved` (or
  `approved_with_caveats`) -- someone touched already-approved content.
- Contradictory evidence between a local source and its linked Confluence page --
  the two disagree and neither is obviously stale.
- An inaccessible, unauthorized, or missing linked Confluence page -- reconciliation
  cannot proceed without knowing the page's real current state.

A conflict blocks progression until a reviewer resolves it. This Skill only detects
and reports conflicts; resolving one is the Agent's (and ultimately the reviewer's)
job, never this Skill's.

## What does not create a change event

- Formatting-only or wording-only edits. They update the artifact's revision and
  version history but are not a "material change" and do not require an `adr-log`
  event.
- A scope row, ADR status, or SAD approval never *silently* downgrades -- any of
  those moving backward (e.g. approved -> reopened) is itself a material change and
  must create an ADR history event, not just a quiet status flip.

## Distinct fields, even for the same person

Owner, approver, reviewer, and facilitator are separate fields on an artifact
instance even when one person holds all four roles for a given engagement. Never
collapse them into a single "owner" value.
