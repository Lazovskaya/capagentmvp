# Business process scope

The real deliverable is a `.xlsx` (`skills/conversion-scoping/scripts/build_scope_workbook.py`) —
Summary sheet + one sheet per Business Area, with status color-coding. This file documents the
shape.

- **Client:**
- **Generated at (UTC):**
- **Notes (`notes`):** must state this is a planning-level draft, to be re-validated jointly with
  the client during Fit-to-Standard/Design-phase workshops — never drop this caveat.

## Per Business Area sheet (`business_areas[].processes`)

| Process | Status | Complexity | Driving Simplification Item | Technical Blocker | Supporting Application(s) |
|---|---|---|---|---|---|
| | Changed / Unchanged / To-Assess / Out of scope | Low / Medium / High | | true / false | |

- **Status** — `Unchanged` rows must be explicitly enumerated, not summarized as "everything else."
- **Technical Blocker** — `true` only when driven by a Simplification Item consistency error
  needing engineering remediation, regardless of Category — not a business decision. Read by
  `workshop-preparation` to exclude the row from the business-discussion agenda.
- **Supporting Application(s)** — populated only when the client's Application Map was
  cross-referenced.
