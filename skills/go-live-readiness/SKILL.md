---
name: go-live-readiness
description: Produce the functional go-live readiness checklist per process area — current status, open items, and a named risk acceptance for anything still open — feeding the cutover sign-off's go/no-go decision. Use in Deploy, before go-live, alongside cutover-plan.
---

# Go-Live Readiness

New skill, ported (as a contract merge, not implemented logic — `sap-ai-cons`'s
`deploy/go-live-readiness` was itself a stub) from `sap-ai-cons`. Not a duplicate of `cutover-plan`:
`cutover-plan` sequences and rehearses the functional cutover *tasks*; this skill tracks the
*readiness status* per process area that those tasks are supposed to produce — test results,
cutover-task status, open items — and turns it into the checklist the go/no-go call is actually
made against. Both feed one shared activity (`activities/deploy/cutover-planning.md`) and one shared
`sign-off-record`, not two separate documents that could silently disagree.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Deploy phase, before go-live, to assemble the functional readiness checklist per process area and
track sign-off status against it. Matches this factory's `cutover-plan` activity (Cutover planning
& go-live readiness) — this skill supplies the readiness-checklist half.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** in-scope process areas.
- **Required:** current readiness status inputs per area — test results (from
  `test-execution-tracker`-style evidence, if available), cutover-task status (from `cutover-plan`'s
  rehearsal tracking), any known open items.
- **Optional:** the standard checklist shape from `knowledge/standards/go-live-readiness-checklist.md`
  (currently a tool-blind stub itself — use it as the item skeleton, don't wait for it to be filled
  in before running this skill).

## Knowledge this skill orchestrates

- `knowledge/standards/go-live-readiness-checklist.md` — the checklist-item skeleton this skill
  populates per process area.
- `knowledge/operations/` — prior go-live history, if a previous cutover's checklist is a useful
  reference point for what tends to stay open.

## Steps

1. **Validate inputs.** If a process area has no test-status or cutover-task input at all, list it
   as `not assessed`, not as implicitly green — an area nobody reported on is not the same as an
   area that's ready.
2. **Build the checklist per process area**, using `go-live-readiness-checklist.md`'s item skeleton:
   status (green/amber/red/not assessed), the evidence behind that status, and any open item.
3. **For every item still open at the point this checklist is produced, require a named risk
   acceptance — not a silent gap.** An open item with nobody's name on the decision to proceed
   anyway is not a green light, it's an unrecorded gamble; this is the same discipline
   `defect-triage` applies to unconfirmed verdicts and `run-exit` applies to open items at hypercare
   close.
4. **Cross-check against `cutover-plan`'s rehearsal results** for the same process area — a
   checklist claiming "cutover ready" that disagrees with the rehearsal's own recorded overruns for
   that area is a contradiction to resolve before sign-off, not two documents left to quietly
   disagree.
5. **Feed the shared sign-off**, alongside `cutover-plan` — see
   `../../../artifacts/sign-off-record/template.md`'s "Deploy go-live variant." This skill supplies
   `go_live_checklist_reference`, `checklist_items_closed`, and
   `checklist_items_open_with_risk_acceptance`.

## Output

- A per-process-area go-live checklist (workspace, gitignored): status, evidence, open items with
  named risk acceptance where applicable.
- Feeds the **`sign-off-record` artifact** (`../../../artifacts/sign-off-record/template.md`, deploy
  go-live variant), jointly with `cutover-plan` — one record, not a separate go-live document that
  could drift from the cutover sign-off.
- Feeds the `deploy→run` Q-gate: "every process area's go-live checklist item closed, none left open
  without a named risk acceptance."

## Judgment calls worth stating out loud

- **"Not assessed" is a distinct status from "green" — never default an unreported area to ready.**
  Silence from a process-area owner is a gap to chase, not a passing grade to assume.
- **An open item with a named risk acceptance is a legitimate go-live outcome; an open item with no
  name on the acceptance is not** — the checklist's job is making that distinction visible, not
  smoothing it over into a single "mostly ready" summary.
- **A checklist that disagrees with `cutover-plan`'s rehearsal record for the same area is a signal
  to reconcile, not to report both and let the reader pick one.**

## Driver

Main driver: delivery. Owner role per factory-data.json: **delivery**.

## Status

Progress. Contract and workflow written (merged from `sap-ai-cons`'s stub plus this factory's own
sign-off-record integration); not yet dry-run tested end to end.
