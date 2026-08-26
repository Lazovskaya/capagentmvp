---
skill: custom-code-scan
title: Custom code evaluation   # TEMP: sourced from activities[].title, pending a real display-name field
namespace: "@epam/sap"

category: "SAP Activate / Prepare"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [developer]
engagement: [B]                    # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run

distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal                   # internal | secondsky | SAP | community
source-repo: [TBD]

q-gate: [prepare-explore]          # TEMP: Q-gate(s) this skill's output feeds evidence into
---

## Notes
ATC (S4HANA_READINESS) baseline joined to real usage data (SCMON/UPL) to
separate retire from remediate, ranked by business criticality rather than
raw finding count. The real judgment is what to retire rather than remediate:
unused code is the cheapest code to fix.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | abap-mcp | requires | runs ATC and pulls usage data (SCMON/UPL) |
| knowledge | custom-code | produces | writes the prioritised remediation inventory |
| knowledge | clean-core | consumes | applies SAP clean-core rules to classify findings |
| knowledge | standards | consumes | applies delivery conventions |
| q-gate | prepare-explore | gates-at | exit criteria: custom-code baseline taken |
