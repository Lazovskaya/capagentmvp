---
assistant: abap-developer
namespace: "@epam/sap"

role_scope: abap-developer
engagement: [G, B, A, R]     # G=Greenfield | B=Brownfield | A=Build and Extend | R=AMS & Run

sdlc-stage: in-test          # not-ready | in-progress | in-test | ready
distribution-class: client-shippable  # client-shippable | epam-internal-only | public-external

source: internal             # internal | secondsky | SAP | community
source-repo: [TBD]
---

## Notes

Entry point for the Developer role (`roles.developer`), active across Prepare → Realize
→ Run. All four use cases are skill-only today, so every `routes-to` edge points at a
**skill**; there is no developer-owned bounded-verdict agent in the first wave.

**Connectors are not assistant edges.** Per the practice model, an Assistant does not
call tools or connectors directly — so `abap-mcp` and `arc-1` are deliberately absent
from the dependency graph below. `abap-dev` and `custom-code-scan` reach them under
their own least-privilege scope; recording them here would misstate the call chain.

**MVP routing deviation.** Strict model is Assistant → Agent → Skill; wrapping these
build skills in bounded agents is second-wave work. `use_case_id` identifiers are
descriptive labels until a registry exists.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | abap-dev | routes-to | no agent wrapper yet; classic ABAP / RAP / CDS |
| skill | custom-code-scan | routes-to | no agent wrapper yet; ATC + usage baseline |
| skill | fix-doc-and-regression | routes-to | no agent wrapper yet; acts on a confirmed defect verdict |
| skill | agent-build | routes-to | no agent wrapper yet; Joule Studio agent build |
| knowledge | custom-code | requires | custom-code guidance loaded as role context |
| knowledge | clean-core | requires | clean-core principles loaded as role context |
| knowledge | testing | requires | regression / test guidance loaded as role context |
