---
skill: workshop-scheduling
title: Workshop scheduling & agendas
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [B]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Workshop scheduling & agendas"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-workshop-prep` skill. Compared directly against
this factory's existing `workshop-preparation` skill before porting (not merged) — the two consume
different-shaped inputs and sit at different points: `workshop-preparation` is a generic coverage
gate before `fit-to-standard`; this skill schedules and builds agendas from `conversion-scoping`'s
specific Brownfield-conversion output. See this skill's own `SKILL.md` for the full comparison.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | business-process-scope | consumes | conversion-scoping's Changed/Unchanged/complexity output |
| skill | adr-log | consumes | open Proposed decisions surfaced per session |
| skill | workshop-preparation | relates-to | compared, found complementary — different input shape and pipeline position |
| connector | calendar | consumes | optional — real attendee availability for session scheduling; degrades to a schedule needing manual booking if absent |
| connector | jira | consumes | optional — links each session to its tracked workshop-prep ticket; degrades gracefully if absent |
