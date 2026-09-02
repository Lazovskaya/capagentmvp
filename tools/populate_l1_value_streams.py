#!/usr/bin/env python3
"""Populate L1_value_stream in every scope-item JSON from a static L2->L1 lookup table.

L1 is a small, stable, publicly documented set of ~10 SAP value streams.
The linkedBy API hop (Method 2) only reaches L2 process groups, not L1 -- see
knowledge/domain-packs/sap-best-practices/README.md "Known gap" section.
This script fills L1 using a hand-curated mapping based on SAP's standard
end-to-end value stream taxonomy (publicly documented in SAP Best Practices
Explorer and SAP Signavio Process Navigator).

Usage:
    python3 tools/populate_l1_value_streams.py [--dry-run] [--scope-items-dir DIR]
"""

import argparse
import json
import sys
from pathlib import Path

DEFAULT_SCOPE_ITEMS_DIR = (
    Path(__file__).resolve().parent.parent
    / "knowledge"
    / "domain-packs"
    / "sap-best-practices"
    / "scope-items"
)

# Hand-curated L2 -> L1 mapping.
# Source: SAP's publicly documented end-to-end value stream taxonomy
# (SAP Best Practices Explorer, SAP Signavio Process Navigator L1 folder structure).
# Each L2 value is exactly as it appears in the linkedBy-enriched scope-item JSONs.
# L1 values follow SAP's own naming convention for the ~10 standard value streams.
L2_TO_L1 = {
    # Lead to Cash — all revenue-side process groups
    "Order and Contract Management":             "Lead to Cash",
    "Sales and Marketing":                       "Lead to Cash",
    "Sales Force Support":                       "Lead to Cash",
    "Order Promising":                           "Lead to Cash",
    "Advanced Order Promising":                  "Lead to Cash",
    "Sales Performance Management":              "Lead to Cash",
    "Subscription Billing and Revenue Management": "Lead to Cash",
    "Revenue Accounting and Reporting":          "Lead to Cash",

    # Source to Pay — procurement and supplier-side process groups
    "Sourcing and Procurement":                  "Source to Pay",
    "Sourcing and Contract Management":          "Source to Pay",
    "Operational Procurement":                   "Source to Pay",
    "Central Procurement":                       "Source to Pay",
    "Supplier Management":                       "Source to Pay",
    "Procurement Analytics":                     "Source to Pay",
    "Invoice Management":                        "Source to Pay",

    # Plan to Fulfill — supply chain, manufacturing, inventory, warehousing, delivery
    "Manufacturing":                             "Plan to Fulfill",
    "Manufacturing Operations":                  "Plan to Fulfill",
    "Production Planning":                       "Plan to Fulfill",
    "Supply Chain Planning":                     "Plan to Fulfill",
    "Inventory":                                 "Plan to Fulfill",
    "Warehousing":                               "Plan to Fulfill",
    "Advanced Warehousing":                      "Plan to Fulfill",
    "Delivery and Transportation":               "Plan to Fulfill",
    "Advanced Transportation":                   "Plan to Fulfill",
    "Quality Management":                        "Plan to Fulfill",
    "Product Compliance":                        "Plan to Fulfill",
    "Extended Warehouse Management":             "Plan to Fulfill",
    "Logistics":                                 "Plan to Fulfill",

    # Design to Operate — asset lifecycle, plant maintenance, environment health & safety
    "Maintenance Management":                    "Design to Operate",
    "Asset Management":                          "Design to Operate",
    "Environment, Health, and Safety":           "Design to Operate",
    "Project Management":                        "Design to Operate",
    "R&D / Engineering":                         "Design to Operate",
    "Engineering":                               "Design to Operate",

    # Service — field service, customer service, service operations
    "Service":                                   "Service",
    "Service Operations and Processes":          "Service",
    "Advanced Service Management":               "Service",
    "Customer Service":                          "Service",

    # Finance and Accounting — all finance, controlling, treasury process groups
    "Accounting and Financial Close":            "Finance and Accounting",
    "Advanced Accounting and Financial Close":   "Finance and Accounting",
    "Financial Operations":                      "Finance and Accounting",
    "Advanced Financial Operations":             "Finance and Accounting",
    "Budget and Finance":                        "Finance and Accounting",
    "Finance":                                   "Finance and Accounting",
    "Treasury Management":                       "Finance and Accounting",
    "Cost Management and Profitability Analysis": "Finance and Accounting",
    "Real Estate Management":                    "Finance and Accounting",
    "Group Reporting":                           "Finance and Accounting",

    # Recruit to Retire — human resources, payroll, time management
    "Core HR and Time Recording":                "Recruit to Retire",
    "Talent Management":                         "Recruit to Retire",
    "Payroll":                                   "Recruit to Retire",
    "HR Analytics":                              "Recruit to Retire",

    # Industry-specific value streams
    "Retail":                                    "Retail",
    "Oil and Gas":                               "Oil and Gas",
    "Professional Services":                     "Professional Services",
    "Public Sector":                             "Public Sector",
    "Utilities":                                 "Utilities",
    "Life Sciences":                             "Life Sciences",
    "Financial Services":                        "Financial Services",
    "Automotive":                                "Automotive",

    # Cross-cutting / Analytics / IT
    "Analytics":                                 "Analytics and Intelligence",
    "Reporting and Analytics":                   "Analytics and Intelligence",
    "IT Service Management":                     "IT and Cross-Application",
    "Cross-Application":                         "IT and Cross-Application",
    "Administration and Usability":              "IT and Cross-Application",
    "Enterprise Information Management":         "IT and Cross-Application",
    "Process Management and Integration":        "IT and Cross-Application",
    "Solution Business Management":              "IT and Cross-Application",

    # Design to Operate additions
    "Enterprise Portfolio and Project Management": "Design to Operate",
    "Product Lifecycle Management":              "Design to Operate",
    "Product Engineering":                       "Design to Operate",
    "Production Engineering":                    "Design to Operate",

    # Finance and Accounting additions
    "Enterprise Risk and Compliance":            "Finance and Accounting",

    # Plan to Fulfill additions
    "Logistics Cross Topics":                    "Plan to Fulfill",
    "Safety Data Sheet and Label Management":    "Plan to Fulfill",
    "Manufacturing Insights":                    "Plan to Fulfill",
    "Manufacturing Options":                     "Plan to Fulfill",

    # Service additions
    "Service Master Data and Agreement Management": "Service",
    "Service Parts Management":                  "Service",

    # Discovered 2026-09-02 while fixing the string-vs-list L2 bug below --
    # these L2 values were previously unreachable (see resolve_l1's docstring note).
    "Supply Chain":                              "Plan to Fulfill",
    "Operations":                                "Plan to Fulfill",
    "Manufacturing Insights and Options":        "Plan to Fulfill",
    "Application Development and Integration":   "IT and Cross-Application",
    "Intelligent Technologies":                  "IT and Cross-Application",
    "Database and Data Management":              "IT and Cross-Application",
    "Marketing":                                 "Lead to Cash",
    "R&D and Product Management":                "Design to Operate",
    "Industry - Oil":                            "Oil and Gas",
    "Mine Operations":                           "Mining",

    # Outlier: this scope item's own L2 field holds a scope-item code + title (2F5's
    # own text) instead of a real L2 category name -- a one-off data-quality issue in
    # the source, not a category to generalize a fallback rule from.
    "2F5 - 00 - Treasury Trading via Trading Platforms": "Finance and Accounting",
}

# Entries that look like outlier scope-item codes used as L2 names (e.g. "2F5 - 00 - Treasury Trading...")
# are handled by the prefix-match fallback below rather than exact matches here.
L2_PREFIX_FALLBACKS = [
    # Treasury-related scope items used as L2 names
    ("Treasury",   "Finance and Accounting"),
    ("Finance",    "Finance and Accounting"),
    ("Accounting", "Finance and Accounting"),
    ("Sourcing",   "Source to Pay"),
    ("Procure",    "Source to Pay"),
    ("Supplier",   "Source to Pay"),
    ("Order",      "Lead to Cash"),
    ("Sales",      "Lead to Cash"),
    ("Manufactur", "Plan to Fulfill"),
    ("Warehous",   "Plan to Fulfill"),
    ("Inventory",  "Plan to Fulfill"),
    ("Delivery",   "Plan to Fulfill"),
    ("Transport",  "Plan to Fulfill"),
    ("Maintenan",  "Design to Operate"),
    ("Asset",      "Design to Operate"),
    ("Service",    "Service"),
    ("HR",         "Recruit to Retire"),
    ("Payroll",    "Recruit to Retire"),
]


def resolve_l1(l2_values):
    """Return a deduplicated sorted list of L1 value streams for a list of L2 values.

    L2_core_process is a list in most scope-item JSONs, but a plain string in ~140 of
    them (schema drift in the Signavio enrichment step) -- iterating a bare string
    yields individual characters, none of which ever match the lookup table, so every
    one of those items silently kept a null L1 forever. Normalize to a list first.
    """
    if isinstance(l2_values, str):
        l2_values = [l2_values]
    l1_set = set()
    for l2 in (l2_values or []):
        if l2 in L2_TO_L1:
            l1_set.add(L2_TO_L1[l2])
        else:
            # Prefix fallback for anomalous L2 values (scope-item codes used as names, etc.)
            matched = False
            for prefix, l1 in L2_PREFIX_FALLBACKS:
                if l2.startswith(prefix):
                    l1_set.add(l1)
                    matched = True
                    break
            if not matched:
                l1_set.add(None)  # unknown — leave null placeholder
    return sorted(v for v in l1_set if v is not None) or None


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--scope-items-dir", type=Path, default=DEFAULT_SCOPE_ITEMS_DIR)
    parser.add_argument("--dry-run", action="store_true", help="Print what would change without writing")
    args = parser.parse_args()

    files = sorted(args.scope_items_dir.glob("*.json"))
    if not files:
        print(f"No JSON files found in {args.scope_items_dir}", file=sys.stderr)
        sys.exit(1)

    updated = 0
    already_set = 0
    no_l2 = 0
    unmapped_l2s = set()

    for path in files:
        doc = json.loads(path.read_text(encoding="utf-8"))
        h = doc.get("hierarchy", {})
        l2 = h.get("L2_core_process")
        current_l1 = h.get("L1_value_stream")

        if not l2:
            no_l2 += 1
            continue

        new_l1 = resolve_l1(l2)

        # Track any L2 values that fell through to prefix fallback or remained unmatched
        for v in ([l2] if isinstance(l2, str) else l2):
            if v not in L2_TO_L1:
                unmapped_l2s.add(v)

        NEW_NOTE = (
            "L2 sourced from SAP Signavio linkedBy reverse-references (Method 2), confirmed live 2026-08-24. "
            "L1 value stream populated from hand-curated L2->L1 lookup table (populate_l1_value_streams.py)."
        )
        note_changed = doc.get("note", "") != NEW_NOTE
        if new_l1 == current_l1 and not note_changed:
            already_set += 1
            continue

        if args.dry_run:
            print(f"  {path.stem}: L2={l2!r} -> L1={new_l1!r}")
        else:
            doc["hierarchy"]["L1_value_stream"] = new_l1
            doc["note"] = NEW_NOTE
            path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
        updated += 1

    print(f"{'[dry-run] Would update' if args.dry_run else 'Updated'}: {updated}")
    print(f"Already set / unchanged: {already_set}")
    print(f"No L2 (skipped): {no_l2}")
    if unmapped_l2s:
        print(f"\nL2 values not in exact lookup (handled by prefix fallback or unknown):")
        for v in sorted(unmapped_l2s):
            resolved = next((l1 for prefix, l1 in L2_PREFIX_FALLBACKS if v.startswith(prefix)), "UNKNOWN")
            print(f"  {v!r} -> {resolved}")


if __name__ == "__main__":
    main()
