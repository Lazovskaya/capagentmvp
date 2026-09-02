# Remote cutover — readiness & execution playbook

Curated from `S4H_747 How to Approach Remote Cutover.pptx` (SAP Activate Methodology
Accelerator, 2024-07-11). See [_index.md](_index.md) for source/consumer context. Applies
when part or all of cutover delivery happens off-site.

## When this applies

Layered on top of the base [cutover-strategy-framework.md](cutover-strategy-framework.md),
not a replacement for it — use alongside normal SAP Activate methodology and delivery
toolsets, not instead of them.

## Readiness-assessment dimensions

A remote-cutover readiness check runs across five dimensions, each with its own checkpoint —
not a single go/no-go gut call:

1. **Cutover plan readiness** — schedule has slack for issues the dress rehearsal didn't
   surface; every identified risk has an action plan; sequence/dependencies/timing tuned by
   rehearsal; ONE master cutover plan even on large multi-area projects (area structure allowed,
   but cross-area dependencies must stay visible).
2. **People/organizational readiness** — all cutover team members have appropriate production
   access; team composition covers customer, SI, and third-party personnel for any integrated
   system; time-zone/SLA coverage considered; governance and escalation paths defined and
   communicated to all stakeholders including external parties.
3. **IT/technology readiness** — IT/technology-partner impact assessed; collaboration
   enablers/tools assessed and gaps identified; infrastructure scalability and team IT
   capability (laptops, bandwidth) checked; security/data-privacy risk identified.
4. **Remote-delivery experience readiness** — organization's and project team's actual
   experience with remote tools/practices assessed (not assumed); decision-making culture
   (hierarchy, speed, review cycles) considered, since remote delivery slows some decisions.
5. **Readiness reporting** — a single-page RAG-rated dashboard per thread/team, reviewed
   regularly with a target "get to green" date per thread; decision-making for cutover starts
   weeks/months ahead of the go/no-go meeting itself, not at it.

## Cutover prerequisites (hard gate before rehearsal/execution)

- All data-migration code and testing complete and production-ready.
- All functional, integration, and user-acceptance testing finished; go-live-critical issues
  resolved.
- No further configuration changes pending against the cutover-affected scope.
- Dress rehearsal and execution only happen **after** end-to-end integration test and UAT —
  never before.

## Business cutover preparation (not just an IT activity)

Business-side tasks that must run in parallel with the technical cutover: closing out
orders/deliveries, stock-taking, external business-partner communication/coordination, risk
reduction for key operations during/post cutover, business verification testing of physical
devices in scope (printers, RF scanners, etc.).

## Dress rehearsal proven practices

- Full cutover team present, including non-SAP vendors — a partial rehearsal doesn't validate
  the real dependency chain.
- One open video-conference/call for the whole rehearsal, run by the cutover PM, to coordinate,
  surface issues, and drive resolution in real time.

## Production execution proven practices

- Daily "open cutover video call" emulating co-location, with breakout sessions for specific
  issues — cutover PM oversees.
- Daily beginning-of-day and end-of-day meetings; full team attendance required.
- A "war room" model: one central conference/chat for overall coordination plus dedicated
  channels per workstream (e.g. Order-to-Cash, Data Migration, FI/CO), each reporting
  status/progress back into the one central cutover plan — never a separate plan per
  workstream.
- Consider a "soft" go-live on a defined process/product subset before full business go-live,
  to validate on live but limited scope first.

## Post-cutover adoption & hypercare

- Defined issue-reporting/escalation process for end users, using existing ticketing tooling
  (not improvised per incident).
- Daily pulse-check/briefing cadence through the hypercare window (accelerator's own example:
  full first week), feeding into
  [operations/hypercare-playbook-template.md](../../operations/hypercare-playbook-template.md).
- Explicit close-out: recognize the team, share cutover/success metrics, capture lessons
  learned before the team disperses — don't let this fall out of scope once the system is live.
