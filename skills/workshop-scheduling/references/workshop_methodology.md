# Workshop Preparation Methodology

How to turn a `conversion-scoping` output into real, sendable workshop
agendas for a Brownfield conversion — grounded in SAP Activate's own
Explore-phase workshop practice, adapted for what a Brownfield engagement
actually needs (confirmation, not redesign).

## 1. This is not a Greenfield Fit-to-Standard workshop — say so

SAP Activate's "Fit-to-Standard" workshop, as documented for Greenfield/
Cloud implementations, exists to **design processes from scratch** against
SAP Best Practice content — review the standard, identify delta
requirements, log gaps, set priorities. That's the right frame for a new
implementation with no existing process to anchor on.

A Brownfield conversion is different: **the business process mostly
already exists and mostly already works** — what changed is the
underlying S/4HANA data model/functionality (per the Simplification Items
driving the Changed classification). The workshop's real job is
**confirmation and delta-resolution**, not design:
- Confirm the Changed/Unchanged/To-Assess call `conversion-scoping`
  made is actually correct for this specific process.
- Resolve exactly what changes for the business user (or the person
  performing that process) once the Simplification Item's effect lands —
  not "redesign the process," but "confirm what's different."
- Close out To-Assess items — these are the ones the Readiness Check
  itself couldn't determine, so they need a real answer from the room.

Calling this "Fit-to-Standard" to the client isn't wrong (many
organizations use the term loosely for any Explore-phase business
workshop), but *internally*, keep the objective framed as confirmation/
delta-resolution — that changes what you actually prepare and how you run
the session.

## 2. Session ordering — build momentum before tackling hard areas

Order sessions by aggregate complexity, **easiest first**:
1. Business Areas dominated by Low/Medium complexity, few or no To-Assess
   items — these confirm quickly, build stakeholder trust in the process,
   and clear easy ground before harder conversations.
2. Business Areas with a real mix, moderate To-Assess volume.
3. Business Areas dominated by High complexity and/or heavy To-Assess
   volume (per `readiness-analysis`'s Simplification Items guide, this
   usually means "Functionality unavailable (no alternative planned)"
   items or a large ST03N-data-gap bucket) — these need the most prep,
   the most senior attendees, and should not be scheduled first while the
   team (on both sides) is still calibrating how these sessions run.

Don't schedule by alphabetical Business Area name or by whatever order the
scope workbook happens to list them — the ordering itself is a real
planning decision that affects how the whole Explore phase feels to the
client.

## 3. What belongs in one session's agenda

- **Objective** — one sentence, specific to this Business Area, framed as
  confirmation/delta-resolution (§1), not generic "process workshop."
- **Attendees**:
  - **Business Process Owner** for this area (must attend — the decision
    maker for anything requiring a business call)
  - **SME(s)** who actually perform the process day-to-day (the people who
    can say whether the Simplification Item's effect is a big deal or a
    non-event in practice)
  - **Solution/Configuration Architect** (facilitator — walks through each
    item, keeps the session moving)
  - **Note-taker** (captures decisions verbatim for the transcript that
    `workshop-to-backlog` (planned, not yet built) will later process — accuracy here directly
    determines how well that next stage works)
  - Executive Sponsor: only for the kickoff session or a session resolving
    a genuinely high-stakes item, not every session.
- **Process walkthrough table** — one row per Changed/To-Assess process in
  this area **that actually needs business input**: the driving
  Simplification Item, its Category (per `readiness-analysis`'s
  taxonomy — lead with this, not just the raw title), the Supporting
  Application (draft, from Scoping), and a blank "Confirmed?" / "Decision"
  column for the session itself to fill in live.
- **Pre-workshop technical fixes, listed separately, not in the
  walkthrough table** — a process flagged by scoping as a
  `technical_blocker` (a Simplification Item technical consistency error)
  needs engineering remediation regardless of Category, not a business
  decision. Putting it in the main walkthrough table implies the session
  needs to weigh in on it, which wastes the Business Process Owner's and
  SMEs' time on something that was never actually up for discussion — list
  it as its own short FYI section instead (process, driving item,
  remediation status), and don't count it toward the session's complexity
  score or time budget (§2).
- **Open questions inherited from `adr-log`** relevant to this
  Business Area — surface these explicitly as agenda items, not
  background context; a Proposed decision this session can actually close
  should be a named agenda line, not left implicit.
- **Time-boxing**: budget roughly 10-15 minutes per Low/Medium-complexity
  process, 20-30 minutes per High-complexity or To-Assess item — don't
  flatten the agenda to equal time slots per row, that under-serves the
  hard items and wastes time on the easy ones.
- **Expected outputs**, stated explicitly at the top of the agenda so
  attendees know what "done" looks like: a confirmed status per process
  (Changed stays Changed / reclassified / scope changed), any new decision
  for the ADR log, and any correction to the draft Application mapping.

## 4. What this skill does NOT do

- It doesn't schedule the actual meeting or secure attendee availability —
  that's real calendar/logistics work, entirely manual.
- It doesn't run the workshop. The output is a ready-to-send agenda, not a
  facilitation script (though the process walkthrough table doubles as
  one in practice).
- It doesn't guess at who the actual named Process Owner/SME is for a
  given Business Area if that isn't already known — ask, rather than
  inventing a role-holder.

## 5. Feeding this into the rest of the pipeline

- **Input**: `conversion-scoping`'s scope data (same JSON shape it
  consumes for `build_scope_workbook.py`) plus, if available, the current
  `adr-log` state to surface open questions per Business Area.
- **Output feeds `workshop-to-backlog` (planned, not yet built) directly**: the process
  walkthrough table's structure (process, driving item, Category,
  application, confirmation column) is exactly the shape that stage will
  need to reconcile against the actual transcript afterward — keep the
  same process identifiers across both so the reconciliation is a clean
  match, not a re-interpretation.
- **Output feeds `adr-log`**: after the session, whatever gets
  confirmed as a real decision (not just "process confirmed as scoped")
  should be raised into the log — this skill prepares the *questions*,
  `adr-log` (via `workshop-to-backlog` (planned, not yet built) processing the transcript,
  or directly) records the *answers*.
