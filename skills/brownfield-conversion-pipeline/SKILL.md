---
name: brownfield-conversion-pipeline
description: Entry point and guide for a full SAP Brownfield (system) conversion SDLC — Readiness Check analysis, sizing, business-process/integration/custom-code scoping and conversion-type decision, Fit-to-Standard workshop preparation, and turning workshop outputs into E2E scenarios/backlog/test scope. Use whenever the user says they're starting, running, or asking about a Brownfield SAP conversion project end-to-end, mentions multiple stages of this process together, or isn't sure what to do next in a conversion project. Routes to the specific skill for whichever stage applies (readiness-analysis, sizing-analysis, conversion-scoping, sad-drafting), and to adr-log — a cross-cutting decision tracker, not a stage — whenever a gating decision or new evidence should update it. Don't use this for a single narrow request that already names its own skill (e.g. "analyze this Readiness Check" goes straight to readiness-analysis).
---

# Brownfield conversion pipeline — router

Ported from `sap-ai-architecture-generator`'s `sap-brownfield-sdlc` skill (real, engagement-tested
routing logic; `own` posture). This skill exists so the user only has to remember one thing — "this
is a Brownfield conversion project" — instead of five skill names and the order they run in. It is
deliberately thin: it doesn't duplicate any stage's actual logic, it just identifies where the user
is in the pipeline and routes to (or explicitly names) the right skill.

*Design conventions this skill follows are in `../../docs/skill-design-conventions.md`.*

**Read `references/pipeline_map.md` first, every time this skill triggers.** It's the single
source of truth for the five stages, what each needs as input, what it produces, which skill (if
any) exists for it yet, and — for stages 4-5 which don't have dedicated skills yet — exactly what
to do in the meantime rather than blocking the user. **`references/future_roadmap.md`** holds the
detailed build plan for what isn't built yet (Stage 5, plus the planned `alm-sync`
Confluence/Jira/Cloud ALM publisher) — consult it when the user asks about what's planned, or when
deciding what to build next; it's a design plan, not something to treat as already available.

## Relationship to `factory-onboard`

`factory-onboard` (this factory's own, broader entry point) routes across every engagement type and
phase, using `references/phase-routing.md`'s role/phase/engagement matrix. This skill sits **one
level below it**, specific to Brownfield conversion engagements — `factory-onboard`'s routing
should point here for that engagement type rather than duplicating this skill's stage logic.

## When to use

Any phase, whenever the user is starting, running, or asking about a Brownfield SAP conversion
project end-to-end, mentions multiple stages together, or isn't sure what to do next. Not for a
single narrow request that already names its own skill (e.g. "analyze this Readiness Check" goes
straight to `readiness-analysis`).

## Inputs (contract)

Ask for anything missing before running.
- **Required:** whatever the user has attached or described so far — a Readiness Check report, a
  business process scope, workshop recordings/transcripts, or nothing yet (a fresh Stage 1 start).
  Infer the stage from what's actually present; don't just ask "what stage are you at" as a bare
  question.

## Steps

1. **Identify which stage the user is at**, using the pipeline map's guidance (infer from what
   they've attached/described).
2. **Tell them, briefly, where they are** in the five-stage pipeline and what the next stage needs
   from them — this orientation is most of this skill's value; don't skip it even when jumping
   straight into work.
3. **Route to the stage's skill if one exists** (`readiness-analysis`, `sizing-analysis`,
   `conversion-scoping`, `workshop-scheduling`, `sad-drafting`), or follow the pipeline map's "what
   to do until it exists" guidance for Stage 5.
4. **If multiple stages are ready to run** (e.g. a Readiness Check just finished, and both sizing
   and scoping can start from it), say so and offer to do both rather than picking one silently.
5. **If a companion skill this stage needs isn't installed, say so explicitly** — don't silently do
   a worse job in its place (mirrors how `sad-drafting` already handles the same situation for
   `readiness-analysis`/`conversion-scoping`).

## Five stages (see `references/pipeline_map.md` for the full table)

| # | Stage | Skill |
|---|---|---|
| 1 | Readiness assessment | `readiness-analysis` |
| 2 | Sizing | `sizing-analysis` |
| 3 | Scoping & conversion-type decision | `conversion-scoping` |
| 4 | Workshop preparation | `workshop-scheduling` |
| 5 | Workshop-to-backlog | *planned — see `references/future_roadmap.md`* |
| — | SAD drafting | `sad-drafting` (consumes stages 1-3) |

**Cross-cutting, not a stage:** `adr-log` runs alongside every stage above, raised into whenever a
gating decision is identified or new evidence (a call transcript, a presentation) resolves one —
don't wait for SAD drafting to surface these.

## Keeping this cheap to run

This skill's own body is short by design — the token cost of a long pipeline lives in the
stage-specific skills, which only load when that stage's work actually starts. Don't inline stage
logic here even if it would save a step; that's exactly the kind of growth that turns a cheap
router into an expensive one. If a stage's ad hoc guidance in the pipeline map starts growing past
a few paragraphs, that's the signal to split it into its own skill, not to leave it here.

## Output

A stated position on the five-stage pipeline and the exact next-stage requirements — this skill
produces no client deliverable itself, only orientation and routing.

## Driver

Main driver: delivery. Owner role per factory-data.json: **delivery**.

## Status

Progress. Ported from `sap-ai-architecture-generator`'s `sap-brownfield-sdlc` (real,
engagement-tested routing logic); stage names updated to this factory's own skill names.
`factory-onboard`'s own routing table (`skills/factory-onboard/references/phase-routing.md`) now
points here for full Brownfield-conversion requests. Not yet dry-run tested against this factory's
own wiring.
