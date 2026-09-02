---
agent: knowledge-harvester
namespace: "@epam/sap"

category: "SAP Activate / Run"
sdlc-stage: in-progress
use-case: ["Knowledge harvest"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [substance_key, sort, target_bucket, proposed_delta, recurrence_flag]
human-confirms: true                  # stated under "Purpose" rather than a dedicated `## Human-in-the-loop` section — see Notes

assistant: [TBD]
---

## Notes
Turns resolved Run-phase work into knowledge-delta proposals, pre-sorted so
a human reviewer isn't starting from raw observations — never auto-merges
into committed `knowledge/`. `human-confirms: true` is grounded in the
agent's own "Human review is mandatory before anything enters committed
`knowledge/`; deltas are proposed, never auto-merged" statement under
`## Purpose`, not a dedicated `## Human-in-the-loop` heading like several
sibling agents use — same substantive guarantee, different placement in the
source file. Checks each candidate's Substance key against the rejected-
delta recurrence tracker before proposing it fresh, so a repeat rejection is
flagged rather than re-proposed as new. Called from
`skills/knowledge-harvest/SKILL.md`.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | triage-verdict | consumes | reads resolved Run-phase RCA/fix output as harvest-candidate source material |
| knowledge | process | produces | proposed only — human review required before merge; sorted here when the lesson is client-process-specific |
| knowledge | standards | produces | proposed only — human review required before merge; sorted here when the lesson is about how we run sessions in general |
| knowledge | operations | produces | proposed only — human review required before merge; sorted here for a recurring resolved-ticket resolution worth reusing verbatim |
