---
connector: cloud-alm
namespace: "@epam/sap"

connector-type: [mcp, script]          # two integration modes for the same service — see Notes
system-type: []                        # not ABAP-system-facing — this axis doesn't apply
auth-type: [oauth2]
sdlc-stage: in-test

distribution-class: client-shippable

source: [TBD]                          # the sap-cloud-alm-mcp binary's publisher (SAP-official vs. community) is not stated in connector.md or server.json — do not assume
source-repo: [TBD]

verified-live: partial   # script-pattern CALM_TM push: verified 2026-09-01. MCP mode: not yet verified.
---

## Notes
Two integration modes for the same service, not two connectors: the **MCP
pattern** (Claude Code calls Cloud ALM at runtime via `sap-cloud-alm-mcp`,
default read-only, controlled writes require explicit approval) and the
**script pattern** (`tools/ingest_sap_best_practices.py` calls the Process
Content API directly via OAuth2 to regenerate the SAP Best Practices
taxonomy cache — confirmed a **dead end** for L1 hierarchy, 2026-08-24: the
API returns real data but no L1 value-stream field). Credentials for both
modes live outside the repo (`~/.config/sap-cloud-alm-mcp/profiles/` and
`~/.config/cloud-alm/sessions/`, respectively). Delete operations and log
posting are explicitly out of the default factory posture.

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
