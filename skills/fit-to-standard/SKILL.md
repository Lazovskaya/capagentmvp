---
name: fit-to-standard
description: Generate simplification-focused fit-to-standard workshop agendas and talking points per module, schedule real slots, and run the decision log with a stable Row ID scheme, a reframing test for every delta, and a named sign-off. Use when preparing or running Explore-phase fit-to-standard workshops.
---

# Fit To Standard

Ported from sap-ai-framework's `epam-sap-skills`' `skills/brownfield/fit-to-standard`, EPAM's one
fully built reference skill in the old system. Kept as this factory's proof-of-concept for the
logistics half: the one component that already proves the pipeline works end to end for preparing
and scheduling a workshop. The decision-log half — previously just "an empty decision log table" with
no method attached — is filled in below with the traceability discipline the rest of this factory's
own-posture skills (`solution-design`, `backlog-drafting`, `defect-triage`) depend on downstream.

Prepare simplification-focused fit-to-standard workshops for a conversion: one workshop pack per
in-scope module (agenda, per-item talking points, decision log), propose real time slots from the
attendees' live calendars, then run the actual standard-vs-delta decision with a Row ID scheme, a
reframing test per delta, and a named sign-off that closes the loop.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

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

Uses the `calendar` connector (Microsoft 365 in the ported version) to find real availability and
draft invites. If no calendar connector is available, the skill still produces the pack and marks
scheduling "not connected, fill manually" rather than blocking.

## Steps

1. **Validate inputs** against the contract; ask for anything missing.
2. **Load knowledge**, framing and agenda shape from `knowledge/process/`, clean-core guardrail
   from `knowledge/standards/`.
3. **Generate one pack per module**: header, timed agenda, per-item talking points (what/why,
   current state, target standard, impact, decision needed, clean-core option). Assign the decision
   log's **Row ID prefix** now (`FTS-<first-workshop-date>-<module-slug>` — see
   `references/decision-log-template.md`), fixed at this point even if the session runs multiple
   days or reconvenes; every row this module's workshop produces cites this prefix verbatim
   downstream, so it must not shift mid-session.
4. **Schedule (live connector)**: find availability for the module's attendees inside the date
   window, propose 2-3 slots, prepare a draft invite. Never auto-send, leave the invite as a draft
   for the consultant to review and send.
5. **Run the decision log, per item, using `references/decision-log-template.md` in full — not a
   free-form table:**
   - State what SAP standard does at this step **before** asking what the client wants (the pack's
     own "current state / target standard" columns feed this) — the question is "does this match how
     you work, and if not, why not," not "how do you want this to work."
   - Classify every item **Standard / Delta / Workaround**. Standard items still get recorded — an
     unaudited silence about a step looks like an oversight later, not a deliberate no-deviation call.
     Workaround items must resolve to Standard or Delta before the session closes; none survive to
     sign-off.
   - For every Delta, capture the four required fields: the **reframed requirement** (ask *why* the
     process works that way — "we've always done it this way" and "the user prefers X" are historical
     descriptions, not requirements), whether standard already meets the reframed requirement, the
     upgrade/clean-core cost in one line, and the **Delta owner** by name (not role or team).
   - **Push back before recording, not after.** A delta with no defensible reframed requirement gets
     the standard-first alternative offered in the room before it goes in the log — recording first and
     debating later just launders a bad decision into a paper trail.
6. **Write** one markdown pack per module to `workspace/fit-to-standard/<module>-workshop.md`
   (gitignored), containing the filled decision log, not an empty table. Report the paths, the
   proposed slots, and the decision log's Row ID prefix.
7. **Close with a named sign-off**, not just a completed document — see
   `../../artifacts/sign-off-record/template.md`. The Row ID range is the source of truth for what's
   in scope; the sign-off's prose process/variant line is a human-readable label for that range, not
   an independent scope definition. No sign-off, no `explore→realize` Q-gate pass.

## Output

- `workspace/fit-to-standard/<module>-workshop.md` per in-scope module: objective and attendees,
  timed agenda, per-item talking points, the **filled** decision log (Row IDs, reframed requirements,
  upgrade cost, Delta owners), and a scheduling section with real proposed slots plus a draft invite.
- **`sign-off-record` artifact** (`../../artifacts/sign-off-record/template.md`): named signer, date,
  Row ID range, deltas accepted/rejected — the signer role is distinct from each row's Delta owner
  even when it's the same person.
- Signed decisions feed `knowledge/process/`. Delta rows feed `solution-design` for extensibility-tier
  routing (this skill decides *whether* to deviate, not *where the change lives*) — cite the Row ID
  verbatim, don't re-describe the session.

## Judgment calls worth stating out loud

- A step with **no reframed requirement recorded** is not neutral — flag it as a gap, don't silently
  mark it Standard to move the session along.
- **"It's how we've always done it"** is a process description, not a requirement — push for the
  underlying business reason before accepting the delta.
- A **delta that only exists because a prior system worked that way** is the single most common
  disguised non-requirement in brownfield conversions — treat it with extra scrutiny.
- If the business owner in the room isn't the person who can actually sign off, say so — don't let
  the sign-off-record imply authority that wasn't there.
- If `solution-design` routes a delta to tier 5 (classic modification), it reopens this decision via
  an **escalation addendum row** (same Row ID, `-esc-1` suffix) rather than a disconnected new
  decision — see `references/decision-log-template.md`'s "Escalation addenda" section.

## Driver

Main driver: functional consultant. Owner role per factory-data.json: **functional**.

## Status

Progress. The workshop-prep and scheduling steps (1–4, 6 minus the decision log) are the ported
logic, proven to work end to end. The decision-log discipline (Row ID scheme, reframing test,
push-back rule, sign-off) is newly stitched in from this factory's own traceability chain and has not
yet been dry-run tested as part of this combined skill inside this repo — treat the combined skill as
`progress`, not `ready`, until it has been.
