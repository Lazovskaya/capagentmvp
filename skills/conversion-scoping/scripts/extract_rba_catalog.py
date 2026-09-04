#!/usr/bin/env python3
"""
Mechanical extractor for SAP's Reference Business Architecture (RBA) /
Reference Solution Architecture (RSA) release Excel. This file (e.g.
"01. RBA & RSA <release> Release Excel") is SAP's own catalog of business
processes, denormalized so every row repeats the full E2E -> Business
Process Module -> Business Process Segment -> Business Activity ->
Business Capability chain. That denormalization makes the raw file
enormous (20MB+, tens of thousands of rows) and unusable directly in a
model's context. This script collapses it to one row per unique
Business Activity (the lowest reliably-populated level) with its full
hierarchy path, plus a separate deduplicated Business Capability list —
small enough to actually read and reason over.

It does not decide which processes are in/out of scope or Changed/
Unchanged — that's the model's job, guided by
references/scoping_methodology.md. This script only does the mechanical
de-duplication.

Usage:
    python3 extract_rba_catalog.py <rba_rsa.xlsx> <output.json> [--industry "Oil, Gas, and Energy"]

--industry: if given, filters rows to those whose Industry column contains
this string (case-insensitive substring match) — the RBA catalog is
cross-industry by default and most engagements only care about their own
industry's rows. Omit to keep everything (large output).
"""
import sys
import json
import argparse
import openpyxl


def extract(xlsx_path, out_path, industry_filter=None):
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb["Business Process Model"]

    rows = ws.iter_rows(values_only=True)
    header = next(rows)

    seen_activities = {}
    seen_capabilities = {}

    for row in rows:
        if row is None or row[0] is None:
            continue
        (
            e2e_id, _, e2e_name, e2e_seq, industry, _, _, e2e_domain, e2e_desc,
            mbp_id, _, mbp_name, _, _, mbp_domain, mbp_seq, mbp_desc,
            bps_id, _, bps_name, _, _, bps_domain, bps_seq, bps_desc,
            ba_id, _, ba_name, ba_domain, ba_seq, ba_desc,
            apqc_ref, fp_id, call_activity, fp_type,
            bc_id, bc_name, bc_type, bc_desc, *_rest
        ) = row

        if industry_filter and (not industry or industry_filter.lower() not in industry.lower()):
            continue

        if ba_id and ba_id not in seen_activities:
            seen_activities[ba_id] = {
                "business_activity_id": ba_id,
                "business_activity": ba_name,
                "enterprise_domain": ba_domain,
                "apqc_reference": apqc_ref,
                "e2e_process": e2e_name,
                "e2e_id": e2e_id,
                "process_module": mbp_name,
                "process_module_id": mbp_id,
                "process_segment": bps_name,
                "process_segment_id": bps_id,
                "business_capabilities": [],
            }
        if ba_id and bc_id:
            existing = {c["id"] for c in seen_activities[ba_id]["business_capabilities"]}
            if bc_id not in existing:
                seen_activities[ba_id]["business_capabilities"].append(
                    {"id": bc_id, "name": bc_name}
                )

        if bc_id and bc_id not in seen_capabilities:
            seen_capabilities[bc_id] = {"id": bc_id, "name": bc_name, "description": bc_desc}

    output = {
        "source": xlsx_path,
        "industry_filter": industry_filter,
        "business_activities": list(seen_activities.values()),
        "business_capabilities": list(seen_capabilities.values()),
    }

    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(seen_activities)} unique business activities and "
          f"{len(seen_capabilities)} unique business capabilities to {out_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx_path")
    parser.add_argument("out_path")
    parser.add_argument("--industry", default=None)
    args = parser.parse_args()
    extract(args.xlsx_path, args.out_path, args.industry)


if __name__ == "__main__":
    main()
