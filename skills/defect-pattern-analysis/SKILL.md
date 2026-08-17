---
name: defect-pattern-analysis
description: Cluster a defect backlog by cause (not symptom) to surface systemic issues, rank them by business weight, and propose permanent fixes on the eliminate/prevent/detect/absorb ladder. Domain-neutral engine — plugs in a domain taxonomy, signal catalog and adjacency map (order-to-cash is the current pack). Prevent stage of bug-fixing.
---

# Defect Pattern Analysis

Ported from `sap-ai-cons`'s `skills/run/bugfix/defect-pattern-analysis` — real, tested content, not
a stub.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Look backwards across a period of defects and answer "why does this keep happening?" — cluster by
**cause key**, quantify each cluster, and propose a permanent fix instead of the next point fix.
**Domain-neutral engine** — the normalize → cluster → quantify → propose procedure is generic; the
taxonomy, signal catalog and adjacency come from a domain pack (order-to-cash today).

## When to use

Prevent stage — periodically (sprint / month / hypercare wrap-up) over a backlog or resolved set.
Not for a single ticket (that's `root-cause-playbook`) and not for today's inflow (that's
`incident-triage`). Matches this factory's `defect-pattern-analysis` activity (Run) — a distinct,
periodic activity, not part of the per-ticket triage flow.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the defect set for a defined period — export (CSV/XLSX/JSON) or connector pull. Per
  defect at least: id, created date, short text. In a project with accumulated history, the real
  source for this is the project's own populated copy of
  `../../knowledge/testing/defect-history-template.md`, filtered to the period — an ad-hoc export is
  the fallback for a project that hasn't accumulated that history yet, not the intended long-run
  source.
- **Required:** which domain pack applies (order-to-cash is the built pack).
- **Strongly preferred:** resolution notes (what was actually changed) — without them clustering
  degrades to symptom clustering; say so in the output.
- **Optional:** prior triage classification, effort per ticket, volume hints, transport/release/
  cutover dates for trigger-event clusters, earlier pattern-analysis runs.

## Knowledge this skill orchestrates

- `references/defect-pattern-analysis-method.md` — normalize, cluster classes, quantification, the
  eliminate/prevent/detect/absorb ladder, honesty rules.
- `../incident-triage/references/incident-triage-method.md` — shared classification (sub-process/
  layer/severity), volume-hint schema, dedup heuristics.
- `references/pattern-analysis-template.md` — output template.
- **Domain taxonomy + signal catalog** —
  `../../knowledge/domain-packs/order-to-cash/incident-taxonomy.md` and
  `incident-signal-catalog.md`, so the same phrase maps to the same code across periods.
- **Domain adjacency map** —
  `../../knowledge/domain-packs/order-to-cash/subprocess-adjacency.md`, to note the regression
  footprint of each proposed permanent fix.

## Connectivity (agnostic + graceful degradation)

- Default: operate on a backlog export the consultant holds.
- If the `jira` connector is wired, pull the period live and optionally write cluster tags back.
- If none is connected: read the export, write results to a file, and state "⚠ no ticket connector —
  clusters not written back to the tracker."

## Steps

1. **Frame the run.** Confirm the period, the source and the count; note whether resolution notes
   are available (all/partial/none).
2. **Normalize** each defect: sub-process + layer + severity via the domain signal catalog (reuse
   prior triage where present). Extract the **cause key** from resolution notes — the concrete
   failing object. Keep unclassifiable tickets visible.
3. **Cluster by cause**, using the method's classes (same cause key / cause family / trigger event /
   actor group / recurring known issue / non-defect load). Each cluster must state a **mechanism**;
   if it cannot, mark `unclear-mechanism` and demote it to a candidate.
4. **Quantify** per cluster: ticket count, business weight, severity mix, recurrence, effort, trend.
   Rank by business weight × severity mix × recurrence — never by raw count.
5. **Propose the permanent fix** on the ladder (eliminate → prevent → detect → absorb), with owner,
   whether a change request is needed, and the expected effect. Do not propose custom code when
   config or governance closes the cause.
6. **Note the regression footprint** for each structural proposal from the domain adjacency row —
   permanent fixes are usually wider than the original point fix; hand implementation to
   `fix-doc-and-regression`.
7. **Propose knowledge feedback:** new signal-catalog phrases or disambiguation rules, new
   troubleshooting-tree branches, and — a distinct target, not a separate skill — known-issue/FAQ
   entries destined for `knowledge/operations/` via `knowledge-harvest` (see that skill's workflow
   step 2; this factory folded `sap-ai-cons`'s `known-issues-kb` stub into `knowledge-harvest`
   rather than keeping it separate).
8. **Write** the completed template to `workspace/bugfix/pattern-analysis-<period>.md` (gitignored),
   including the caveats section (sample size, missing notes, period effects).

## Output

A ranked set of cause-based clusters with stated mechanisms, quantification, permanent-fix proposals
on the ladder, regression footprints, and proposed additions back to the domain knowledge pack (and
to `knowledge-harvest` for known-issue entries). Feeds `fix-doc-and-regression` (implementation).

## Judgment calls worth stating out loud

- **A cluster needs a stated mechanism, not just a shared label** — "many tickets about X" is not a
  cluster until you can say *why* they share a cause.
- **Rank by business weight × severity mix × recurrence, never by raw ticket count** — ten how-to
  tickets rank below two S1 billing blocks.
- **State the sample size and period explicitly** — a month of 20 tickets does not support calling
  something "systemic."
- **Never merge clusters to make a bigger headline number.**

## Driver

Main driver: test. Owner role per factory-data.json: **test**.

## Status

## Run-loop handoff

This activity is the Prevent step in the Run loop. Its output must be handed to
`knowledge-harvest`, not left as an analysis-only report:

```text
resolved incidents/defects -> cause clusters -> recurrence and business weight
  -> permanent-fix proposals -> harvest candidates -> operations knowledge
```

For every cluster record source incident refs, recurrence evidence, priority,
ladder action, target bucket and owner. Known-issue candidates require confirmed
cause and applicability before harvest. A period with no candidates still emits
an explicit zero-candidate record; silence is not evidence that this step ran.

Progress. Real, tested logic ported from sap-ai-cons; not yet re-verified as part of this factory's
own pipeline wiring.
