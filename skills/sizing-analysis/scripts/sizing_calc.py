#!/usr/bin/env python3
"""
Mechanical sizing calculator: turns a raw sizing baseline (from a HANA
Sizing Report, Quick Sizer output, or the sap-readiness-check skill's
Chapter 6 extract) into a padded target recommendation. Does not decide
methodology or interpret findings — that's the model's job, guided by
references/sizing_methodology_guide.md. This script only does the
arithmetic: applying a growth buffer, subtracting an archiving offset, and
splitting a combined estimate across multiple target instances.

Usage:
    python3 sizing_calc.py <input.json> <output.json>

Input JSON:
{
  "instances": [
    {"name": "PRD-EU", "baseline_memory_gib": 5288, "baseline_disk_gib": 3331}
  ],
  "growth_pct_per_year": 10,
  "years_of_growth_to_provision": 3,
  "archiving_reduction_gib": 0,
  "new_functionality_gib": 0,
  "zero_growth_acknowledged": false
}

Only "instances" is required; every other field defaults to 0 and should
be filled in deliberately, not left at the default without saying so in
the accompanying recommendation text (a 0% growth assumption is a real
claim, not a safe default). If "growth_pct_per_year" is 0 for ANY horizon
(not just a 0-year horizon), pass "zero_growth_acknowledged": true once the
recommendation text has explicitly called this out to the reader — this
script warns whenever growth is 0% and that field isn't set, regardless of
what "years_of_growth_to_provision" is.

Output JSON: the same instance list, each with baseline, applied
adjustments, and a final recommended memory/disk figure (floored at 0 —
never negative, even if an archiving offset exceeds the grown baseline),
plus a combined total across all instances.
"""
import sys
import json


def calc(input_path, output_path):
    with open(input_path) as f:
        data = json.load(f)

    growth_pct = data.get("growth_pct_per_year", 0) / 100.0
    years = data.get("years_of_growth_to_provision", 0)
    archiving_reduction = data.get("archiving_reduction_gib", 0)
    new_functionality = data.get("new_functionality_gib", 0)
    zero_growth_acknowledged = data.get("zero_growth_acknowledged", False)

    results = []
    total_memory = 0
    total_disk = 0
    clamped = False

    for inst in data["instances"]:
        baseline_memory = inst["baseline_memory_gib"]
        baseline_disk = inst.get("baseline_disk_gib", 0)

        growth_factor = (1 + growth_pct) ** years
        grown_memory = baseline_memory * growth_factor
        grown_disk = baseline_disk * growth_factor

        recommended_memory = max(0, grown_memory - archiving_reduction + new_functionality)
        recommended_disk = max(0, grown_disk - archiving_reduction)
        if grown_memory - archiving_reduction + new_functionality < 0 or grown_disk - archiving_reduction < 0:
            clamped = True

        result = {
            "name": inst["name"],
            "baseline_memory_gib": baseline_memory,
            "baseline_disk_gib": baseline_disk,
            "growth_factor_applied": round(growth_factor, 3),
            "archiving_reduction_gib": archiving_reduction,
            "new_functionality_gib": new_functionality,
            "recommended_memory_gib": round(recommended_memory, 1),
            "recommended_disk_gib": round(recommended_disk, 1),
        }
        results.append(result)
        total_memory += result["recommended_memory_gib"]
        total_disk += result["recommended_disk_gib"]

    output = {
        "per_instance": results,
        "combined_total_memory_gib": round(total_memory, 1),
        "combined_total_disk_gib": round(total_disk, 1),
        "assumptions": {
            "growth_pct_per_year": data.get("growth_pct_per_year", 0),
            "years_of_growth_to_provision": years,
            "archiving_reduction_gib": archiving_reduction,
            "new_functionality_gib": new_functionality,
            "zero_growth_acknowledged": zero_growth_acknowledged,
        },
    }

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Calculated sizing for {len(results)} instance(s). Combined memory: {output['combined_total_memory_gib']} GiB. Saved to {output_path}")
    if growth_pct == 0 and not zero_growth_acknowledged:
        print("WARNING: growth_pct_per_year is 0 (regardless of years_of_growth_to_provision) — "
              "this recommendation carries no growth buffer, which is a real claim, not a safe "
              "default. Say so explicitly in the recommendation text, then re-run with "
              "\"zero_growth_acknowledged\": true once it's been called out.")
    if clamped:
        print("WARNING: archiving_reduction_gib exceeded the grown baseline for at least one "
              "instance/metric — recommended memory or disk was floored at 0 rather than going "
              "negative. Check whether the archiving offset or baseline figures are realistic.")


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    calc(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
