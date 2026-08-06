# Connector: abap-mcp

Object read, syntax check and ATC from the session, via the MCP server bundled with SAP's
official ABAP Development Tools VS Code extension (SAPSE, generally available since Q2 2026).
Runs locally, inside each developer's own VS Code, not on a shared client endpoint.

**Scope limit:** GA release covers ABAP Cloud development (RAP, Fiori services), not classical
ABAP. `abap-dev` (RAP/CDS work) benefits directly; classical, on-premise ABAP still needs
Eclipse ADT for now.

## Enable it (per developer, one-time, in VS Code)

1. Install the ABAP Development Tools extension from the VS Code marketplace.
2. Command palette, Preferences: Open Settings (UI), search "ADT MCP Server".
3. Check Enable ADT MCP server (off by default, for security).
4. Note the port (`Adt > McpServer: Port`, default 2236). Once enabled, the server runs at
   `http://localhost:<port>/mcp`.
5. Separately connect the extension itself to the actual ABAP system: HTTP/OAuth for a BTP ABAP
   Environment, or RFC/SSO for on-premise. Personal, per-developer setup, not something a project
   configures centrally.

## Wiring

Local, not client-scoped: always `localhost`, on whichever port the developer set (default
2236). No secrets, since it is a local server. See `server.json` in this folder for the
config fragment, and each tool adapter's own MCP config file for how it lands per tool.

## If it's not connected

Nothing to fall back to for live ABAP-system operations. Skills that need it (browsing a real
RAP business object, live syntax check) cannot act on live data until this is enabled.

**Status:** In progress. Real, verified scope and setup steps (ported from the same research
behind `sap-gain`'s `abap-adt` connector); the wiring pattern below is real, not a placeholder.
