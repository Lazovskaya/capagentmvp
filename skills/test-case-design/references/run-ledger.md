# Run ledger — test-case-design

Every invocation gets its own run folder under the gitignored workspace. Do not
scatter scripts across a flat `workspace/test-case-design/` root.

## Path

```
workspace/test-case-design/<YYYY-MM-DD>-<process-slug>/
├── meta.json
├── events.jsonl
├── input-quality.md
├── test-coverage-matrix.md
├── scripts/
│   └── TS-<process-slug>-NN.md
└── sync-receipt.json          # only if user approved a test-management push
```

`<process-slug>` is a short kebab name of the process area (e.g. `credit-management`).

## meta.json (mutable snapshot)

```json
{
  "schema": 1,
  "skill": "test-case-design",
  "run_id": "<YYYY-MM-DD>-<process-slug>",
  "started_at": "<ISO-8601>",
  "updated_at": "<ISO-8601>",
  "phase": "input-quality | design | review | sync | done",
  "decision_log_ref": "<path or Row ID range>",
  "decision_log_session_status": "<verbatim from log>",
  "row_ids_in_scope": ["…"],
  "status": "running | blocked | awaiting-review | complete"
}
```

Update `phase` / `status` / `updated_at` as you go. Do not delete history — that lives in `events.jsonl`.

## events.jsonl (append-only)

One JSON object per line. Minimum events:

| event | when |
|-------|------|
| `run.started` | folder created |
| `scope.confirmed` | Row ID range accepted (or Delta-only ask refused) |
| `input_quality.completed` | after `input-quality.md` |
| `scripts.written` | after scripts + matrix first draft |
| `review.requested` / `review.approved` / `review.changes_requested` | user review gate |
| `sync.skipped` / `sync.approved` / `sync.completed` / `sync.failed` | optional test-management push |
| `run.completed` | handoff |

Example line:

```json
{"ts":"2026-08-11T14:00:00Z","event":"scope.confirmed","row_ids":["FTS-…-row-01","FTS-…-row-02"]}
```

## Regeneration

If the same `<YYYY-MM-DD>-<process-slug>` already exists, do **not** silently overwrite.
Ask whether to resume (read `meta.json` + continue) or start a new slug suffix (`-r2`). Always append to `events.jsonl`; never rewrite past events.
