---
connector: jira
namespace: "@epam/sap"

connector-type: mcp
system-type: []                       # not SAP-system-facing — this axis doesn't apply
auth-type: [token]                    # JIRA_API_TOKEN via mcp-atlassian
sdlc-stage: ready

distribution-class: client-shippable

source: community                     # wraps the public mcp-atlassian package via uvx
source-repo: "https://github.com/sooperset/mcp-atlassian"

verified-live: "unspecified-date — connector.md documents live re-verification against real tickets (EPMCSAPAI-203, EPMCSAPAI-204) after the launcher rewrite, but records no ISO date; CLAUDE.md names this as one of the two genuinely live-tested connectors as of writing"
---

## Notes
Deliberately narrow tool surface: only `jira_get_issue`, `jira_add_comment`,
`jira_update_issue` are exposed — no create, delete, transition, assignment,
project search, or broad JQL. Default is dry-run; live mutations require
explicit `--apply`. A working launcher (`scripts/start-mcp-atlassian.py`)
was missing until this connector was written — `uvx mcp-atlassian` alone
starts with no credentials and cannot authenticate; the launcher reads
`~/.config/mcp-atlassian/sessions/<destination>.env`, cross-platform via
Python's `Path.home()` (the original ported macOS Keychain-only script was
replaced for this reason).

## Dependency graph
Usually empty — a connector reaches out to its external system and rarely
calls anything else in the factory. Callers are never listed here: that is
recorded as a `requires` row on each calling skill's or agent's own sidecar.
| Type | Ref | Relation | Notes |
|---|---|---|---|
| *(none)* | | | |
