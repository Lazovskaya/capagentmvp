---
name: conversion-scoping
description: Turns SAP Readiness Check Simplification Item findings into a scoped business-process list marked Changed/Unchanged/Out of scope, using SAP's official Reference Business Architecture (RBA/RSA) catalog as the process taxonomy. Use whenever the user wants to scope business processes for an SAP conversion project, asks which processes will change vs. stay the same, or provides both a Readiness Check analysis and an RBA/RSA catalog file.
---

# Business Process Scoping

merged onto this factory's own `conversion-scoping` contract and `business-process-scope`
artifact (schema/template carried over unchanged from `main` -- they already mirror the ported
script's real input shape). Deterministic extraction/rendering now lives in
`tools/generate-business-process-scope/`, not under this Skill.

Turns a Readiness Check's technical findings into a business-facing deliverable: which processes
change, which don't, and roughly how much work each changing process is -- a planning-level
estimate to validate in workshops, not a final answer.

## When to use

After `readiness-analysis` has produced its findings (specifically the `business-process-impact-
list` artifact), when the client's SAP RBA/RSA Release Excel is also available.

## Inputs (contract)

- **Required:** `readiness-analysis`'s `business-process-impact-list` (or the Readiness Check
 findings brief directly, if that skill hasn't run yet) for the Simplification Item findings.
- **Required:** the client's SAP RBA/RSA Release Excel for the process taxonomy. Don't attempt
 this skill with only one of the two inputs -- the RBA/RSA catalog alone has no idea what's
 relevant to this client, and the Simplification Items alone have no complete process taxonomy
 to scope against.
- **Optional:** the client's Application Map/interface inventory, to cross-reference supporting
 applications per scoped process.

## Steps

1. **Extract the RBA catalog mechanically** via the `generate-business-process-scope` Tool:
 ```
 python3 tools/generate-business-process-scope/scripts/extract_rba_catalog.py <rba_rsa.xlsx> /tmp/rba_extract.json --industry "<client's industry>"
 ```
 The raw file is a denormalized 20MB+ export; this collapses it to one entry per unique
 Business Activity with its full hierarchy path. Always pass `--industry` filtered to the
 client's actual industry.
2. **Do the matching** per `references/scoping_methodology.md` §2 -- semantic judgment, not a
 mechanical join; there's no shared ID between a Simplification Item's `LoB -- Business Area`
 text and the RBA's naming. This is what flips `business-process-impact-list`'s
 `applicability_verified` field to `true` per row.
3. **Explicitly enumerate the Unchanged processes too.** The Readiness Check never names them
 (it only counts them) -- pull every RBA Business Activity under each in-scope Business Area
 and subtract whatever's already Changed/To-Assess (§2 point 5 of the methodology file). A
 scope deliverable that only lists Changed/To-Assess rows and describes "everything else" in
 prose is incomplete.
4. **Produce the output as a real `.xlsx` workbook, always** -- a standing requirement, not a
 one-time preference. Build the structured JSON (set `technical_blocker: true` on any row
 driven by a Simplification Item consistency error, per §3 of the methodology file) and run:
 ```
 python3 tools/generate-business-process-scope/scripts/build_scope_workbook.py <scope_data.json> <ClientName>_Business_Process_Scope.xlsx
 ```
 Include the explicit caveat that this is a planning-level draft to be re-validated jointly
 with the client during workshops -- never drop it.
5. **Raise any "Business Decision" or otherwise gating row into `adr-log` now**, not after the
 workbook ships.
6. **If the client has an Application Map, cross-reference it now, before the workshop**:
 ```
 python3 tools/generate-business-process-scope/scripts/extract_application_map.py <application_map.xlsx> /tmp/appmap.json
 ```
 Then match per §6 of the methodology file and pass supporting application(s) through to
 `build_scope_workbook.py` via each row's optional `applications` field.

## Output

- **`business-process-scope` artifact**: stable row ID, business area, process, scope status,
 complexity, driving item, applications, technical blocker, evidence, caveats, confirmation
 state -- delivered as a real `.xlsx` workbook (Summary + one sheet per Business Area).
- Flips `business-process-impact-list`'s rows to applicability-verified.
- Output feeds `sad-drafting` (Requirements/Business Goals, Extensibility) and workshop
 preparation's starting scope.

## Driver

Main driver: architect.

## Status

In test. All three Tool scripts (`extract_rba_catalog.py`,
`build_scope_workbook.py`, `extract_application_map.py`) are real, `openpyxl`-based, and verified
end to end in this environment against synthetic `.xlsx` fixtures (RBA extraction with an
industry filter, workbook generation with Changed/Unchanged rows and an applications column,
generic sheet extraction). No automated test suite exists yet.
