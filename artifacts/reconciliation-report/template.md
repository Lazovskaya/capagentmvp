# Reconciliation report — reconciliation

This is the artifact the `realize→deploy` Q-gate checks. The cleanest evidence in the whole factory:
the answer is a number against a tolerance, not an opinion.

- **Client / engagement:**
- **Migration object(s) / data domain covered:** <e.g. "FI: Universal Journal line items,
  2026-08-01 load" — see "First domain pack" note below for the finance/DTV instance>
- **Reconciliation date:**
- **Reconciled by:**
- **Agreed tolerance:** <the tolerance agreed before the load ran, not chosen after seeing the
  result — a tolerance set after the fact isn't a tolerance, it's a rationalization>

## Before / after comparison

| Object | Before (count/balance) | After (count/balance) | Delta | Within tolerance? | Mismatch cause (if any) |
|---|---|---|---|---|---|
| | | | | Yes / No | |

## Mismatches requiring explanation

<Every "No" row above needs a stated likely cause here — a mismatch with no cause attached blocks
the gate silently instead of surfacing what actually needs fixing.>

## First domain pack: finance / Data Transition Validation (DTV)

The first concrete instance of this generic contract is finance migration reconciliation via DTV
(Universal Journal / Asset Accounting / Material Ledger before/after comparison) — see
`knowledge/data/README.md`'s `data-transition-validation.md` candidate. Other migration domains
(e.g. logistics master data, sales documents) follow the same before/after/tolerance shape once
ported; nothing about this report format is finance-specific, only this first filled example is.

## Validity checklist before this report is considered complete

- [ ] Tolerance was agreed before the load, not set to fit the result
- [ ] Every mismatch row states a likely cause, not just "investigating"
- [ ] The object/domain scope is named specifically, not "the migration" in general
