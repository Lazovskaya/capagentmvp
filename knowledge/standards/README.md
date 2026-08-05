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

## Status

In progress. The bucket structure and file set are ported; the actual standards content inside
each file is still TODO, same as it was in sap-ai-framework.
