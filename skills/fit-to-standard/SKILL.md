---
name: fit-to-standard
description: Generate simplification-focused fit-to-standard workshop agendas and talking points per module, capture decisions into the backlog, and record the standard-versus-delta call per process. Use when preparing or running Explore-phase fit-to-standard workshops.
---

# Fit To Standard

Ported from sap-ai-framework's `epam-sap-skills`' `skills/brownfield/fit-to-standard`, EPAM's one
fully built reference skill in the old system. Kept as this factory's proof-of-concept: the one
component the whole pipeline should point to as evidence it works end to end.

Prepare simplification-focused fit-to-standard workshops for a conversion: one workshop pack per
in-scope module (agenda, per-item talking points, decision log), then propose real time slots
from the attendees' live calendars.

## When to use

Explore phase, after readiness/simplification analysis and delta-impact analysis, when preparing
or running the fit-to-standard workshops. Matches this factory's `fit-to-standard` activity.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** in-scope **modules** (e.g. FI, MM, SD).
- **Required:** the relevant **simplification items per module** (from readiness/delta analysis).
- **Required for scheduling:** **attendee emails** per module.
- **Optional:** workshop **duration** (default 90 min) and target **date window** (default: next
  10 business days).

## Knowledge this skill orchestrates

- `knowledge/process/` (this factory's bucket for scope, variants and fit-to-standard outcomes),
  the target for each pack's decision log once signed.
- `knowledge/standards/` for delivery conventions and the clean-core guardrail applied to how each
  decision is framed (standard, key-user extension, or modification).

## Scheduling

Uses a calendar connector (Microsoft 365 in the ported version) to find real availability and draft
invites. Note: factory-data.json's `fit-to-standard` activity currently lists only the `signavio`
connector for this activity, not a calendar connector, this is a known gap between the data model
and what the ported skill actually does; flagged for whoever reconciles the two. If no calendar
connector is available, the skill still produces the pack and marks scheduling "not connected,
fill manually" rather than blocking.

## Steps

1. **Validate inputs** against the contract; ask for anything missing.
2. **Load knowledge**, framing and agenda shape from `knowledge/process/`, clean-core guardrail
   from `knowledge/standards/`.
3. **Generate one pack per module**: header, timed agenda, per-item talking points (what/why,
   current state, target standard, impact, decision needed, clean-core option), and an empty
   decision log.
4. **Schedule (live connector)**: find availability for the module's attendees inside the date
   window, propose 2-3 slots, prepare a draft invite. Never auto-send, leave the invite as a draft
   for the consultant to review and send.
5. **Write** one markdown pack per module to `workspace/fit-to-standard/<module>-workshop.md`
   (gitignored). Report the paths and the proposed slots.

## Output

- `workspace/fit-to-standard/<module>-workshop.md` per in-scope module: objective and attendees,
  timed agenda, per-item talking points, an empty decision log table, and a scheduling section
  with real proposed slots plus a draft invite.
- Signed decisions feed `knowledge/process/`, the sign-off itself becomes a `sign-off-record`
  artifact per this factory's `fit-to-standard` activity.

## Driver

Main driver: functional consultant. Owner role per factory-data.json: **functional**.

## Status

Ready. This is the one component in the factory proven to work end to end, everything else should
be measured against it.
