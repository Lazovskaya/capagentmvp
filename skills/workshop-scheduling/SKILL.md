---
name: workshop-scheduling
description: Turn a conversion-scoping output (Changed/Unchanged/To-Assess business processes) into a ready-to-send workshop schedule and per-session agendas for the SAP Activate Explore-phase Fit-to-Standard workshops on a Brownfield S/4HANA conversion. Orders sessions by complexity, surfaces open adr-log questions per Business Area, and builds a process walkthrough table per session. Use whenever the user has a completed business process scope (from conversion-scoping) and needs to plan, schedule, or prepare agendas for Fit-to-Standard/delta-confirmation workshops.
---

# Workshop scheduling

Ported from `sap-ai-architecture-generator`'s `sap-workshop-prep` skill (real, engagement-tested
content; `own` posture). Turns a completed business process scope into concrete, sendable workshop
planning artifacts — a schedule and per-session agendas — for the Explore phase of a Brownfield
S/4HANA conversion.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

## Relationship to `workshop-preparation` (compared, not merged)

This factory already has `skills/workshop-preparation/` — checked directly against this skill
before porting, and they are **not duplicates**:

- `workshop-preparation` validates a *generic* module-based process scope for coverage, groups
  covered processes into topics, and hands a coverage-checked plan to `fit-to-standard`. It
  explicitly refuses to build agendas, schedules, or attendee lists, or to make any scoping/module
  judgment — its own "Hard boundaries" name this.
- `workshop-scheduling` (this skill) consumes `conversion-scoping`'s specific
  Changed/Unchanged/To-Assess/complexity output (Brownfield-conversion-specific, not a generic
  module scope) and produces the actual sendable deliverables: a complexity-ordered `.xlsx`
  schedule and per-session `.md` agendas with attendees, ADR questions, and a process walkthrough
  table.

They sit at different points and consume different shaped inputs — `workshop-preparation` is the
coverage gate before `fit-to-standard`; this skill is the scheduling/agenda step specific to a
Brownfield conversion's confirmation-style workshops, downstream of `conversion-scoping` rather
than a generic process scope. Use `workshop-preparation` when the input is a generic scope with no
Changed/Unchanged/complexity classification yet; use this skill once `conversion-scoping` has
already produced that classification.

## Why this isn't a generic Fit-to-Standard workshop planner

Read `references/workshop_methodology.md` §1 before drafting anything. In short: a Brownfield
conversion's Explore-phase workshops are a **confirmation/delta-resolution** exercise, not a
from-scratch process design exercise — most of the business process already exists and works; the
workshop confirms what a Simplification Item's effect actually means for a Changed process and
resolves what a Readiness Check couldn't determine (To-Assess items). Get this framing into the
agenda's Objective line for every session, not just internal reasoning.

## When to use

Explore phase, once `conversion-scoping` has produced a completed business process scope and
Fit-to-Standard/delta-confirmation workshops need scheduling and agendas.

## Inputs (contract)

- **Required:** the same JSON shape `conversion-scoping`'s `build_scope_workbook.py` uses:
  `{"areas": {"<Business Area>": [{"process", "status", "complexity", "driving_item",
  "applications": [...], "technical_blocker": false}, ...]}}`. If the user only has the scope
  `.xlsx`, extract it back into this shape first (read the per-area sheets, including the
  "Technical Blocker" column if present) rather than asking them to rebuild it from scratch.
- **Optional:** an `adr-log` workbook for this engagement, to surface open Proposed decisions per
  session.

## Steps

1. **Get the scope data** (see Inputs). A row with `technical_blocker: true` (a Simplification
   Item technical consistency error, per `conversion-scoping`'s `scoping_methodology.md` §3) is
   excluded from the discussion-time complexity score and listed separately in the agenda as an
   FYI-only item — see `references/workshop_methodology.md` §3.
2. **Optionally fold in open ADR questions.** If an `adr-log` workbook exists, pull any entry with
   `status` = "Proposed" and match it to a Business Area (via its `sad_section` or `context`
   field). Add these to the scope JSON's optional `open_adrs` field, keyed by Business Area, each
   entry `{"id", "title", "status"}`. This is a semantic matching step — do it yourself, don't
   guess a mechanical string match will always work.
3. **Build the schedule and agendas mechanically:**
   ```
   python3 scripts/build_workshop_agendas.py <scope_data.json> <out_prefix>
   ```
   Produces `<out_prefix>_schedule.xlsx` (one row per session, ordered by ascending complexity
   score — see `references/workshop_methodology.md` §2 for the rationale) and
   `<out_prefix>_agendas.md` (one full agenda per session: process walkthrough table, ADR
   questions, attendees, expected outputs). The script computes ordering and duration mechanically
   from `status`/`complexity`; it does not re-judge which processes are Changed/To-Assess — that
   already happened in `conversion-scoping`.
4. **Review before sending.** Check that: attendees are the actual named Process Owner/SMEs for
   each area if known (the script only fills role placeholders — don't invent names); the
   Objective line for each session reads as confirmation/delta-resolution, not generic workshop
   boilerplate; high-complexity/To-Assess-heavy areas are scheduled later (automatic from the
   complexity score, but sanity-check against the client's actual stakeholder calendar
   constraints).
5. **Hand off.** The agenda's process walkthrough table is deliberately the same shape a future
   `workshop-to-backlog` skill (planned, not yet built anywhere in this factory) will need to
   reconcile against the actual workshop transcript afterward — keep process names consistent
   between this output and the scope it came from.

## Working with the rest of the factory

- **Input from `conversion-scoping`**: the scope data this skill consumes directly.
- **Input from `adr-log`**: open Proposed decisions surfaced per session (step 2).
- **Output feeds a future `workshop-to-backlog` skill** (planned, not yet built): the confirmed
  process walkthrough, once the workshop happens, becomes the input that stage reconciles against
  the transcript.
- **Output feeds `adr-log`**: any new/updated decision surfaced in a session should be raised into
  the log afterward.

## Output

- `<out_prefix>_schedule.xlsx` — one row per session, ordered by ascending complexity score.
- `<out_prefix>_agendas.md` — one full agenda per session: Objective (confirmation/delta-
  resolution framing), Attendees, open ADR questions for that area, a process walkthrough table,
  a separate FYI-only table for technical-blocker items, Expected Outputs.

## Judgment calls worth stating out loud

- **Attendee names are role placeholders** — this skill doesn't know or guess actual named people;
  fill those in before sending.
- **Session ordering is purely a complexity-score heuristic** — sanity-check it against real
  stakeholder calendar constraints before finalizing.
- **This doesn't schedule the actual meeting or run the workshop** — output is prep material only.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-workshop-prep` (real, engagement-
tested methodology and build script); compared against this factory's own `workshop-preparation`
and found complementary, not duplicate (see above); not yet dry-run tested against this factory's
own wiring.
