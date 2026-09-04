#!/usr/bin/env python3
"""
Mechanical maintainer for a running Architecture Decision Record (ADR) log
that persists across an entire engagement — not regenerated once at the
end, but appended to and updated by every pipeline stage (sap-readiness-check,
sap-sizing, sap-conversion-scoping, sap-sad) and by the architect attaching
new evidence (call transcripts, presentations) at any point.

This script does not decide what belongs in the log or how a finding
should be worded — that's the model's job, guided by
references/adr_log_methodology.md. It only does the mechanical part:
merging new/updated entries into the existing log by ID, tracking status
history, and writing the result back out as a real .xlsx (so the log is
always a shareable artifact on its own, not just prose buried in a chat
transcript).

Usage:
    python3 update_adr_log.py <existing_log.xlsx_or_'new'> <updates.json> <output.xlsx>

updates.json shape:
{
  "entries": [
    {
      "id": "ADR-004",                       // omit for a new entry — one is assigned
      "title": "Instance Strategy: Harmonized regional model",
      "status": "Decided",                    // Proposed | Decided | Deprecated | Superseded | Rejected
      "raised_by": "sap-sad",                 // which skill/person raised it
      "date": "2026-08-20",                   // date of this update
      "context": "...",
      "options_considered": ["Consolidated", "Harmonized", "Independent"],
      "decision": "...",
      "rationale": "...",
      "owner": "...",
      "sad_section": "2.1, 13",
      "evidence": ["Readiness Check Ch.6", "Call transcript 2026-08-20"],
      "supersedes": ["ADR-004"],              // IDs this entry replaces, if any
      "superseded_by": []                     // IDs that replace this entry, if any — set on the OLD entry when a new one supersedes it
    }
  ]
}

Merge rules:
- No "id" -> a new entry, assigned the next ADR-NNN number.
- Existing "id" -> merged into the current row: scalar fields (title,
  status, decision, rationale, owner, sad_section) are overwritten with
  the new value if provided; "options_considered", "evidence",
  "supersedes" and "superseded_by" are UNIONED (existing + new,
  de-duplicated), never overwritten, since a later update usually adds
  context rather than invalidating what was already true.
- Every status change is appended to a running History sheet
  (id, from_status, to_status, date, raised_by) so the log stays
  auditable — who decided what, and when it changed.
- Marking an entry Superseded is a two-sided edit: set the OLD entry's
  status to "Superseded" and its "superseded_by" to the new entry's id,
  and set the NEW entry's "supersedes" to the old entry's id. The script
  does not infer this automatically — both sides must be passed in the
  same (or a follow-up) update. "Deprecated" is different from
  "Superseded": use it when a decision stops being relevant on its own
  (dropped scope, moot precondition) with nothing replacing it; use
  "Superseded" only when a later decision explicitly takes its place.
"""
import sys
import json
import os
import re
from datetime import date
import openpyxl
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

STATUS_FILL = {
    "Proposed": PatternFill(start_color="F6EAD2", end_color="F6EAD2", fill_type="solid"),
    "Decided": PatternFill(start_color="DFEEE1", end_color="DFEEE1", fill_type="solid"),
    "Deprecated": PatternFill(start_color="EAE3F2", end_color="EAE3F2", fill_type="solid"),
    "Superseded": PatternFill(start_color="ECECEF", end_color="ECECEF", fill_type="solid"),
    "Rejected": PatternFill(start_color="F8DADA", end_color="F8DADA", fill_type="solid"),
}
HEADER_FILL = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
HEADER_FONT = Font(color="FFFFFF", bold=True)

LOG_COLUMNS = [
    "id", "title", "status", "raised_by", "date_raised", "date_last_updated",
    "context", "options_considered", "decision", "rationale", "owner",
    "sad_section", "evidence", "supersedes", "superseded_by",
]


def load_existing(path):
    """Returns (entries_by_id: dict, history_rows: list) from an existing workbook, or empty if 'new'."""
    if path == "new" or not os.path.exists(path):
        return {}, []
    wb = openpyxl.load_workbook(path, data_only=True)
    entries = {}
    if "ADR Log" in wb.sheetnames:
        ws = wb["ADR Log"]
        rows = list(ws.iter_rows(values_only=True))
        # Header cells are written as "Title Case" for readability; map back
        # to the snake_case keys used internally via positional order, since
        # column order is always LOG_COLUMNS regardless of display label.
        for row in rows[1:]:
            if not row or not row[0]:
                continue
            record = dict(zip(LOG_COLUMNS, row))
            record["options_considered"] = _split(record.get("options_considered"))
            record["evidence"] = _split(record.get("evidence"))
            record["supersedes"] = _split(record.get("supersedes"))
            record["superseded_by"] = _split(record.get("superseded_by"))
            entries[record["id"]] = record
    history = []
    if "History" in wb.sheetnames:
        ws = wb["History"]
        rows = list(ws.iter_rows(values_only=True))
        for row in rows[1:]:
            if row and row[0]:
                history.append(list(row))
    return entries, history


def _split(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    return [v.strip() for v in str(value).split(";") if v.strip()]


def _join(values):
    return "; ".join(values)


def next_id(entries):
    nums = []
    for eid in entries:
        m = re.match(r"ADR-(\d+)", eid or "")
        if m:
            nums.append(int(m.group(1)))
    return f"ADR-{(max(nums) + 1) if nums else 1:03d}"


def merge(entries, history, updates):
    today = date.today().isoformat()
    for upd in updates:
        eid = upd.get("id")
        if not eid:
            eid = next_id(entries)
        if eid in entries:
            existing = entries[eid]
            old_status = existing.get("status")
            for field in ["title", "status", "raised_by", "context", "decision", "rationale", "owner", "sad_section"]:
                if upd.get(field):
                    existing[field] = upd[field]
            existing["options_considered"] = sorted(set(
                _split(existing.get("options_considered")) + _split(upd.get("options_considered"))
            ))
            existing["evidence"] = sorted(set(
                _split(existing.get("evidence")) + _split(upd.get("evidence"))
            ))
            existing["supersedes"] = sorted(set(
                _split(existing.get("supersedes")) + _split(upd.get("supersedes"))
            ))
            existing["superseded_by"] = sorted(set(
                _split(existing.get("superseded_by")) + _split(upd.get("superseded_by"))
            ))
            existing["date_last_updated"] = upd.get("date", today)
            new_status = existing.get("status")
            if new_status != old_status:
                history.append([eid, old_status, new_status, upd.get("date", today), upd.get("raised_by", "")])
        else:
            entries[eid] = {
                "id": eid,
                "title": upd.get("title", ""),
                "status": upd.get("status", "Proposed"),
                "raised_by": upd.get("raised_by", ""),
                "date_raised": upd.get("date", today),
                "date_last_updated": upd.get("date", today),
                "context": upd.get("context", ""),
                "options_considered": _split(upd.get("options_considered")),
                "decision": upd.get("decision", ""),
                "rationale": upd.get("rationale", ""),
                "owner": upd.get("owner", ""),
                "sad_section": upd.get("sad_section", ""),
                "evidence": _split(upd.get("evidence")),
                "supersedes": _split(upd.get("supersedes")),
                "superseded_by": _split(upd.get("superseded_by")),
            }
            history.append([eid, "—", entries[eid]["status"], upd.get("date", today), upd.get("raised_by", "")])
    return entries, history


def write_workbook(entries, history, out_path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "ADR Log"

    for i, col in enumerate(LOG_COLUMNS, start=1):
        c = ws.cell(row=1, column=i, value=col.replace("_", " ").title())
        c.fill = HEADER_FILL
        c.font = HEADER_FONT

    for r, eid in enumerate(sorted(entries.keys(), key=lambda x: (len(x), x)), start=2):
        e = entries[eid]
        for c, col in enumerate(LOG_COLUMNS, start=1):
            val = e.get(col, "")
            if col in ("options_considered", "evidence", "supersedes", "superseded_by"):
                val = _join(val)
            cell = ws.cell(row=r, column=c, value=val)
            if col == "status" and val in STATUS_FILL:
                cell.fill = STATUS_FILL[val]

    widths = [9, 32, 12, 16, 12, 14, 40, 30, 34, 34, 16, 12, 34, 16, 16]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"

    hist_ws = wb.create_sheet("History")
    for i, col in enumerate(["ID", "From Status", "To Status", "Date", "Raised By"], start=1):
        c = hist_ws.cell(row=1, column=i, value=col)
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
    for r, row in enumerate(history, start=2):
        for c, val in enumerate(row, start=1):
            hist_ws.cell(row=r, column=c, value=val)
    for i, w in enumerate([9, 14, 14, 12, 16], start=1):
        hist_ws.column_dimensions[get_column_letter(i)].width = w

    wb.save(out_path)


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    existing_path, updates_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

    entries, history = load_existing(existing_path)
    with open(updates_path) as f:
        updates = json.load(f)["entries"]

    entries, history = merge(entries, history, updates)
    write_workbook(entries, history, out_path)

    proposed = sum(1 for e in entries.values() if e.get("status") == "Proposed")
    decided = sum(1 for e in entries.values() if e.get("status") == "Decided")
    print(f"ADR log now has {len(entries)} entries ({decided} Decided, {proposed} Proposed). Saved to {out_path}")


if __name__ == "__main__":
    main()
