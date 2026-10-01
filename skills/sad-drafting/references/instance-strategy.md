# Decision matrix: Instance strategy

Consultant decision guide for the system landscape section of the Brownfield SAD.
Present these options with evidence from the readiness artifact's system landscape findings.
Each decision requires explicit human confirmation before recording to the ADR log.

## Decision 1 — Number of production instances

| Option | When to recommend | Key indicators |
|---|---|---|
| **Single S/4HANA instance** | Recommended default for most Brownfield conversions | One ERP system today, no regulatory mandate for separation, < 5 company codes |
| **Multiple instances** | Legacy multi-ERP or regulatory separation required | Separate ERP systems for distinct legal entities, strict data-residency rules, independent go-live windows |

Evidence to cite: readiness check's System Landscape chapter, mandant list from the export.

## Decision 2 — Mandant concept

| Option | When to recommend |
|---|---|
| **Single production mandant** | Standard; simplest transport and authorisation model |
| **Multiple production mandants** | Distinct business units on one instance requiring data isolation without separate instances |

SAP recommendation: avoid multiple production mandants unless legally mandated — increases
transport, authorisation, and cutover complexity disproportionately.

## Decision 3 — System landscape (number of non-production instances)

Standard SAP landscape configurations:

| Configuration | Instances | When to use |
|---|---|---|
| 3-system | DEV / QA / PRD | Standard; recommended for all production Brownfield conversions |
| 4-system | DEV / QA / PRE-PRD / PRD | Large programmes, complex integrations, separate pre-prod validation |
| 2-system (DEV + PRD) | Not recommended for Brownfield | Only acceptable for very small, low-risk conversions with frozen custom code |

## Decision 4 — Multi-ERP consolidation

Relevant only when readiness identified multiple source ERP systems.

| Option | When to recommend |
|---|---|
| **Sequential conversion** | Convert one ERP first, stabilize, then the next; lower risk per step |
| **Parallel conversion** | Convert all ERPs simultaneously to a single S/4HANA; faster but higher risk, requires strong programme governance |
| **Out of scope** | Consolidation deferred; each ERP converts independently to its own S/4HANA |

## Decision 5 — Transport landscape ownership

| Option | Notes |
|---|---|
| **Client manages transport landscape** | Standard; client Basis team controls CTS and release management |
| **EPAM manages transport landscape during project** | Applicable when client lacks Basis capacity; requires clear handover milestone |

## Recording the decision

Confirmed option(s) → ADR entry:
- `decision_type: conversion-approach`
- `stage: sad-drafting`
- `title: Instance strategy — <summarise chosen option>`
- `description`: state each sub-decision (instances, mandants, landscape, consolidation)
- `rationale`: cite the readiness evidence that supports the choice
