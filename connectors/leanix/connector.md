# Connector: SAP LeanIX

SAP LeanIX MCP provides workspace-scoped access to enterprise architecture
facts, technology stacks, application components, transformations, surveys and
architecture decisions.

## Verified connection

The workspace-specific endpoint was tested on 2026-08-15:

```text
https://mcp.leanix.net/services/mcp-server/v1/mcp/instance/demo-de/workspace/EPAMSystemsPolandSpzooTDD
```

OAuth completed successfully and the server reported `LeanIX MCP Server 3.4.6`.
The server returned the available tools through `tools/list`.

The test workspace currently reports that Self-Built Software Discovery is not
provisioned for technology-stack reads. This is a LeanIX workspace setup
requirement, not an authentication failure.

## Packaging

This connector uses `mcp-remote` as a local OAuth bridge:

1. `server.json` contains portable stdio launcher wiring.
2. `scripts/start-leanix-mcp.py` resolves an external workspace profile.
3. `config.example.json` documents the profile without credentials.
4. OAuth client metadata and tokens are kept by `mcp-remote` outside the repository.

Default profile location:

```text
~/.config/sap-leanix-mcp/profiles/<profile>.json
```

Profile example:

```json
{
  "subdomain": "demo-de",
  "workspace": "EPAMSystemsPolandSpzooTDD"
}
```

The workspace is derived from a URL such as:

```text
https://demo-de.leanix.net/EPAMSystemsPolandSpzooTDD/dashboard/...
```

No API token, OAuth secret or bearer token belongs in this repository. User-based
OAuth is the default. Technical-user token authentication is a separate future
profile mode and must use the minimum LeanIX permissions required.

## Available tool posture

The verified server exposed tools including:

- `get_all_tech_stacks`;
- `get_application_components`;
- `get_milestones_by_fact_sheet_ids`;
- `get_reminders`;
- `search_components_by_license`;
- `search_components_by_purl`;
- `search_transformations_tool`;
- `get_survey_templates`;
- `get_survey_results`.

Tool availability is permission-dependent. The MCP server returns only tools the
authenticated LeanIX user can access.

### Default read-only posture

Use read-only tools for architecture discovery, application portfolio analysis,
technology assessment, transformation mapping and evidence collection.

### Controlled writes

Tools such as `create_architecture_decision`, `create_survey`, `create_tech_stack`
and status changes require explicit approval from the calling skill. Preview the
payload, write the local artifact first, perform the mutation, then re-read and
record the result.

Do not enable destructive or high-impact operations as a default factory
workflow. The authenticated user's LeanIX permissions remain the final boundary.

## Workspace prerequisites

- LeanIX MCP Server enabled by a workspace administrator.
- User-based OAuth allowed for the workspace, or a separately approved technical user.
- Authenticated user has the required workspace role and permissions.
- Self-Built Software Discovery provisioned if technology-stack discovery is needed.

## Local setup

```bash
mkdir -p ~/.config/sap-leanix-mcp/profiles
cp connectors/leanix/config.example.json \
  ~/.config/sap-leanix-mcp/profiles/default.json
```

Edit the external profile with the LeanIX subdomain and workspace name, then
install `npx` and run:

```bash
python3 connectors/leanix/scripts/start-leanix-mcp.py --profile=default
```

The first connection opens the OAuth page in a browser. OAuth sessions expire
according to the LeanIX authentication policy; re-authenticate when required.

## Fallback

If LeanIX is unavailable or the workspace feature is not provisioned, continue
from a customer-approved export or manually supplied evidence and record that
live synchronization was not performed.

## Governance contract

```yaml
data_classification:
  input: client-confidential
  output: client-confidential
  credentials: restricted
default_mode: read-only
allowed_operations: [get_all_tech_stacks, get_application_components, get_milestones_by_fact_sheet_ids, get_reminders, search_components_by_license, search_components_by_purl, search_transformations_tool, get_survey_templates, get_survey_results]
approval_required: [create_architecture_decision, create_tech_stack, create_survey, change_survey_status, fact-sheet-mutation]
forbidden_operations: [delete, bulk-mutation]
write_controls:
  preview_payload: true
  local_artifact_required: true
  reread_after_write: true
  external_id_required: true
  apply_flag_required: true
```

LeanIX facts, technology assessments and transformation data are workspace-
scoped. Reusable knowledge requires source reference, retrieval date,
applicability, redaction and explicit approval; OAuth tokens never enter an
artifact or knowledge bucket.