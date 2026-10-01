# SAP AI Factory — *.meta.md and body file templates

Source: `ai-strategy-materials/AI Artifacts/AI artifact meta-models for MVP/`
Canonical URL: https://git.epam.com/epmc-sap/sap-ai-competency/ai-strategy-materials/-/tree/main/AI%20Artifacts/AI%20artifact%20meta-models%20for%20MVP

Use these templates verbatim when authoring new artifacts. Replace every `<placeholder>` with
a real value; do not leave angle-bracket tokens in committed files.

---

## Assistant

### assistant.md

```markdown
# <assistant-stable-id>

[Put the description of your assistant here]

## Routing table

| Use case ID | Eligible Agent ID | Routing rule |
|---|---|---|
| `<use-case-stable-id>` | `<agent-id>` | [Describe rule for AI how to decide that this agent should be used] |

Routing strategy: [Describe the routing strategy]
```

### assistant.meta.md

```yaml
---
assistant: <assistant-stable-id>
namespace: "@epam/sap"
version: <semver>
owner: <person-email>
role_scope: <practice-controlled-role-id>
use_case_ids: [<stable-use-case-id>, ...]
project_types: [<project-type>, ...]
sdlc_phases: [<discover|prepare|explore|realize|deploy|run>, ...]
risk_freedom: <low|medium|high>
provenance:
  source: <internal|secondsky|SAP|community>
  source_repo: <url-if-reused>
---

## Notes
[Any notes you think required here]

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| agent | <agent-stable-id> | routes-to | Implements <use case human readable> |
| knowledge_source | <stable-source-id> | consumes | human readable note on knowledge source |
```

---

## Agent

### agent.md

```markdown
# <agent-stable-id>

[Your instructions for the agent go here]

## Output Contract
<Describe the result, required fields or artifacts, unresolved conditions, and human confirmation requirements when applicable.>
```

### agent.meta.md

```yaml
---
agent: <agent-stable-id>
namespace: "@epam/sap"
version: <semver>
owner: <person-email>
use_case_ids: [<use-case-stable-id>, ...]
project_types: [<project-type>, ...]
sdlc_phases: [<discover|prepare|explore|realize|deploy|run>, ...]
risk_freedom: <low|medium|high>
provenance:
  source: <internal|secondsky|SAP|community>
  source_repo: <url-if-reused>
---

## Notes
<bounded goal and limitations. The delivered agent.md contains the output contract.>

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| <type> | <stable-id> | <relation> | <reason or constraint> |
```

---

## Skill

### SKILL.md

```markdown
---
name: <skill-stable-id>
description: [human readable description of the skill's purpose and workflow]
---

# [Human readable skill id]

[Description of the skill]

## When to use

[Clear human-readable instructions on when to use the skill]

## Inputs (contract)

[Input contract for the skill]

## Steps

[Step by step description of what needs to be done]

## Output

[Output contract, what skill will produce and what is its format]

## Status

[Human readable state overview]
```

### skill.meta.md

```yaml
---
skill: <skill-stable-id>
namespace: "@epam/sap"
version: <semver>
owner: <person-email>
project_types: [<project-type>, ...]
sdlc_phases: [<discover|prepare|explore|realize|deploy|run>, ...]
risk_freedom: <low|medium|high>
provenance:
  source: <internal|secondsky|SAP|community>
  source_repo: <url-if-reused>
---

## Notes
<rationale, limitations, and data-quality uncertainty>

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| tool | <stable-tool-id> | requires | <operation used by the Skill> |
| knowledge_source | <stable-source-id> | consumes | <managed information required> |
| artifact | <stable-artifact-id> | produces | <delivered artifact, if any> |
| q-gate | <stable-gate-id> | gates-at | <evidence relationship, if any> |
```

---

## Tool

### tool.md

```markdown
# Tool: <display name>

## Input contract

```yaml
<input-name>:
  type: <type>
  required: <true|false>
  description: <constraint or purpose>
```

## Operation

<deterministic operation and access constraints>

## Output contract

```yaml
<output-name>:
  type: <type>
  required: <true|false>
```

## Errors and confirmations

- <error code and condition>
- <human-confirmation requirement, if any>
```

### tool.meta.md

```yaml
---
tool: <tool-stable-id>
namespace: "@epam/sap"
version: <semver>
owner: <person-email>
project_types: [<project-type>, ...]
sdlc_phases: [<discover|prepare|explore|realize|deploy|run>, ...]
operation: <governed-operation-id>
permission_scope: <read-only|read-write|transport-release>
risk_freedom: <low|medium|high>
provenance:
  source: <internal|SAP|secondsky|community>
  source_repo: <url-if-reused>
---

## Notes
<operation limits, implementation constraints, and verification uncertainty>

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
| connector | <connector-stable-id> | requires | <operation used> |
```

> A Tool that reaches an external system must declare `connector | <id> | requires`.
> A Tool that only runs locally may have an empty dependency graph table (header only).

---

## Connector

### connector.md

```markdown
# Connector: <Display Name>

<One or two sentences: what this connects to and why it exists.>

## What it connects to

<System/service name>, via <protocol/library>.
Credentials come from a `.env` file outside the project directory, loaded by a launcher script —
never written to a file that could be committed.

## Wiring

1. Create `~/.config/<tool>/sessions/<destination>.env` with `<REQUIRED_ENV_VAR>`, ...
2. In the project's `.mcp.json`, wire `<connector-name>` to the launcher script, passing
   `--destination=<destination>`.

## Exposed tools / operations

Only these, deliberately narrow:

- `<operation>` — <read-only | gated behind approval>

## Write-back contract *(omit for read-only connectors)*

**Default is dry-run.** Preview the exact change locally first; a live write happens only
when the user explicitly approves (`--apply`).

## If it's not connected

<Fallback behavior — e.g. degrade to a local file/export. Nothing should block on this
connector being present.>

## Used by

<Skill/Agent stable IDs that depend on this connector.>

## Never

<Hard boundaries — operations this connector must never perform.>

## Governance contract

```yaml
data_classification:
  input: <public|internal|client-confidential>
  output: <public|internal|client-confidential>
  credentials: restricted
default_mode: <read-only|read-write>
allowed_operations: [<operation>, ...]
approval_required: [<operation-requiring-explicit-approval>, ...]
forbidden_operations: [<operation>, ...]
write_controls:
  preview_payload: <true|false>
  local_artifact_required: <true|false>
  reread_after_write: <true|false>
  apply_flag_required: <true|false>
```
```

### connector.meta.md

```yaml
---
connector: <connector-stable-id>
namespace: "@epam/sap"
version: <semver>
owner: <person-email>
project_types: [<project-type>, ...]
sdlc_phases: [<discover|prepare|explore|realize|deploy|run>, ...]
integration_boundary:
  system: <system-or-service>
  environments: [<environment>, ...]
  access_path: <protocol-or-route>
authentication_model: [<supported-authentication-method>, ...]
data_classification: <classification>
connector_type: <mcp|cli|script|api>
permission_scope: <read-only|read-write|transport-release>
provenance:
  source: <internal|secondsky|SAP|community>
  source_repo: <url-if-reused>
verified_live: <YYYY-MM-DD|false>
---

## Notes
<integration purpose, constraints, alternatives, and caveats>

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
```

---

## Knowledge source

### knowledge.meta.md

```yaml
---
knowledge_source: <knowledge-stable-id>
namespace: "@epam/sap"
version: <semver>
owner: <person-email>
project_types: [<project-type>, ...]
sdlc_phases: [<discover|prepare|explore|realize|deploy|run>, ...]
access: <repository|public|connector>
source_location: <knowledge-relative-path-or-canonical-https-URL>
connector: <stable-connector-id>  # required only when access: connector
provenance:
  source: <internal|SAP|secondsky|community>
  source_repo: <url-if-applicable>
---

## Notes
<purpose, scope, authority, volatility, and content-handling constraints>

## Knowledge index

| Location | Coverage | Notes |
|---|---|---|
| <path-or-URL> | <knowledge covered> | <constraint or version note> |

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|
```

> Knowledge sources are always leaves — their `## Dependency graph` stays empty (header only).
> Omit the `connector` field for `repository` and `public` sources.

---

## Valid vocabulary (v0.3)

### Types (dependency graph `Type` column)

`assistant` · `agent` · `skill` · `tool` · `connector` · `artifact` · `knowledge_source` · `q-gate`

### Relations (dependency graph `Relation` column)

`requires` · `optional` · `routes-to` · `chains-to` · `produces` · `consumes` · `gates-at` · `related`

### project_types

`greenfield` · `brownfield` · `bluefield` · `ams` · `product-development` · `discovery` · `consulting` · `enterprise-architecture`

### sdlc_phases

`discover` · `prepare` · `explore` · `realize` · `deploy` · `run`

### risk_freedom

`low` · `medium` · `high`

### Forbidden edges (never declare these)

| Source | Target | Why |
|---|---|---|
| `assistant` | `tool` | Assistants never invoke Tools directly |
| `agent` or `skill` | `connector` | The Tool owns the Connector edge |
| `knowledge_source` | anything | Always a leaf |
| `q-gate` | anything | Always a leaf; producing Skill/Artifact owns the `gates-at` edge |
