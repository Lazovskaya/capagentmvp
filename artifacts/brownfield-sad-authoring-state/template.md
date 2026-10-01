# Brownfield SAD authoring state

Not a client-facing document -- an engagement's durable resume/reconciliation state,
`workspace/<engagement_id>/brownfield-sad/state.json`. Gitignored, never published to
Confluence. Mirrors this artifact's `schema.json` (kept in the factory source; not shipped in a
lean client package).

- **`engagement_id` / `last_valid_checkpoint`** -- the only fields the 
 `reconcile-brownfield-sad-state` Tool populates today. Everything else below is
 populated by the Agent once a Confluence root page is established for the engagement.
- **`confluence_root_page_id`**, **`current_evidence_stage`**,
 **`next_eligible_skill_ids`**, **`adr_sync_status`** -- engagement-level pointers the
 Agent maintains once it can actually resolve a Confluence root page and reason
 about stage sequencing.
- **`documents`** -- one entry per tracked artifact instance (a Readiness finding, a
 sizing recommendation, the SAD itself, ...), each carrying its own hash, review
 state, and Confluence page/attachment version once linked. `source_origin` is one
 of `agent-generated`, `human-local`, `confluence-published`, `confluence-live`, or
 `human-imported-external` -- human-reviewed sources take precedence over stale
 agent-generated content, per the plan's Artifact Status And Reopen Rules.
- **`conflict_ids`** -- artifact IDs currently blocked on an unresolved conflict from
 the last `diff` run (e.g. a human-approved file edited on disk since its last
 checkpoint).

## The paired checkpoint file (not this artifact's own schema, but what it points at)

Each `last_valid_checkpoint` (and every prior checkpoint under
`checkpoints/CHK-<engagement_id>-<n>.json`) is a separate, immutable record the same
Tool writes on `commit`:

```json
{
 "checkpoint_id": "CHK-<engagement_id>-<n>",
 "engagement_id": "<engagement_id>",
 "artifacts": [
 {
 "artifact_id": "<stable-artifact-id>",
 "path": "<workspace file path at commit time>",
 "hash": "sha256:<...>",
 "review_status": "unreviewed | approved | ...",
 "reviewer": "<person-email-or-null>",
 "review_date": "<YYYY-MM-DD-or-null>",
 "source_origin": "agent-generated | human-local | confluence-published | confluence-live | human-imported-external"
 }
 ]
}
```

A checkpoint is never edited after being written -- reconciliation always appends a
new, higher-numbered one; `state.json` just moves its `last_valid_checkpoint` pointer
forward.
