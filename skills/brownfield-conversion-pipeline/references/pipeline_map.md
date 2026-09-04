# Brownfield Conversion SDLC — Pipeline Map

Five stages, each with a clear input, a clear output, and (where it
exists) a dedicated skill that does the real work. This file is the single
source of truth for "what stage are we at and what's next" — read it once
per engagement, not once per message. **For the detailed build plan behind
Stages 4-5 and the two planned publishing companions (`alm-sync` (planned, not yet built),
Confluence/Jira/Cloud ALM sync), see `references/future_roadmap.md`** — this
table only tracks current state.

| # | Stage | Input | Output | Skill |
|---|---|---|---|---|
| 1 | **Readiness assessment** | SAP Readiness Check report (`.docx`) | Findings brief: blockers, data gaps, per-chapter findings with SAD routing | `readiness-analysis` (built) |
| 2 | **Sizing** | Readiness Check Ch.6 output, or FUE count, or Quick Sizer export | Growth-adjusted, per-instance sizing recommendation | `sizing-analysis` (built) |
| 3 | **Scoping & conversion-type decision** | Readiness Check findings brief (custom code volume, integration count, simplification items) + business process reference catalog (e.g. SAP RBA/RSA) + optionally the client's own Application Map/interface inventory (any format) | Sized business-process/integration/custom-code volume; conversion-type decision (e.g. DMO variant); scoped BP list marked Changed/Unchanged/Out of scope, with Supporting Application(s) per process when an Application Map was supplied | `conversion-scoping` (built) |
| 4 | **Workshop preparation** | Scoped BP list from Stage 3 | Workshop schedule (complexity-ordered) + per-session agendas confirming Simplification Item impact and resolving To-Assess items | `workshop-scheduling` (built) |
| 5 | **Workshop-to-backlog** | Workshop recordings/transcripts from Stage 4 | E2E scenario list, backlog of changing processes, test scope | *planned — see `future_roadmap.md`'s `workshop-to-backlog` (planned, not yet built) design* |
| — | **SAD drafting** | Outputs of stages 1-3 (at minimum) | Filled Solution Architecture Document | `sad-drafting` (built — already calls `readiness-analysis` itself when relevant) |
| — | **ALM/Confluence sync** | Any stage's deliverable, ready to share | Confirmed-before-publish Confluence pages and Jira/Cloud ALM issues | *planned — see `future_roadmap.md`'s `alm-sync` (planned, not yet built) design* |
| — | **Custom Code Remediation** | `readiness-analysis` Ch.5 output | Handled by a separate, existing tool (instructions to follow separately) | *external — integration point only, see `future_roadmap.md`* |

## Cross-cutting: the ADR log runs alongside every stage, not after them

`adr-log` (built) isn't a stage in the numbered sequence above — it's
a companion every other stage writes into as soon as a real, gating
decision is identified (Instance Strategy, CVI completion, an Add-On
licensing gate, a downtime-tier choice, a "Business Decision" scoping
row). Don't wait for Stage — (SAD drafting) to surface these; raise them
into the log the moment they're found, and hand the updated `.xlsx` back
to the user as its own artifact each time it changes. If the architect
attaches new evidence at any point — a call transcript, workshop notes, a
presentation — route it to `adr-log` to update the log directly,
regardless of which numbered stage the engagement is otherwise in.

## How to tell which stage the user is at

Don't ask "which stage are you at" as a bare question — infer it from what
they've handed you or described, and confirm:

- Only mentioned "Brownfield conversion project," nothing attached → Stage 1.
  Ask for the Readiness Check report (or confirm one hasn't been run yet).
- Readiness Check report attached/already analyzed → Stage 1 output exists;
  Stage 2 (sizing) is fully ready to run from it alone. **Stage 3 (scoping)
  is NOT equally ready from the findings brief alone** — `conversion-scoping`
  also hard-requires a business process reference catalog (e.g. SAP
  RBA/RSA export), which this scenario hasn't mentioned yet. Don't say
  "both are ready, want me to do both?" without checking for the catalog
  first — if it's missing, say sizing can start now and name the RBA/RSA
  catalog as the one thing still needed before scoping can run in parallel
  with it, rather than presenting both as equally unblocked.
- Business process catalog / RBA-RSA file attached alongside a Readiness
  Check → Stage 3 in progress. If an Application Map/interface inventory
  is also available, ask for it now rather than after workshops — Stage 3
  cross-references it before the workshop specifically so facilitators
  have current-state application context going in.
- A scoped BP list with Changed/Unchanged marks already exists → Stage 4.
- **User directly names a Stage 4 activity (e.g. "help me plan Fit-to-Standard
  workshops") with no evidence any earlier stage ran** → don't route straight
  to `workshop-scheduling` on the activity name alone. Check first whether a
  Stage 3 scoped BP list actually exists (ask, if it's not obvious from
  context) — `workshop-scheduling` hard-requires that scope data. If it
  doesn't exist yet, say so explicitly and offer Stage 3 (`conversion-scoping`)
  first, rather than relying on `workshop-scheduling` itself to discover the
  gap once invoked — this router's own job (see step 5 below) is to catch a
  missing companion-skill input before routing, not after.
- Workshop recordings or transcripts attached → Stage 5.
- A call transcript, workshop notes, or a presentation attached **as new
  evidence about an existing decision** (rather than raw Stage 5 material
  to mine for E2E scenarios) → route to `adr-log`, regardless of which
  numbered stage the engagement is otherwise in. If it's ambiguous which
  one the user means, ask.
- Asking to draft the actual SAD document → route to `sad-drafting`, which can
  consume whatever stage outputs already exist.

## What to do until Stages 4-5 have dedicated skills

Don't block the user on a skill that doesn't exist yet — do the stage's
job with what's already available, and say explicitly that it's a
manual/best-effort pass rather than a purpose-built skill:

- **Stage 3 (Scoping)**: now has a dedicated skill, `conversion-scoping`
  — invoke it directly rather than doing this ad hoc. It consumes the
  Readiness Check findings brief (custom code, integration, and
  Simplification Item data) plus the client's SAP RBA/RSA catalog and
  produces the Changed/Unchanged/Out-of-scope business process list. The
  conversion-type decision (e.g. which DMO variant, or the organization's
  own shorthand like "DOC"/"DMOVE2S4") still needs the user's exact
  terminology confirmed — that skill asks rather than guesses.
- **Stage 4 (Workshop prep)**: now has a dedicated skill,
  `workshop-scheduling` — invoke it directly. It consumes the Stage 3 scope
  data and produces a complexity-ordered session schedule plus per-session
  agendas (process walkthrough, open `adr-log` questions per Business
  Area, expected outputs), framed as confirmation/delta-resolution rather
  than a from-scratch Fit-to-Standard design exercise.
- **Stage 5 (Workshop-to-backlog)**: if given a transcript (text), extract
  E2E scenarios and backlog items directly from it, and also check
  whether anything in it should update `adr-log`. If given raw video/
  audio, say explicitly that this doesn't yet include a transcription
  step and ask the user to provide a transcript instead. See
  `future_roadmap.md`'s `workshop-to-backlog` (planned, not yet built) design for the fuller
  shape.

## When to promote a stage to its own skill

Once a stage's ad-hoc approach above has been used on 2-3 real
engagements and the pattern has stabilized (the same questions, the same
categorization scheme, the same output shape each time), split it out into
its own dedicated skill — mirroring how `readiness-analysis` and
`sizing-analysis` were split out of what started as inline guidance inside
`sad-drafting`. Update this file's table row (input/output/skill columns) and
the routing note above when that happens; don't let this map drift out of
sync with what's actually built.
