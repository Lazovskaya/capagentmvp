---
name: activate
description: Single SAP AI Factory launcher. Capture Activate phase, engagement type (G/B/A/R), domain pack, data sensitivity, and ceremony depth; route to factory-onboard (orient) or the matching phase skill. Use when starting or resuming a client/engagement run. Replaces scattered "which skill first?" guessing.
---

# Activate (factory entry)

Single entry skill for an engagement run. Captures context once, then routes — it does **not**
replace phase skills, domain diagnostics, or `factory-onboard` (team orientation).

*Design conventions: `../../docs/skill-design-conventions.md`.*
*Phase routing table: `references/phase-routing.md`.*
*Explore handoff contracts: `../../artifacts/explore-chain/`.*

## When to use

- Starting or resuming work on a client engagement
- "Where do I begin?" when the ask is delivery work, not factory-team orientation
- Switching Activate phase mid-engagement (e.g. Explore → Realize defect)

**Do not use** as a substitute for `factory-onboard` (joining the factory team), or to skip
`ceremony-routing` after triage / requirements intake.

## Inputs (contract)

Ask for anything missing before routing.

| Field | Required | Values / notes |
|-------|----------|----------------|
| **phase** | yes | Discover / Prepare / Explore / Realize / Deploy / Run |
| **engagement** | yes | `G` Greenfield / `B` Brownfield / `A` Build and Extend / `R` AMS & Run |
| **goal** | yes | One sentence: what this session should produce |
| **domain_pack** | recommended | e.g. `order-to-cash` — required for Realize/Run diagnostics |
| **ceremony** | optional | `light` / `standard` / `deep` — if unknown, route via `ceremony-routing` after intake |
| **data_sensitivity** | optional | `none` / `internal` / `client-pii` — steers workspace hygiene |
| **apply_writes** | optional | default **false** — MCP mutations stay dry-run unless user passes `--apply` |

Also load `.factory/config.yaml` if present (`jira_project`, `abap_destination`, `domain_packs`).

## Steps

1. **Capture** the contract fields above. Write
   `workspace/activate/<YYYY-MM-DD>-<slug>/context.json` (gitignored) so the session is resumable.
2. **Orient briefly** — one paragraph: which phase, which engagement letter, which domain pack,
   dry-run vs `--apply`. Point at the component map only if status of the next skill is unclear.
3. **Route** using `references/phase-routing.md`:
   - Team join / "how does the factory work?" → `factory-onboard` (stop; do not auto-chain)
   - Otherwise → primary skill for phase + goal; state the next skill name explicitly
4. **Handoff, do not silently execute** the next skill unless the user asked to continue in the
   same turn. When they continue, load that skill's `SKILL.md` and follow it.
5. **Write-safety reminder** (once per session): connector mutations are dry-run unless `--apply`
   (see `docs/skill-design-conventions.md` §6).

## Routing summary (defaults)

| Phase | Typical next skill |
|-------|--------------------|
| Discover | `readiness-analysis` or `agent-readiness`; meta → `factory-onboard` |
| Prepare | `knowledge-discovery` or `custom-code-scan` |
| Explore | `requirements-intake` → `fit-to-standard` → `solution-design` → `backlog-drafting` |
| Realize (build) | `config-doc` / `abap-dev` — only if Explore design-record status is `APPROVED` |
| Realize / Run (defect) | `incident-triage` → `ceremony-routing` → domain diagnose → `defect-triage` → `fix-doc-and-regression` |
| Deploy | `cutover-plan` / `go-live-readiness` |
| Run (close) | `knowledge-harvest` / `run-exit` gate evidence |

Full table and engagement modifiers: `references/phase-routing.md`.

## Output

- `workspace/activate/<run>/context.json` — captured inputs + chosen `next_skill`
- Spoken next action: skill name + why + whether `--apply` is in force

## Judgment calls

- **STATUS beats marketing.** If `factory-data.json` marks the next skill `notstarted` or thin
  `progress`, say so and offer a degraded path (local artifacts only) rather than pretending.
- **v1 ready surface** (see root README / `readySlice` in `factory-data.json`) is Explore + O2C
  bugfix + live `jira`/`abap-mcp` connectors — prefer those when the goal fits.
- **Never invent client config or AC** to unblock routing — send to `requirements-intake` first.

## Driver

Any role. Delivery usually opens the engagement; functional/developer/architect take the routed skill.

## Status

Progress. Product-shell entry skill; routes into existing phase skills. Dry-run tested as a contract
only — not a substitute for those skills' own maturity.
