---
name: fix-doc-and-regression
description: Draft fix documentation (root cause, solution, SAP Note pointers, evidence) and propose adjacency-driven regression test scope for an SAP defect fix. Domain-neutral engine — plugs in a domain adjacency map (order-to-cash is the current pack). Fix/verify stage of bug-fixing.
---

# Fix Doc & Regression

Ported from `sap-ai-cons`'s `skills/run/bugfix/fix-doc-and-regression` — real, tested content, not
a stub.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

After diagnose: document the fix and propose **regression scope** from the domain adjacency map
(which areas a change can break). **Domain-neutral engine** — the fix-doc structure and adjacency
walk are generic; the adjacency rows come from a domain pack (order-to-cash today).

## When to use

Fix/verify stage — once root cause + intended fix are known (from `root-cause-playbook`,
`pricing-diagnostic`, `billing-ar-error-analyzer`, `idoc-failure-analyzer`). Not for triage and not
while multiple causes are still equally open (unless documenting TBCs explicitly).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** confirmed (or primary) root cause + layer + intended fix.
- **Required:** which domain pack applies and the primary sub-process code of the change.
- **Strongly preferred:** evidence already collected (doc numbers, error text, Analysis/VKOA/IDoc
  status) and ticket id.
- **Optional:** SAP Note/KBA numbers (pointers only), transport/CR id, secondary sub-processes,
  client doc-type names for scenario wording.

## Knowledge this skill orchestrates

- `references/fix-doc-and-regression-method.md` — generic fix-doc principles + how to derive
  regression from adjacency.
- `references/fix-regression-template.md` — output template.
- **Domain adjacency map** —
  `../../../knowledge/domain-packs/order-to-cash/subprocess-adjacency.md` (Must/Often adjacent, layer
  extras, scenario templates, negative adjacency).
- Optional cross-read: domain `routing-matrix.md` for verify owners; the diagnose RCA file in
  `workspace/` if present.

## Connectivity (agnostic + graceful degradation)

- Default: write `workspace/bugfix/<ticket-or-doc>-fix.md` (gitignored).
- If the `jira` connector is wired, attach the fix doc and/or create regression test items;
  otherwise state "⚠ no ticket/test connector — paste from workspace file."

## Steps

1. **Validate inputs.** Need root cause, layer, fix intent, domain, primary sub-process. If the
   diagnose output exists in `workspace/bugfix/`, reuse it rather than re-asking.
2. **Draft the fix section** from the template: symptom, root cause, evidence, ruled-out, solution
   steps + owners. Pointers only for Notes. For `custom`, scope a CR; for `user`, enablement only.
3. **Load adjacency** for the domain. Select the **From** row = primary sub-process.
4. **Build regression scope:** Must re-test → add Often adjacent if the fix touches that link →
   apply layer extras → apply negative adjacency to cut over-scope.
5. **Instantiate scenarios** (happy path / pricing / credit / returns / interface templates as
   relevant) with client doc types when known; mark smoke/full/negative and executor.
6. **List out-of-scope** explicitly (so reviewers don't assume full regression).
7. **Write** the completed template to `workspace/bugfix/<ticket-or-doc>-fix.md`. Surface open
   points/TBC in the dedicated section.

## Output

One fix & regression markdown: root cause + solution + adjacency-traced regression scenarios. Feeds
verify execution and, after resolve, `defect-pattern-analysis` and `knowledge-harvest` (known-issue
entries).

## Judgment calls worth stating out loud

- **Never invent ABAP fixes in prose** — for `custom`-layer causes, document a scoped change request
  instead.
- **Regression scope is bigger than the original point fix, usually** — the adjacency walk exists
  because "just retest the one thing that broke" under-scopes structural fixes.
- **Apply negative adjacency deliberately** — don't over-scope regression just because it feels
  safer; state why something is explicitly out of scope.

## Driver

Main driver: test. Owner role per factory-data.json: **test**.

## Status

Progress. Real, tested logic ported from sap-ai-cons; not yet re-verified as part of this factory's
own pipeline wiring.
