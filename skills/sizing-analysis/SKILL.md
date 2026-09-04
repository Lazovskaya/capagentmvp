---
name: sizing-analysis
description: Turn an SAP sizing input — a Readiness Check sizing chapter, a HANA Sizing Report, a Quick Sizer export, or a RISE FUE/user count — into an actual sizing recommendation, with a growth buffer, archiving offset, and per-instance breakdown, instead of just restating a raw baseline number. Use whenever the user asks about SAP system sizing, HANA memory/CPU/disk sizing, RISE T-shirt sizing, Full User Equivalents (FUE), Quick Sizer results, or needs sizing figures for a Solution Architecture Document.
---

# Sizing Analysis

Ported from `sap-ai-architecture-generator`'s `sap-sizing` skill (real, engagement-tested content;
`own` posture). Act as an experienced SAP Basis/infrastructure architect turning a raw sizing
number into an actual provisioning recommendation. A sizing tool's raw output (Quick Sizer, the
HANA Sizing Report, a RISE T-shirt mapping) is a baseline, not a target — this skill's job is
applying the adjustments a real recommendation needs (growth, archiving offset, per-instance split,
methodology-mismatch checks) and saying explicitly which adjustments were and weren't applied.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

Discover/Prepare phase, whenever a technical sizing baseline exists or needs interpreting — a
Readiness Check Chapter 6 output, a HANA Sizing Report, a Quick Sizer export, or a RISE FUE count.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** which methodology produced (or should produce) the baseline number — see
  `references/sizing_methodology_guide.md` §1-2. Ask, don't guess:
  - Existing Readiness Check report → its Chapter 6 is the HANA Sizing Report result; use
    `readiness-analysis`'s extractor on it if not already parsed, and pull the Initial Target
    Size / Used Size on Disk numbers from there.
  - Quick Sizer export → use its memory/CPU/disk output directly.
  - RISE engagement, no technical sizing yet → get the FUE count and map it to a T-shirt tier per
    §3 of the guide, but flag this as a licensing-driven estimate, not a technical measurement.
  - None of the above yet → say so, and recommend running the appropriate tool first.
- **Required:** growth rate and horizon — never default to 0% growth silently, ask.
- **Optional:** known archiving/housekeeping opportunity; planned new functionality (Fiori,
  embedded analytics) needing sizing on top, per SAP's own guidance; the target instance count,
  from an Instance Strategy decision if one exists (once `sad-drafting` is ported).

## Knowledge this skill orchestrates

- `references/sizing_methodology_guide.md` — methodology comparison, RISE T-shirt tier reference
  (directional — confirm current SAP figures before quoting exact numbers to a client), and the
  recommendation checklist.

## Steps

1. **Identify the methodology** per the guide's §1-2 decision logic (above).
2. **Get the growth/adjustment inputs** the raw baseline never includes on its own: expected growth
   rate and horizon, any known archiving/housekeeping opportunity, any planned new functionality
   needing sizing on top.
3. **Run the calculation:**
   ```
   python3 scripts/sizing_calc.py <input.json> <output.json>
   ```
   Input shape is documented in the script's docstring — one entry per target instance, plus
   growth/archiving/new-functionality assumptions. The script only does the arithmetic (growth
   compounding, archiving offset, per-instance and combined totals); it warns loudly if growth is
   left at 0, since that's a real claim, not a safe default.
4. **Write the recommendation**: which methodology produced the baseline, what adjustments were
   applied, any RISE FUE-tier vs. technical-data-volume mismatch, a per-instance table plus
   narrative — not just the raw output JSON.
5. **If the methodology choice or resulting target is materially disputed or commercially
   significant** (a RISE FUE-tier mismatch that changes which contract tier applies, a growth
   assumption the client pushed back on), raise it into the `adr-log` skill — a sizing number
   driving a commercial decision deserves the same tracking as any other gating architectural
   decision, not just a line in this skill's own output.

## Output

- **`sizing-recommendation` artifact** (`../../artifacts/sizing-recommendation/`): methodology used
  (labeled measured/estimated/license-tier-derived), adjustments applied (or an explicit warning if
  none were), a per-instance table, and any RISE tier mismatch flagged.
- Feeds the (not yet ported) `sad-drafting` skill's Sizing Strategy decision (SAD Section 2.1/10) —
  once that skill exists, name explicitly which section the number lands in.
- Consumes `readiness-analysis`'s Chapter 6 output directly as its most common real-world input for
  Brownfield/Bluefield engagements — if both skills run in one conversation, say explicitly where
  each number came from and where it's going.

## Judgment calls worth stating out loud

- **A raw sizing-tool baseline is not a provisioning target** — an unadjusted number presented as
  final without saying so is a false precision claim.
- **0% growth is a real assumption, not a safe default** — state it explicitly if that's genuinely
  the client's position, don't let it pass silently.
- **A RISE FUE-tier vs. technical-data-volume mismatch changes which contract tier applies** — flag
  it as its own finding, not a footnote.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-sizing` (real, engagement-tested
methodology and calculation script); not yet dry-run tested against this factory's own artifact
wiring.
