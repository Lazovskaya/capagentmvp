---
skill: architecture-diagrams
title: Architecture diagrams (draw.io)
namespace: "@epam/sap"

category: "SAP Activate / Explore"
sdlc-stage: in-progress            # not-ready | in-progress | in-test | ready
target-role: [architect]
engagement: [G, B, A]              # G=Greenfield | B=Brownfield conversion | A=Build and Extend | R=AMS & Run
use-case: ["Architecture diagramming"]

distribution-class: client-shippable

source: internal
source-repo: [sap-ai-architecture-generator]

q-gate: []
---

## Notes
Ported from `sap-ai-architecture-generator`'s `sap-architecture-diagrams` skill. Standalone —
no cross-skill dependencies in this factory. Tool-specific language from the source (a particular
web-fetch/file-delivery mechanism) was generalized during porting since this factory's skills must
stay tool-agnostic. `scripts/verify_render_with_icons.py` needs `cairosvg`, not confirmed available
in every tool environment.

## Dependency graph
| Type | Ref | Relation | Notes |
|---|---|---|---|
| skill | sad-drafting | feeds-into | diagrams support Section 2.2 System Architecture / landscape content |
| agent | sad-assembly | feeds-into | technical-sad composition can reference generated diagrams |
| knowledge | standards | consumes | applies the SAP/EPAM diagram style guide bundled in this skill's own references |
