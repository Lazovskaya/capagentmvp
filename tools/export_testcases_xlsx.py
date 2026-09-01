#!/usr/bin/env python3
"""Export test scripts from a test-case-design run folder to SAP S4H_458 Excel format.

Produces an .xlsx with the same structure as SAP's standard test script template:
  - Dashboard sheet — test plan overview with Pass/Fail/N.A. counters per scenario
  - One scenario sheet per process slug — Step | Test procedure | Expected result |
    Owner | Due Date | Status | Comment | Reference User Manual

Input:  TS-*.md files in <run-folder>/scripts/ (or --scripts-subdir)
Output: <run-folder>/<slug>-test-scripts.xlsx (or --output)

The process slug is extracted from the test case ID prefix (TS-<slug>-NN).
Multiple slugs produce multiple scenario sheets in one workbook.

Usage:
    python3 tools/export_testcases_xlsx.py \\
        --run-folder workspace/test-case-design/2026-09-01-credit-mgmt \\
        [--scripts-subdir scripts] \\
        [--output /path/to/output.xlsx] \\
        [--process-name "Credit Management"]

Requires: openpyxl  (pip install openpyxl)
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    print("ERROR: openpyxl not installed — run: pip install openpyxl", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Colours matching SAP S4H_458 style
# ---------------------------------------------------------------------------
BLUE_HEADER   = "1F497D"   # SAP dark blue header
LIGHT_BLUE    = "DCE6F1"   # alternating row fill
YELLOW_WARN   = "FFFF00"
STATUS_COLORS = {
    "Pass":     "92D050",
    "Passed":   "92D050",
    "Fail":     "FF0000",
    "Failed":   "FF0000",
    "n/a":      "D9D9D9",
    "Not run":  "D9D9D9",
    "Blocked":  "FF6600",
    "On hold":  "FFC000",
    "Retest":   "FFC000",
}

def _fill(hex_color: str) -> PatternFill:
    return PatternFill("solid", fgColor=hex_color)

def _thin_border() -> Border:
    side = Side(style="thin")
    return Border(left=side, right=side, top=side, bottom=side)

def _header_font(bold=True, color="FFFFFF") -> Font:
    return Font(name="Calibri", bold=bold, color=color, size=11)

def _normal_font(bold=False) -> Font:
    return Font(name="Calibri", bold=bold, size=10)


# ---------------------------------------------------------------------------
# Markdown parsing (reused from sync_calm_testcases.py)
# ---------------------------------------------------------------------------

def _table_rows(text: str, start_marker: str) -> list[list[str]]:
    idx = text.find(start_marker)
    if idx == -1:
        return []
    block = text[idx:]
    rows: list[list[str]] = []
    in_table = False
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            if in_table:
                break
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if all(re.fullmatch(r"[-: ]+", c) for c in cells):
            in_table = True
            continue
        if in_table or not rows:
            in_table = True
            rows.append(cells)
    return rows


def _header_field(text: str, field: str) -> str:
    m = re.search(
        r"\|\s*" + re.escape(field) + r"\s*\|\s*(`[^`]+`|[^|\n]+)\s*\|",
        text, re.IGNORECASE,
    )
    return m.group(1).strip().strip("`") if m else ""


def parse_test_script(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")

    tc_id         = (_header_field(text, "Test case ID") or path.stem).strip("`")
    scenario_name = _header_field(text, "Scenario name") or tc_id
    traceability  = _header_field(text, "Traceability")
    technique     = _header_field(text, "Technique(s) used")
    depth         = _header_field(text, "Depth")
    executor_role = _header_field(text, "Executor role")
    prereq        = _header_field(text, "Prerequisite data")

    script_rows = _table_rows(text, "## Script")
    steps: list[dict] = []
    # skip header row ("Step | Action | Expected result | …")
    data_rows = [r for r in script_rows if r and r[0].strip().lstrip("`").isdigit()]
    for i, row in enumerate(data_rows):
        action   = row[1] if len(row) > 1 else ""
        expected = row[2] if len(row) > 2 else ""
        if not action:
            continue
        steps.append({
            "step_no":  row[0].strip(),
            "action":   action,
            "expected": expected,
            "status":   "Not run",
        })

    # Extract slug from TC ID: TS-credit-mgmt-01 → credit-mgmt
    slug_m = re.match(r"TS-(.+)-\d+$", tc_id, re.IGNORECASE)
    slug   = slug_m.group(1) if slug_m else "test-cases"

    return {
        "tc_id":        tc_id,
        "scenario":     scenario_name,
        "slug":         slug,
        "traceability": traceability,
        "technique":    technique,
        "depth":        depth,
        "executor":     executor_role,
        "prereq":       prereq,
        "steps":        steps,
        "source":       str(path),
    }


# ---------------------------------------------------------------------------
# Excel sheet builders
# ---------------------------------------------------------------------------

def _write_scenario_sheet(wb: openpyxl.Workbook, sheet_name: str,
                           process_label: str, test_cases: list[dict]) -> dict:
    """Write one scenario sheet. Returns step-level counts."""
    ws = wb.create_sheet(title=sheet_name[:31])

    # Row 1: process/scenario title
    ws.append([process_label])
    ws["A1"].font  = _header_font(bold=True, color="000000")
    ws["A1"].fill  = _fill("DCE6F1")
    ws.row_dimensions[1].height = 18

    # Row 2: column headers
    headers = ["Step", "Test Case ID", "Scenario / Test procedure",
               "Expected result", "Owner", "Due Date",
               "Status", "Comment", "Reference / Traceability"]
    ws.append(headers)
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx, value=h)
        cell.font    = _header_font()
        cell.fill    = _fill(BLUE_HEADER)
        cell.border  = _thin_border()
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[2].height = 20

    # Column widths
    widths = [7, 22, 55, 45, 14, 12, 12, 20, 40]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    counts = {"total": 0, "pass": 0, "fail": 0, "on_hold": 0, "na": 0}
    row_num = 2
    fill_alt = False

    for tc in test_cases:
        # One header row per test case (grey)
        row_num += 1
        tc_header = [
            "", tc["tc_id"], tc["scenario"],
            f"Prerequisite: {tc['prereq']}" if tc["prereq"] else "",
            tc["executor"], "",
            "",
            f"Technique: {tc['technique']}" if tc["technique"] else "",
            tc["traceability"],
        ]
        for col_idx, val in enumerate(tc_header, 1):
            cell = ws.cell(row=row_num, column=col_idx, value=val)
            cell.font   = _normal_font(bold=True)
            cell.fill   = _fill("E2EFDA")
            cell.border = _thin_border()
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[row_num].height = 32

        # Step rows
        for step in tc["steps"]:
            row_num += 1
            counts["total"] += 1
            status = step["status"]
            status_lower = status.lower()
            if "pass" in status_lower:
                counts["pass"] += 1
            elif "fail" in status_lower:
                counts["fail"] += 1
            elif "hold" in status_lower or "retest" in status_lower:
                counts["on_hold"] += 1
            else:
                counts["na"] += 1

            row_fill = _fill(LIGHT_BLUE) if fill_alt else _fill("FFFFFF")
            row_data = [
                step["step_no"], "", step["action"],
                step["expected"], "", "", status, "", "",
            ]
            for col_idx, val in enumerate(row_data, 1):
                cell = ws.cell(row=row_num, column=col_idx, value=val)
                if col_idx == 7:  # Status column
                    color = STATUS_COLORS.get(status, "FFFFFF")
                    cell.fill = _fill(color)
                    cell.font = _normal_font(bold=(status not in ("Not run", "n/a")))
                else:
                    cell.fill = row_fill
                    cell.font = _normal_font()
                cell.border    = _thin_border()
                cell.alignment = Alignment(wrap_text=True, vertical="top")
            ws.row_dimensions[row_num].height = 42
            fill_alt = not fill_alt

    ws.freeze_panes = "A3"
    return counts


def _write_dashboard(wb: openpyxl.Workbook, summaries: list[dict]) -> None:
    ws = wb.create_sheet(title="Dashboard", index=0)

    ws.append(["TEST PLAN DASHBOARD"])
    ws["A1"].font  = _header_font(bold=True, color="000000")
    ws["A1"].fill  = _fill("DCE6F1")
    ws.row_dimensions[1].height = 20

    headers = ["Scope", "Business Scenario", "Sheet", "Status",
               "Steps", "Pass", "Fail", "On hold", "N.A.", "Owner", "Comment"]
    ws.append(headers)
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx, value=h)
        cell.font    = _header_font()
        cell.fill    = _fill(BLUE_HEADER)
        cell.border  = _thin_border()
        cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20

    widths = [18, 40, 14, 14, 8, 8, 8, 10, 8, 16, 30]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    for row_idx, s in enumerate(summaries, 3):
        total    = s["counts"]["total"]
        n_pass   = s["counts"]["pass"]
        n_fail   = s["counts"]["fail"]
        n_hold   = s["counts"]["on_hold"]
        n_na     = s["counts"]["na"]
        if n_fail > 0:
            status, status_color = "in process", "FFC000"
        elif n_pass == total and total > 0:
            status, status_color = "completed",  "92D050"
        else:
            status, status_color = "not started", "D9D9D9"

        row = [s["scope"], s["scenario"], s["sheet"], status,
               total, n_pass, n_fail, n_hold, n_na, "", ""]
        for col_idx, val in enumerate(row, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.border    = _thin_border()
            cell.alignment = Alignment(horizontal="center" if col_idx >= 4 else "left",
                                        vertical="center")
            cell.font = _normal_font()
            if col_idx == 4:
                cell.fill = _fill(status_color)
        ws.row_dimensions[row_idx].height = 18

    ws.freeze_panes = "A3"


def _write_value_list(wb: openpyxl.Workbook) -> None:
    ws = wb.create_sheet(title="Value List")
    ws.append(["Dashboard Status", "Testcase Status"])
    ws.append(["not started", "n/a"])
    ws.append(["in process",  "Pass"])
    ws.append(["completed",   "Fail"])
    ws.append(["",            "On hold"])
    ws.append(["",            "Not run"])
    ws.append(["",            "Retest"])
    ws.column_dimensions["A"].width = 18
    ws.column_dimensions["B"].width = 18


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--run-folder",     required=True)
    p.add_argument("--scripts-subdir", default="scripts")
    p.add_argument("--output",         default=None,
                   help="Output .xlsx path (default: <run-folder>/<slug>-test-scripts.xlsx)")
    p.add_argument("--process-name",   default=None,
                   help="Human-readable process/scenario name for the sheet header "
                        "(default: derived from slug)")
    p.add_argument("--scope",          default="",
                   help="Scope label for Dashboard (e.g. 'Finance', 'SD')")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    run_folder  = Path(args.run_folder)
    scripts_dir = run_folder / args.scripts_subdir

    if not scripts_dir.is_dir():
        print(f"ERROR: scripts directory not found: {scripts_dir}", file=sys.stderr)
        return 1

    script_files = sorted(scripts_dir.glob("TS-*.md"))
    if not script_files:
        print(f"ERROR: no TS-*.md files found in {scripts_dir}", file=sys.stderr)
        return 1

    # Parse
    parsed: list[dict] = []
    for f in script_files:
        try:
            parsed.append(parse_test_script(f))
        except Exception as exc:
            print(f"Parse error {f.name}: {exc}", file=sys.stderr)
            return 1

    # Group by slug
    by_slug: dict[str, list[dict]] = defaultdict(list)
    for tc in parsed:
        by_slug[tc["slug"]].append(tc)

    # Output path
    first_slug = next(iter(by_slug))
    out_path = Path(args.output) if args.output else run_folder / f"{first_slug}-test-scripts.xlsx"

    # Build workbook
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # remove default sheet

    summaries: list[dict] = []
    for slug, test_cases in by_slug.items():
        sheet_name    = slug.upper()[:10]
        process_label = args.process_name or slug.replace("-", " ").title()
        counts = _write_scenario_sheet(wb, sheet_name, process_label, test_cases)
        summaries.append({
            "scope":    args.scope or slug.split("-")[0].upper(),
            "scenario": process_label,
            "sheet":    sheet_name,
            "counts":   counts,
        })
        print(f"  Sheet '{sheet_name}': {len(test_cases)} test cases, {counts['total']} steps")

    _write_dashboard(wb, summaries)
    _write_value_list(wb)

    wb.save(out_path)
    print(f"\nSaved: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
