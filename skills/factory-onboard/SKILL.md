---
name: factory-onboard
description: Orient a new (or returning) internal factory team member — role path, repo mental model, day-0 setup, and pointers to the skill they should run first. Grounded only in committed factory docs. Does not execute any delivery skill itself. Use when someone joins the team, asks how to start, where things live, or which skill to run first.
---

# Factory Onboard

Ported (adapted, not copied verbatim) from `sap-ai-cons`'s `skills/meta/factory-onboard` — real,
DRAFT-status content, not a stub. Adjusted for this factory's own layout: `sap-ai-cons`'s
`STATUS.md`/`REPO-MAP.md`/`.claude/skills` symlink model doesn't exist here; this factory's
equivalents are `README.md`, `docs/`, and `factory-data.json`/`index.html` (the component map).

This is **meta content, not an Activate-phase deliverable** — it orients a person, it does not
produce a client artifact and does not feed a Q-gate. Placed in Discover per team decision (that's
typically when a new person is staffed onto a fresh engagement), not because it's conceptually
Discover-phase client work.

*Design conventions this skill follows (ID schemes, status enums, role naming, etc.) are in
`../../docs/skill-design-conventions.md` — check it before modifying this skill's templates.*

## When to use

- Someone joins the factory team or switches role into it.
- "How do I start?", "Where is X?", "Which skill should I run first?"
- Refresh after a long pause — re-orient to what's actually built versus still a stub.

**Do not use** for client end-user training/OCM (that's `training-enablement`, still a cons stub not
ported here), or as a substitute for actually running a delivery skill.

## Inputs (contract)

Ask for anything missing before running.
- **Required:** **role** (or best guess) — functional, developer, architect, delivery, basis, data,
  test (this factory's role set, see `factory-data.json`).
- **Required:** **goal for this session** — orient only | day-0 setup | role map.
- **Optional:** SAP domain focus, IDE, repo access status.
- No client data required. Never ask for secrets.

## Reads (grounding — load on demand, prefer these over memory)

1. `../../README.md` — layout, single-source-of-truth convention, how to regenerate the component map.
2. `../../index.html` — the interactive component map (phases × component kinds, statuses).
3. `../../docs/skill-design-conventions.md` — the conventions every skill here follows.
4. This skill's `references/first-day-checklist.md` — day-0 checklist.
5. Role path (only the relevant one, see the table below).

**Progressive disclosure:** answer from `README.md`/the component map first; open a specific
`SKILL.md` only when routing to a first run.

## Produces

- Spoken/chat orientation: mental model + next action.
- Optional local note: `workspace/onboarding/<yyyy-mm-dd>-<name-or-role>.md` (gitignored) — role,
  path chosen, checklist progress, blockers.
- **Does not** write to any tracker or edit `knowledge/` — that only happens if the person
  explicitly continues into a delivery skill afterward.

## Steps

1. **Orient.** Restate role + goal. One-paragraph mental model: `factory-data.json` is the single
   source of truth (phases, roles, components, statuses); `skills/<name>/SKILL.md` are the
   playbooks; `agents/<name>.md` return bounded verdicts; `knowledge/<bucket>/` is what skills read;
   the component map (`index.html`) is the picture, `factory-data.json` is what's real.
2. **Day-0 setup.** Walk `references/first-day-checklist.md`, skipping anything already done.
3. **Role map — pointers only, do not execute named skills unless explicitly asked:**

| Role | Mainly uses | Read first |
|---|---|---|
| Any (engagement start) | `activate` (launcher) | `skills/activate/SKILL.md`, then the routed skill |
| Functional | `fit-to-standard`, `config-doc` | `docs/skill-design-conventions.md`, the relevant `SKILL.md` |
| Architect | `readiness-analysis`, `solution-design` | Same |
| Developer | `custom-code-scan`, `abap-dev` (adopt) | Same |
| Delivery | `activate`, `cutover-plan`, `go-live-readiness`, `backlog-drafting` | Same |
| Data | `reconciliation` | Same |
| Test | `defect-triage` | Same |
| Basis | `production-conversion` | Same |

4. **Guardrails (state once):** no client data or secrets committed; every skill's own `SKILL.md`
   states its own human-confirmation points — don't assume any skill auto-executes an
   irreversible action. MCP writes are dry-run unless `--apply`.
5. **Close.** Summarize the next single action. For **engagement delivery work** (not team
   orientation), point them at `activate` as the launcher — this skill does not chain into running
   another one automatically.

## Judgment calls worth stating out loud

- **This skill orients and points — it does not execute delivery skills**, even "just to prove it
  works." Running a real skill is a separate, explicit request.
- **A component marked `notstarted` or `progress` in `factory-data.json` is a contract, not a
  promise** — say so plainly rather than let a new joiner assume it's fully working.
- **STATUS beats memory.** If this skill's own description of what's built ever seems to disagree
  with `factory-data.json`, the JSON wins — flag the drift rather than trusting the prose here.

## Driver

Main driver: delivery (COORD/PLATFORM equivalent in this factory's role set). Any role can invoke.

## Status

Progress. Adapted from real, DRAFT content in sap-ai-cons; not yet dry-run tested with an actual new
joiner in this factory's own repo layout.
