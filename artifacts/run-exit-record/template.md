# Run-exit record — run-exit

This is the whole mechanism, not just the evidence — SAP doesn't define this gate, so nothing outside
this record backs up the claim that the Run period closed cleanly. Every section must be filled
honestly; there is no external checklist to catch a gap this record misses.

- **Period closing:** <e.g. "Hypercare, Sprint 1–14" or "AMS contract year 1">
- **Approver (named, empowered to accept carry-over/commercial decisions):**
- **Date:**

## Deploy → Run handoff

This section is completed before hypercare starts and carried forward unchanged
until the closing review. It is the operational contract between the Deploy and
Run teams, not a narrative status update.

- **Go-live sign-off reference:** <sign-off-record ID and checklist scope>
- **Production conversion reference:** <runbook/run ID, or `N/A` with reason>
- **Cutover rehearsal reference:** <rehearsal ID, date and result>
- **Handoff status:** `READY` | `READY_WITH_EXCEPTIONS` | `BLOCKED`
- **Hypercare window:** <start/end, timezone and support hours>
- **Service owner:** <named owner>
- **On-call/escalation path:** <team, contact route and severity path>
- **Rollback decision owner:** <named person with authority>

### Entry criteria

- [ ] Go-live decision and scope are signed.
- [ ] Production conversion evidence and logs are stored.
- [ ] Cutover rehearsal completed, or exception is explicitly accepted.
- [ ] Monitoring, alerting and support access are verified.
- [ ] Open risks have owners, due dates and acceptance authority.
- [ ] Initial operational baselines and thresholds are recorded.

### Operational baseline

| Metric / SLO | Baseline or target | Measurement source | Window | Owner |
|---|---|---|---|---|
| Availability | | | | |
| Response time / batch duration | | | | |
| Incident volume / severity | | | | |
| Data reconciliation / business KPI | | | | |

An empty baseline is a gap, not an implicit zero. If a metric is not applicable,
state why and name the approving owner.

## Open items from defect-triage — every one needs a disposition, no silent third option

**Disposition has four values, not two** — "Carried over" alone conflates a healthy scheduled handoff
with a genuine red flag, and neither reads right for a traceability gap:
- **Resolved** — closed, with evidence.
- **Carried over — scheduled** — a committed date/owner exists, this is a normal, healthy handoff (e.g.
  a CR already booked for next contract year).
- **Carried over — red flag** — open with no committed resolution path, or open for a reason that
  itself signals a problem (e.g. stalled, disputed, no owner willing to take it) — this should draw
  the approver's attention specifically, not blend into routine handoff.
- **Escalated — traceability gap** — for `Untraceable` items specifically. This is not an ordinary
  backlog carry-over: it means an earlier-phase artifact (a decision-log row, a design-record) is
  missing or wrong, not that a known piece of work is merely unfinished. Name the specific upstream
  activity that needs to re-open (usually `knowledge-discovery` or a retroactive `fit-to-standard`
  session), not just an owner.

| Item ref | Classification | Disposition (four values above) | Owner (if Carried over/Escalated) | Reason / evidence | Contingent on contract renewal? (Y/N) |
|---|---|---|---|---|---|
| | Bug | | | | |
| | Spec flaw — CR referral | | | | |
| | Untraceable | | | | |

- **Open CR referrals specifically** — for each, one of three outcomes, no default:
  - Scheduled with a committed date beyond this closing point → **Carried over — scheduled** — name
    the owner and the contractual/commercial context
  - Formally dropped — state why (e.g. client decided not to pursue)
  - Genuinely in-flight with no committed date → **Carried over — red flag** — this gate does not close
    silently on this; the approver must explicitly accept the risk, not just note it

## Knowledge-harvest confirmation

- **Harvest cycle covering this closing period:** <cite the cycle header from harvest-log verbatim —
  don't re-describe it>
- **Cycle naming convention:** a cycle run specifically to satisfy this gate must be named
  `<Period> Closing Harvest` in its harvest-log cycle header (e.g. "AMS Year 1 Closing Harvest") — this
  distinguishes a mandatory gate-driven cycle from an ordinary scheduled one when someone reads the
  harvest-log later without this record in front of them.
- **Cycle status:** Ran / Skipped
- **If Skipped:** this gate cannot close yet. **Handoff to `knowledge-harvest`:** the `run-exit`
  facilitator (not necessarily the approver) runs or commissions the closing cycle using
  `knowledge-harvest`'s own SKILL.md and template in full — this record only **cites** the resulting
  cycle header afterward, it does not embed or duplicate the harvest-log's content here. If the closing
  cycle itself surfaces a delta that gets sorted as reopen-shaped (contradicts a Validated bucket), that
  redirect goes to `knowledge-discovery` exactly as `knowledge-harvest`'s own rules specify — it does
  not become a new open item in this record's table above.
- **Deltas accepted in the closing cycle:**
- **Recurring-rejection escalations surfaced in the closing cycle (if any):** <cite the specific
  Substance key(s) from the harvest-log's recurrence tracker that were flagged as worth escalating —
  this record is where that escalation gets a named home if nothing else already owns it; don't let a
  flagged recurrence disappear just because the engagement is ending>
- **Escalation owner (if any recurring-rejection escalation is unresolved at close):**

## Validity checklist before this record is considered complete

- [ ] Every open item from defect-triage has one of the four dispositions — none left silently
      unaddressed, and none defaulted to "Carried over" when "Carried over — red flag" or
      "Escalated — traceability gap" is the honest call
- [ ] Every CR referral has one of the three named outcomes, not a default assumption
- [ ] Any item marked "Contingent on contract renewal" is flagged as such — the approver should not
      discover this dependency later
- [ ] The knowledge-harvest cycle covering this period actually ran (not Skipped) before this record
      was closed, and is cited by its cycle header, not duplicated here
- [ ] Any recurring-rejection escalation surfaced in the closing cycle has a named home (either already
      owned elsewhere, or given an owner in this record) — not silently dropped at engagement close
- [ ] The approver is named and empowered to make the carry-over/commercial calls recorded here — not
      assumed
- [ ] This record, not a verbal summary, is what gets handed to any follow-on team or contract
      discussion
