---
name: adr-log
description: Append a new architectural decision record (or split an existing bundled one) to the engagement's ADR log and, when connected, publish it to Confluence as one child page per entry under the engagement's Architecture Decision Log index. Invoked cross-cutting by the Brownfield SAD Authoring Agent for every material manual or detected change -- not called directly by the user.
---

# ADR log

Cross-cutting Skill invoked by
the Brownfield SAD Authoring Agent for every material architectural decision or detected
material change during a Brownfield S/4HANA engagement. Maintains an append-only ADR log
locally and publishes it to Confluence.

## When to use

Any time the Brownfield SAD Authoring Agent detects or makes a material architectural decision --
on conversion approach, scope boundary, sizing assumption, integration decision, risk acceptance,
deferral, or business decision. Also invoked by `brownfield-sad-state-reconciliation` when it
detects a material manual change that altered a previously approved artifact.

Do not call this Skill for routine status updates, progress notes, or trivial formatting changes.
A change is material if it would alter the approved evidence basis for any Q-gate, change a
commercial or contractual boundary, or affect how a downstream system (Jira, Cloud ALM,
developer handoff) is configured.

## Inputs (contract)

- **Required:** `engagement_id` -- stable engagement identifier.
- **Required:** `decision_type` -- one of `conversion-approach`, `scope-boundary`,
 `sizing-assumption`, `integration-decision`, `risk-acceptance`, `deferral`,
 `business-decision`.
- **Required:** `stage` -- the SAD stage that produced this decision (`readiness`, `sizing`,
 `scoping`, `workshop-preparation`, `sad-drafting`, `cross-cutting`).
- **Required:** `title` -- brief decision title, ≤80 characters.
- **Required:** `description` -- what was decided, in plain language.
- **Required:** `rationale` -- why this was decided; reference supporting evidence when available.
- **Required:** `raised_by` -- person email, or `agent` when inferred automatically.
- **Optional:** `options_considered`, `decision_drivers`, `consequences`, `owner`,
 `related_pages`, `sap_references` -- the deeper analysis fields. Not required for every entry,
 but expected whenever the decision has genuine alternatives worth recording -- a one-line
 `description`/`rationale` pair with no options considered is the "extremely high level" shape
 this Skill should avoid for anything beyond a trivial acknowledgement. One entry = one
 independent decision; see "Splitting a bundled decision" below if a candidate entry isn't that.
- **Optional:** `change_set_ref` -- reconciliation change set ID, if triggered by
 `brownfield-sad-state-reconciliation`.
- **Optional:** `--apply` -- required to write; dry-run by default.

## Steps

1. **Read the current ADR log.** Load
 `workspace/<engagement_id>/brownfield-sad/adr-log.json`. If it doesn't exist yet,
 initialize it with an empty `entries` array and the `engagement_id`. This is the local
 source of truth -- never infer ADR state from conversation history.

2. **Assign the next ID.** The new entry's `id` is `ADR-<engagement_id>-<N>` where N is
 `(current entry count) + 1`. This sequence is monotonic and never reused.

3. **Compose the draft entry.** Build the full entry object per `artifacts/brownfield-adr-log/schema.json`:
 all required fields populated, `status: active`, `reviewed_by: null`, `review_date: null`,
 `date: <today>`. If `decision_type` is `deferral`, require `deferred_until` too. If an existing
 entry is being superseded, set `status: superseded` and `superseded_by: [<new-id>]` on the
 **old** entry (the new entry does not carry a `superseded_by` of its own -- it is the
 replacement, not the replaced). This mutation of an existing entry's `status`/`superseded_by`
 is the only mutation allowed on an existing entry.

4. **Show the full preview.** Display the complete draft entry as JSON, plus the full updated
 `entries` array length and the change being made to any superseded entry. Do not write
 anything yet.

5. **Require `--apply`.** If `--apply` is not set, stop here. Show the path the file would be
 written to and the exact JSON payload. Confirm that nothing has been written.

6. **Append and write.** With `--apply`: append the new entry to `entries`, update any
 superseded entry's `status`, and write the full updated `adr-log.json` back to disk atomically
 (write to a temp file, then rename). Re-read the file immediately and verify:
 - the new entry's `id` is present
 - `entries` length increased by exactly 1
 - any superseded entry now has `status: superseded`
 Report these verification results explicitly.

7. **Check Confluence connectivity and offer to publish.** If `confluence-document-publishing`
 is available and the engagement's `brownfield-sad-authoring-state`
 has a `confluence_root_page_id`, offer to publish: one new/updated child page per entry
 (classical ADR format -- Page Properties block, Context, Decision, Consequences, Related ADRs
 if `related_pages` names other ADRs), under the engagement's Architecture Decision Log index
 page. The index page itself does not need editing for a plain new entry -- its Page Properties
 Report macro aggregates children automatically (see
 `confluence-document-publishing/SKILL.md`'s "Publishing a section hierarchy" note); only edit
 the index page directly when adding introductory text or a superseded-entries callout. The
 Confluence publish requires its own separate `--apply` gate as defined in
 `confluence-document-publishing` -- do not reuse the write gate from step 5.

8. **Update `adr_sync_status` in engagement state.** After a successful write (and Confluence
 publish if attempted), set `adr_sync_status` to `synced` (or `local-only` if Confluence is
 unavailable) in `brownfield-sad-authoring-state`. If the write failed, leave the status as
 `pending`. Never clear `pending` without a verified write.

## Preview format (step 4)

```
Draft ADR entry (not written yet)
----------------------------------
ID: ADR-<engagement_id>-<N>
Date: <today>
Stage: <stage>
Type: <decision_type>
Title: <title>
Status: active
Raised by: <raised_by>
Change set: <change_set_ref or n/a>

Description:
 <description>

Rationale:
 <rationale>

Will supersede: <ADR-...-X (old title)> → status will change to 'superseded'
 [or: none]

Target file: workspace/<engagement_id>/brownfield-sad/adr-log.json
Current entries in log: <N-1>
After write: <N>
```

## Write-back contract

- Default is dry-run; `--apply` required to write.
- Re-read immediately after write to verify the entry landed correctly.
- Never overwrite a `reviewed_by` field that is already populated without a new explicit
 human confirmation -- a reviewed ADR entry is treated as human-approved content.
- Write is to a local file only; Confluence publish is a separate, independently gated action.

## Edge cases

- **Duplicate decision**: if an `active` entry with the same `title` already exists in the same
 `stage` + `decision_type`, show the existing entry and ask the user whether to supersede it or
 append a new, distinct entry. Never silently create a duplicate.
- **Splitting a bundled decision**: if an existing entry actually covers multiple independent
 decisions (each with its own real options and consequences -- a common outcome of an earlier,
 too-coarse ADR pass), create one new entry per decision, each with `description` noting
 `"Split from ADR-<old-id>."` and its own `options_considered`/`decision_drivers`/`consequences`.
 Set the old entry's `status: superseded` and `superseded_by` to the array of every new entry's
 ID. Never delete the old entry or its Confluence page -- Confluence pages here cannot be moved
 or deleted (`connectors/confluence/connector.md`), so the old page is rewritten in place as a
 short stub ("split into the following ADRs") rather than removed.
- **Missing `adr-log.json`**: initialize with an empty log rather than treating it as an error.
- **Confluence unavailable**: continue without publishing; set `adr_sync_status: local-only` in
 engagement state. Do not block the ADR write on Confluence availability.
- **`deferred` without `deferred_until`**: surface this as a validation error before showing
 the preview; require the caller (the Agent) to supply a milestone before continuing.
