#!/usr/bin/env python3
"""Map a local process list to a local Fiori Apps Library XLSX export."""

import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as xml

NAMESPACE = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REQUIRED_COLUMNS = {"App Name", "App ID", "Selected", "Application Component", "App Description"}
STOP_WORDS = {"and", "for", "the", "with", "from", "app", "process", "management"}


def cell_column(reference):
    return re.match(r"[A-Z]+", reference).group(0)


def read_xlsx(path):
    with ZipFile(path) as archive:
        shared_root = xml.fromstring(archive.read("xl/sharedStrings.xml"))
        shared = ["".join(item.itertext()) for item in shared_root.findall("x:si", NAMESPACE)]
        root = xml.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in root.findall(".//x:sheetData/x:row", NAMESPACE):
            values = {}
            for cell in row.findall("x:c", NAMESPACE):
                value = cell.find("x:v", NAMESPACE)
                raw = "" if value is None else value.text
                values[cell_column(cell.attrib["r"])] = shared[int(raw)] if cell.attrib.get("t") == "s" and raw else raw
            rows.append(values)
    headers = rows[0]
    column_names = {column: value for column, value in headers.items() if value}
    if not REQUIRED_COLUMNS.issubset(column_names.values()):
        missing = sorted(REQUIRED_COLUMNS - set(column_names.values()))
        raise ValueError(f"XLSX is missing required columns: {', '.join(missing)}")
    return "SAPUI5 Export", [{name: row.get(column, "") for column, name in column_names.items()} for row in rows[1:]]


def tokens(value):
    return {word for word in re.findall(r"[a-z0-9]+", value.lower()) if len(word) > 2 and word not in STOP_WORDS}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processes", type=Path, required=True)
    parser.add_argument("--app-list", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    processes = json.loads(args.processes.read_text(encoding="utf-8")).get("processes", [])
    if not processes:
        parser.error("processes JSON must contain at least one process")
    sheet, apps = read_xlsx(args.app_list)
    selected_apps = [app for app in apps if app["Selected"].strip().lower() == "yes"]
    mappings = []
    for process in processes:
        if not process.get("process_id") or not process.get("name"):
            parser.error("every process requires process_id and name")
        process_tokens = tokens(process["name"] + " " + " ".join(process.get("keywords", [])))
        candidates = []
        for app in selected_apps:
            app_text = " ".join((app["App Name"], app.get("App Launcher Title - Subtitle (Information)", ""), app["App Description"]))
            overlap = process_tokens & tokens(app_text)
            if overlap:
                candidates.append((len(overlap), app, sorted(overlap)))
        candidates.sort(key=lambda candidate: (-candidate[0], candidate[1]["App ID"]))
        output_apps = [
            {
                "app_id": app["App ID"],
                "app_name": app["App Name"],
                "application_component": app["Application Component"],
                "match_basis": "Shared terms: " + ", ".join(overlap),
                "confidence": "medium" if score > 1 else "low",
            }
            for score, app, overlap in candidates[:10]
        ]
        mappings.append({
            "process_id": process["process_id"],
            "process_name": process["name"],
            "status": "REVIEW_REQUIRED" if output_apps else "UNMAPPED",
            "apps": output_apps,
            "review_notes": "Confirm functional applicability, release and authorization scope.",
        })
    payload = {
        "source_export": {"file": str(args.app_list), "sha256": hashlib.sha256(args.app_list.read_bytes()).hexdigest(), "sheet": sheet, "app_count": len(selected_apps)},
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "mappings": mappings,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(mappings)} process mappings from {len(selected_apps)} selected apps to {args.output}")


if __name__ == "__main__":
    main()