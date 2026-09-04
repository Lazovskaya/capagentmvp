---
name: conversion-scoping
description: Turn SAP Readiness Check Simplification Item findings into a scoped business-process list marked Changed/Unchanged/Out of scope, using SAP's official Reference Business Architecture (RBA/RSA) catalog as the process taxonomy. Use whenever the user wants to scope business processes for an SAP conversion project, asks which processes will change vs. stay the same, wants a Fit-to-Standard/Design-phase workshop scope, or provides both a Readiness Check analysis and an RBA/RSA catalog file.
---

# Conversion scoping

Ported from `sap-ai-architecture-generator`'s `sap-conversion-scoping` skill (real, engagement-
tested content; `own` posture) — modeled on a real EPAM deliverable (ADNOC L&S ERP Transformation,
Section 2.2 Business Process Scope). Turns a Readiness Check's technical findings into a
business-facing deliverable: which processes change, which don't, and roughly how much work each
changing process is. Match that same honesty about it being a planning-level draft to validate in
workshops, not a final answer.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

## When to use

Discover/Explore phase, whenever the user wants to scope business processes for an SAP conversion
— which processes will change vs. stay the same, or a Fit-to-Standard/Design-phase workshop scope.

## Inputs (contract)

Ask for anything missing before running.
- **Required: both inputs.** A `readiness-analysis` findings brief (or run that skill first if the
  report hasn't been analyzed yet) for the Simplification Item findings, and the client's SAP
  RBA/RSA Release Excel for the process taxonomy. Don't attempt this with only one — the RBA/RSA
  catalog alone has no idea what's relevant to this client, and the Simplification Items alone have
  no complete process taxonomy to scope against.
- **Required:** confirmation of the organization's own conversion-type shorthand (e.g. "DOC,"
  "DMOVE2S4") if used — ask for exact definitions, don't guess.
- **Optional:** the client's Application Map/interface inventory, to cross-reference supporting
  applications per scoped process before the workshop rather than after — the `leanix` connector can
  supply this directly when available; otherwise ask for the client's own export.

## Knowledge this skill orchestrates

- `references/scoping_methodology.md` — the matching approach, output shape (modeled on a real
  EPAM deliverable), complexity heuristic, Application Map cross-referencing, and conversion-type
  terminology guidance.

## Steps

1. **Get both inputs** (see Inputs above) — say so and ask if either is missing rather than
   proceeding with just one.
2. **Extract the RBA catalog mechanically:**
   ```
   python3 scripts/extract_rba_catalog.py <rba_rsa.xlsx> /tmp/rba_extract.json --industry "<client's industry>"
   ```
   The raw file is a denormalized 20MB+ export (every row repeats the full hierarchy path) — don't
   read it directly. This collapses it to one entry per unique Business Activity with its full
   E2E/Process Module/Process Segment path and linked Business Capabilities. Always pass
   `--industry` filtered to the client's actual industry — the unfiltered catalog covers every
   SAP-supported industry and is far larger than needed.
3. **Do the matching** per `references/scoping_methodology.md` §2 — semantic judgment, not a
   mechanical join; there's no shared ID between a Simplification Item's `LoB – Business Area` text
   and the RBA's naming. Be conservative — a false "Changed" costs a real workshop slot.
4. **Explicitly enumerate the Unchanged processes too — don't skip this.** The Readiness Check
   never names them (only counts them); build this list by pulling every RBA Business Activity
   under each in-scope Business Area and subtracting whatever's already Changed/To-Assess. A scope
   deliverable that only lists Changed/To-Assess rows and describes "everything else" in prose is
   incomplete — the Unchanged rows are as much the point of this skill as the Changed ones.
5. **Produce the output as a real `.xlsx` workbook, always** — a standing requirement, not a
   preference. Build the structured JSON (one entry per process, per Business Area — see the input
   shape in the script's docstring; set `"technical_blocker": true` on any row driven by a
   Simplification Item consistency error per `references/scoping_methodology.md` §3 — this is what
   tells `workshop-preparation` to keep it out of the business-discussion agenda) and run:
   ```
   python3 scripts/build_scope_workbook.py <scope_data.json> <ClientName>_Business_Process_Scope.xlsx
   ```
   Produces a Summary sheet plus one sheet per Business Area, with status color-coding. A
   prose/markdown summary is a fine companion, but never replaces the workbook. Include the
   explicit caveat that this is a planning-level draft to be re-validated jointly with the client
   during workshops — don't drop that caveat; it's load-bearing.
6. **Raise any "Business Decision" or otherwise gating row into `adr-log` now, not after the
   workbook ships.** A Mandatory/Before-project activity that's actually a business decision (e.g.
   "decide whether Business Partner ID matches Customer/Vendor ID," a Dual Stack landscape-redesign
   flag) is a real architectural decision, not routine scope data — raise it as a "Proposed" entry
   as soon as it's identified here.
7. **If the client has an Application Map, cross-reference it now — before the workshop:**
   ```
   python3 scripts/extract_application_map.py <application_map.xlsx> /tmp/appmap.json
   ```
   Every client formats this differently (no assumed columns) — extract generically, then do the
   same semantic matching as step 3 (§6 of the methodology file) to attach supporting
   application(s) to each scoped process, passed through to `build_scope_workbook.py` via each
   row's optional `applications` field (adds a "Supporting Application(s)" column automatically).
   Optional, but do it whenever an Application Map is available — don't wait for the workshop.

## Working with the rest of the factory

- **Input from `readiness-analysis`**: the Simplification Item findings (Ch.3.1.1/3.1.2) are this
  skill's primary driver. If Custom Code (Ch.5) or Integration (Ch.7) findings are also available,
  factor them into the complexity call where they clearly apply.
- **Output feeds `sad-drafting`**: the scoped process list is a real input to IV.I
  (Business Goals/Capabilities) and Section 6 (Extensibility), grounding those in actual process
  impact rather than generic statements.
- **Output feeds workshop preparation** (once reconciled with `workshop-preparation` — see that
  skill's own notes): the Changed-process list, grouped by Business Area, is exactly the starting
  scope that stage needs — hand it over directly rather than reformatting.

## Output

- A real `.xlsx` workbook: Summary sheet + one sheet per Business Area, Changed/Unchanged/To-Assess
  status with color-coding, a complexity estimate (Low/Medium/High) per Changed process, and a
  "Supporting Application(s)" column when an Application Map was cross-referenced.
- A "Technical Blocker" column flagging any process whose driving Simplification Item carries a
  technical consistency error — needs engineering remediation regardless of Category, not a
  business decision.
- An explicit caveat on the Summary sheet: planning-level draft, to be validated during
  Fit-to-Standard/Design-phase workshops.

## Judgment calls worth stating out loud

- **Matching a Simplification Item's Business Area to the RBA's process taxonomy is semantic
  judgment, not an exact join** — treat the output as a strong first draft, always re-validate in a
  real workshop.
- **The organization's own conversion-type shorthand isn't guessed** — confirm exact definitions
  before classifying anything by it.
- **A missing Unchanged-process enumeration is an incomplete deliverable**, not an acceptable
  shortcut.

## Driver

Main driver: architect. Owner role per factory-data.json: **architect**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-conversion-scoping` (real,
engagement-tested methodology and three extraction/build scripts); not yet dry-run tested against
this factory's own wiring.
