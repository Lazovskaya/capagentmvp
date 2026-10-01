# Tool: Parse Readiness Check Export

Mechanical extractor for SAP Readiness Check for SAP S/4HANA exports. Walks the
`.docx`'s fixed, numbered chapter structure and captures paragraph text and tables as
structured data; when pointed at a folder, also ingests every supporting `.xlsx`
export. Does not interpret anything -- severity/blocker judgment is the
`readiness-analysis` Skill's job, guided by its `references/`.


## Input contract

```yaml
export_path:
 type: string
 required: true
 description: >
 Either a single .docx (supporting_data will be empty) or a folder/unzipped export
 containing the .docx plus its supporting .xlsx files (preferred).
output_path:
 type: string
 required: true
 description: Where to write the extracted JSON.
```

CLI: `python3 scripts/extract_readiness_check.py <export_path> <output_path>`

## Setup

`pip install -r tools/parse-readiness-check-export/requirements.txt` (`python-docx`,
`openpyxl`) before running -- the script imports `python-docx` unconditionally at
module load and fails immediately without it.

## Operation

Splits the document into chapters/subchapters by heading number and level, capturing
each section's paragraphs and tables. Flags paragraphs matching a known
"no data collected" phrase list (`gap_flags`) and a known "checked, found nothing"
phrase list (`clean_result_flags`, kept separate since it's the opposite finding).
Also flags any chapter with no table and no substantive text as `structurally_empty`,
even with no phrase match, since the phrase list can't cover every wording SAP uses.
When given a folder, reads every `.xlsx` (all sheets, all rows -- deliberately without
`openpyxl`'s `read_only` mode, since real exports have been found with a stale
`<dimension>` tag that `read_only` trusts and silently truncates to) into
`supporting_data`, keyed by filename without extension. A sheet over 150 rows is
written to its own sidecar JSON file next to the main output instead of being inlined.

## Output contract

```yaml
chapters:
 type: array
 description: One entry per chapter/subchapter, each {number, level, heading, paragraphs, tables, gap_flags, clean_result_flags, structurally_empty}.
supporting_data:
 type: object
 required: false
 description: Present only when export_path was a folder. Keyed by source filename (no extension); each sheet is either inlined ({headers, row_count, rows}) or, over 150 rows, a sidecar reference ({headers, row_count, sidecar}).
```

## Errors and confirmations

- Raises on a missing/unreadable `.docx`, or (folder mode) no `.docx` found in the
 folder.
- Read-only against the export; writes only the output JSON and, if needed, sidecar
 files next to it. No confirmation required.

**Verified (2026-09-11):** with `requirements.txt` installed, ran end to end against a
synthetic export (a numbered-heading `.docx` fixture plus two supporting `.xlsx`
files, one over the 150-row sidecar threshold) -- chapter/subchapter splitting,
`gap_flags`, `clean_result_flags`, `structurally_empty`, and sidecar file writing all
produced correct output. Not yet run against a real client export -- SAP's actual
heading wording/structure across report versions is still unverified here, only the
script's own documented behavior.
