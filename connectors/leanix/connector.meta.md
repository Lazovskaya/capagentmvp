---
connector: leanix
namespace: "@epam/sap"

connector-type: mcp
system-type: []                        # not ABAP-system-facing — this axis doesn't apply
auth-type: [oauth]
sdlc-stage: in-progress

distribution-class: client-shippable

source: SAP                            # the MCP endpoint itself (mcp.leanix.net) is SAP LeanIX's own official service
source-repo: "https://mcp.leanix.net/services/mcp-server/v1/mcp/instance/demo-de/workspace/EPAMSystemsPolandSpzooTDD"   # verified workspace endpoint, not a code repo — this field carries a citation URL where no code repo exists

verified-live: "2026-08-15"
---

## Notes
Verified live 2026-08-15 against a real workspace endpoint; OAuth completed
and the server reported `LeanIX MCP Server 3.4.6`. Uses `mcp-remote` as a
local OAuth bridge — no API token or bearer token is ever stored in the
repo; profile (subdomain + workspace only) lives at
`~/.config/sap-leanix-mcp/profiles/<profile>.json`. The test workspace
reports Self-Built Software Discovery not provisioned for technology-stack
reads — a workspace setup gap, not an authentication failure. Default
read-only; writes (`create_architecture_decision`, `create_survey`,
`create_tech_stack`, status changes) require explicit skill-level approval.

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
