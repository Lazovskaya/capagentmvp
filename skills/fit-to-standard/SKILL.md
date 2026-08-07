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
- **Required for scheduling:** **attendee name, role/title, and email** per module — an email alone
  is not enough. The decision log's Delta-owner field and the sign-off-record's signer field both
  require a real name and a stated authority to accept, neither of which can be inferred from an
  email address (dry-run confirmed: don't improvise a title from an email local-part). Ask for the
  missing name/role explicitly rather than proceeding with email-only attendees.
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

## Session status — never let a draft look like a signed session

Every output this skill produces is either **Live** (an actual facilitated session happened —
decisions are room-agreed fact) or **Draft — pending facilitation** (the pack/log/sign-off was
prepared or simulated ahead of, or without, an actual session — decisions are proposals, not
outcomes yet). State this explicitly at the top of every pack and sign-off-record this skill
writes; never phrase a Draft run's Notes in past-tense room-narration ("asked X, business agreed
Y") as if a session occurred — write it as "proposed test: X; expected pushback: Y" instead. A
sign-off-record only gets its validity checklist marked complete, and only counts toward the
`explore→realize` Q-gate, when Session status is **Live**.

## Steps

1. **Validate inputs** against the contract; ask for anything missing. State the session status
   (Live / Draft — pending facilitation) before doing anything else — it governs how every
   downstream field gets phrased.
2. **Load knowledge**, framing and agenda shape from `knowledge/process/`, clean-core guardrail
   from `knowledge/standards/`.
3. **Generate one pack per module**: header, timed agenda, per-item talking points (what/why,
   current state, target standard, impact, decision needed, clean-core option). Assign the decision
   log's **Row ID prefix** now (`FTS-<first-workshop-date>-<process-slug>` — a slug for the specific
   process/sub-area this workshop covers, e.g. `credit-block-handling`, **not** the bare module code;
   see `references/decision-log-template.md`'s worked example), fixed at this point even if the
   session runs multiple days or reconvenes; every row this module's workshop produces cites this
   prefix verbatim downstream, so it must not shift mid-session.
4. **Schedule.** Use the `calendar` connector if wired: find availability for the module's attendees
   inside the date window, propose 2-3 slots, prepare a draft invite (never auto-send). **If no
   connector is wired**, still produce this section — mark it "not connected, fill manually," propose
   slots from the stated date window without live availability, and say explicitly that availability
   is unconfirmed. Either way, this step never blocks the rest of the pack.
5. **Run the decision log, per item, using `references/decision-log-template.md` in full — not a
   free-form table:**
   - State what SAP standard does at this step **before** asking what the client wants (the pack's
     own "current state / target standard" columns feed this) — the question is "does this match how
     you work, and if not, why not," not "how do you want this to work."
   - Classify every item **Standard / Delta / Workaround**. Standard items still get recorded — an
     unaudited silence about a step looks like an oversight later, not a deliberate no-deviation call.
     Workaround items must resolve to Standard or Delta before the session closes; none survive to
     sign-off.
   - **Apply the reframing test to every item heading toward Standard too, not only to items that
     already look like Deltas.** A step resolving to Standard because the client's *current* (legacy,
     non-SAP) practice gets waved through unquestioned — e.g. "we never make exceptions to X" — is the
     same disguised-non-requirement pattern as a Delta with no reframed requirement, just wearing a
     Standard-shaped wrapper. Dry-run confirmed this is easy to skip: push back on a Standard-leaning
     item's *current-practice* framing exactly as hard as on a proposed Delta's, before recording it,
     not after.
   - For every Delta, capture the four required fields: the **reframed requirement** (ask *why* the
     process works that way — "we've always done it this way" and "the user prefers X" are historical
     descriptions, not requirements), whether standard already meets the reframed requirement, the
     upgrade/clean-core cost in one line, and the **Delta owner** by name (not role or team — if the
     session only has an email or title for this person, get the actual name before the row is
     considered closed, not a role placeholder). **Pick the owner by asking who actually owns the
     business consequence of this specific decision, not by matching job-title vocabulary to the
     process area** — e.g. a credit-limit-setting delta belongs to whoever owns credit-limit policy,
     which is not automatically whichever attendee's title contains a related-sounding word. Same
     discipline as picking the sign-off signer in step 7; get it wrong here and `defect-triage` later
     attributes a decision to someone who never actually accepted it.
   - **State SAP standard behavior precisely — don't collapse two distinct SAP mechanisms into one
     sentence.** A conversion-familiar functional consultant knows the difference between "an
     automatic check" and "no manual release step exists at all" (most SAP checks still route to a
     release workflow), or between an order-type exclusion and a value-threshold rule — these are
     separate configuration levers, not synonyms. Collapsing them costs the workshop's credibility
     with the client's own consultants even when the *decision* (Standard vs. Delta) ends up right.
   - **Don't let the workshop pre-judge the extensibility tier.** A Delta's upgrade-cost note states
     the *shape* of the gap (e.g. "no standard equivalent for X"), not a specific tier recommendation
     (side-by-side BTP, developer extensibility, etc.) — that routing decision, and its own
     tier-ladder justification, belongs to `solution-design`, not this workshop.
   - **Push back before recording, not after.** A delta with no defensible reframed requirement gets
     the standard-first alternative offered in the room before it goes in the log — recording first and
     debating later just launders a bad decision into a paper trail.
6. **Write** one markdown pack per module to `workspace/fit-to-standard/<module>-workshop.md`
   (gitignored), containing the filled decision log, not an empty table. **This is a client-facing
   deliverable — don't cite this skill's own method by name inside it** ("per the reframing test,"
   "per step 7") — that self-reference is process audit trail, not something the client needs to
   read; if the reasoning is worth keeping for internal review, keep it in a separate facilitator
   note, not the pack itself. Report the paths, the proposed slots, and the decision log's Row ID
   prefix.
7. **Close with a named sign-off**, not just a completed document — see
   `../../artifacts/sign-off-record/template.md`. The Row ID range is the source of truth for what's
   in scope; the sign-off's prose process/variant line is a human-readable label for that range, not
   an independent scope definition. **Ask, don't infer, who has signing authority.** With more than
   one attendee, the test is explicit: *"of the people in this room, who is actually authorized to
   accept this scope on the business's behalf?"* — ask it out loud in the session, don't default to
   whoever organized the meeting or infer a title from an email address (dry-run confirmed this
   is otherwise easy to improvise past). If nobody in the room can answer that question, the
   sign-off waits for that person, it doesn't get signed by the closest available attendee. No
   sign-off, no `explore→realize` Q-gate pass.
8. **Write the signed decisions into the project's own `knowledge/process/<process-slug>.md`** —
   an actual file, not just the prose promise that they "feed" it. One entry per resolved row:
   process step, Row ID, final Decision, the reframed requirement (for Deltas), effective date.
   **Only for a Live session** — a Draft run's proposed decisions do not get written into
   `knowledge/process/` as if they were accepted; they stay inside the pack until a real session
   confirms them. (This is the project's own `knowledge/process/` bucket, per that bucket's
   central-default-plus-per-project-override convention — not a shared default to edit centrally.)

## Output

- `workspace/fit-to-standard/<module>-workshop.md` per in-scope module: objective and attendees,
  timed agenda, per-item talking points, the **filled** decision log (Row IDs, reframed requirements,
  upgrade cost, Delta owners), and a scheduling section with real proposed slots plus a draft invite.
- **`sign-off-record` artifact** (`../../artifacts/sign-off-record/template.md`): named signer, date,
  Row ID range, deltas accepted/rejected — the signer role is distinct from each row's Delta owner
  even when it's the same person.
- **A `knowledge/process/<process-slug>.md` entry**, written only once the session is Live and
  signed — not a promise in prose, an actual file (see step 8).
- Delta rows feed `solution-design` for extensibility-tier routing (this skill decides *whether* to
  deviate, not *where the change lives*) — cite the Row ID verbatim, don't re-describe the session.

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
- **A row that resolved Standard after push-back on a habit/legacy framing is not the same shape as
  a Delta that was formally proposed and then voted down** — both end up counted under a sign-off's
  "Deltas explicitly rejected," but the sign-off's Notes should say which shape each one was; "no one
  proposed a Delta here, the room agreed standard already covers it" reads very differently from "a
  Delta was proposed and the room chose standard instead," and collapsing the two loses information
  a later reviewer would want.

## Driver

Main driver: functional consultant. Owner role per factory-data.json: **functional**.

## Status

Progress. The workshop-prep and scheduling steps (1–4, 6 minus the decision log) are the ported
logic, proven to work end to end. The decision-log discipline (Row ID scheme, reframing test,
push-back rule, sign-off) is newly stitched in from this factory's own traceability chain. Two
rounds of testing against the same SD/Credit Management scenario (2026-08-07): an automated dry-run
audit, then an actual real run producing real output files, then an independent review of that real
run's output. Both rounds found and fixed real gaps — first round: Row ID prefix scheme consistency,
reframing test scope, attendee-name contract, signer-authority test; second round (from the
independent review of actual output): no session-status distinction between a real session and a
prepared/simulated one (a Draft run's output looked identical to a signed one), the promised
`knowledge/process/` write was never an actual step, internal method self-references were leaking
into the client-facing pack, SAP-standard wording was collapsing distinct mechanisms (automatic
check vs. release workflow; order-type exclusion vs. value threshold), the workshop was implicitly
pre-judging `solution-design`'s tier decision, and Delta-owner selection had no stated test (parallel
to the signer-authority gap). Still `progress`, not `ready`, until re-verified with a real live
session.
