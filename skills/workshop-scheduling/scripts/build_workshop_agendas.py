#!/usr/bin/env python3
"""Mechanical builder for workshop schedule + agendas from scope data.

Input: a scope JSON with the same shape conversion-scoping's
build_scope_workbook.py consumes:
    {
      "areas": {
        "<Business Area>": [
          {"stream": ..., "process": ..., "status": "Changed"|"Unchanged"|"To Assess"|"Out of Scope",
           "complexity": "Low"|"Medium"|"High"|"", "driving_item": ..., "note": ...,
           "applications": ["App A", "App B"], "technical_blocker": false},
          ...
        ],
        ...
      },
      "open_adrs": {          # optional
        "<Business Area>": [
          {"id": "ADR-001", "title": ..., "status": "Proposed", "context": ...},
          ...
        ]
      }
    }

Output:
  - <out_prefix>_schedule.xlsx  — one row per session, ordered by complexity score
  - <out_prefix>_agendas.md     — one section per session with the full agenda

Purely mechanical: computes the complexity score, orders sessions, and lays
out the tables. Which processes count as Changed/To Assess and what their
Category/complexity is has already been decided upstream by
conversion-scoping; this script does not re-judge that.

A row with "technical_blocker": true (set by conversion-scoping when a
Simplification Item carries a technical consistency error -- see that
skill's scoping_methodology.md) is a pure engineering fix, not a business
discussion item. It is excluded from the discussion-time complexity score
and duration estimate, and listed separately in the agenda as an FYI item
-- putting it in the main process walkthrough table would imply it needs
a workshop decision when it doesn't.
"""
import json
import sys

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

COMPLEXITY_WEIGHT = {"Low": 1, "Medium": 2, "High": 3}
RELEVANT_STATUSES = {"Changed", "To Assess"}

HEADER_FILL = PatternFill("solid", fgColor="1F4E78")
HEADER_FONT = Font(color="FFFFFF", bold=True)


def relevant_rows(rows):
    return [r for r in rows if r.get("status") in RELEVANT_STATUSES]


def discussion_rows(rows):
    """Relevant rows that actually need workshop discussion time -- excludes
    pure technical-blocker fixes, which need no business input."""
    return [r for r in relevant_rows(rows) if not r.get("technical_blocker")]


def blocker_rows(rows):
    return [r for r in relevant_rows(rows) if r.get("technical_blocker")]


def complexity_score(rows):
    """Discussion-time complexity only -- excludes technical-blocker rows, since they need
    no workshop discussion. Used for the schedule's own "Complexity Score" column and for
    duration estimation. NOT the sequencing key on its own -- see prep_score()."""
    score = 0
    for r in discussion_rows(rows):
        score += COMPLEXITY_WEIGHT.get(r.get("complexity", ""), 0)
    return score


def prep_score(rows):
    """Sequencing key: discussion complexity PLUS blocker prep weight.

    A technical-blocker row needs no workshop discussion time (see complexity_score()),
    but an area that is entirely, or mostly, blocker-flagged high-complexity processes
    still needs the most pre-workshop remediation lead time -- exactly the case
    workshop_methodology.md warns should NOT be scheduled first. Without this, an
    all-blocker area scores 0 on complexity_score() and lands in Session 1, the opposite
    of the intended sequencing. Blocker rows count at full COMPLEXITY_WEIGHT here so an
    area heavy with high-complexity blockers sorts later, alongside genuinely complex
    discussion-heavy areas, even though none of that weight shows up in the discussion
    score or duration estimate.
    """
    score = complexity_score(rows)
    for r in blocker_rows(rows):
        score += COMPLEXITY_WEIGHT.get(r.get("complexity", ""), 0)
    return score


def duration_minutes(rows):
    total = 0
    for r in discussion_rows(rows):
        if r.get("status") == "To Assess" or r.get("complexity") == "High":
            total += 25
        else:
            total += 12
    return total


def build_schedule(areas, out_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Workshop Schedule"

    headers = [
        "Order", "Business Area", "# Changed", "# To Assess",
        "# Technical Blockers (FYI)", "Complexity Score",
        "Suggested Duration (min)", "Suggested Attendees",
    ]
    for col, h in enumerate(headers, start=1):
        c = ws.cell(row=1, column=col, value=h)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
        c.alignment = Alignment(horizontal="center")

    summary = []
    for area, rows in areas.items():
        disc = discussion_rows(rows)
        n_changed = sum(1 for r in disc if r.get("status") == "Changed")
        n_assess = sum(1 for r in disc if r.get("status") == "To Assess")
        n_blockers = len(blocker_rows(rows))
        score = complexity_score(rows)
        seq_score = prep_score(rows)
        mins = duration_minutes(rows)
        summary.append((area, n_changed, n_assess, n_blockers, score, mins, seq_score))

    summary.sort(key=lambda t: t[6])

    for i, (area, n_changed, n_assess, n_blockers, score, mins, seq_score) in enumerate(summary, start=1):
        attendees = "Business Process Owner, SME(s), Solution/Configuration Architect (facilitator), Note-taker"
        ws.append([i, area, n_changed, n_assess, n_blockers, score, mins, attendees])

    widths = [8, 32, 10, 12, 18, 16, 22, 60]
    for col, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(col)].width = w

    wb.save(out_path)
    return summary


def build_agendas(areas, open_adrs, ordered_summary, out_path):
    lines = ["# Workshop Agendas\n"]
    lines.append(
        "Sessions ordered by aggregate prep need (lowest first) — discussion complexity "
        "PLUS technical-blocker prep weight — to confirm easier areas before tackling "
        "higher-complexity, To-Assess-heavy, or blocker-heavy areas that need the most "
        "pre-workshop remediation lead time. An area that is mostly or entirely "
        "technical-blocker rows is NOT scheduled first just because it needs little "
        "discussion time — see the FYI table's blocker count/complexity for why it may "
        "still be scheduled later. Objective for every session: **confirm and resolve the "
        "delta already identified by scoping — not a from-scratch process "
        "design exercise.**\n"
    )

    for i, (area, n_changed, n_assess, n_blockers, score, mins, seq_score) in enumerate(ordered_summary, start=1):
        rows = discussion_rows(areas[area])
        blockers = blocker_rows(areas[area])
        lines.append(f"\n## Session {i}: {area}\n")
        lines.append(
            f"**Objective:** Confirm the {n_changed} Changed process(es) and "
            f"resolve the {n_assess} To-Assess item(s) identified for {area} "
            "by the conversion scoping — confirm what changes for the people "
            "who run these processes, not redesign them from scratch.\n"
        )
        lines.append(
            "**Attendees:** Business Process Owner ({area}), SME(s), "
            "Solution/Configuration Architect (facilitator), Note-taker.\n".format(area=area)
        )
        lines.append(f"**Suggested duration:** {mins} minutes.\n")

        lines.append("\n**Open questions from the ADR log:**\n")
        adrs = open_adrs.get(area, [])
        if adrs:
            for a in adrs:
                lines.append(f"- `{a.get('id','')}` — {a.get('title','')} (status: {a.get('status','')})")
        else:
            lines.append("- None open for this area.")

        lines.append("\n\n**Process walkthrough:**\n")
        lines.append("| Process | Status | Driving Item | Supporting Application(s) | Confirmed? / Decision |")
        lines.append("|---|---|---|---|---|")
        for r in rows:
            apps = ", ".join(r.get("applications", [])) or "TBD"
            lines.append(
                f"| {r.get('process','')} | {r.get('status','')} | "
                f"{r.get('driving_item','') or r.get('note','')} | {apps} | |"
            )

        if blockers:
            lines.append(
                "\n**Pre-workshop technical fixes — FYI only, not a discussion "
                "item.** These carry a Simplification Item technical "
                "consistency error and need engineering remediation "
                "regardless of Category; they don't need business input, so "
                "don't spend session time on them beyond a status update.\n"
            )
            lines.append("| Process | Driving Item | Status |")
            lines.append("|---|---|---|")
            for r in blockers:
                lines.append(
                    f"| {r.get('process','')} | {r.get('driving_item','') or r.get('note','')} | "
                    f"{r.get('status','')} — remediation in progress |"
                )

        lines.append(
            "\n**Expected outputs:** confirmed status per process above; any "
            "new/updated decision raised into `adr-log`; any correction "
            "to the Supporting Application mapping.\n"
        )

    with open(out_path, "w") as f:
        f.write("\n".join(lines))


def main():
    if len(sys.argv) != 3:
        print("usage: build_workshop_agendas.py <scope_data.json> <out_prefix>", file=sys.stderr)
        sys.exit(1)

    scope_path, out_prefix = sys.argv[1], sys.argv[2]
    with open(scope_path) as f:
        data = json.load(f)

    areas = data.get("areas", {})
    open_adrs = data.get("open_adrs", {})

    schedule_path = f"{out_prefix}_schedule.xlsx"
    agendas_path = f"{out_prefix}_agendas.md"

    summary = build_schedule(areas, schedule_path)
    build_agendas(areas, open_adrs, summary, agendas_path)

    print(f"Wrote {schedule_path}")
    print(f"Wrote {agendas_path}")


if __name__ == "__main__":
    main()
