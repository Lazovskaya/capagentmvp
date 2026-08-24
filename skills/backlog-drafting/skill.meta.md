---
skill: backlog-drafting
title: Backlog drafting   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [delivery]
engagement: [G, B, A]              # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [explore→realize]          # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
Converts deltas and design decisions into sized, owned, traceable work items
in the work-intent system, each carrying a link back to the process decision
that caused it. Includes an AC quality check, clarifying questions when thin,
and review before push; refuses ungrounded asks and routes them back via
requirements-intake / fit-to-standard. Traceability is established here or
not at all.

## Dependency graph
(later)
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | requirements-intake | related | routes an ungrounded ask back here before drafting |
| skill | fit-to-standard | related | converts signed fit-to-standard deltas into work items |
| mcp-server | jira | requires | pushes sized, owned work items |
| mcp-server | cloud-alm | requires | delivery/operations traceability context |
| knowledge | process | consumes | traces each work item back to its process decision |
| q-gate | explore→realize | gates-at | exit criteria: backlog baselined |
