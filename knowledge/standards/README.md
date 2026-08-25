# Knowledge: standards

EPAM delivery standards and project-agnostic conventions used as guardrails across skills.

## What lives here

- `source-synthesis.md` — real, tested content. Tool-blind methodology for building structured,
  source-traced documents from heterogeneous inputs. Ported from `sap-ai-cons`'s
  `business-blueprint` skill methodology, generalized for any target document. Orchestrated by
  `solution-design`'s compose/maintain input mode.

- `sap-architecture-references.md` — curated reference list of external SAP GitHub repos and
  official resources for SAP AI architecture, development standards, and SDK integration.

## Planned (not yet written)

The following guardrail standards were carried as stubs from `sap-ai-framework` but never had
real content written. Removed as stubs 2026-08-25 — to be written from scratch when a skill
actually needs them, not speculatively:

- ABAP/S4HANA constraints (released APIs, forbidden patterns, SQL rules)
- Configuration guidelines (what config must conform to)
- EPAM delivery guardrails (candidate for "locked"/non-overridable content)
- Go-live readiness checklist (go/no-go decision criteria)

## Status

`source-synthesis.md` and `sap-architecture-references.md` are real content. Guardrail stubs
removed; write them when a skill's SKILL.md lists them as an input it actually reads.
