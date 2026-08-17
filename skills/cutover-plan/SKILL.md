---
name: cutover-plan
description: Sequence the functional cutover tasks (master-data checks, open-item handling, manual steps), rehearse them end to end against the clock, and track dress-rehearsal results. Basis/technical downtime steps stay out of scope. Use for Deploy-phase cutover planning.
---

# Cutover Plan

Contract merged from two independently-sketched stubs (this factory's own, and `sap-ai-cons`'s
`deploy/cutover-plan`) — neither side had implemented logic. `sap-ai-cons`'s stub added one
concrete scoping detail this factory's own stub didn't have: **functional/coordination cutover
tasks only** — master-data checks, open-item handling, manual steps — explicitly excluding
Basis/technical downtime steps (those belong to `production-conversion`, owned by Basis). Folded in
below, since the two skills would otherwise silently overlap on "who plans the downtime window."

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Deploy phase, to build the functional cutover task list and track its dress rehearsal before
go-live. Matches this factory's `cutover-plan` activity (shared with `go-live-readiness` — see
below). Not for Basis's technical downtime execution — that's `production-conversion`.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** in-scope process areas.
- **Required:** known functional cutover activities per area (master-data checks, open-item
  handling/carry-forward, manual configuration steps that don't travel by transport).
- **Optional:** prior rehearsal results, if this is a repeat rehearsal rather than the first pass.

## Knowledge this skill orchestrates

- `knowledge/operations/` — this activity's own bucket; the runbook shape this task list follows
  and the target for rehearsal history.

## Steps

1. **Validate inputs.** Master-data checks and open-item handling are functional/coordination work;
   if a proposed task is actually a technical downtime step, flag it and route it to
   `production-conversion` instead of absorbing it here — keeping the two lists cleanly split is
   what lets Basis and Functional rehearse their own halves in parallel.
2. **Build the sequenced task list** against the clock: task, owner, dependency, expected duration,
   go/no-go checkpoint if one applies.
3. **Rehearse it end to end**, not on paper. Record what actually happened against the plan —
   overruns, blocked dependencies, steps that took a different owner than planned. **The rehearsal
   is the point**; a plan that has never been run is an estimate, not evidence.
4. **Track dress-rehearsal results** across however many passes happen before go-live — each pass
   should show the plan getting tighter, not the same gaps recurring unaddressed.
5. **Close with a named sign-off**, alongside `go-live-readiness`'s checklist — see
   `../../artifacts/sign-off-record/template.md`'s "Deploy go-live variant." Cutover-plan's part is
   the rehearsal reference; `go-live-readiness` owns the checklist-items part of the same record.

## Connector governance

- Cloud ALM access is read-only by default while building and rehearsing the plan.
- Any task/status write requires a local cutover artifact, exact payload preview and explicit approval from the named delivery owner.
- After a write, reread the Cloud ALM object and record external ID, timestamp and actual state in the rehearsal ledger.
- Do not delete, post logs or make production-impacting changes from this skill.
- If Cloud ALM is unavailable, continue with local rehearsal evidence and mark live synchronization as `not performed`.
- Redact production URLs, personal data, credentials and restricted logs before LLM use or knowledge harvest.

## Output

- A sequenced functional cutover task list plus dress-rehearsal history (workspace, gitignored).
- Feeds the **`sign-off-record` artifact** (`../../artifacts/sign-off-record/template.md`, deploy
  go-live variant) jointly with `go-live-readiness` — this skill supplies the
  `cutover_rehearsal_reference` field, not a separate document.
- If a `cutover-risk-assessor` agent is wired, it reads this rehearsal record plus
  `go-live-readiness`'s checklist for a bounded go/conditional/no-go recommendation — a starting
  point for the sign-off, not the decision itself.

## Judgment calls worth stating out loud

- **"We'll figure out the exact sequence during the rehearsal" is not a plan** — the sequence has to
  exist before the first rehearsal, or the rehearsal is just discovering the plan live under time
  pressure.
- **A rehearsal that "went fine" with no recorded overruns or blocked dependencies is worth a second
  look** — a cutover with genuinely zero friction on every pass is rare enough to be suspicious.
- **Don't let a functional task quietly become a technical one** (e.g. "just run this report" that
  actually needs a downtime window) — route it to `production-conversion` explicitly rather than
  planning around it here.

## Driver

Main driver: delivery. Owner role per factory-data.json: **delivery**.

## Status

Progress. Contract and workflow written and merged from both stubs' scoping, including the explicit
functional/technical split with `production-conversion`; not yet dry-run tested end to end.
