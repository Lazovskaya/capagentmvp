# Work item template — backlog-drafting

One of these per work item. Every backlink field is mandatory — an empty one means the item isn't
ready to draft yet, not a field to fill in later.

- **Title:**
- **Type:** Story / Task / Change Request — tie-breaker rule, apply in this order and stop at the
  first match:
  1. If this delta's addendum shows the sign-off happened *after* build started (a scope change
     mid-flight) → **Change Request**, regardless of tier.
  2. Else if extensibility tier is 1 or 2 (standard config / key-user, no custom code) → **Task**.
  3. Else (tier 3–5, custom code involved) → **Story**.
  This is derived here, from the extensibility tier and the addendum timing — not something upstream
  supplies. Apply the rule the same way every time so two drafters looking at the same tier don't pick
  different types.
- **Description:** <what changes and why — pull the "why" from the decision-log requirement, not from
  memory of the conversation>
- **Acceptance criteria:** <from the design-record's target design — if the design-record doesn't
  contain enough detail to write these, stop and fix the design-record first>
- **Extensibility tier:** <1–5, from the extensibility-record>
- **Size estimate:** <derived here, from the design-record's target design — like Type, this is
  backlog-drafting's own output, not a field read from an upstream artifact>
- **Build owner (by tier):** <functional / functional-citizen-dev / developer-BTP / developer /
  developer+escalation-owner — see solution-design's owner-by-tier mapping. This is the **build
  owner** role: distinct from the decision log's **Delta owner** (accepted the decision) and the
  sign-off record's **signer** (accepted the session scope), even when the same person holds more
  than one of those roles.>

## Backlink chain (mandatory, none optional)

- **Fit-to-standard decision-log Row ID:** <the exact Row ID, e.g. `FTS-2026-08-04-credit-block-handling-row-02`>
- **Sign-off-record reference:** <who signed, date>
- **Design-record reference:** <cites the same Row ID>
- **Extensibility-record reference:** <cites the same Row ID; tier + one-line justification>

## Splitting rule

If a single delta's design spans more than one extensibility tier, this is item **N of M** for that
delta — list the sibling items here so the tier split is visible, not hidden across separate,
unlinked tickets.

- **Sibling items for this delta:**

## Validity checklist before this work item is considered draftable

- [ ] Every backlink field above is filled, not marked "TBD"
- [ ] Acceptance criteria came from the design-record, not reconstructed from memory
- [ ] Owner assigned matches the extensibility tier, not just who's available
- [ ] If tier 5 (classic modification), the escalation sign-off owner is named, not just the regular
      design-record sign-off
