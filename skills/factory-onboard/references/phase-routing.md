# Phase routing table

Used by `factory-onboard` when the consultant is starting **project work**. Prefer the
**primary** skill; use **alternates** when the goal sentence matches.

## Discover

| Goal signal | Primary |
|-------------|---------|
| Readiness / SI-Check / Notes impact | `readiness-analysis` |
| Which processes for agents | `agent-readiness` |

## Prepare

| Goal signal | Primary |
|-------------|---------|
| Extract client shape into guides | `knowledge-discovery` |
| ATC + usage → retire vs remediate | `custom-code-scan` |
| Role path through knowledge | `onboarding-guide` |

## Explore

Chain (do not skip backlinks):

```text
requirements-intake → fit-to-standard → solution-design → backlog-drafting
         ↓                  ↓                 ↓                  ↓
  requirements.md    decision-log+sign-off  design-record    work items
                                         + extensibility-record
```

| Goal signal | Primary |
|-------------|---------|
| Raw ask / ticket pile / notes | `requirements-intake` |
| Workshop / standard vs delta | `fit-to-standard` |
| Tier / target design for a Delta row | `solution-design` |
| Sized work items with backlinks | `backlog-drafting` |
| Depth of workshop vs design | `ceremony-routing` after intake |

Contracts: `artifacts/explore-chain/artifact-model.yaml` and `handoff.md`.  
**Status gate:** `backlog-drafting` and Realize build skills require design-record `status: APPROVED`.

## Realize

| Goal signal | Primary | Gate |
|-------------|---------|------|
| Config + transport doc | `config-doc` | design-record APPROVED for that Row ID |
| ABAP / RAP / CDS | `abap-dev` (adopt) | same |
| Migration delta check | `reconciliation` | agreed tolerance exists |
| Incident / defect intake | `incident-triage` | then `ceremony-routing` |
| Pricing symptom | after triage → `pricing-diagnostic` | domain pack `order-to-cash` |
| Billing / AR posting | after triage → `billing-ar-error-analyzer` | domain pack `order-to-cash` |
| IDoc fail | after triage → `idoc-failure-analyzer` | — |
| Generic RCA | after triage → `root-cause-playbook` | — |
| Commercial bug vs spec | `defect-triage` | after diagnose |
| Fix doc + regression | `fix-doc-and-regression` | after RCA |
| Test design from AC | `test-case-design` | backlog AC exists |

## Deploy

| Goal signal | Primary |
|-------------|---------|
| Cutover plan / rehearsal | `cutover-plan` |
| Go-live checklist | `go-live-readiness` |
| Production conversion | `production-conversion` |

## Run

| Goal signal | Primary |
|-------------|---------|
| Hypercare intake | `incident-triage` (reuse) |
| Cluster / systemic defects | `defect-pattern-analysis` |
| Harvest into knowledge | `knowledge-harvest` |
| Engagement close | evidence for `run-exit` gate |

## Engagement modifiers

| Letter | Bias |
|--------|------|
| `G` | Prefer Explore workshop chain; light custom-code path |
| `B` | Emphasize `custom-code-scan`, readiness, conversion Deploy skills |
| `A` | Emphasize extensibility tier ladder in `solution-design` |
| `R` | Prefer Realize/Run bugfix path; skip greenfield Explore unless CR/scope change |

## Domain packs

If `domain_pack` is `order-to-cash`, load
`knowledge/domain-packs/order-to-cash/` for triage/diagnose skills.  
If unset on a diagnostic ask, ask once before `incident-triage`.
