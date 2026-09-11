#!/usr/bin/env python3
"""Create a traceable catalog-derived business-process impact list.

The SAP Transition Database catalog describes potential simplification impacts.
It is not a client-specific SI-Check result, so the importer defaults every item
to ``conditional`` unless a reviewer later supplements it with client evidence.
"""

import argparse
import csv
import datetime as dt
import json
import sys
import xml.etree.ElementTree as xml
from collections import defaultdict
from pathlib import Path


def local_name(tag):
    """Return an XML tag without its optional namespace."""
    return tag.rsplit("}", 1)[-1]


def field(record, name):
    """Return the direct child text for a catalog record field."""
    for child in record:
        if local_name(child.tag) == name:
            return (child.text or "").strip()
    return ""


def parse_records(path, record_name):
    """Stream records to avoid loading a larger catalog into memory."""
    for _, element in xml.iterparse(path, events=("end",)):
        if local_name(element.tag) == record_name:
            yield element
            element.clear()


def read_header(path):
    values = {}
    for record in parse_records(path, "_-IWBEP_-S_MGW_NAME_VALUE_PAIR"):
        name = field(record, "NAME")
        if name:
            values[name] = field(record, "VALUE")
    return values


def catalog_timestamp(value):
    """Convert SAP's YYYYMMDDHHMMSS.fraction timestamp to ISO 8601 UTC."""
    if not value:
        return "unknown"
    try:
        parsed = dt.datetime.strptime(value.strip()[:14], "%Y%m%d%H%M%S")
    except ValueError:
        return value.strip()
    return parsed.replace(tzinfo=dt.timezone.utc).isoformat()


def load_taxonomy(path):
    if not path:
        return {"by_item_id": {}, "by_application_area": {}}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        "by_item_id": data.get("by_item_id", {}),
        "by_application_area": data.get("by_application_area", {}),
    }


def process_mappings(item, taxonomy):
    mappings = taxonomy["by_item_id"].get(item["item_id"])
    if mappings is None:
        mappings = taxonomy["by_application_area"].get(item["application_area"], [])
    return mappings


def catalog_items(catalog_dir, taxonomy):
    transition_path = catalog_dir / "sdb_transition_db_item.xml"
    check_path = catalog_dir / "sdb_check_new.xml"
    target_release_path = catalog_dir / "sdb_target_release.xml"

    items = {}
    for record in parse_records(transition_path, "GSS_RC_SIC_DOWNLOAD_SITEM"):
        item_guid = field(record, "GUID")
        if not item_guid:
            continue
        items[item_guid] = {
            "item_guid": item_guid,
            "item_id": field(record, "SITEM_ID"),
            "title": field(record, "TITLE_EN"),
            "application_area": field(record, "APP_AREA"),
            "impact_note": field(record, "IMPACT_NOTE"),
            "checks": [],
                "target_release_categories": [],
        }

    for record in parse_records(check_path, "item"):
        item_guid = field(record, "SITEM_GUID")
        if item_guid in items:
            note = field(record, "SAP_NOTE")
            items[item_guid]["checks"].append(
                {
                    "check_identifier": field(record, "CHECK_IDENTIFIER"),
                    "check_type": field(record, "CHECK_TYPE"),
                    "sap_note": "" if note == "0000000000" else note,
                }
            )

    for record in parse_records(target_release_path, "V_SIC_TART_REL"):
        item_guid = field(record, "GUID")
        if item_guid in items:
            items[item_guid]["target_release_categories"].append(
                {
                    "category": field(record, "CATEGORY"),
                    "category_text": field(record, "CATEGORY_TEXT_EN"),
                    "valid_from_product_version": field(record, "TARGET_REL_VALID_FROM_PRD_VER"),
                    "valid_to_product_version": field(record, "TARGET_REL_VALID_TO_PRD_VER"),
                }
            )

    for item in items.values():
        mappings = process_mappings(item, taxonomy)
        evidence = [f"sdb_transition_db_item.xml#{item['item_guid']}"]
        if item["checks"]:
            evidence.append(f"sdb_check_new.xml#{item['item_guid']}")
        if item["target_release_categories"]:
            evidence.append(f"sdb_target_release.xml#{item['item_guid']}")
        item.update(
            {
                "impact_classification": "conditional",
                "process_mappings": mappings,
                "evidence_refs": evidence,
                "review_status": "DRAFT",
                "assumptions": [
                    "Catalog metadata alone does not prove client-specific applicability.",
                    "Confirm with SI-Check, configuration and productive-usage evidence before classifying mandatory.",
                ],
            }
        )
        del item["checks"]
    return sorted(items.values(), key=lambda item: (item["application_area"], item["item_id"]))


def write_csv(path, items):
    with path.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "item_guid", "item_id", "title", "application_area", "impact_note",
                "impact_classification", "business_process", "candidate_transaction_codes",
                "mapping_basis", "confidence", "evidence_refs", "review_status",
            ],
        )
        writer.writeheader()
        for item in items:
            mappings = item["process_mappings"] or [{}]
            for mapping in mappings:
                writer.writerow(
                    {
                        **{key: item.get(key, "") for key in writer.fieldnames},
                        "business_process": mapping.get("business_process", ""),
                        "candidate_transaction_codes": ";".join(mapping.get("candidate_transaction_codes", [])),
                        "mapping_basis": mapping.get("mapping_basis", ""),
                        "confidence": mapping.get("confidence", ""),
                        "evidence_refs": ";".join(item["evidence_refs"]),
                    }
                )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-dir", type=Path, required=True)
    parser.add_argument("--target-release", required=True)
    parser.add_argument("--source-release")
    parser.add_argument("--taxonomy", type=Path, help="Optional JSON mappings by item ID or application area.")
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-csv", type=Path, required=True)
    args = parser.parse_args()

    required_files = ["header.xml", "sdb_transition_db_item.xml", "sdb_check_new.xml", "sdb_target_release.xml"]
    missing = [name for name in required_files if not (args.catalog_dir / name).is_file()]
    if missing:
        parser.error(f"catalog is missing required files: {', '.join(missing)}")

    header = read_header(args.catalog_dir / "header.xml")
    downloaded_at = catalog_timestamp(header.get("TransitionDBDownloadedTimeUTC", ""))
    if downloaded_at == "unknown":
        parser.error("header.xml does not contain TransitionDBDownloadedTimeUTC")

    items = catalog_items(args.catalog_dir, load_taxonomy(args.taxonomy))
    payload = {
        "catalog_source": {
            "name": "SAP Transition Database Simplification Item Catalog",
            "downloaded_at": downloaded_at,
            "files": required_files,
        },
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "target_release": args.target_release,
        "source_release": args.source_release or "unknown",
        "items": items,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    write_csv(args.output_csv, items)
    print(f"Wrote {len(items)} catalog items to {args.output_json} and {args.output_csv}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, xml.ParseError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error