---
tool: cap-pattern-scanner
namespace: "@epam/sap"
version: 0.1.0
owner: Vera Lazouskaya
project_types: [greenfield, brownfield, bluefield, product-development]
sdlc_phases: [realize]
operation: scan-cap-patterns
permission_scope: read-only
risk_freedom: low
readiness: in-test
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
First EPAM source baseline, 0.1.0. Earlier GitHub pilot tags retain their original
labels; they are not the version line for this initial factory contribution.

Offline Node.js tool with nine catalog entries and a separate private experimental
npm helper. No project-code execution, credentials, network, source upload, or writes.
Default CLI output is a compact review brief; --full retains the inventory and the
scanProject API returns it directly. --report prepares saved JSON (Windows BOM
supported), --context supplies bounded hash-checked excerpts, and --decisions
validates declared evidence, snapshot identity, finding IDs, and progress.

Exit codes: 0 means traversal complete within scope/policy, 2 means incomplete with
valid JSON, 1 means invalid input/fatal failure. Rule workers have per-file deadlines.
Changed evidence fingerprints reopen reviews. Decision validation does not establish
semantic truth, executed tests, developer acceptance, or source-policy approval.

Synthetic/offline delivery and Claude Code/Cursor/Copilot adapter layouts are tested.
Real helper HTTP and CQN checks passed on CAP 9.9.3/10.1.1 with Node 24.5.0/macOS
and test-only dummy auth. Not certification of customer SSO/BTP, all hosts/versions,
HANA execution, or a production library release. Customer source excerpts stay inside
the approved customer/model boundary.

## Dependency graph

| Type | Ref | Relation | Notes |
|---|---|---|---|