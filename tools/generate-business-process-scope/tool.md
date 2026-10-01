# Tool: Generate Business Process Scope

Three mechanical scripts behind `conversion-scoping`'s output: de-duplicating SAP's
denormalized RBA/RSA catalog, extracting a client's Application Map generically, and
rendering the final scope decision as a real `.xlsx` workbook. None of the three
decide Changed/Unchanged/complexity or matching -- that's `conversion-scoping`'s job.

## Input contract

```yaml
# extract_rba_catalog.py
rba_rsa_xlsx: {type: string, required: true}
output_path: {type: string, required: true}
industry_filter: {type: string, required: false, description: case-insensitive substring match against the catalog's Industry column.}

# extract_application_map.py
application_map_xlsx: {type: string, required: true}
output_path: {type: string, required: true}
sheets: {type: array, required: false, description: sheet names to extract; omit for all sheets.}

# build_scope_workbook.py
scope_data:
 type: object
 required: true
 description: "{title, areas: {<area name>: [{process, status, stream?, complexity?, driving_item?, note?, technical_blocker?, applications?}]}, notes: [string]}"
output_xlsx: {type: string, required: true}
```

CLI:
```
python3 scripts/extract_rba_catalog.py <rba_rsa.xlsx> <output.json> [--industry "..."]
python3 scripts/extract_application_map.py <application_map.xlsx> <output.json> [--sheets "Sheet1,Sheet2"]
python3 scripts/build_scope_workbook.py <scope_data.json> <output.xlsx>
```

## Operation

`extract_rba_catalog.py` reads the `"Business Process Model"` sheet, collapsing every
row to one entry per unique Business Activity ID with its full E2E -> Process Module
-> Process Segment hierarchy path plus linked Business Capabilities; an
`--industry` filter is a case-insensitive substring match. `extract_application_map.py`
makes no assumption about columns -- it turns each sheet into a list of
header-to-value dicts using the first non-empty row as the header. `build_scope_workbook.py`
writes one "Summary" sheet plus one sheet per Business Area with status
color-coding, and a "Supporting Application(s)" column when any row's `applications`
field is set.

## Output contract

```yaml
# extract_rba_catalog.py -> output.json
business_activities: {type: array, items: {business_activity_id, business_activity, enterprise_domain, apqc_reference, e2e_process, e2e_id, process_module, process_module_id, process_segment, process_segment_id, business_capabilities}}
business_capabilities: {type: array, items: {id, name, description}}

# extract_application_map.py -> output.json
<sheet_name>: {type: array, items: {"<header>": "<cell value>", ...}}

# build_scope_workbook.py -> output.xlsx
# A real workbook file (not JSON) -- see artifacts/business-process-scope/template.md for its shape.
```

## Errors and confirmations

- `extract_rba_catalog.py` raises `KeyError` if the workbook has no `"Business Process
 Model"` sheet, or unpacks a row shorter than the expected 39 columns.
- `extract_application_map.py` returns an empty list for a sheet with no non-empty
 header row, rather than raising.
- `build_scope_workbook.py` writes any `status` value as-is; only the four documented
 values (`Changed`/`Unchanged`/`To Assess`/`Out of Scope`) get color-coded.
- All three are read/write against locally supplied files only. No confirmation
 required.

**Verified end to end** in this environment against synthetic `.xlsx` fixtures: RBA
extraction with an industry filter (1 activity + 1 capability extracted correctly),
scope workbook generation (Changed + Unchanged rows, Supporting Application(s)
column populated), and generic Application Map extraction (1 row, arbitrary
columns).
