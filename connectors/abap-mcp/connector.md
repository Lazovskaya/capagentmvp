# Connector: abap-mcp

Full ABAP repository read/write (classic ABAP, RAP, CDS/views, transports) via `mcp-abap-adt`
(`@mcp-abap-adt/core` on npm, repo `fr0ster/mcp-abap-adt`), run per-developer via `npx`. Chosen as
this factory's default ABAP connector: broadest scope (classic on-prem + BTP ABAP Cloud + legacy)
and least setup friction for a single consultant working in Claude Code, Cursor, or Copilot — no
extra IDE or infrastructure required. See "Alternatives" below for when a different connector fits
better.

## Two parts, don't confuse them

1. **This file**, the definition: what the connector is and which activities use it.
2. **`server.json`** (this folder) plus the project's own `.mcp.json`, the live wiring. Secrets
   are never in either; real values live in a `.env` file outside the project directory (see
   "Wiring" below), never committed.

## What it connects to

An ABAP system (on-premise ECC/S/4HANA, SAP BTP ABAP Environment, or a legacy system on BASIS <
7.50) via ADT, run locally per developer through `npx -y @mcp-abap-adt/core` (stdio transport).
Auth is either JWT/XSUAA (BTP ABAP Cloud, `SAP_AUTH_TYPE=xsuaa`) or basic username/password
(on-prem, `SAP_AUTH_TYPE=basic`).

**Verified the hard way:** the server does *not* read `SAP_URL`/`SAP_USERNAME`/etc. from the
process environment passed via `.mcp.json`'s `env` block, despite its own published
`server.json` (on the MCP registry) declaring them as `environmentVariables` — a live test against
a real sandbox system confirmed the process starts in "inspection-only mode" and every `tools/call`
fails until credentials come from one of: a `.env` file in the server's working directory, an
explicit `--env-path=<file>`, or (used here) `--env=<destination>` resolving to
`~/.config/mcp-abap-adt/sessions/<destination>.env`. Use the destination form — it's outside the
project directory by construction, so there's nothing to accidentally commit, and it's portable
across machines without an absolute path in `.mcp.json`. See `server.json` in this folder for the
exact `.mcp.json` shape and the `.env` file's expected keys.

## Wiring

1. Create `~/.config/mcp-abap-adt/sessions/<destination>.env` (any name for `<destination>`,
   e.g. `abap-sandbox`) with `SAP_URL`, `SAP_AUTH_TYPE`, `SAP_SYSTEM_TYPE`, `SAP_CLIENT`, and
   either `SAP_JWT_TOKEN` (xsuaa) or `SAP_USERNAME`/`SAP_PASSWORD` (basic). This file lives outside
   the project directory and is never read by, or written into, the repo.
2. In the project's `.mcp.json`, wire `abap-mcp` to
   `{"command": "npx", "args": ["-y", "@mcp-abap-adt/core", "--env=<destination>"]}` — matching the
   destination name chosen in step 1.
3. `tools/list` and `initialize` work with no SAP config at all; only `tools/call` needs a working
   destination, so a broken or missing `.env` file surfaces as a failure on first real tool call,
   not at server startup.

## Product-agnostic operations

- `read_object` (repository read: class/interface/program/table/CDS/view/BDEF source and
  metadata, where-used, package tree, AST/semantic analysis)
- `write_object` (create/update ABAP OO, RAP, DDIC, and CDS artifacts), gated behind explicit
  per-developer opt-in (this connector defaults to whatever scope the developer's own service
  key/user authorization allows — the factory adds no separate write gate on top)
- `run_diagnostics` (profiler traces, dumps, gateway error log, inactive-objects list)
- Graceful degrade: skills that need live repository facts fall back to whatever export/snapshot
  the consultant already has, and state plainly that live data was not available.

## Exposed tool surface

Four tool tiers, scoped by system type and use case (see `mcp-abap-adt`'s own docs for the full
per-tool list, this factory doesn't re-enumerate all ~80 tools):

- **Read-only** — object read, where-used, AST/semantic analysis, package/include discovery,
  enhancement discovery, runtime diagnostics. Safe default for any activity that only needs
  repository facts (`knowledge-discovery`, `custom-code-scan`).
- **High-level CRUD** — create/update/get/delete for classes, interfaces, programs, tables,
  structures, views, function groups/modules, domains, data elements. Used by `abap-development`.
- **RAP-specific** — behavior definitions/implementations, service definitions, metadata
  extensions (DDLX), CDS views. Used by `abap-development` when the target is a RAP business
  object.
- **Legacy-system tools** — for BASIS < 7.50 targets where some ADT endpoints differ.

Transport and activation support (`CreateTransport`, `GetTransport`, `ActivateObject`) is exposed;
this factory does not add its own approval gate on top — transport writes follow whatever the
developer's own SAP authorization already permits, same as any other ADT client (Eclipse, VS Code).

## If it's not connected

Nothing to fall back to for live ABAP-system operations. Skills that need it (repository read,
where-used, live CRUD) cannot act on live data until the developer has installed the server and
supplied a working destination; state that plainly rather than guessing at repository contents.

## Used by

`abap-development` (Realize), `knowledge-discovery` and `custom-code-scan` (Prepare, read-only
usage) — same activities the SAP-official connector below is scoped to, but with classic ABAP and
write operations also covered.

## Alternatives (documented, not wired as default)

Two other real ABAP ADT MCP servers exist; pick one of these instead of the default above when the
column below matches the project's actual constraint:

- **SAP's own ADT MCP server** (bundled with the official ABAP Development Tools VS Code
  extension). Use instead when the team already works in VS Code with ADT connected, wants zero
  third-party server to install, and only needs Cloud ABAP (RAP/Fiori) read/syntax-check/ATC —
  it does not cover classic on-premise ABAP. Runs at `http://localhost:2236/mcp` once enabled in
  VS Code settings, no separate auth (rides the extension's own SAP connection). No CRUD.
- **`arc-1`** (`arc-1` on npm, also ships as a Docker image, repo `arc-mcp/arc-1`). Use instead
  when the project needs enterprise-grade rollout: safe-by-default (read-only until
  `SAP_ALLOW_WRITES=true`), package-scoped write restrictions, deny-lists, audit logging, and BTP
  Cloud Foundry deployment for a shared team endpoint rather than per-developer stdio. Heavier to
  operate (Docker/BTP CF, more env vars, more security flags to reason about) — worth it once
  several consultants need governed, audited access to the same system, not for one developer.

## Never

Never put credentials (SAP_PASSWORD, SAP_JWT_TOKEN, service key contents) in `server.json`,
`.mcp.json`, or anywhere in git. Never assume a write succeeded without re-reading the object or
checking the tool's own response; record success or failure in the local artifact.

**Status:** In progress. Real, verified default (ported from live testing of `mcp-abap-adt`
against real ABAP systems, not a placeholder); the alternatives section reflects two other real,
evaluated implementations, not hypothetical options.
