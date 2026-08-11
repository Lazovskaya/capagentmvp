# Input quality check — test-case-design

Run **before** picking techniques or writing scripts. Cheap structural checks only —
do not invent missing design detail here.

## What to score

For each Row ID in scope, classify input quality:

| Classification | Source fields to inspect | Pass means |
|----------------|--------------------------|------------|
| Standard | Decision-log Requirement / Decision / Impact cells, or session notes for that row | Enough concrete behaviour to write at least one scenario without inventing workshop outcomes |
| Delta | Paired `design-record.target_design` + `test_approach`; `extensibility-record.tier` | `test_approach` is a real correctness statement (not `TBD` / `—` / one vague adjective); target design says what changes |
| Workaround | Same as Standard for coverage intent | Row is listed; unresolved classification is tracked later in the matrix, not blocked here |

## Verdicts

- **`clear`** — proceed to technique selection for this row.
- **`thin`** — can proceed only with an explicit Caveat on every script and matrix row derived from it (e.g. "seed-only — design-record test_approach is one adjective"). Prefer asking 1–3 clarifying questions **or** routing the Delta back to `solution-design` before spending a full technique pass.
- **`blocked`** — do not write executable scripts for this row yet. Matrix entry with empty `test_case_ids` and Gaps reason (Delta without design-record → `design-record pending`; Standard with empty cells and no session notes → `decision-log too thin`).

## Acceptance / test_approach quality (Delta)

Treat `test_approach` (and any backlog AC if present) as **measurable** only if a tester could fail the case without debating intent. Fail examples: "works correctly", "as per workshop", "standard SAP". Pass examples name the observable outcome (document status, account posted, message, field value, block reason).

If confidence that the seed is testable is below ~50%, halt the row as `blocked` and ask the user — do not "interpret generously" into a fake plan.

## Optional work-item AC

When `backlog-drafting` AC text exists for a Delta, use it as a **starting checklist**, not as finished coverage. Still expand via techniques. If AC and `test_approach` disagree, record an open conflict in the run's `events.jsonl` and surface it before writing scripts.

## Output of this check

Write `input-quality.md` in the run folder:

```markdown
# Input quality — <slug>

| Row ID | Classification | Verdict | Notes |
|--------|----------------|---------|-------|
| … | Standard/Delta/Workaround | clear/thin/blocked | … |

## Clarifying questions asked
- …

## Rows deferred (blocked)
- …
```

Append `input_quality.completed` to `events.jsonl`.
