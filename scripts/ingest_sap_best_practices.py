#!/usr/bin/env python3
"""Build SAP Best Practices scope-item -> Fiori app/TCode mappings from a locally
downloaded Fiori Apps Reference Library export, one JSON file per scope item.

Method 4 of the SAP Best Practices taxonomy ingestion strategy (EPMCSAPAI-197),
adjusted from the original plan: the classic library's public, unauthenticated
`SingleApps.xsodata` OData feed no longer exists (SAP retired it in favor of
FAL 2.0 at fal.cloud.sap, which requires Sign In). There is no anonymous live
API left to call, so this script follows the same local-export pattern already
used by tools/map_processes_to_fiori_apps.py in this repo: a human downloads
the export from the library UI (Sign In required) and this script parses it
offline. Methods 1-2 (SAP Cloud ALM Process Content API, Signavio bulk export)
still need OAuth/S-user credentials and are meant to enrich this baseline later
with L1-L2 hierarchy and BPMN step detail.

Output is a regenerable cache, not curated knowledge: see
knowledge/domain-packs/sap-best-practices/README.md for why it lives under
scope-items/ and is gitignored rather than committed.
"""

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as xml

NAMESPACE = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "knowledge" / "domain-packs" / "sap-best-practices" / "scope-items"

# Column names as they appear in a Fiori Apps Reference Library export. Pass --column-map to
# override any of these if a real export uses different header text (unverified against a real
# FAL 2.0 export as of this writing -- confirm column names against the actual downloaded file
# and adjust here or via --column-map before trusting the output).
# Confirmed against a real FAL 2.0 "App List" export (2026-08-24): Scope Item and Line Of
# Business cells both list "|"-joined entries (Scope Item as "<title> - <CODE>", LOB as a
# broad-to-narrow path e.g. "Finance | Budget and Finance | Corporate Finance | Finance & Risk"),
# and the TCode column is plural. --column-map can still override any of these for a
# differently-shaped export.
DEFAULT_COLUMNS = {
    "scope_item": "Scope Item",
    "app_name": "App Name",
    "app_id": "App ID",
    "transaction_code": "Transaction Codes",
    "app_type": "UI Technology",
    "role": "Business Role",
    "component": "Application Component",
    "lob": "Line Of Business",
}
SCOPE_ITEM_SEPARATOR = " | "
LOB_PATH_SEPARATOR = " | "


def cell_column(reference):
    return re.match(r"[A-Z]+", reference).group(0)


def read_xlsx(path):
    """Reads sheet1 of an .xlsx export into a list of {header: value} row dicts.
    Handles both shared-string cells (t="s", the common case for Excel-produced files) and
    inline-string cells (t="inlineStr", which some export tools use instead of a sharedStrings
    part)."""
    with ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = xml.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(item.itertext()) for item in shared_root.findall("x:si", NAMESPACE)]
        root = xml.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in root.findall(".//x:sheetData/x:row", NAMESPACE):
            values = {}
            for cell in row.findall("x:c", NAMESPACE):
                cell_type = cell.attrib.get("t")
                if cell_type == "inlineStr":
                    inline = cell.find("x:is", NAMESPACE)
                    raw = "".join(inline.itertext()) if inline is not None else ""
                else:
                    value = cell.find("x:v", NAMESPACE)
                    raw = "" if value is None else value.text
                    if cell_type == "s" and raw:
                        raw = shared[int(raw)]
                values[cell_column(cell.attrib["r"])] = raw
            rows.append(values)
    if not rows:
        raise ValueError(f"{path} has no rows on sheet1")
    headers = {column: value for column, value in rows[0].items() if value}
    return [{name: row.get(column, "") for column, name in headers.items()} for row in rows[1:]]


def split_scope_items(raw_value):
    """A row's Scope Item cell lists entries like "Sell from Stock - BD9" joined by " | ".
    Returns (code, title) pairs. Falls back to treating the whole entry as a bare code (no title)
    if it doesn't end in " - <CODE>", so a differently-shaped export degrades gracefully instead
    of silently dropping the entry."""
    entries = []
    for entry in (raw_value or "").split(SCOPE_ITEM_SEPARATOR):
        entry = entry.strip()
        if not entry:
            continue
        if " - " in entry:
            title, code = entry.rsplit(" - ", 1)
            entries.append((code.strip(), title.strip()))
        else:
            entries.append((entry, None))
    return entries


def group_by_scope_item(rows, columns):
    grouped = {}
    titles = {}
    for row in rows:
        for scope_id, title in split_scope_items(row.get(columns["scope_item"], "")):
            grouped.setdefault(scope_id, []).append(row)
            if title and not titles.get(scope_id):
                titles[scope_id] = title
    return grouped, titles


def top_level_lob(apps, columns):
    """Each app row can carry its own "|"-joined, broad-to-narrow LOB path (e.g. "Finance |
    Budget and Finance | ..."); a scope item's apps usually agree on the first (broadest) segment.
    Returns (best_guess_lob_or_None, all_distinct_top_level_segments_seen)."""
    top_levels = []
    for app in apps:
        raw = app.get(columns["lob"]) or ""
        segments = [s.strip() for s in raw.split(LOB_PATH_SEPARATOR) if s.strip()]
        if segments:
            top_levels.append(segments[0])
    if not top_levels:
        return None, []
    counts = Counter(top_levels)
    best = counts.most_common(1)[0][0]
    return best, sorted(counts)


def build_process_doc(scope_id, title, apps, columns):
    steps = [
        {
            "step_no": idx,
            "name": app.get(columns["app_name"]),
            "fiori_app_id": app.get(columns["app_id"]),
            "technical_transaction": app.get(columns["transaction_code"]),
            "app_type": app.get(columns["app_type"]),
            "role": app.get(columns["role"]),
            "component": app.get(columns["component"]),
        }
        for idx, app in enumerate(apps, start=1)
    ]
    title = title or f"Scope item {scope_id}"
    lob, distinct_lobs = top_level_lob(apps, columns)
    notes = ["L1 value stream not populated from this local export; needs Method 1 (Cloud ALM Process Content API) or Method 2 (Signavio bulk export) enrichment."]
    if len(distinct_lobs) > 1:
        notes.append(f"L2 is a majority vote across apps that disagreed on Line Of Business: {', '.join(distinct_lobs)}.")
    return {
        "scope_item_id": scope_id,
        "title": title,
        "hierarchy": {
            "L1_value_stream": None,
            "L2_core_process": lob,
            "L3_scope_item": f"{scope_id} - {title}",
            "L4_steps": steps,
        },
        "note": " ".join(notes),
    }


def parse_column_map(pairs):
    columns = dict(DEFAULT_COLUMNS)
    for pair in pairs or []:
        if "=" not in pair:
            raise ValueError(f"--column-map entries must be key=Header Name, got: {pair}")
        key, header = pair.split("=", 1)
        if key not in DEFAULT_COLUMNS:
            raise ValueError(f"unknown column key '{key}', expected one of: {', '.join(DEFAULT_COLUMNS)}")
        columns[key] = header
    return columns


def run_ingestion(export_path, output_dir, columns, only_scope_items):
    rows = read_xlsx(export_path)
    available_headers = set(rows[0].keys()) if rows else set()
    missing = {label for label in (columns["scope_item"], columns["app_name"]) if label not in available_headers}
    if missing:
        raise ValueError(
            f"export is missing required column(s) {sorted(missing)}. "
            f"Columns found: {sorted(available_headers)}. Use --column-map key=Header to fix."
        )

    grouped, titles = group_by_scope_item(rows, columns)
    if only_scope_items:
        unknown = set(only_scope_items) - grouped.keys()
        if unknown:
            print(f"Warning: not found in export: {', '.join(sorted(unknown))}", file=sys.stderr)
        grouped = {sid: apps for sid, apps in grouped.items() if sid in only_scope_items}

    output_dir.mkdir(parents=True, exist_ok=True)
    for scope_id, apps in grouped.items():
        process_doc = build_process_doc(scope_id, titles.get(scope_id), apps, columns)
        (output_dir / f"{scope_id}.json").write_text(json.dumps(process_doc, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {len(grouped)} scope-item files (from {len(rows)} export rows) to {output_dir}/")
    return len(grouped)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--export", type=Path, required=True, help="Path to the locally downloaded Fiori Apps Reference Library .xlsx export")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory to write per-scope-item JSON files into")
    parser.add_argument("--scope-item", action="append", dest="scope_items", help="Restrict output to one scope item ID (repeatable); default is every scope item found in the export")
    parser.add_argument("--column-map", action="append", dest="column_map", help="Override a column header, e.g. --column-map scope_item='Best Practice ID'")
    args = parser.parse_args()

    try:
        columns = parse_column_map(args.column_map)
        run_ingestion(args.export, args.output_dir, columns, set(args.scope_items) if args.scope_items else None)
    except (ValueError, FileNotFoundError, KeyError) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
