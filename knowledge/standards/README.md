# Knowledge: standards

EPAM delivery standards and the project's own conventions.

## Ported from sap-ai-framework

Copied verbatim from `sap-ai-framework/knowledge/standards/`. Correction to note: these are all
stubs (contract/purpose stated, content marked TODO), not built content, despite initially looking
like real, finished standards. Carrying them forward as-is rather than inventing content they
never had:

- `abap-s4hana.md`, guardrail constraints for ABAP under S/4HANA (SQL, released APIs, forbidden
  patterns).
- `config-guidelines.md`, standards config must conform to.
- `epam-delivery.md`, EPAM delivery guardrails, a candidate for "locked" (non-overridable) content
  later.
- `go-live-readiness-checklist.md`, checklist for the go/no-go decision.

`clean-core.md` moved to its own bucket, `knowledge/clean-core/`, since factory-data.json models
it as a separate component (adopt posture, SAP publishes it) rather than part of `standards`.

## Ported from sap-ai-cons

- `source-synthesis.md`, real, tested content (not a stub) — ported from `sap-ai-cons`'s
  `business-blueprint` skill methodology, generalized from "fill the Business Blueprint template" to
  "fill whichever target document the calling skill owns." Orchestrated by `solution-design`'s
  compose/maintain input mode, see `skills/solution-design/SKILL.md`.

## Status

In progress overall. `source-synthesis.md` is real, tested content. The other files in this bucket
(ported from sap-ai-framework) are still stubs, content marked TODO.
