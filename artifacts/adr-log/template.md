# ADR log

The real deliverable is a `.xlsx` produced by `skills/adr-log/scripts/update_adr_log.py` — never
hand-edit it directly, the script's merge logic (union, not overwrite, for
`options_considered`/`evidence`/`supersedes`/`superseded_by`) and its History-sheet tracking are
the reason this stays trustworthy across an engagement. This file documents the shape.

## ADR Log sheet (`entries`)

One row per decision.

| ID | Title | Status | Raised By | Date Raised | Date Last Updated | Context | Options Considered | Decision | Rationale | Owner | SAD Section | Evidence | Supersedes | Superseded By |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ADR-001 | | Proposed / Decided / Deprecated / Superseded / Rejected | | | | | | | | | | | | |

- **ID** — stable `ADR-NNN`, assigned by the script; never renumbered.
- **Status** — `Proposed` (identified, not resolved) → `Decided` (real basis: client statement,
  workshop outcome, documented business rule) / `Deprecated` (stopped applying, nothing replaces
  it) / `Superseded` (a later entry explicitly replaces it — set `Superseded By`) / `Rejected`
  (considered and explicitly declined).
- **Supersedes / Superseded By** — structured cross-reference by ID, not prose — a two-sided edit
  whenever a decision is marked `Superseded`.

## History sheet

One row per status change, appended automatically — never edited by hand.

| ID | From Status | To Status | Date | Raised By |
|---|---|---|---|---|
| | | | | |
