---
artifact: workshop-candidate-register
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: not-ready

distribution-class: client-shippable

source: internal
source-repo: [TBD]

q-gate: []                            # not cited in explore-realize's own Evidence-mapping table
---

## Notes
Traceable candidate requirements, decisions and open questions extracted
from a workshop transcript (TXT/VTT/SRT). Not an approved decision log and
must never be used to create Jira work items directly. Every candidate must
cite one or more stable transcript segment IDs.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | workshop-transcript-intake | produced-by | TMP — mirrors this skill's own `produces` row; remove once the catalog inverts the graph instead |
| skill | requirements-intake | related | one of the candidate "Next step" routing targets |
| skill | fit-to-standard | related | one of the candidate "Next step" routing targets |
| skill | solution-design | related | one of the candidate "Next step" routing targets |
