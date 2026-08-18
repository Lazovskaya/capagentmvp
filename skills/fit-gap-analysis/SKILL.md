---
name: fit-gap-analysis
description: Generate a reviewable Fit/Gap analysis from a Fit-to-Standard decision log and optional process-to-app mapping. Use after a workshop decision log exists; routes confirmed gaps to solution-design without selecting an extensibility tier.
---

# Fit-gap analysis

## Inputs

- Required: normalized Fit-to-Standard decision-log JSON with stable Row IDs.
- Optional: `process-app-mapping` output from `fiori-app-mapping`.
- Optional: a named functional reviewer and a business-process owner.

The decision-log input contains `log_id`, `session_status`, optional `process`,
and rows with `row_id`, `process_step`, `decision`, standard behavior,
requirement, owner and notes.

## Procedure

1. Run the local generator:

   ```bash
   python3 tools/generate_fit_gap_analysis.py \
     --decision-log /path/to/decision-log.json \
     --process-app-mapping /path/to/process-app-mapping.json \
     --output workspace/fit-gap-analysis/fit-gap-analysis.json
   ```

2. Classify by workshop decision, never by lexical inference:
   - `Standard` -> `FIT` / `standard`.
   - `Delta` -> `GAP` / `solution-design-required`.
   - `Workaround` -> `WORKAROUND` / `open-question` unless its recorded
     resolution is clearly Standard or Delta.
   - blank or unsupported decision -> `TBC` / `open-question`.
3. Include app IDs only as supporting evidence. A missing app candidate is an
   application-coverage open question, not proof of a functional Gap.
4. For a Draft workshop, keep every output item and the document in `DRAFT`.
   A Live decision log still requires human review before the document is
   `APPROVED`.
5. Route `GAP` rows to `solution-design` by exact Row ID. Do not pick standard
   configuration, key-user extension, BTP, ABAP Cloud or classic modification;
   that is the solution-design tier decision.

## Outputs

- `fit-gap-analysis` JSON/Markdown with one row per FTS Row ID.
- An explicit list of unresolved Workaround/TBC/app-coverage questions.

## Hard boundaries

- Never invent requirements, app IDs, decisions or a Delta owner.
- Never create Jira or Cloud ALM work items.
- Never turn an unresolved Workaround into a confirmed Gap or Fit.