---
name: workshop-preparation
description: Validate supplied business-process scope and simplification impacts, group covered processes into workshop topics, and hand a coverage-checked plan to fit-to-standard. Does not schedule workshops, create decision logs or claim sign-off.
---

# Workshop preparation from process scope

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Explore phase, before `fit-to-standard` workshops, when a process scope list exists but has not
yet been validated for coverage and grouped into workshop topics. Run once per scope; re-run if
the scope changes significantly before workshops begin.

**Not the same as `workshop-scheduling`** (compared directly when that skill was ported): this
skill validates a generic module-based scope for coverage and stops at a grouped plan; it does not
build a schedule or agendas. `workshop-scheduling` consumes `conversion-scoping`'s specific
Changed/Unchanged/complexity output and produces the actual sendable schedule/agenda deliverables
for a Brownfield conversion. Use this skill first when the scope has no Changed/Unchanged
classification yet; use `workshop-scheduling` once `conversion-scoping` has already produced one.

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