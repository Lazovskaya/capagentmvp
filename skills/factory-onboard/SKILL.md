---
name: factory-onboard
description: Helper for a consultant who installed SAP AI Factory and wants to use it on a project (not author it). Day-0 orientation, role path, then capture phase/engagement/domain and point to the first delivery skill. Does not execute delivery skills unless the user asks to continue. Use when someone first opens the repo, asks how to start on a project, which skill to run, or how the factory is laid out as a user.
---

# Factory Onboard (user helper)

For **consultants using the factory on an engagement** — not for people editing
`factory-data.json`, writing new skills, or owning the platform Makefile/CI.

After install, this is the single entry: orient → capture project context → name the next
delivery skill. It does **not** produce a client deliverable and does not feed a Q-gate.

*Explore handoffs (when you land in Explore): `../../../artifacts/explore-chain/`.*  
*Write safety (state once): connector mutations are dry-run / preview only unless the user
passes `--apply`. Do not open authoring docs for this — it is a runtime rule, not a design task.*

## When to use

- First time after installing/cloning the factory for project work
- "How do I start on this engagement?", "Which skill should I run?"
- Resume after a pause — re-check what's actually usable vs still a stub

**Do not use** for client end-user training/OCM, or as a substitute for running the delivery
skill once the next step is clear. **Do not use** as the contributor guide (that stays in
`README.md` / platform docs).

## Inputs (contract)

Ask for anything missing before finishing.

**Always**

| Field | Notes |
|-------|--------|
| **role** | functional, developer, architect, delivery, basis, data, test |
| **goal for this session** | `orient only` \| `day-0 setup` \| `start project work` |

**When goal is start project work** (or orient already done)

| Field | Required | Values / notes |
|-------|----------|----------------|
| **phase** | yes | Discover / Prepare / Explore / Realize / Deploy / Run |
| **engagement** | yes | `G` Greenfield / `B` Brownfield / `A` Build and Extend / `R` AMS & Run |
| **goal** | yes | One sentence: what this session should produce |
| **domain_pack** | recommended | e.g. `order-to-cash` — needed for Realize/Run diagnostics |
| **ceremony** | optional | `light` / `standard` / `deep` — else use `ceremony-routing` after intake |
| **apply_writes** | optional | default **false** — no live Jira/ABAP writes without `--apply` |

## Reads (progressive — prefer these over memory)

1. `../../README.md` section **Installing skills into a project** only — how skills land in *your*
   tool. Skip the contributor frontmatter (`factory-data.json` / `build.py`) unless they ask.
2. Component map (`index.html` or Confluence) — what's `ready` vs `progress` vs `notstarted`
3. This skill's `references/first-day-checklist.md` — day-0 for users
4. `references/phase-routing.md` — which delivery skill matches phase + goal
5. Open a specific delivery `SKILL.md` only when handing off

Do **not** send a project user into `docs/skill-design-conventions.md` (authoring conventions)
unless they ask how to *write* skills.

## Steps

1. **Orient (user lens).** One paragraph: skills are playbooks you run; `knowledge/` is what they
   read; `workspace/` is your local run output (gitignored, no client secrets in git); the map
   shows maturity — `notstarted`/`progress` are contracts, not promises.
2. **Day-0 setup.** Walk `references/first-day-checklist.md` (skip done items). Focus on: tool
   install of skills, optional Jira/ABAP connector wiring per `connectors/*/connector.md`,
   `workspace/` hygiene. Skip contributor topics (regenerating the map, validators, Makefile).
3. **If goal is start project work — capture context** (table above) and write
   `workspace/factory-onboard/<YYYY-MM-DD>-<slug>/context.json` (gitignored).
4. **Route** via `references/phase-routing.md` + role table below. State the **next skill name**
   explicitly and why. Remind once: connector writes are dry-run unless `--apply`.
5. **Hand off — do not silently execute** the delivery skill unless the user asks to continue in
   the same turn. Then load that skill's `SKILL.md` and follow it.

## Role → typical skills (pointers)

| Role | Often starts with |
|------|-------------------|
| Functional | Explore: `fit-to-standard` / `requirements-intake`; Realize: `config-doc` |
| Architect | `readiness-analysis`, `solution-design` |
| Developer | `custom-code-scan`, `abap-dev` (adopt) |
| Delivery | phase routing below; Deploy: `cutover-plan`, `go-live-readiness` |
| Data | `reconciliation` |
| Test | `defect-triage`, `test-case-design` |
| Basis | `production-conversion` |

Phase + engagement modifiers beat this table when they disagree — see
`references/phase-routing.md`.

## Routing summary

| Phase | Typical next skill |
|-------|--------------------|
| Discover | `readiness-analysis` or `agent-readiness` |
| Prepare | `knowledge-discovery` or `custom-code-scan` |
| Explore | `requirements-intake` → `fit-to-standard` → … — if goal names FTS but no normalized ask / simplification pack yet, start at intake (see `phase-routing.md`) |
| Realize (build) | `config-doc` / `abap-dev` — only if design-record `status` is `APPROVED` |
| Realize / Run (defect) | `incident-triage` → `ceremony-routing` → diagnose → `defect-triage` → `fix-doc-and-regression` |
| Deploy | `cutover-plan` / `go-live-readiness` |
| Run (close) | `knowledge-harvest` / `run-exit` gate evidence |

## Output

- Spoken orientation + **one** next action (skill name)
- Optional `workspace/factory-onboard/.../context.json` when project work was scoped
- Does **not** write to trackers or edit `knowledge/`

## Judgment calls

- **User vs contributor.** If they want to change the factory itself, point at `README.md` and
  stop — this skill stays on the user path.
- **STATUS beats marketing.** If the next skill is thin `progress` or `notstarted`, say so and
  offer a degraded path (local artifacts only).
- **Never invent AC or client config** to unblock routing — send to `requirements-intake` first.

## Driver

Any role. Delivery often opens the engagement; the routed skill's driver takes over after handoff.

## Status

Progress. User-entry skill (orientation + routing). Not a substitute for delivery skills' own
maturity.
