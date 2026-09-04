# Business process scope

The real deliverable is a `.xlsx` (`skills/conversion-scoping/scripts/build_scope_workbook.py`) —
Summary sheet + one sheet per Business Area, with status color-coding. This file documents the
shape, matching the script's actual input JSON exactly (`title`, `areas`, `notes`) — build the JSON
against the script's own docstring or this file interchangeably, they now describe the same shape.

- **`title`:** e.g. "Client Name — Business Process Scope" — carries client/date context; there is
  no separate client/generated-at field.
- **`notes`:** a list of strings. Must include the caveat that this is a planning-level draft, to
  be re-validated jointly with the client during Fit-to-Standard/Design-phase workshops — never
  drop this caveat.

## Per Business Area (`areas`, keyed by area name)

One array of process rows per Business Area — `areas` is a dict keyed by area name (`"Finance"`,
`"Manufacturing"`, ...), not a list of area objects.

| Stream | Process | Status | Complexity | Driving Item / Note | Technical Blocker | Supporting Application(s) |
|---|---|---|---|---|---|---|
| | | Changed / Unchanged / To Assess / Out of Scope | Low / Medium / High | | true / false | |

- **`status`** — `Unchanged` rows must be explicitly enumerated, not summarized as "everything
  else."
- **`technical_blocker`** — `true` only when driven by a Simplification Item consistency error
  needing engineering remediation, regardless of Category — not a business decision. Read by
  `workshop-scheduling` to exclude the row from discussion-time complexity and duration, and list
  it separately as an FYI item instead.
- **`applications`** — populated only when the client's Application Map was cross-referenced. A
  string or a list of strings.
