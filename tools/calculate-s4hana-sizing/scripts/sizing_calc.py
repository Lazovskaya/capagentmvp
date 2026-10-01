#!/usr/bin/env python3
"""
Mechanical sizing calculator: turns a raw sizing baseline (from a HANA
Sizing Report, Quick Sizer output, or the readiness-analysis skill's
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
  "new_functionality_gib": 0
}

Only "instances" is required; every other field defaults to 0 and should
be filled in deliberately, not left at the default without saying so in
the accompanying recommendation text (a 0% growth assumption is a real
claim, not a safe default).

Output JSON: the same instance list, each with baseline, applied
adjustments, and a final recommended memory/disk figure, plus a combined
total across all instances.
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

    results = []
    total_memory = 0
    total_disk = 0

    for inst in data["instances"]:
        baseline_memory = inst["baseline_memory_gib"]
        baseline_disk = inst.get("baseline_disk_gib", 0)

        growth_factor = (1 + growth_pct) ** years
        grown_memory = baseline_memory * growth_factor
        grown_disk = baseline_disk * growth_factor

        recommended_memory = grown_memory - archiving_reduction + new_functionality
        recommended_disk = grown_disk - archiving_reduction

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
        },
    }

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Calculated sizing for {len(results)} instance(s). Combined memory: {output['combined_total_memory_gib']} GiB. Saved to {output_path}")
    if growth_pct == 0 and years == 0:
        print("WARNING: growth_pct_per_year and years_of_growth_to_provision are both 0 — "
              "this recommendation is an unadjusted baseline, not a provisioned target. "
              "Say so explicitly if presenting this as final.")


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    calc(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
