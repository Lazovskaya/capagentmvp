---
name: requirements-intake
description: Normalize free-form text, a Jira/ALM ticket, email or workshop notes, or a greenfield idea into one requirements.md with source, goal, acceptance criteria (only if present), context, and open questions. Use before fit-to-standard or solution-design Mode B when the ask is still scattered. Does not invent AC, does not create backlog items with fake FTS backlinks, and does not replace backlog-drafting.
---

# Requirements intake

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Adapted from the sdlc-factory `requirements-intake` **normalization pattern** (detect input shape →
one `requirements.md` → never invent AC). Stripped of coding-pipeline concerns (branch names,
local work-item ledgers under `docs/superpowers/`, TDD handoff). SAP consulting downstream is
`fit-to-standard`, `solution-design` Mode B, or workshop prep — not "start coding."

## Purpose

Consultants get asks as tickets, email threads, slide scraps, and hallway ideas. Downstream skills
need one stable document with an explicit **Source**, what is known, and what is still open.
Without intake, every skill re-parses the pile differently and silently invents missing acceptance
criteria.

## When to use

- Explore (early): before or beside `fit-to-standard`, when the process ask is not yet a decision-log row
- Before `solution-design` Mode B, to turn a scattered pack into a single requirements baseline the
  source-synthesis pass can cite
- When someone asks `backlog-drafting` for a ticket with **no** design-record — normalize here, then
  route to FTS/design; do not draft an ungrounded work item

## When not to use

- Delta already has a design-record → `backlog-drafting`
- Decision log already exists and you need tests → `test-case-design`
- Incident/defect intake → `incident-triage` (different taxonomy)

## Detection order

Apply in order; stop at the first match (details in `references/detection-order.md`):

1. Explicit greenfield / "new process idea" ask
2. Path to an existing `requirements.md` / story draft in `workspace/`
3. External ticket ID or URL (Jira / Cloud ALM) — adapter via `jira` / `cloud-alm` connectors when wired
4. Multi-file notes pack (email `.md`, transcript, deck extract) handed as sources
5. Otherwise free-form text

## Constraints (hard)

- **Never invent acceptance criteria** not present in the source. Put gaps under **Open questions**.
- **Never** create a Jira/ALM work item that pretends to have FTS/design backlinks — that is
  `backlog-drafting`'s job after the chain exists.
- Ticket lookup failure is not a total halt: write requirements from the ID/URL as
  `ticket-unresolved:<id>`, add an open question about adapter/access, continue.
- Client data stays under `workspace/` (gitignored).

## Run layout

```
workspace/requirements-intake/<YYYY-MM-DD>-<slug>/
├── meta.json
├── events.jsonl
├── requirements.md              # primary output (also mirrors artifacts/requirements-record)
└── sources/                     # optional copies or pointers to input files
```

`meta.json` phases: `detect | fetch | normalize | review | done`.  
Events: `run.started`, `source.detected`, `ticket.fetched` | `ticket.unresolved`,
`requirements.written`, `review.approved` | `review.changes_requested`, `run.completed`.

## Steps

1. **Open run folder** + `run.started`.
2. **Detect** input shape; append `source.detected` with the funnel name.
3. **Fetch / collect** — ticket adapter if applicable; otherwise read provided files/text. Do not
   crawl the whole repo "for context" unless the user pointed at paths.
4. **Clarify only if too broad** — same budget as product-owner: **2–3 questions in one batch**
   when there is no process area, no persona/problem, and multiple unrelated topics. Skip if the
   ask is already specific.
5. **Write `requirements.md`** from `references/requirements-template.md` /
   `../../../artifacts/requirements-record/template.md`. Goal = one sentence. AC = only what the
   source states (or "(none in source — see Open questions)"). Append `requirements.written`.
6. **User review** — show the doc; on approval append `review.approved` and set status complete.
7. **Optional depth** — if the next step is ambiguous (thin AC + many open questions vs a crisp
   single-process ask), invoke `ceremony-routing` with the requirements goal as the problem
   statement. Use depth only to choose ritual: light → lean FTS prep; standard/deep → fuller
   workshop or `solution-design` Mode B. Do not invent a diagnose handoff here.
8. **Handoff** — name the next skill explicitly:
   - needs process decision → `fit-to-standard`
   - scattered design intent already, needs tier/design → `solution-design` Mode B
   - still just an idea for a story-shaped brief → keep this `requirements.md` as the brief; do
     **not** call `backlog-drafting` until FTS/design exist

## Output

- `requirements-record` shaped `requirements.md` in the run folder
- Feeds Explore activities; does not itself satisfy `explore→realize` (no design/backlink chain yet)

## Status

Progress. New skill (2026-08), pattern-ported from sdlc-factory requirements-intake; not yet
live-engagement verified. Evals under `evals/`.
