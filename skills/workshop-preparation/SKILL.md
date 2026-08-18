---
name: workshop-preparation
description: Validate supplied business-process scope and simplification impacts, group covered processes into workshop topics, and hand a coverage-checked plan to fit-to-standard. Does not schedule workshops, create decision logs or claim sign-off.
---

# Workshop preparation from process scope

## Inputs

- Required: process scope JSON with `process_id`, `name` and `module` per process.
- Optional: simplification-impact list with `process_id` and `item_id`.
- Required by downstream `fit-to-standard`: attendees and workshop timing data.

## Procedure

1. Run the local coverage adapter:

   ```bash
   python3 tools/prepare_workshop_topics.py \
     --processes /path/to/processes.json \
     --impacts /path/to/impacts.json \
     --output workspace/workshop-preparation/plan.json
   ```

2. Review every `REVIEW_REQUIRED` process before running a workshop. A process
   without a module cannot be silently placed into an arbitrary agenda.
3. Pass `COVERED` module topics, simplification references and named attendees
   to `fit-to-standard`. That skill owns agendas, scheduling, stable FTS Row IDs,
   workshop decisions and sign-off.

## Outputs

- `workshop-preparation-plan` with grouped topics and complete process coverage.
- Explicit review queue for incomplete scope or absent impact evidence.

## Hard boundaries

- Never infer a business-process scope or a module.
- Never create a decision log, sign-off record, Jira item or calendar invite.
- Never mark a workshop outcome as Standard or Delta.