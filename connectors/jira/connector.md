# Connector: Jira

Work items and the defect queue. The work-intent surface of record for now.

Ported from sap-ai-cons's real, live-tested wiring (`mcp/connectors/tickets.md` and
`mcp/connectors/jira-e2e-runbook.md`), the most mature connector across either predecessor repo:
actually exercised against real tickets (EPMCSAPAI-203, EPMCSAPAI-204), not just specified.
sap-ai-framework's older `connectors/jira-cloudalm.md` bundled Jira and Cloud ALM together for
planning/tracking; this factory keeps them separate, since factory-data.json already lists
`cloud-alm` as its own connector (SAP's delivery surface, needed for Deploy and Run reporting).
This file stays scoped to ticketing and incident/defect work, matching how sap-ai-cons built it.

## Two parts, don't confuse them

1. **This file**, the definition: what the connector is and which activities use it.
2. **`server.json`** (this folder) plus the project's own `.mcp.json`, the live wiring. Secrets
   are never in either; real values are supplied via environment or OS keychain.

## What it connects to

Jira, via `mcp-atlassian` (stdio, launched through `uvx`). Credentials are read from the macOS
Keychain by a small launch script, never written to a file that could be committed.

## Product-agnostic operations

- `fetch_ticket` (Jira: `jira_get_issue`, supplied keys only, no broad JQL/project scope)
- `write_classification` (Jira: additive labels plus a comment), gated behind explicit approval
- Graceful degrade to a CSV/Excel export when the connector isn't wired

## Exposed tools

Only these three, deliberately narrow:

- `jira_get_issue`, read a supplied issue
- `jira_add_comment`, explicit comment writes
- `jira_update_issue`, additive labels plus comment, in the approved write-back only

No create, delete, transition, assignment, project search, or broad JQL tool is exposed. No
status, priority, or assignee change ever happens through this connector.

## Write-back contract

1. Read, classify, and write the local artifact first.
2. Preview the exact labels and comment before touching Jira.
3. Require explicit user approval, low-confidence classifications need it even more.
4. Preserve every existing label; only append normalized `sap-*` labels.
5. Add the classification comment; never change workflow fields.
6. Verify by re-reading the issue after write-back; record success or failure in the local
   artifact rather than assuming it worked.

## Label convention

All labels lowercase and additive: `sap-triaged`, `sap-process-<subprocess>`,
`sap-layer-<layer>` (or `sap-layer-mixed` for multi-lane tickets, never force a single lead
layer when several genuinely apply), `sap-severity-<s1|s2|s3>`, `sap-confidence-<high|medium|low>`.
Never encode client data, document IDs, or root-cause text in a label.

## If it's not connected

`defect-triage` and anything else that reads tickets falls back to a file export the consultant
holds, and states plainly that classification was not written back to the tracker. Nothing
blocks on this connector being present.

## Used by

`defect-triage` (this factory's Realize and Run activities), and eventually backlog-drafting once
that skill needs live work-item creation rather than just reading.

## Never

Never put credentials in `.mcp.json`, `server.json`, or anywhere in git. Never transition, assign,
or change priority/status through this connector, regardless of what a skill's classification
implies should happen next, that decision stays with a human.
