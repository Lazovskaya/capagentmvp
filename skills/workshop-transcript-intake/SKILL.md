---
name: workshop-transcript-intake
description: Extract traceable candidate requirements, decisions, open questions and candidate work items from a workshop transcript. Use after a workshop when TXT, VTT or SRT is available, before requirements-intake, fit-to-standard or solution-design. Never creates Jira work items.
---

# Workshop transcript intake

*Design conventions for IDs, review states and cross-skill handoffs are in
`../../../docs/skill-design-conventions.md`.*

## When to use

Explore phase, after a fit-to-standard or requirements workshop has taken place and a transcript
(TXT, VTT or SRT) is available. Run before `requirements-intake`, `fit-to-standard` or
`solution-design` to extract traceable candidates from spoken discussion before it is forgotten
or misremembered. Not a replacement for the decision log — output feeds into, not past, review.

## Purpose

Turn a workshop transcript into a reviewable candidate register without treating
spoken discussion as an approved decision or implementation backlog. The output
preserves segment-level provenance, consolidates repeated statements and routes
each candidate to the existing delivery chain.

## Inputs

- Required: one workshop transcript in `.txt`, `.vtt` or `.srt` format.
- Optional: workshop date, participant list, process/module scope and a prior
  requirements record or decision log for comparison.

## Procedure

1. Parse the transcript into stable IDs with the local helper:

   ```bash
   python3 tools/parse_workshop_transcript.py \
     --input /path/to/workshop.vtt \
     --output workspace/workshop-transcript-intake/segments.json
   ```

2. Read every segment and extract only statements supported by its text. Classify
   each as `requirement`, `decision`, `open_question` or `candidate_work_item`.
   When a statement is unclear, use `open_question`; do not infer intent.
3. Consolidate repeated statements only when they express the same outcome. Keep
   every original segment ID in `source_segment_ids` and note the consolidation.
4. Write `workshop-candidate-register` locally. Start at `DRAFT`; a human must
   review it before a candidate is treated as a decision or input to downstream
   work.
5. Route candidates deliberately:
   - scattered/new requirements -> `requirements-intake`;
   - standard-versus-delta workshop outcomes -> `fit-to-standard`;
   - an agreed design intent with scattered sources -> `solution-design`;
   - unresolved items -> `defer`.

## Hard boundaries

- Never create Jira or Cloud ALM work items.
- Never generate FTS Row IDs, design-record IDs or approval claims from a
  transcript.
- Never discard duplicate source segments after consolidation.
- `backlog-drafting` remains the only skill that creates traceable work-item
  drafts, after approved design and extensibility records exist.

## Outputs

- `workspace/workshop-transcript-intake/<date>-<slug>/segments.json`
- `workshop-candidate-register` in JSON and/or Markdown for human review.
- A named next skill for every reviewed candidate.

## Refuse conditions

- Empty or unreadable transcript -> `blocking missing evidence`.
- A request to create tickets directly from the transcript -> produce candidates
  only and route through the appropriate upstream review path.