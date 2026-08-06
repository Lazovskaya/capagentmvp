# Gate: run-exit

Exit criteria: hypercare closed, knowledge harvested. This one is ours, Activate does not define it.

**Status:** Mechanism and evidence defined below. Not yet run on a real engagement.

## Why this gate is different

Every other Q-gate in this factory borrows its mechanism from SAP — Cloud ALM's Quality Gates app
supplies the checklist and approval workflow; our skills only supply the evidence (see the other five
`gates/*.md` files). **Activate's roadmap doesn't define a formal exit from Run**, because Run is
meant to be ongoing operation, not a phase with a scripted end. But an engagement (or a hypercare
period, or an AMS contract period) does actually end, and closing it without a deliberate check is how
loose ends — an unresolved CR referral, a skipped harvest cycle, a backlog nobody decided to carry
forward — quietly become somebody else's problem months later with no record of why. So this gate owns
both the mechanism and the evidence, not just the evidence.

## When to run this

- End of a defined hypercare period
- End of an AMS/Run engagement or contract period
- Any point where "Run" work is formally handing off (to another team, to steady-state support, to
  contract renewal) and a clean record of what's closed vs. carried over is needed

## Inputs needed

- `defect-triage`'s `triage-verdict` log for the period — every open item, by classification
- `knowledge-harvest`'s harvest-log — specifically, whether a cycle covering this closing period
  actually ran (not skipped) and what it produced
- Any open CR referrals (`defect-triage`'s spec-flaw routing) and their current status
- A named approver empowered to accept carry-over items — this is a commercial/contractual decision in
  many cases (what the client is and isn't still owed), not a purely technical one

## Mechanism

1. **Pull every open item from `defect-triage`'s `triage-verdict` log for the period.** Sort by
   classification: open bugs, open CR referrals (and their referral status —
   `Not yet scheduled`/`Scheduled`/`Session held, pending new Row ID`), and any `Untraceable` items
   still unresolved.

2. **Every open item gets one of four dispositions — not a binary resolved/carried-over.** `Resolved`;
   `Carried over — scheduled` (a healthy, committed handoff); `Carried over — red flag` (open with no
   committed path, or open for a reason that itself signals a problem); or, for `Untraceable` items
   specifically, `Escalated — traceability gap` (this isn't unfinished work, it's a missing or wrong
   upstream artifact — name the activity, usually `knowledge-discovery` or a retroactive
   `fit-to-standard` session, that needs to re-open it). There is no silent fifth option. A backlog
   that simply stops being worked on without one of these four recorded is not "closed," it's
   abandoned.

3. **Confirm a knowledge-harvest cycle actually covered this closing period, and that it ran (not
   skipped).** If the most recent relevant cycle in the harvest-log has `Cycle status: Skipped`, that
   is itself a blocker — hand off to `skills/knowledge-harvest`: run (or commission) a closing cycle
   using its own `SKILL.md` and template in full, named `<Period> Closing Harvest` in its cycle header
   so it reads as gate-driven rather than routine when found later. Come back to this gate only to
   **cite** that cycle's header — don't duplicate its content in `artifacts/run-exit-record/`. If the
   closing cycle surfaces a reopen-shaped delta, it redirects to `knowledge-discovery` per
   `knowledge-harvest`'s own rules, not into this gate's open-items table. If the closing cycle's
   recurrence tracker flags an escalation, that escalation needs a named home in this record if
   nothing else already owns it — don't let it vanish because the engagement is ending. A
   Run/engagement closing without a harvest cycle is exactly the failure mode
   `knowledge-harvest`'s own `SKILL.md` warns about, materializing at the worst possible moment (right
   before the knowledge stops flowing to the next team).

4. **For every open CR referral, get an explicit decision, not a default.** Either it's scheduled with
   a committed date beyond this closing point (carried over, named owner, contractual context stated),
   or it's formally dropped (state why — e.g. client decided not to pursue), or — if it's a genuine
   in-flight item — the gate waits for it. Don't let a CR referral just age out unaddressed because the
   engagement happened to end first.

5. **Record the closure**, not just the underlying items — a named approver confirms the gate, citing
   every carried-over item's owner and every resolved item's evidence (see
   `artifacts/run-exit-record/template.md`). There's no Cloud ALM checklist to lean on here, so the
   record itself has to carry the full weight of "what did we actually check."

## Evidence / output

- **`run-exit-record` artifact**: open-item disposition (one of four values, each with reasoning and
  owner), harvest-cycle confirmation, CR-referral dispositions, named approver and date — see
  `artifacts/run-exit-record/template.md` and `schema.json`
- A definitive answer to "is this Run period closed, and if not fully clean, exactly what's still open
  and who owns it" — this is the artifact a follow-on team or a contract renewal discussion should be
  handed, not a verbal summary

## Judgment calls worth stating out loud

- **"We ran out of time" is not a valid disposition for an open item.** Every item gets resolved or
  explicitly, named-ly carried over — there is no quiet third option, however much delivery pressure
  argues for one.
- **A skipped final harvest cycle is worse here than anywhere else in the factory.** Every other
  skipped harvest cycle just delays a lesson; a skipped harvest cycle at Run-exit means the lesson
  likely never gets captured at all, because there's no next cycle coming to catch it.
- **Because SAP doesn't define this gate, there's no external checklist to fall back on if our own
  record is incomplete.** Treat the validity checklist in `artifacts/run-exit-record/template.md` as
  the actual bar, not a formality — there's nothing else standing behind it.

See `docs/skill-design-conventions.md` for the ID/status/role conventions this gate's evidence
(`triage-verdict`, harvest-log Substance keys) relies on.
