---
tool: cap-pattern-scanner
namespace: "@epam/sap"
version: 0.1.0
owner: Vera Lazouskaya
project_types: [greenfield, brownfield, bluefield, product-development]
sdlc_phases: [realize]
operation: scan-cap-patterns
permission_scope: read-write
risk_freedom: low
readiness: in-test
provenance:
  source: internal
  source_repo: https://git.epam.com/epmc-sap/sap-ai-competency/sap-ai-factory
---

## Notes
First EPAM source baseline, 0.1.0. Earlier GitHub pilot tags retain their original
labels; they are not the version line for this initial factory contribution.

Offline Node.js tool with nine catalog entries, all with native default examples, and a
separate private experimental npm helper kept as a review-gated alternative. No project-code execution, credentials, network, or source upload. The
analyzed project is never written; the only write is an optional new --output file
(hence read-write), which refuses existing files and paths inside the project.
Classification reasoning: the Factory's permission_scope is a least-privilege declaration
of the most a tool can do (read-only, read-write, transport-release), and every other tool
here that can write a local file declares read-write. This follows that convention instead
of treating an opt-in flag as read-only, so a reviewer is not told the tool cannot write.
Default invocations write nothing, and no shared metadata semantics change.
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
