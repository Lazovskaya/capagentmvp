---
skill: technical-documentation-generation
title: Technical documentation generation
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress
target-role: [technical]
engagement: [G, B]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy]
---

## Notes
Atomic, called-not-run-standalone skill: documents a code artifact an invoking agent already
generated, citing that agent's own traced spec/mapping reference IDs verbatim rather than
re-deriving purpose from the code alone. Reuses the Data Mapping / Error Handling / Selection
Screen Requirements section shapes from this factory's existing WRICEF functional-spec artifacts
(`artifacts/wricef-conversion/`, `wricef-report/`, and siblings) where a generated artifact has
an equivalent section — those document a *planned* build, this documents *already-generated*
code, so content is re-verified against the code, not copied forward unchecked. Refuses to
document any artifact with no traceable spec/mapping reference rather than inventing a purpose.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | migration-code-development | consumed-by | EPMCSAPAI-256, already committed — passes traced object-field-mapping row IDs per generated artifact |
| agent | code-development | consumed-by | EPMCSAPAI-254, not yet built in this repo |
| artifact | object-field-mapping | consumes | cited verbatim when the invoking agent is migration-code-development |
| artifact | wricef-conversion | consumes | section-shape prior art only, when a WRICEF functional spec exists for the same object |
| artifact | wricef-report | consumes | section-shape prior art only, when a WRICEF functional spec exists for the same object |
| artifact | technical-documentation | produces | purpose/inputs/outputs/key-logic doc with verbatim spec/mapping citations |
| q-gate | realize-deploy | gates-at | exit criteria: generated code has review-ready documentation |
