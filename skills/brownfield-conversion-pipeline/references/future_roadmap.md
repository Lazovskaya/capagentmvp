# Future Roadmap — Full-Cycle Acceleration Plan

This file is a **design plan for what to build next**, not a description
of what exists today (see `pipeline_map.md` for current state). It exists
so the detailed thinking behind the next phase of this pipeline lives in
the skill's own structure, not only in a conversation history. Nothing
here should be treated as built until `pipeline_map.md`'s own table says
so — this file gets consulted when deciding what to build next, and
updated (moving items from here into `pipeline_map.md`) once something
actually ships.

## Two standing design constraints for everything below

1. **Publishing to a shared system is never silent.** Creating/updating a
   Confluence page or a Jira/Cloud ALM issue is visible to other people at
   the client and hard to cleanly undo — every such action must be shown
   to the user for confirmation before it happens, every time, not
   auto-run in the background just because a stage produced output ready
   to publish. This applies regardless of how confident the content is.
2. **Jira and SAP Cloud ALM are different systems needing different
   adapters** — a client may use either (this pipeline shouldn't assume
   one). Confluence and Jira are both Atlassian and can likely share one
   connector; Cloud ALM is SAP's own REST API and needs its own client
   credentials from the customer, provided separately — design the
   publishing skill with an adapter per target system, not a single
   hard-coded integration.

## Planned companion skill: `alm-sync` (planned, not yet built) (not yet built)

A cross-cutting publisher, like `adr-log` — not a numbered stage,
callable from any stage once that stage has a deliverable ready to share
with the client's own tracked-work system.

- **Confluence adapter**: turns a stage's structured output (findings
  brief, sizing recommendation, scope workbook, workshop agenda, E2E
  scenario) into a real Confluence page, using the client's existing space/
  page-tree conventions where discoverable rather than inventing a new
  structure each time.
- **Jira adapter**: turns the same outputs into Epics/Stories/Tasks with
  the right hierarchy (see per-stage breakdown below) — always presenting
  the exact set of issues about to be created for confirmation first.
- **Cloud ALM adapter**: same job, different API — build this once a real
  client engagement actually needs it and API credentials are available;
  don't build speculative Cloud ALM integration against undocumented
  assumptions.
- Every adapter call ends with "here's what I'm about to publish — confirm?"
  — never a bare "published successfully" after the fact.

## Built skill: `workshop-scheduling` (Stage 4)

Turns `conversion-scoping`'s Changed-process list into real workshop
agendas, ready to schedule — not just a data dump for someone to manually
turn into slides.

- **Input**: the scoped BP workbook from Stage 3, plus the current
  `adr-log` state (to surface open questions the workshop needs to
  resolve).
- **AI produces**: a complexity-ordered session schedule (`.xlsx`) plus one
  agenda per Business Area/Stream (`.md`), sessions ordered by complexity
  (start with well-understood, Low-complexity areas to build workshop
  momentum before tackling Assessment-Required/High ones), each listing:
  processes in scope for that session, the driving Simplification Item(s)
  per process, Supporting Application(s) if known, and the specific open
  ADR questions this session needs to close. Framed explicitly as
  confirming Simplification Item impact and validating overall E2E scope
  — not a from-scratch Fit-to-Standard design exercise.
- **Manual, not automatable**: actually scheduling time with the right
  stakeholders, securing attendance, running the session itself. This
  skill's job ends at "here is a ready-to-send agenda," not the logistics
  of getting people in a room.
- **Confluence**: one page per session (or per Business Area, client
  preference) — this is a very Confluence-native artifact already, most
  real SAP Activate programmes keep Fit-to-Standard agendas there. Not yet
  wired to `alm-sync` (planned, not yet built) — publishing is still a manual copy-paste today.
- **Jira/Cloud ALM**: one tracking issue per session (for status/owner
  visibility), plus a rollup "workshop calendar" issue or dashboard.

## Planned skill: `workshop-to-backlog` (planned, not yet built) (Stage 5, not yet built)

Turns a **text transcript** of an already-conducted workshop into the
next stage's real inputs — never raw audio/video (no transcription step
planned; require a transcript upfront, the same limitation already
documented for evidence attached to `adr-log`).

- **AI produces**: E2E scenario write-ups (one per process or logical
  group), a backlog entry per confirmed changing process, and a test-scope
  list per scenario.
- **Also updates `adr-log` directly** — a workshop transcript is
  exactly the kind of evidence that closes out Proposed decisions raised
  earlier in the pipeline; this skill and `adr-log` should be used
  together whenever a workshop transcript comes in, not treated as
  separate concerns.
- **Manual, not automatable**: conducting and recording the workshop.
- **Confluence**: one "E2E Scenario" page per process/group.
- **Jira/Cloud ALM**: one backlog Story per changing process (linked to
  its Stage 3 Epic), one test-scope Task per scenario for QA.

## Custom Code Remediation — external tool, integration point only

A separate, already-existing tool handles custom code remediation itself
(instructions to be provided separately — not designed here). What this
pipeline needs to get right regardless of that tool's internals:

- `readiness-analysis`'s Chapter 5 (Custom Code) extraction is the
  natural handoff point — its output (finding counts, remediation-type
  breakdown, priority split) should be exportable in whatever shape that
  tool needs, once that shape is known.
- Any *architectural* decision the custom code findings force (e.g.
  decoupling custom code from an add-on being removed, per
  `addon_compatibility_guide.md` §4) still belongs in `adr-log` — the
  remediation *work* is out of this pipeline's scope, but the *decision*
  about how to handle it is not.

## Full per-stage activity breakdown (AI / Manual / Confluence / Jira)

| Stage | AI action (this pipeline) | Requires manual input | Confluence artifact | Jira/Cloud ALM artifact |
|---|---|---|---|---|
| 1. Readiness Assessment | `readiness-analysis` → findings brief; blockers → `adr-log` | Client must run/provide the Readiness Check report itself; vendor/AE follow-ups on Unknown add-ons and licensing gaps are real conversations, not draftable by AI | "Readiness Assessment — Findings" page | Epic per engagement; Story per blocker (CVI, Add-On remediation, AE conversation) |
| 2. Sizing | `sizing-analysis` → growth-adjusted per-instance recommendation | Growth-rate assumption must come from the business, not be defaulted; RISE FUE-tier mismatch resolution is a real AE conversation | "Sizing Recommendation" page | Task for Basis/Infra provisioning; Task for AE conversation if a mismatch exists |
| 3. Scoping & conversion-type | `conversion-scoping` → scope workbook; Business Decision rows → `adr-log` | Application Map (if used) comes from the client; industry/module scope and internal conversion-type terminology need client confirmation; **the Fit-to-Standard workshops themselves are entirely manual** — this stage only prepares the scope they'll run against | "Business Process Scope" page per Business Area, linked to the `.xlsx` | Epic per Business Area/Stream; Story per Changed process (tagged with complexity); Spike/Investigation task per To-Assess item |
| 4. Workshop Preparation *(built)* | `workshop-scheduling` → session agendas ordered by complexity, with open ADR questions surfaced | Scheduling, stakeholder attendance, and running the session are fully manual | One page per session (or per Business Area) | One tracking issue per session; a workshop-calendar rollup issue |
| 5. Workshop-to-Backlog *(planned)* | `workshop-to-backlog` (planned, not yet built) → E2E scenarios, backlog, test scope; updates `adr-log` from the transcript | Conducting/recording the workshop is manual; a **text transcript** is the required input, not raw audio/video | "E2E Scenario" page per process/group | Backlog Story per changing process (linked to its Stage 3 Epic); test-scope Task per scenario |
| Custom Code Remediation *(external tool)* | `readiness-analysis` Ch.5 extraction is the handoff point | The remediation tool itself, and its own workflow, are out of this pipeline's scope — instructions to follow separately | — (owned by the external tool's own process, unless/until integration is designed) | Any *architectural* decision the findings force still goes through `adr-log`, even though remediation execution doesn't |

## What "done" looks like for each planned piece

Don't build `alm-sync` (planned, not yet built) or `workshop-to-backlog` (planned, not yet built) speculatively
against assumptions — each is ready to build once:
- **`alm-sync` (planned, not yet built)**: there's a real engagement with Stage 1-3 output ready
  to publish, and confirmed Confluence/Jira (or Cloud ALM) access for that
  client.
- **`workshop-to-backlog` (planned, not yet built)**: a real workshop transcript exists to
  calibrate the extraction approach against — the same way every other
  skill in this pipeline was calibrated against a real report/example
  rather than a generic template.
