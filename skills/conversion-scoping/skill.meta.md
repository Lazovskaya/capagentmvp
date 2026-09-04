---
skill: conversion-scoping
title: Conversion scoping
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [B]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Conversion scoping"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-conversion-scoping` skill. Consumes
`readiness-analysis`'s Simplification Item findings and SAP's own RBA/RSA catalog to produce a
Changed/Unchanged/Out-of-scope business-process list. Not yet reconciled with
`skills/workshop-preparation` (comparison pending, per this factory's own port plan).

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | readiness-analysis | consumes | Simplification Item findings drive the scoping |
| artifact | business-process-scope | produces | Changed/Unchanged/Out-of-scope workbook |
| skill | adr-log | feeds-into | any "Business Decision" or gating row |
| skill | sad-drafting | feeds-into | scoped process list grounds IV.I / Section 6 |
