# Run ledger — backlog-drafting

```
workspace/backlog-drafting/<YYYY-MM-DD>-<row-or-slug>/
├── meta.json
├── events.jsonl
├── ac-quality.md
├── work-items/
│   └── WI-<slug>-N.md          # drafted items (template-shaped)
└── sync-receipt.json             # only after user-approved push to jira/cloud-alm
```

Prefer the decision-log Row ID (kebab-shortened) as `<row-or-slug>` when drafting from one delta.

## meta.json

```json
{
  "schema": 1,
  "skill": "backlog-drafting",
  "run_id": "<YYYY-MM-DD>-<row-or-slug>",
  "started_at": "<ISO-8601>",
  "updated_at": "<ISO-8601>",
  "phase": "ac-quality | draft | review | sync | done",
  "decision_log_row_ids": ["…"],
  "status": "running | blocked | awaiting-review | complete"
}
```

## events.jsonl

Minimum: `run.started`, `ac_quality.completed`, `draft.written`, `review.requested`,
`review.approved` | `review.changes_requested`, `sync.skipped` | `sync.completed` | `sync.failed`,
`run.completed`. Also `upstream.refused` when step 1 refuses an ungrounded ticket ask.

Never auto-push to Jira/Cloud ALM without `review.approved` + explicit sync confirmation.
