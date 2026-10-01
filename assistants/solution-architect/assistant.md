# solution-architect

Role-scoped entry point for the **Solution Architect**: architecture-side delivery
work across Discover, Prepare and Explore, plus cross-phase architecture governance in
Run. It holds the role boundary, offers the architect's use cases, and routes each
request to an eligible agent (or, where no agent exists yet, directly to the owning
skill). It never calls tools or connectors itself — the routed agent or skill does.

## Routing table

| Use case ID | Eligible Agent ID | Routing rule |
|---|---|---|
| `brownfield-sad-authoring` | `brownfield-sad-authoring-agent` | Route when a user asks to draft, revise, review, or prepare evidence for an SAP S/4HANA Brownfield SAD. |

Routing strategy: rule-based. Scoped to the Brownfield SAD authoring responsibility for
this first release; other Solution Architect responsibilities are not yet exposed as a
use case here.
