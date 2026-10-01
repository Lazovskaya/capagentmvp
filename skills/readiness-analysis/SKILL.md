---
name: readiness-analysis
description: Intake and orchestrate a SAP Readiness Check for SAP S/4HANA export -- run the mechanical extraction once, cache it at a stable engagement path, print a chapter/gap summary, and route the user to the relevant topic-scoped skill(s) (readiness-business-architecture, readiness-technical-architecture, readiness-extensibility, readiness-integration, readiness-security, readiness-data-master-data). Use in Discover as soon as Readiness Check output exists, before committing to a conversion date, when you want a first full pass across every topic or aren't yet sure which topic to update.
---

# Readiness & Simplification Analysis — Intake

This skill no longer interprets chapters itself. It was split into 6 topic-scoped skills (see
`knowledge/methodology/brownfield-conversion/confluence-publication-structure.md` for the taxonomy)
so a single-topic update doesn't have to load the whole 10-chapter interpretation guide and every
deep-dive reference. This skill's remaining job is intake: run the extraction once, cache it where
every topic skill can find it, and point to the right topic skill(s).

Deterministic extraction lives in `tools/parse-readiness-check-export/`, unchanged by this split.

## When to use

Discover phase, as soon as the consultant has SAP Readiness Check output for a Brownfield
S/4HANA conversion, before committing to a conversion date -- when a first full pass across every
topic is wanted, or when it isn't yet clear which topic needs attention. If you already know you
only want to (re-)check one topic, skip this and invoke that topic skill directly -- each one is
fully self-sufficient and will run the extraction itself if no cached copy exists yet.

Calibrated against the "Readiness Check for SAP S/4HANA" (system conversion) report specifically,
not the Cloud ALM, BW/4HANA, or SAP S/4HANA Cloud variants.

## Inputs (contract)

- **Required:** the Readiness Check export -- ask for the full `.zip`/folder export (the `.docx`
  plus ~20-25 supporting `.xlsx` files), not just the `.docx`, since the `.xlsx` files carry the
  real underlying numbers as clean structured columns. A bare `.docx` still works, but say
  explicitly that findings depending on those numbers are then sourced from less-reliable docx
  text extraction.
- **Required:** `engagement_id` -- stable engagement identifier, used for the cache path.

## Steps

1. **Extract mechanically** via the `parse-readiness-check-export` Tool, to a stable,
   engagement-scoped path -- **not `/tmp`**, which doesn't survive across sessions and would force
   every topic skill invoked later to re-run extraction:
   ```
   python3 tools/parse-readiness-check-export/scripts/extract_readiness_check.py <export_folder/> workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json
   ```
   Walks the document in its own chapter/subchapter structure, capturing paragraph text and
   tables as structured JSON; flags known "no data collected" phrases and any chapter with no
   table and no substantive text as `structurally_empty`. When pointed at a folder, every `.xlsx`
   is read into `supporting_data`; a sheet over 150 rows is written to its own sidecar JSON file
   next to the main output.
2. **Report the summary** the Tool already prints (chapter count, gap-flagged sections,
   structurally-empty sections, supporting `.xlsx` files ingested) -- this is the full extent of
   this skill's own interpretation. Do not draft findings here.
3. **Route to the relevant topic skill(s)**:

   | Topic skill | Owns |
   |---|---|
   | `readiness-business-architecture` | Ch. 1, 3, 4 (Simplification Items, Compatibility Scope) |
   | `readiness-technical-architecture` | Ch. 2, 9.5 (Add-Ons, Planned Downtime) |
   | `readiness-extensibility` | Ch. 5 (Custom Code) + Clean Core/Extensibility framework |
   | `readiness-integration` | Ch. 7 (all interface types) |
   | `readiness-security` | No dedicated chapter -- auth-adjacent items scattered in Ch. 2/3 |
   | `readiness-data-master-data` | Ch. 6, 8, 9.6 (HANA Sizing, Financial Data Quality, CVI) |

   For a first full pass, invoke all 6 (parallelized where independent -- they don't depend on
   each other, same pattern as interpreting chapters used to work under the old monolithic skill).
   For a targeted update, invoke only the relevant one(s).

## Output

- The cached extraction at `workspace/<engagement_id>/brownfield-sad/rc_data/rc_data.json` (+
  sidecars), which every topic skill reuses.
- No findings artifact of its own -- `simplification-impact-report` and
  `business-process-impact-list` are produced by the topic skills, each scoped to its own
  chapters.

## Driver

Main driver: architect (invoked by the Brownfield SAD Authoring Agent).

## Status

In test. `tools/parse-readiness-check-export`'s `extract_readiness_check.py` ships its own
`requirements.txt` (`python-docx`, `openpyxl` -- run
`pip install -r tools/parse-readiness-check-export/requirements.txt` before using it) and has been
run end-to-end against a synthetic export and, in this engagement, against a real client export
(chapter/subchapter splitting, gap/clean-result flagging, and sidecar output all correct). No
automated test suite exists yet.
