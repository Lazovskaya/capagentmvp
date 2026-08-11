---
name: ceremony-routing
description: Score how deep to go on an already-classified SAP incident or normalized requirements ask (Light / Standard / Deep). Does not replace domain diagnostics or routing-matrix handoffs — only sets ceremony depth (HITL, pattern-analysis nudge, clarifying budget). Call after incident-triage or requirements-intake, before diagnose / FTS / solution-design.
---

# Ceremony routing (depth scoring)

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

Inspired by sdlc-factory `complexity-scoring` (heuristic-first, assessor only on boundaries) but
**not** a port of coding dimensions (API/Service/DB). SAP axes: blast radius, clarity, layer risk,
system span, data sensitivity.

## Purpose

Answer one question: **how deep should the next skill go?**  
It does **not** choose which O2C diagnostic to run — that stays in the domain `routing-matrix`
(and triage). Depth only changes ritual around that handoff.

| Depth | Meaning |
|-------|---------|
| `light` | Narrow pass; few clarifying questions; skip pattern-analysis |
| `standard` | Full diagnostic tree + fix-doc + adjacency regression |
| `deep` | Standard + HITL on root-cause / fix-scope; consider `defect-pattern-analysis` for clusters |

## When to use

- After `incident-triage` has set sub-process, layer, severity (and diagnose handoff)
- After `requirements-intake`, before choosing light workshop prep vs heavy Mode B design
- Standalone when the user asks "light or full RCA?" on an already-classified ticket

## When not to use

- Instead of `pricing-diagnostic` / `billing-ar-error-analyzer` / `root-cause-playbook` / `idoc-failure-analyzer`
- Instead of severity S1/S2/S3 (orthogonal: S1 can still be `light` if the fix path is obvious)

## Inputs (contract)

- **Required:** short problem statement (ticket text or requirements goal)
- **Required for incidents:** triage fields — `sub_process`, `layer`, `severity`, `diagnose_handoff`
  (from routing matrix), optional `dup_group_size`, `confidence`
- **Optional:** environment (`qas` / `prod`), whether FI posting / period / mass master-data /
  legal-tax is in play, PII in workspace

## Knowledge

- `references/depth-guide.md` — dimensions, red flags, score bands, heuristic shortcuts
- `references/depth-output-template.md` — `depth.json` / markdown table shape
- Domain `routing-matrix` — **read-only** for `next_skill` recommendation (do not reinvent handoff)
- `evals/evals.json` — Light / Standard / Deep / cluster fixtures

## Steps

1. **Open run folder**  
   `workspace/ceremony-routing/<YYYY-MM-DD>-<ticket-or-slug>/`  
   with `meta.json` + `events.jsonl` (`run.started`).
2. **Heuristic pass** (no subagent) — apply `depth-guide.md` § Heuristic shortcuts and score all
   five dimensions 1–5. Apply red-flag bumps.
3. **Boundary check** — if total is in a boundary band (10–12 or 16–18) **or** triage confidence
   is `low`, state uncertainty and either ask the user one depth question or re-score once with
   their answer. Do not invent a sixth dimension.
4. **Resolve depth** from total + forced overrides (guide § Bands).
5. **Keep diagnose handoff** from triage/routing-matrix unchanged. Write `next_skill` =
   that handoff (or `defect-pattern-analysis` **in addition** when Deep + cluster flag).
6. **Write** `depth.json` + short `depth.md` table; append `depth.scored` / `run.completed`.
7. **Hand back** to the caller (`incident-triage` worklist column, or spoken next step).

## Output

Per item:

```json
{
  "schema": 1,
  "id": "<ticket or REQ id>",
  "scores": {
    "blast_radius": 1,
    "clarity": 1,
    "layer_risk": 2,
    "system_span": 1,
    "data_sensitivity": 1
  },
  "total": 6,
  "red_flags": [],
  "depth": "light",
  "diagnose_handoff": "pricing-diagnostic",
  "next_skill": "pricing-diagnostic",
  "also_consider": [],
  "notes": "…"
}
```

## Judgment calls

- **Depth ≠ priority.** Sort worklists by severity/volume from triage; depth only shapes how each
  primary is worked.
- **Do not swap diagnostics because depth is Deep.** Deep billing stays `billing-ar-error-analyzer`
  (or the matrix handoff), not a random other skill.
- **Cluster (≥5 same-root) nudges Deep + `also_consider: defect-pattern-analysis`** — still fix the
  primary with the normal diagnostic unless the user chooses a pure pattern pass.

## Status

Progress. New (2026-08). Eval fixtures only; not yet live-engagement verified.
