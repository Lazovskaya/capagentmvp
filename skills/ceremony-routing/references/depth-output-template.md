# Depth output template

Write both `depth.json` (machine) and a short `depth.md` (human) in the run folder.

## depth.md

```markdown
# Depth — <id>

| Field | Value |
|-------|--------|
| Depth | light / standard / deep |
| Total | <5–25> |
| Diagnose handoff (unchanged) | <from routing-matrix> |
| Next skill | <usually same as handoff> |
| Also consider | <e.g. defect-pattern-analysis or —> |
| Red flags | <list or none> |

## Scores

| Dimension | Score | Note |
|-----------|------:|------|
| Blast radius | | |
| Clarity | | |
| Layer risk | | |
| System span | | |
| Data sensitivity | | |

## Notes
```

## Batch mode

When called from a triage worklist, either:
- one `depth.json` per primary ticket under `workspace/bugfix/triage-<date>/depth/`, or
- a column `depth` + `next_skill` on each primary row in `triage-<date>.md`, with a compact
  `depth-summary.json` listing all primaries.

Duplicates inherit the primary's depth; do not re-score every dup.
