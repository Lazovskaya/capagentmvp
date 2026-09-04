---
agent: simplification-items-to-processes
namespace: "@epam/sap"

category: "SAP Activate / Discover"
sdlc-stage: in-test
use-case: ["Readiness & simplification analysis"]

distribution-class: client-shippable

source: internal
source-repo: [TBD]

verdict-shape: [item_process_mappings, impact_classification, evidence_references, confidence, review_status, ambiguity_list]
human-confirms: false                 # agent.md carries no `## Human-in-the-loop` section — see Notes

assistant: [TBD]
---

## Notes
Turns an SAP Simplification Item Catalog export into a de-duplicated,
reviewable `business-process-impact-list`. Deliberately does not decide
client-specific applicability — that judgment belongs to `readiness-analysis`
once SI-Check, configuration and productive-usage evidence are available;
this agent classifies conservatively (`mandatory` / `conditional` /
`informational`) and never calls anything a conversion blocker from catalog
metadata alone. Refuses (returns `blocking missing evidence` or `gaps`)
rather than guessing when catalog provenance, `sdb_transition_db_item.xml`,
or target release are missing.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| artifact | business-process-impact-list | produces | item-to-process mappings, impact classification, evidence, confidence, review status |
| skill | readiness-analysis | related | hands off client-specific applicability and conversion-effort conclusions — a routing note, not a call this agent makes itself |
