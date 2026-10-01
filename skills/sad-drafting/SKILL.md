---
name: sad-drafting
description: Draft the Brownfield SAD document from prior-stage evidence and consultant-confirmed decision matrices (instance strategy, RICEFW, sizing strategy, data migration architecture, dual maintenance / retrofit). Invoked by the Brownfield SAD Authoring Agent after readiness, sizing, and scoping stages are complete.
---

# Brownfield SAD Drafting

Synthesizes evidence from the readiness, sizing, and scoping stages together with five
consultant-confirmed decision matrices into a complete Brownfield S/4HANA Solution Architecture
Document (SAD). Writes a structured, source-traced document staged locally for review and
optional Confluence publication.

## When to use

After readiness, sizing, and conversion-scoping stages have each produced an approved or
partial-with-documented-gaps artifact. The Agent invokes this Skill to draft `06 Brownfield SAD`.
Do not invoke before at least a `partial` readiness artifact exists — the SAD depends on
readiness findings as its primary evidence base.

## Inputs (contract)

- **Required:** `engagement_id` — stable engagement identifier.
- **Required:** `readiness_artifact_path` — path to the staged or approved readiness artifact
  (`01-readiness-assessment.md` or equivalent JSON source).
- **Required:** `sizing_artifact_path` — path to the staging artifact from `sizing-analysis`.
- **Required:** `scoping_artifact_path` — path to the staging artifact from `conversion-scoping`.
- **Required:** `adr_log_path` — path to `adr-log.json` for this engagement.
- **Optional:** `existing_sad_path` — if updating an existing SAD draft, path to the prior version.
- **Optional:** `--apply` — required to write output; dry-run by default.

## Steps

### Step 1 — Verify prerequisites

Load each required artifact. Check:

- `simplification-impact-report` and `business-process-impact-list` exist (from `readiness-analysis`).
- `sizing-recommendation` exists (from `sizing-analysis`).
- `business-process-scope` exists (from `conversion-scoping`).
- `adr-log.json` exists; `adr_sync_status` is `synced` or `local-only` (never `pending` — a
  pending ADR means a material decision has not been recorded yet).

If any required artifact is missing, report it as a blocker and stop. If an artifact is `partial`,
continue but surface every documented gap explicitly in the SAD's Open Topics section — never
paper over a gap.

### Step 2 — Work through the five decision matrices

For each matrix below, present the decision options with supporting evidence drawn from the
prior-stage artifacts, show the recommended option with rationale, and wait for consultant
confirmation before recording the decision. Do not auto-select: each decision must be
human-confirmed before proceeding to the next.

Decision matrices and their reference files:

1. **Instance strategy** (`references/instance-strategy.md`) — system landscape, mandant
   concept, transport routes, DEV/QA/PRD instance count, multi-ERP consolidation options.
2. **RICEFW disposition** (`references/ricefw-decisions.md`) — custom code handling:
   keep-as-is, adapt, retire, replace per object category (Report/Interface/Conversion/
   Enhancement/Form/Workflow).
3. **Sizing strategy** (`references/sizing-strategy.md`) — hardware/cloud approach,
   sizing method, S/4HANA memory model implications, growth factor decisions.
4. **Data migration architecture** (`references/data-migration-architecture.md`) — Shell
   conversion vs. data-load approach, archiving strategy pre- and post-conversion, historical
   data handling, cutover window sizing.
5. **Dual maintenance / retrofit** (`references/dual-maintenance-retrofit.md`) — strategy
   for handling development work during the conversion project: freeze, retrofit tooling,
   parallel transport lanes.

For each matrix, record the confirmed decision as an ADR entry (via `adr-log --apply`) before
moving to the next matrix. Decision type: `conversion-approach` (matrices 1, 3, 4),
`scope-boundary` (matrix 2), `integration-decision` (matrix 5 when retrofit touches interfaces).

### Step 3 — Run `fill-brownfield-sad-template`

Call `tools/fill-brownfield-sad-template/scripts/fill_sad_template.py` with all confirmed inputs:

```bash
python3 tools/fill-brownfield-sad-template/scripts/fill_sad_template.py \
    --engagement-id <engagement_id> \
    --readiness  <readiness_artifact_path> \
    --sizing     <sizing_artifact_path> \
    --scoping    <scoping_artifact_path> \
    --adr-log    <adr_log_path> \
    --decisions  workspace/<engagement_id>/brownfield-sad/sad-decisions.json \
    --template   artifacts/brownfield-sad/template.md \
    --out        workspace/<engagement_id>/brownfield-sad/staged/06-brownfield-sad.md
```

The tool fills each SAD section from the matching evidence source. It writes a structured
markdown document with inline source citations `[S-id]` for every material statement, and an
Open Topics section for every documented gap or unconfirmed item.

If the tool exits non-zero, report the error verbatim and stop. Do not construct the SAD
manually by paraphrasing inputs — the tool is the single authoring step.

### Step 4 — Preview the generated SAD

Read the generated file. Display a structured summary:

```
SAD DRAFT PREVIEW — workspace/<engagement_id>/brownfield-sad/staged/06-brownfield-sad.md
------------------------------------------------------------------------------------------
Sections generated: <list of top-level headings>
Word count: <N>
Open topics: <count> (listed below)
Gaps carried forward from prior stages: <count>
ADR entries referenced: <N>

Open topics:
  1. <title> — <source stage>
  ...

Pass --apply to write this draft as the active staged SAD.
Pass nothing to cancel.
```

### Step 5 — Require `--apply`

If `--apply` is not set, stop here. Do not proceed.

### Step 6 — Write staged SAD and update engagement state

With `--apply`:

1. The file is already written by the tool in step 3. Re-read it to verify the word count is
   plausible (> 500 words for a non-trivial engagement).
2. Update `brownfield-sad-authoring-state` (`state.json`):
   - Add a `documents` entry for `brownfield-sad` with `source_origin: agent-generated`,
     `review_status: unreviewed`.
   - Set `current_evidence_stage: sad-drafting`.
3. Report the exact file path and the review-status set.

### Step 7 — Log decisions in ADR

Verify that every decision confirmed in step 2 has a corresponding ADR entry with `status:
active`. If any are missing (e.g., the ADR write was skipped or failed), surface each one
as an open blocker — the SAD cannot move to review-ready status until its decision log is
complete.

### Step 8 — Optional Confluence publish

If `confluence-document-publishing` is available and the engagement has a
`confluence_root_page_id`, offer to publish the staged SAD as `06 Brownfield SAD`.
Confluence publication is a separate, independently gated action (requires its own `--apply`).
If Confluence is unavailable, mark the document `not_published` and continue.

## Output

- `workspace/<engagement_id>/brownfield-sad/staged/06-brownfield-sad.md` — the drafted SAD.
- `workspace/<engagement_id>/brownfield-sad/sad-decisions.json` — the five confirmed
  decisions in machine-readable form, sourced from step 2.
- Updated `brownfield-sad-authoring-state` with the new document entry.
- ADR entries for each decision (via `adr-log`).

## Status

Skill available. `fill-brownfield-sad-template` tool required and included.
No automated test suite yet — testable outcome: fill a SAD from a sample scope and decision set
and verify the output validates against `artifacts/brownfield-sad/schema.json`.

## Driver

Main driver: architect (Brownfield SAD Authoring Agent orchestrates this Skill on the
architect's behalf after readiness, sizing, and scoping stages are complete).
