---
skill: test-case-design
title: Test case design   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Realize"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [test]
engagement: [G, B, A]              # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: []                         # TEMP: Q-gate(s) this skill's output feeds evidence into — none recorded in factory-data.json for this activity
---

## Notes
Derives executable test scripts from every decision-log Row ID in a process
area, Standard and Delta alike, with an input-quality gate and per-run
ledger; picks the design technique per row's shape, seeds regression from
defect history, produces a coverage matrix, and requires review before
optional test-management sync.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | test-coverage-matrix | produces | Row ID to test-case traceability: technique used, test case IDs, status, explicit gaps |
| knowledge | process | consumes | derives test scripts from decision-log Row IDs |
| knowledge | domain-packs | consumes | picks the design technique per row's shape using domain expertise |
| knowledge | testing | consumes | seeds regression scope from defect history |
