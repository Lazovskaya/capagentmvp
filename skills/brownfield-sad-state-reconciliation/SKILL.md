---
name: brownfield-sad-state-reconciliation
description: Reconstruct a Brownfield SAD authoring engagement's state from workspace artifacts and, once linked, live Confluence pages -- never from conversation history. Detects local and imported manual changes since the last checkpoint, classifies them, and either resumes cleanly or surfaces a conflict for the Agent to resolve. Use before selecting or resuming any Brownfield SAD authoring stage.
---

# Brownfield SAD state reconciliation

Implements the plan's Resume And Manual Change Reconciliation protocol. Invoked by the Brownfield SAD Authoring Agent before
it selects a stage, including on a fresh request -- resuming is only ever done from a
validated checkpoint, never inferred from the conversation.

## When to use

Every time the Agent is about to select or resume a Brownfield SAD authoring stage
(readiness, sizing, scoping, workshop preparation, ADR log, SAD drafting). Not a
user-facing skill on its own -- the Agent invokes it, not a person.

## Inputs (contract)

- **Required:** `engagement_id` (stable engagement identifier).
- **Required:** the set of artifact instances the engagement currently tracks, each
 as `{artifact_id, path}` -- the Agent supplies this from `state.json`'s `documents`
 once that's populated; for a fresh engagement this list is empty.
- **Optional, once the Confluence connector is set up:** for any artifact instance already linked to
 a Confluence page, its `page_id`/canonical URL.

## Steps

1. Call the `reconcile-brownfield-sad-state` Tool in `diff` mode with the known
 artifact list. This compares each artifact's on-disk content hash against the
 last checkpoint and returns `changed_artifact_ids`/`conflict_ids` -- purely local,
 read-only.
2. For every artifact instance already linked to a Confluence page, call
 `read-confluence-page` directly (this Skill's own use of that Tool, not delegated
 through `reconcile-brownfield-sad-state`) to retrieve the live page content,
 version, and last-modified metadata; compare against the last synchronized
 version/hash recorded in the checkpoint. If a linked page is inaccessible or returns an error, treat the comparison as
 unavailable and surface that explicitly rather than skipping it silently.
3. Classify every detected change: an edit to a file whose last checkpoint entry was
 `review_status: approved` is a **conflict** (a human-approved source was modified
 since it was last recorded) -- human-reviewed content is authoritative and must
 never be silently overwritten. An edit to anything else is a plain **change**.
4. Return the classification to the Agent. The Agent is responsible for invoking
 `adr-log` for every material change set and for resolving conflicts with a
 reviewer before continuing -- this Skill only detects and classifies, it never
 decides how to resolve a conflict.
5. Once the Agent has resolved every change/conflict for this pass, call
 `reconcile-brownfield-sad-state` again, this time in `commit` mode, with the
 now-reconciled artifact list (including each artifact's `review_status`,
 `reviewer`, `review_date`, `source_origin`). This writes a new, immutable
 checkpoint and advances `state.json`'s `last_valid_checkpoint` pointer.

## Output

- `resume_status` (`fresh`/`resumed`), `reconciliation_status`
 (`clean`/`changes_detected`/`conflict`/`blocked`), `last_valid_checkpoint`,
 `changed_artifact_ids`, `conflict_ids`, and (on commit) `new_checkpoint_id` --
 exactly the `reconcile-brownfield-sad-state` Tool's own output contract, passed
 through unchanged.
- An inaccessible, unauthorized, missing, or conflicting linked Confluence page sets `reconciliation_status: blocked`; the Agent cannot
 continue until access is restored or a reviewer resolves the conflict.

## Driver

Main driver: architect (Brownfield SAD Authoring Agent orchestrates this Skill on the
architect's behalf).

## Status

In test. The local half (`reconcile-brownfield-sad-state` Tool) is real
and verified end to end against a scratch workspace (fresh engagement, commit, clean
resume, conflict-on-approved-file-edit, unreadable-artifact). The Confluence half
(step 2) uses `read-confluence-page`, which is now available. No automated test suite
exists yet.
