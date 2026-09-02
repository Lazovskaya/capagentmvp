---
skill: e2e-test-scenario-generation
title: E2E test scenario generation
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress
target-role: [test]
engagement: [G, B, A]
use-case: ["Test case design"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: [realize-deploy]
---

## Notes
Built for `EPMCSAPAI-258` once its dependency `e2e-process-scope` (`EPMCSAPAI-249`) resolved
2026-09-02. Called by the Test generation agent (`EPMCSAPAI-259`) alongside
[[test-case-design]] — flow-level E2E scenarios here, per-decision-log-row functional cases
there, neither substituting for the other. Inherits `e2e-process-scope`'s own honest limit (no
step-sequencing data) rather than pretending to know an order it doesn't have — every generated
scenario's step order is marked `PROVISIONAL`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | e2e-process-scope | consumes | from `EPMCSAPAI-249`; required, at least one flow |
| artifact | fit-gap-analysis | consumes | via e2e-process-scope's linked_fit_gap_rows; optional |
| artifact | e2e-test-scenarios | produces | one scenario per E2E flow, provisional step order, explicit gap-verification steps |
| agent | EPMCSAPAI-259 Test generation | feeds | direct caller, orchestrates this skill alongside test-case-design |
