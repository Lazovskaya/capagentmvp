# Knowledge: clean-core

SAP's clean-core rules applied as an always-on guardrail across extensibility decisions,
custom-code remediation, and solution design. **Posture: adopt** — content is distilled from
SAP's own published guidance (ABAP Cloud programming model, SAP Help, BTP documentation),
not authored by us from scratch.

## What lives here

- `clean-core-principles.md` — the authoritative reference: what clean-core means, ABAP Cloud
  API release classification (C1/C2/not-released), how to check release state (ADT, SACM, ATC),
  in-app vs. side-by-side decision criteria, released extension-point types, and a violation
  pattern catalog for triage and remediation planning.

- `upgrade-safety-checklist.md` — per-object checklist for `extensibility-assessor` and
  `custom-code-scan`: API state, extension-point release, namespace rules, forbidden ABAP Cloud
  language constructs, ATC clean pass, transportability. Each item is a binary gate; "no" is a
  blocker unless escalated.

## Who reads these files

- **`extensibility-assessor` agent** — uses `clean-core-principles.md` as criteria at each tier
  transition in the tier ladder walk.
- **`custom-code-scan` skill** — uses `upgrade-safety-checklist.md` to classify findings and
  `clean-core-principles.md`'s violation catalog to propose remediation tiers.
- **`solution-design` skill** — reads this bucket alongside `knowledge/extensibility/` when
  constructing extensibility records for each Delta.
- **`onboarding-guide` skill** — references this bucket to explain clean-core context.

## What is NOT here

- The extensibility tier ladder (Tier 1–5 decision rubric) lives in
  `skills/solution-design/references/extensibility-ladder.md` — that is the *decision logic*;
  this bucket is the *technical criteria* the ladder references.
- Per-engagement extensibility records live in `workspace/extensibility/` (gitignored).
- Per-engagement custom-code inventory lives in `workspace/custom-code/` (gitignored).

## Status

Content written 2026-08-25. Covers: clean-core definition, API release classification, release
state check procedure, in-app vs. side-by-side criteria, released extension points, violation
pattern catalog, and upgrade-safety checklist. Sufficient for `extensibility-assessor` and
`custom-code-scan` to apply without inventing criteria.
