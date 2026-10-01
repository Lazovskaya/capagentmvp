---
name: sizing-analysis
description: Turns SAP sizing inputs -- a Readiness Check's sizing chapter, a HANA Sizing Report, a Quick Sizer export, or a RISE FUE/user count -- into an actual sizing recommendation with a growth buffer, archiving offset, and per-instance breakdown, instead of just restating a raw baseline number. Use whenever the user asks about SAP system sizing, HANA memory/CPU/disk sizing, RISE T-shirt sizing, Full User Equivalents, or needs sizing figures for a Solution Architecture Document.
---

# SAP Sizing Analysis

Merged onto
this factory's own `sizing-analysis` contract and `sizing-recommendation` artifact. The
mechanical arithmetic lives in `tools/calculate-s4hana-sizing/`, not under this Skill.

Act as an experienced SAP Basis/infrastructure architect turning a raw sizing number into an
actual provisioning recommendation. A sizing tool's raw output is a baseline, not a target -- the
skill's job is applying the adjustments a real recommendation needs (growth, archiving offset,
per-instance split, methodology-mismatch checks) and saying explicitly which adjustments were and
weren't applied.

## When to use

Whenever the user needs a sizing recommendation for a Brownfield conversion, typically right
after `readiness-analysis` has extracted a Readiness Check's Chapter 6 (HANA Sizing Report
result), or when a Quick Sizer export or a RISE FUE count is available directly.

## Inputs (contract)

- **Required:** a sizing baseline from one of: `readiness-analysis`'s Chapter 6 extract, a Quick
 Sizer export, a HANA Sizing Report, or a RISE FUE count mapped to a T-shirt tier (flag this
 last case explicitly as a licensing-driven estimate, not a technical measurement).
- **Required:** growth rate and horizon -- ask the user, never default to 0% growth silently. A
 0% growth assumption is a real claim, not a safe default.
- **Optional:** known archiving/housekeeping opportunity; planned new functionality (Fiori,
 embedded analytics) needing sizing on top, per `references/sizing_methodology_guide.md`.

## Steps

1. **Identify the methodology** per `references/sizing_methodology_guide.md` §1-2: technical
 sizing (Quick Sizer / HANA Sizing Report / SAP Expert Sizing, data-volume-driven) vs. RISE
 Standard T-shirt sizing (FUE/license-driven) -- a different input entirely.
2. **Get the growth/adjustment inputs** the raw baseline never includes on its own.
3. **Run the calculation** via the `calculate-s4hana-sizing` Tool:
 ```
 python3 tools/calculate-s4hana-sizing/scripts/sizing_calc.py <input.json> <output.json>
 ```
 One entry per target instance, plus growth/archiving/new-functionality assumptions. The Tool
 only does the arithmetic (growth compounding, archiving offset, per-instance and combined
 totals) -- it warns loudly if growth is left at 0.
4. **Write the recommendation** per §4-5 of the guide: which methodology produced the baseline,
 what adjustments were applied, any RISE FUE-tier vs. technical-data-volume mismatch, and a
 per-instance table plus narrative -- not just the raw output JSON.
5. **If the methodology choice or resulting target is materially disputed or commercially
 significant**, raise it into `adr-log` -- a sizing number that drives a commercial decision
 deserves the same tracking as any other gating architectural decision.

## Output

- **`sizing-recommendation` artifact**: baseline, assumptions, per-instance calculation, RISE
 mismatch flag, caveats, reviewer, and approval state.
- Feeds `sad-drafting`'s Sizing Strategy decision matrix.

## Driver

Main driver: architect.

## Status

In test. `tools/calculate-s4hana-sizing/scripts/sizing_calc.py` is real, stdlib-only,
and verified end to end in this environment (growth compounding + archiving offset + new
functionality, single instance: 5288 GiB baseline -> 6888.3 GiB recommended at 10%/yr for 3
years, -200 GiB archiving, +50 GiB new functionality -- matches hand-calculated expected value).
No automated test suite exists yet.
