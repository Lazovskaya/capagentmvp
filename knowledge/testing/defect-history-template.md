# Defect history — central default (empty shape, not real data)

This is the shipped default: an **empty register with a fixed column schema**, not a filled-in
example. A project's real, growing copy of this file lives at its own `knowledge/testing/defect-
history.md`, appended to over time — never hand-written fresh per period. It is the durable,
cumulative counterpart to the one-off exports `incident-triage`/`defect-pattern-analysis` otherwise
have to be handed manually.

Reuses the exact vocabulary already established by `artifacts/triage-verdict/` and
`skills/defect-pattern-analysis/references/pattern-analysis-template.md`, so a row here can be
copied in either direction without relabeling fields.

## Who writes to this file

`knowledge-harvest`, at the end of a cycle (sprint close, hypercare wrap-up, or any point a
`triage-verdict` reaches a real, human-confirmed classification) — same accept/reject/defer review
as any other harvest delta, targeted at this bucket. Nothing else writes here directly; a live
`workspace/bugfix/*-triage-verdict.md` file is the working draft, this register is where it lands
once confirmed.

## Who reads this file

- **`defect-triage`** — before running the Row ID comparison, check whether this same ask (same
  cause key, or same affected process step) already has a row here. See "Precedent check" below.
- **`defect-pattern-analysis`** — this file, filtered to the period in question, is the intended
  real-engagement source for its required "defect set for a defined period" input, already shaped
  with the sub_process/layer/severity/resolution_notes columns that skill's clustering step needs.
  An ad-hoc export is still fine for a project that hasn't accumulated history yet; this file is
  what that export becomes over time.

## Schema

| Column | Meaning |
|--------|---------|
| `ticket_id` | Stable ID from the source tracker. Never re-described in prose elsewhere — cite this verbatim (use stable, copyable IDs). |
| `created_date` | When the ticket/incident was raised. |
| `resolved_date` | Blank if still open. |
| `sub_process` | Domain pack code (e.g. O2C: `pricing`, `credit`, `interface`, …) — from `incident-triage`. |
| `layer` | `config` / `master-data` / `custom` / `data` / `user` — from the diagnose stage. |
| `severity` | S1/S2/S3 — from `incident-triage`. |
| `cause_key` | The concrete failing object (e.g. a specific condition-record key, a specific IDoc partner profile) — from the diagnose-stage skill that closed the item. Blank if not yet diagnosed. |
| `decision_log_row_id` | The fit-to-standard/solution-design Row ID this item was checked against, or `none found` — from `defect-triage`. |
| `classification` | `Bug` / `Spec flaw` / `Untraceable — traceability gap` / `Blocked — pending intake` — from `defect-triage`'s confirmed verdict. Never write a provisional/unconfirmed verdict here; this register only holds confirmed history. |
| `classification_status` | `Confirmed` / `Reopened — new evidence changed the ruling`. Forward-only status fields can't represent a later correction without erasing who ruled what and when (convention §2) — e.g. an item ruled `Untraceable` because no Row ID existed at the time can later be `Reopened` once a retroactive fit-to-standard clarification backfills one, and the row must show both the original and the corrected verdict, not silently overwrite it. |
| `confirmed_by` | Named human — never left as "the agent's recommendation" (per `triage-verdict`'s own validity checklist). |
| `resolution_notes` | What actually changed to close it — durable, generalizable statement, not the ticket-specific narrative. This is the column `defect-pattern-analysis` clusters on; a blank or thin entry here degrades that skill's clustering to symptom-only, and its output must say so. |
| `effort_hours` | Optional. |

## Precedent check (how `defect-triage` uses this file)

Before defaulting straight to the Row ID comparison, ask the explicit test: **"Does this ticket ask
for the same behavior an existing row already ruled on — same cause key, or same affected process
step — or is it a genuinely new ask?"** (N-way-routing-needs-a-written-test convention, §5 — this is
a 2-way version of the same discipline.)

- **Same ask, prior row says `Spec flaw`:** cite that row's `ticket_id` and `decision_log_row_id` as
  the precedent rather than re-deriving the commercial call from scratch. A second ticket raising an
  already-rejected ask is not automatically a fresh `Untraceable` just because *this* ticket has no
  Row ID of its own — the precedent row's reasoning carries over.
- **Same ask, prior row says `Bug` and it's recurring:** this is exactly the signal
  `defect-pattern-analysis` exists to catch — flag it for that skill's next run rather than treating
  each recurrence as an isolated fix.
- **Genuinely new ask:** run the normal Row ID comparison; there is no precedent to short-circuit it.

## Example (illustrative only — delete before real use)

| ticket_id | created_date | resolved_date | sub_process | layer | severity | cause_key | decision_log_row_id | classification | classification_status | confirmed_by | resolution_notes | effort_hours |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TICKET-1001 | 2026-03-02 | 2026-03-04 | pricing | master-data | S2 | VK11 3000/54021/ZK01 | FTS-2026-01-15-pricing-row-04 | Bug | Confirmed | J. Alvarez | Extended expired discount condition record validity; no config/code change. | 2 |
