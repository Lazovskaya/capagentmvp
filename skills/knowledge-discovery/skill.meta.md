---
skill: knowledge-discovery
title: Knowledge foundation   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Prepare"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A, R]           # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Knowledge foundation"]

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [prepare-explore]          # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Scans the client's real system and process landscape, custom code inventory,
configuration baseline, integration surface and process scope, and turns it
into the nine knowledge buckets every other activity reads. Includes a human
validation gate, because inferred SAP context is wrong often enough to be
dangerous: someone corrects it and adds the client-specific why. Nothing
downstream is trustworthy until this exists.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | abap-mcp | requires | scans the ABAP system landscape and custom code |
| connector | knowledge-graph | requires | grounds discovery in the business entity/relationship map |
| knowledge | process, config, custom-code, clean-core, extensibility, data, testing, operations, standards | produces | builds all nine knowledge buckets from scratch (domain-packs is a distinct, separately-sourced bucket, not built here) |
| q-gate | prepare-explore | gates-at | exit criteria: knowledge built and validated |
