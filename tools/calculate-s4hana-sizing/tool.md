# Tool: Calculate S/4HANA Sizing

Mechanical sizing calculator: turns a raw sizing baseline into a padded target
recommendation by applying a growth buffer, subtracting an archiving offset, and
adding new-functionality headroom, split across one or more target instances. Does
not decide methodology or interpret findings -- that's `sizing-analysis`'s job.

stdlib-only Python.

## Input contract

```yaml
instances:
 type: array
 required: true
 items:
 name: {type: string, required: true}
 baseline_memory_gib: {type: number, required: true}
 baseline_disk_gib: {type: number, required: false, default: 0}
growth_pct_per_year:
 type: number
 required: false
 default: 0
years_of_growth_to_provision:
 type: number
 required: false
 default: 0
archiving_reduction_gib:
 type: number
 required: false
 default: 0
new_functionality_gib:
 type: number
 required: false
 default: 0
```

CLI: `python3 scripts/sizing_calc.py <input.json> <output.json>`

## Operation

For each instance: `growth_factor = (1 + growth_pct/100) ** years`;
`recommended_memory = baseline_memory * growth_factor - archiving_reduction + new_functionality`;
`recommended_disk = baseline_disk * growth_factor - archiving_reduction`. Sums a combined total
across all instances. Prints a warning when both growth inputs are 0 -- an unadjusted baseline
being presented as a provisioned target is a real claim, not a safe default.

## Output contract

```yaml
per_instance:
 type: array
 items: {name, baseline_memory_gib, baseline_disk_gib, growth_factor_applied, archiving_reduction_gib, new_functionality_gib, recommended_memory_gib, recommended_disk_gib}
combined_total_memory_gib: {type: number}
combined_total_disk_gib: {type: number}
assumptions: {type: object, description: echoes growth_pct_per_year/years_of_growth_to_provision/archiving_reduction_gib/new_functionality_gib as applied.}
```

## Errors and confirmations

- Raises `KeyError` on a missing `name` or `baseline_memory_gib` in any instance entry
 (required fields).
- Read-only against its input; writes only the output JSON. No confirmation required.

**Verified end to end** in this environment: single instance, 5288 GiB baseline, 10%/year
growth over 3 years, -200 GiB archiving, +50 GiB new functionality -> 6888.3 GiB recommended,
matching the hand-calculated expected value.
