---
name: solution-design
description: Turn an accepted fit-to-standard scope into a coherent solution architecture, create one target design and extensibility record per delta, and produce a traceable architecture package before backlog or build work starts.
---

# Solution design, architecture package and extensibility routing

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Run this skill once for the agreed process, release or program scope. It produces
one client-facing `architecture-package` for the scope and one `design-record`
plus one `extensibility-record` for each separable Delta. The package is the
architecture-level output; the per-delta records are its evidence and detail.

## When to use

Explore phase, after `fit-to-standard` workshops have produced a signed decision log with Row IDs.
Run once per agreed scope before any backlog or build work starts. Re-run if the scope changes
enough to invalidate existing design records — do not silently patch individual records without
re-running the package-level scope check.

## Inputs

- Complete fit-to-standard scope, including Delta Row IDs, requirements, justification and owners.
- Requirements record, process scope, system landscape, release, regions and exclusions.
- Scattered sources for Mode B compose/maintain when no single decision-log row captures a delta.
- `extensibility` and `clean-core` knowledge buckets.
- Agent recommendations from `extensibility-assessor`, `source-conflict-analyst` and `design-test-reviewer`, when wired.
- Named architecture, business, security and delivery reviewers.

## Scope and decision boundaries

Establish the package scope and architecture views: capability/process,
application/integration, data/migration, security/authorization,
extensibility/clean core, environment/transport, and operations/support.

Then split the scope into separable decisions. A `design-record` is one Delta,
always. A source pack covering several decisions must produce several records;
scope-level gaps such as missing security or NFR evidence belong in the package,
not in an arbitrary Delta's `open_questions`.

## Cross-artifact traceability

Create one traceability row for every in-scope requirement or Delta. Use stable
IDs and exact references, not filenames or descriptive names alone:

```text
Requirement -> FTS Row -> Design -> Extensibility -> Backlog
  -> Build/Configuration -> Test -> Defect -> Approval
```

Allowed link statuses are `MISSING`, `DRAFT`, `IN_REVIEW`, `APPROVED`,
`IMPLEMENTED`, `TESTED`, `ACCEPTED` and `REOPENED`.

Classify gaps as `missing-source`, `missing-design`, `missing-tier`,
`missing-backlog`, `missing-test`, `missing-approval`, `stale-downstream` or
`scope-conflict`. Every gap needs an owner and due date. Never infer a link from
prose or silently mark a downstream artifact current after an upstream change.

## Extensibility tier ladder

1. **Standard configuration** — customizing only.
2. **Key-user extension** — released in-app extension points.
3. **Side-by-side BTP** — CAP/RAP outside the core using released APIs.
4. **Developer extensibility** — in-app ABAP Cloud using released APIs.
5. **Classic modification** — last resort, requiring explicit escalation.

Start at tier 1 for every Delta. Check released APIs and clean-core rules at
each step. Tier 5 requires the fit-to-standard escalation addendum (or the
design-record ID as the anchor in Mode B) before its extensibility record is
complete.

## Agent orchestration

When a package covers more than one separable Delta, invoke `extensibility-assessor` (step 5) and,
once design-records exist, `design-test-reviewer` as one Task call per Delta launched together
rather than one at a time — each agent applies the same bounded procedure to a different Delta, so
there is no cross-Delta dependency stopping them from running concurrently. Reconcile every
returned verdict before moving on; a Delta whose agent call has not returned yet is not ready for
its design-record to be marked `IN_REVIEW`. Cap concurrent calls at 3-5 per batch — more adds
coordination overhead without proportional benefit.

`source-conflict-analyst` runs earlier, during Mode B source synthesis for a single Delta before
its design-record exists — nothing to batch against yet, so keep it sequential.

## Workflow

1. Establish package ID, scope, release, systems, process areas, regions and exclusions.
2. Register requirements, fit-to-standard sign-off and all source artifacts.
3. Create the traceability matrix and mark every known link and gap.
4. Identify decision boundaries and create one target design per Delta. In Mode B, cite every synthesized claim or mark it `TBC`; surface conflicts instead of resolving them silently.
5. Walk the tier ladder for every Delta and record the reason for every rejected tier.
6. Write the `design-record` and `extensibility-record` for each Delta. Pair them by the same stable Row ID.
7. Populate the architecture package: architecture views, decision register, source artifacts, detailed traceability matrix, NFRs, risks, assumptions, dependencies and open decisions.
8. Run the completion checklist. Set the package `IN_REVIEW` only when gaps are owned; set `APPROVED` only after named architecture and business approvals.

## Outputs

- `architecture-package`: one scope-level client-facing architecture dossier and the `explore→realize` handoff.
- `design-record`: one target design per separable Delta.
- `extensibility-record`: one clean-core tier decision per Delta, including tier-5 escalation where needed.
- Traceability rows linking every Delta through backlog, build, test and approval.

The package must not invent decisions, replace per-delta records, or hide a
scope-level gap inside a single design record. An approved upstream change
reopens affected downstream records and the package traceability row.