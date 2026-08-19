# AI artifact delivery process & RACI (P2)

**Backlog ID:** P2 (Platform MVP track) — [EPMCSAPAI-292](https://jiraeu.epam.com/browse/EPMCSAPAI-292)

## What this is

The operational process and RACI for taking factory content (skills, agents, connectors,
artifacts, knowledge) from this source repo to a running client engagement, across the four
stages of the pipeline this platform track is building (P1–P8): **scoping → clone/filter → infra
context → unpack & sign-off**. Distinct from `factory-onboard` (a consultant's day-0 orientation
inside an already-delivered project) and `onboarding-guide` (a new team member's knowledge-base
walkthrough) — this document is for the people who run the delivery pipeline itself, before either
of those skills is ever invoked on the client side. See [onboarding-note.md](onboarding-note.md)
for how the two connect.

## Roles

Deliberately named distinctly from the project-side delivery roles in `factory-data.json`
(`roles.delivery` = "Delivery Manager" is a client-engagement role; the roles below run the
factory's own delivery pipeline and may or may not be the same person on a small pilot — see
`skill-design-conventions.md` #3 on not merging distinct responsibilities even when one person
holds several).

| Role | Responsibility |
|---|---|
| **Engagement Delivery Lead (EDL)** | Accountable for the engagement getting a working, signed-off client repo. Owns the go/no-go at sign-off. |
| **Artifact Scoping Reviewer (ASR)** | Decides which skills/agents/connectors/knowledge are in scope for this client (relevance + confidentiality — e.g. excluding another client's domain-pack content). |
| **Client Repo Maintainer (CRM)** | Runs the clone-and-filter pipeline (P3) and owns the resulting Client AI Artifacts repo's integrity. |
| **Infra Context Owner (ICO)** | Collects and validates the pilot's `pilot-context.schema.json` instance (P4) — typically the engagement's Basis/Infra contact, working from the client-side `sapSystems`/`btp` data, never handling the schema's `credentialRef` values directly (those are wired by whoever controls the secret store — see `platform/pilot-context/README.md`). |
| **Unpack Operator (UO)** | Runs the Unpack step (P5) against the filtered repo + infra context, resolves the post-unpack dependency-validation report. |
| **Factory Platform Owner (FPO)** | Owns `factory-data.json` as canonical source, framework-level own-vs-adopt decisions, and shared adapter code (`tools/<tool>/adapter/`). Not engagement-specific — one FPO covers all engagements. |

## RACI — delivery pipeline stages

| Stage | EDL | ASR | CRM | ICO | UO | FPO |
|---|---|---|---|---|---|---|
| **1. Scoping** (which components are in scope for this client) | A | R | C | I | I | C |
| **2. Clone & filter** (P3 — Factory → Client AI Artifacts repo) | I | C | R/A | I | I | C |
| **3. Infra context** (P4 — pilot-context schema filled + secrets wired) | A | I | I | R | C | I |
| **4. Unpack & sign-off** (P5 — Unpack + post-unpack validation, EDL sign-off) | A | I | C | C | R | I |

`R` = Responsible (does the work), `A` = Accountable (owns the outcome, only one per stage),
`C` = Consulted, `I` = Informed. Stage 2 shows CRM as both R and A because on an MVP-sized pilot
the same person typically runs and owns the clone/filter step; split this the moment a pilot's
scale calls for a separate accountable owner.

**Sign-off gate:** stage 4 does not complete until the EDL explicitly signs off against the
post-unpack dependency-validation report (P5's acceptance criterion) — a clean validation report
alone is not sign-off, it's an input to the EDL's decision.

## Framework ownership (distinct from per-engagement delivery)

This is a second, orthogonal RACI: who decides things about the *shared factory itself*, not about
any one client delivery. A change here affects every future engagement, so it goes through the FPO
regardless of which engagement's work surfaced the need.

| Decision | Owner (A) | Consulted |
|---|---|---|
| Code/skill review before merge to `main` | FPO | Whoever authored the change |
| Own-vs-adopt posture for a new skill (see `postures`/`postureWhy` in `factory-data.json`) | FPO | ASR (for client-relevance input), original author |
| Shared adapter maintenance (`tools/claude-code/adapter/`, `tools/cursor/adapter/`, `tools/github-copilot/adapter/`) | FPO | UO (reports adapter defects found during real unpacks) |
| New connector's credential pattern (must follow the `abap-mcp`/`jira` cross-platform pattern — see `CLAUDE.md`) | FPO | ICO (for pattern reuse from `platform/pilot-context/`) |

## Client AI Artifacts repo: re-clone as the MVP update strategy

**Decision:** for MVP, updating a client's intermediate Client AI Artifacts repo after a factory
change means **re-running the clone-and-filter pipeline (P3) from scratch and replacing the
repo's content**, not merging an incremental diff into it.

**Why re-clone, not merge (for MVP):**
- The filtered repo's whole purpose is "exactly what P3's scoping decided is in scope, nothing
  else" — a merge risks silently reintroducing content the ASR excluded in stage 1, or leaving
  stale content P3 would no longer include.
- A merge strategy needs conflict resolution rules for content a client may have locally modified
  post-unpack; re-clone sidesteps that by treating the Client AI Artifacts repo as fully
  regenerable, never hand-edited.
- This is explicitly an MVP simplification, not a permanent design choice — the first time a real
  pilot has meaningful post-unpack local modifications that a re-clone would clobber, this
  decision needs revisiting (track as a fast-follow, not silently worked around).

**Operational rule:** never hand-edit the Client AI Artifacts repo. If a client-side fix is needed,
it goes back into this factory repo (or the client's own project repo, downstream of Unpack) —
never patched directly in the intermediate repo, which the next re-clone would overwrite anyway.

**What re-clone does *not* cover:** anything downstream of Unpack (P5) — a client's own project
repo, once unpacked, is the client's own to evolve; re-clone only applies to the intermediate
Client AI Artifacts repo between P3 and P5.

## Status

Process, RACI, framework-ownership table, and re-clone policy defined per this ticket's acceptance
criteria. Onboarding note packaged separately — see [onboarding-note.md](onboarding-note.md). Not
yet exercised against a real pilot (P3/P5 are still Open/Blocked-pending-P1 as of this writing) —
treat the RACI's stage boundaries as provisional until a real run tests them.
