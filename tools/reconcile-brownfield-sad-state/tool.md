# Tool: Reconcile Brownfield SAD State

Deterministic, local-only checkpoint comparison for the Brownfield SAD Authoring
Agent's resume/reconciliation flow. Detects manual changes against the engagement's
last checkpoint (`diff`) and persists a new checkpoint once the Agent has classified
those changes and resolved any conflicts (`commit`). Never touches Confluence -- the
`brownfield-sad-state-reconciliation` Skill calls `read-confluence-page` directly for any linked Confluence page, per the plan's Resume And
Manual Change Reconciliation section.

## Input contract

```yaml
engagement_id:
 type: string
 required: true
 description: Stable engagement identifier; resolves to workspace/<engagement_id>/brownfield-sad/.
workspace_root:
 type: string
 required: true
 description: Path to the gitignored workspace/ root (a real filesystem path, not a stable ID).
mode:
 type: string
 required: true
 enum: [diff, commit]
known_artifacts:
 type: array
 required: false
 description: Required for mode=diff. Each entry is {artifact_id, path}.
reconciled_artifacts:
 type: array
 required: false
 description: >
 Required for mode=commit. Each entry is {artifact_id, path, review_status,
 reviewer, review_date, source_origin} -- the fields the Artifact Status And
 Reopen Rules section requires be tracked per artifact.
```

## Operation

`diff`: loads the highest-numbered `checkpoints/CHK-<engagement_id>-<n>.json` under
`workspace_root/<engagement_id>/brownfield-sad/` if one exists (no checkpoint is a
fresh engagement, not an error). For each `known_artifacts` entry, hashes the file at
`path` (SHA-256) and compares it to the hash recorded for that `artifact_id` in the
checkpoint. An artifact with no prior checkpoint entry, or a changed hash, is
`changed`. A changed artifact whose prior checkpoint entry had `review_status:
approved` is additionally a `conflict` -- an already human-approved source was
modified on disk since the last checkpoint. Read-only; writes nothing.

`commit`: hashes each `reconciled_artifacts` entry's current file content and writes
a new `CHK-<engagement_id>-<n+1>.json` checkpoint recording, per artifact, its hash,
`review_status`, `reviewer`, `review_date`, and `source_origin`. Updates
`state.json`'s `last_valid_checkpoint` pointer. Local filesystem write only -- this is
not a Confluence write and does not require `--apply` (that gate is specific to
`upsert-confluence-page`/`upload-confluence-attachment`).

## Output contract

```yaml
resume_status:
 type: string
 enum: [fresh, resumed]
reconciliation_status:
 type: string
 enum: [clean, changes_detected, conflict, blocked]
last_valid_checkpoint:
 type: string
 required: false
changed_artifact_ids:
 type: array
conflict_ids:
 type: array
unreadable_artifact_ids:
 type: array
 required: false
new_checkpoint_id:
 type: string
 required: false
 description: Present only for mode=commit.
```

## Errors and confirmations

- `invalid_mode` -- `mode=diff` called without `known_artifacts`, or `mode=commit`
 called without `reconciled_artifacts`.
- `artifact_unreadable` (commit) -- a `reconciled_artifacts` entry's file is missing;
 the commit is refused rather than writing a checkpoint with a fabricated hash.
- A `diff` with any unreadable `known_artifacts` entry returns
 `reconciliation_status: blocked` in `unreadable_artifact_ids` rather than raising --
 the Agent decides how to proceed, per the plan's "inaccessible ... page sets the
 engagement reconciliation state to blocked" pattern applied to local files too.
- Read-only (`diff`) requires no confirmation. `commit` writes only to the gitignored
 local workspace, not a client-visible system, so it also requires no `--apply`
 confirmation -- unlike the Confluence-writing Tools.
