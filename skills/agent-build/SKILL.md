---
name: agent-build
description: Build and govern a Joule Studio agent from an approved agent-readiness assessment, producing an agent card and evaluation pack before registration.
---

# Agent build and registration

Use this Run-phase skill only after `agent-readiness` has named the process as a
candidate and the required data access and authorization scope are known.

See `../../docs/skill-design-conventions.md` before creating or reviewing an
agent-build pack.

Use the `knowledge/extensibility` and `knowledge/standards` guidance for API,
clean-core and authorization decisions. The produced `artifacts/agent-card`
records the durable ownership, scope and evaluation evidence.

## When to use

Use when an approved readiness assessment requires a Joule agent to be built,
evaluated and either registered in AI Agent Hub or explicitly tracked as pending.

## Inputs

- approved `assessment-report` and its stable process/candidate identifiers
- named business owner, acted-as identity and authorization/data scope
- Joule Studio project or source export, plus the target tenant/runtime
- available Joule CLI and any approved external registration endpoint

## Workflow

1. Confirm the target process is in the approved `assessment-report`. Stop if it is
   absent or marked `Leave alone`.
2. Define the agent's purpose, human owner, acted-as business identity, data scope,
   tools, escalation path and reversible/irreversible actions.
3. Build the agent in Joule Studio. Prefer released APIs and explicit BTP
   destinations; do not bypass SAP authorization or add direct database access.
4. Run the Joule CLI lint/compile flow and record the exact source and runtime
   artifact versions.
5. Execute a representative evaluation pack covering happy path, missing data,
   authorization denial, tool failure, ambiguity, escalation and unsafe action.
6. Complete the `agent-card` artifact and obtain security, business-owner and
   operations acceptance.
7. Register the agent in AI Agent Hub when that tenant feature/API is available.
   Until then, keep a local registration record and mark the Hub step pending;
   LeanIX MCP may supply architecture evidence but does not register or govern
   the agent.

## Required evidence

- approved `assessment-report` reference
- Joule Studio source and compiled/deployed version
- evaluation results and unresolved limitations
- agent card with owner, acted-as identity, authorizations, data scope and
  retirement trigger
- explicit registration status: `registered`, `pending`, or `blocked`

Never treat a successful demo as production readiness. A failed evaluation,
unbounded data scope, missing owner, or unclear acted-as identity blocks release.
