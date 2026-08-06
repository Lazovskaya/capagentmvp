---
name: reconciliation
description: Verify a migration load by comparing before-and-after counts and balances against an agreed tolerance, and explain every mismatch rather than let it block the gate silently. Use in Realize during and after a data migration run. First domain pack: finance migration via Data Transition Validation (DTV).
---

# Data Migration & Reconciliation

Contract merged from two independently-sketched stubs (this factory's own, and `sap-ai-cons`'s
`realize/finance-reconciliation`) — neither side had implemented logic. `sap-ai-cons`'s stub was
scoped specifically to finance/DTV; this factory's own stub was scoped generically to "migration
objects" for any Data Lead. Kept generic here, with finance/DTV folded in as the **first domain
pack**, not the whole contract — see the "First domain pack" note in
`../../artifacts/reconciliation-report/template.md`. Other migration domains (logistics master
data, sales documents, etc.) reuse the same before/after/tolerance shape once ported; nothing about
this skill is finance-specific except the first filled-in example.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Realize phase, during or immediately after a migration object load, to verify the load rather than
assume it. Matches this factory's `reconciliation` activity (Data migration & reconciliation).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** the migration object(s) / data domain being reconciled.
- **Required:** the before and after extracts (counts, balances) — or the live source to pull them
  from.
- **Required:** the agreed tolerance, agreed **before** the load ran. If no tolerance was agreed in
  advance, say so explicitly rather than picking one that happens to fit the result.

## Knowledge this skill orchestrates

- `knowledge/data/` — this activity's own bucket; for the finance/DTV first pack, this is where
  `data-transition-validation.md` (candidate, see `knowledge/data/README.md`) would live once
  ported.
- `knowledge/standards/` — delivery conventions for how a mismatch gets written up.

## Steps

1. **Validate inputs.** If the tolerance wasn't agreed before the load, flag this explicitly in the
   output — a tolerance chosen after seeing the delta is not evidence, it's a rationalization, and
   the report should say so rather than quietly present it as if it were agreed in advance.
2. **Pull the before and after figures** per object — counts, balances, whatever the domain's unit
   of comparison is (for finance/DTV: Universal Journal line items, Asset Accounting values,
   Material Ledger balances).
3. **Compute the delta and check it against tolerance**, per object, not in aggregate — an
   in-tolerance total can hide an out-of-tolerance object that happened to net out against another.
4. **For every out-of-tolerance mismatch, state a likely cause.** "Investigating" is not a
   completed reconciliation report — this skill's whole value is that the answer is a number, and a
   number with no attached explanation just relocates the ambiguity instead of resolving it.
5. **Write the report** — see `../../artifacts/reconciliation-report/template.md`.

## Output

- **`reconciliation-report` artifact** (`../../artifacts/reconciliation-report/template.md`):
  per-object before/after/delta/tolerance table, explained mismatches, domain scope, agreed
  tolerance.
- Feeds the `realize→deploy` Q-gate — a report either sits inside tolerance or blocks the phase;
  there is no third, ambiguous outcome.

## Judgment calls worth stating out loud

- **A tolerance agreed after seeing the result is not a tolerance** — flag this explicitly rather
  than let the report imply the check was set up correctly.
- **Net-zero aggregates can hide real mismatches** — always compare per object, never only the
  total.
- **"Investigating" is a status, not a finished mismatch explanation** — if the cause genuinely
  isn't known yet, say that explicitly and name who owns finding it, rather than leaving the field
  vague.

## Driver

Main driver: data. Owner role per factory-data.json: **data**.

## Status

Progress. Contract and workflow written and merged from both stubs' scoping, with finance/DTV framed
explicitly as the first domain pack rather than the whole contract; not yet dry-run tested end to
end.
