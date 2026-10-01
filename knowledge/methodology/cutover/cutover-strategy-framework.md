# Cutover strategy — decision framework

See [_index.md](_index.md) for consumer context.

## 1. Core strategy questions

Every Cutover strategy answers these, explicitly, before Realization ends:

- **Time constraints?** Available downtime/data-migration windows against business disruption.
- **Big Bang or Phased?** Single cutover event vs. phased across business units/geographies.
- **Sequence?** Order of migration activities, system checks, validation steps, sign-off gates.
- **Parallel run with legacy?** Whether the new system runs in parallel with legacy during
  transition.

## 2. Go-Live acceptance criteria

Defined and agreed **before Realization begins**, not decided at go-live itself:

- To begin production cutover: acceptable Integration-Test pass rate, trained/certified user
  coverage, open-issue levels, performance criteria.
- To accept master data / transactional data: planned accuracy percent by object.
- Outcome check: key processes execute correctly in production post-migration.

## 3. Cutover organization

Standard role set: Cutover Manager, with Team Leads for Legacy, Data Migration, Functional,
and OCM — each leading their own team (Legacy Team, Data Migration Team, Site Coordinators,
Key Users). A strategy document should name these roles even before individuals are assigned.

**Legacy team's long-term responsibility:** legacy system inventory (what sunsets, what needs
modification), batch-process rescheduling/cancellation, access & security during cutover and
post go-live.

**Migration team's responsibility:** decide one-time vs. multi-delta migration, dual-maintenance
approach, migration sequence; track quality (record counts, validation results, timing) per
data load in a dedicated tracking sheet; support business data cleansing/validation.

**Business team's responsibility:** key personnel/staffing, new data requirements, business
prep activities, process cut-off milestones, alternative processes during transition,
acceptable shutdown window, in-production key processes, end-user requirements, dual-maintenance
decisions, data cleansing/validation ownership.

## 4. Schedule discipline

- Each functional/data/technical team lead maintains its own team cutover schedule up to the
  point of the QA-box migration handoff.
- After handoff, **only the Master Cutover Schedule is updated** — team schedules stop being
  maintained independently. The Cutover Manager owns the merge.
- The Master Schedule is reused across iterations (QA build, simulations, production cutover),
  using predecessor/successor dependency links for time forecasting — not rebuilt each time.

## 5. Cutover simulations

Occur within the Cutover Preparation track, ahead of the active cutover period — this is where
the checklist (see [cutover-checklist-template.md](cutover-checklist-template.md)) gets
rehearsed and corrected before it is trusted for production.

## 6. Contingency plan

A strategy document names, per identified risk: the mitigation, the owner, the legacy-system
restoration time if cutover must abort, explicit decision points positioned through the
schedule, and objective acceptance requirements at each decision point (so proceed/abort is a
fact-based call, not judgment on the day).

## 7. Hypercare handoff

- Dedicated cutover-room staffing for a defined period (accelerator's own example: 2 weeks),
  24×7 support schedule, help-desk coordination, dedicated issue tracking/escalation.
- Formal handover to standing Help Desk at period end, with an ongoing support model already
  established and Key Users as first line of support; lessons learned documented and shared —
  this is the connective tissue into `knowledge/operations/hypercare-playbook-template.md`.

## 8. Top assumptions this strategy depends on

A real Cutover strategy states these explicitly rather than assuming them silently — each is a
precondition, not a nice-to-have:

- In-scope system design (config + enhancements) is complete and integration-tested end-to-end.
- In-scope interfaces are complete and integration-tested with receiving-system confirmation.
- Additional development (authorizations, reports, forms, migrations) is complete and tested.
- Data to convert is cleansed, validated, and approved for migration.
- The cutover approval process runs to its own defined criteria without slipping.
- Prerequisite/parallel activities (security roles, CAT, end-user training, OCM) finish before
  go-live.
- Resource constraints are managed by priority/criticality/urgency, and each team keeps the
  skills it needs for the duration.
