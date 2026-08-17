---
name: production-conversion
description: Execute the technical production conversion runbook (SUM/DMO) inside the go-live downtime window, with a named go/no-go decision-maker and rollback triggers agreed before downtime starts, and logs captured as evidence at every checkpoint rather than a post-hoc summary. Use in Deploy, during the actual go-live weekend.
---

# Production Conversion

New content, not ported (no `sap-ai-cons`/`sap-ai-framework` equivalent existed). Grounded in SAP's
own published cutover/SUM-DMO guidance — see Sources below; these are SAP Community blog posts, not
verbatim SAP documentation, and the exact tooling (SUM version, DMO vs. classic, Technical Downtime
Optimization availability) must be checked against the client's actual release and scenario.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## Purpose

This is the highest-risk activity in a brownfield programme: a fixed downtime window, often a single
weekend, with the business waiting on the other side. This skill's job is making sure that window is
executed against a pre-agreed runbook with pre-agreed abort criteria — not improvised live under
pressure — and that every checkpoint leaves a log, not just a memory of what happened.

## When to use

Deploy phase, during the actual production conversion (go-live weekend). Distinct from `cutover-plan`
(which builds and rehearses the **functional** task list beforehand) — this skill is the **technical**
execution: the SUM/DMO run itself, owned by Basis. Matches this factory's `production-conversion`
activity.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the rehearsed runbook — sequenced technical steps, expected duration per step,
  owner per step. **If this hasn't been rehearsed in at least one prior test conversion, say so
  explicitly** — a runbook executed for the first time in production is an estimate wearing a
  runbook's clothes.
- **Required:** a **named go/no-go decision-maker**, agreed before downtime starts — not identified
  during the outage. Naming this person mid-crisis is exactly the failure mode this skill exists to
  prevent.
- **Required:** **rollback triggers** stated in advance — the specific conditions (e.g. a named step
  exceeding its rehearsed duration by X%, a specific error class) that trigger a rollback decision,
  not a vague "if things look bad."
- **Optional:** Technical Downtime Optimization (TDO) configuration, parallelism tuning parameters,
  if the scenario and release support them.

## Knowledge this skill orchestrates

- `knowledge/operations/` — this activity's own bucket: runbooks, cutover history, performance
  baselines. This run's log becomes the next conversion's baseline.

## Steps

1. **Confirm the runbook has been rehearsed**, not just written. If this is the first execution of
   this exact sequence, flag the elevated risk rather than proceeding as if it were routine.
2. **Confirm the go/no-go decision-maker and rollback triggers are named and agreed**, in writing,
   before the downtime window opens. Refuse to proceed on a "we'll figure it out if something goes
   wrong" basis — that is precisely the gap this skill closes.
3. **Execute the runbook step by step**, capturing a log entry at every checkpoint: step, start/end
   time, actual vs. expected duration, status, operator. A step that overruns its rehearsed duration
   is a decision point against the pre-agreed rollback triggers, not something to silently absorb
   and continue.
4. **At each named rollback-trigger condition, stop and get the go/no-go decision explicitly** —
   don't let momentum ("we're already this far in") substitute for the pre-agreed criteria being
   checked.
5. **Run post-conversion technical validation** (the checks the runbook specifies — system
   consistency, interface connectivity, critical job scheduling) before declaring the technical
   conversion complete; this is separate from `go-live-readiness`'s functional checklist, which
   covers the business-facing go/no-go.
6. **Write the conversion log** as the artifact of record: every step, every timing, every decision
   point and who made it, any deviation from the runbook and why.

## Output

- A conversion log in `knowledge/operations/`: step-by-step timing, checkpoint status, any rollback
  decisions and their basis, post-conversion validation results.
- Feeds the `deploy→run` Q-gate ("production conversion executed with evidence") alongside
  `cutover-plan`/`go-live-readiness`'s sign-off-record — this skill supplies the technical evidence
  half, not the business go/no-go itself.

## Judgment calls worth stating out loud

- **A runbook executed for the first time in production is not the same risk profile as a rehearsed
  one** — say this out loud rather than letting "we have a runbook" imply "we have a tested runbook."
- **Naming the go/no-go decision-maker during the outage is itself a failure**, even if the eventual
  call turns out fine — the point is removing that decision from under time pressure, not just
  getting lucky with who happened to be in the room.
- **An overrunning step is a trigger to check against pre-agreed criteria, not a reason to
  improvise a new threshold in the moment.**
- **"It felt fine" is not evidence** — the log's checkpoint data is what the next conversion (and
  this Q-gate) actually reads, not the team's after-the-fact impression.

## Driver

Main driver: basis. Owner role per factory-data.json: **basis**.

## Status

Progress. New content grounded in SAP's published cutover/SUM-DMO method (see Sources); not yet
dry-run tested against a real conversion runbook.

## Sources

SAP Community guidance — representative of the standard method, not verbatim SAP documentation.
Verify exact SUM/DMO options and TDO availability against the client's actual release and scenario.

- [S/4HANA In-Place System Conversion Blog Series 10/10: Planning the Cutover — SAP Community](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/s-4hana-in-place-system-conversion-blog-series-10-10-planning-the-cutover/ba-p/13456749)
- [System Conversion to SAP S/4HANA: Downtime Reduction with Technical Options — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-sap/system-conversion-to-sap-s-4hana-downtime-reduction-with-technical-options/ba-p/14343806)
- [SAP Cutover Management: How to prepare for a successful Go-Live? — PIKON](https://www.pikon.com/en/blog/sap-cutover-management-how-to-prepare-for-a-successful-go-live/)
