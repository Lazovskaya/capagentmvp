# CAP-AI-11: CAP Pattern Suggestions

Status: Proposed; tested offline pilot candidate for a limited internal pilot. Broader
distribution and production admission are pending (see the pilot handoff).
Release baseline: 0.1.0, first EPAM source contribution; committed and pushed on
`feature/cap-ai-11-suggest-patterns` (see Commit History), not tagged or released.
Scope: Greenfield, Brownfield, Bluefield, Product Development; Realize.
Decision owner: Vera Lazouskaya. Library reviewer and reuse-rights approver are
separate responsibilities, even when one person holds both.

## Decision

Current decision (2026-10-18):

- CAP-AI-11 scans an explicitly scoped CAP Node.js project with a deterministic, offline
  scanner and recommends applicable patterns.
- Native SAP CAP implementations are the default recommendation wherever they apply.
  Every catalog entry carries a native example.
- The scanner, catalog, skill, and review workflow work without installing any package.
  Adapters do not add a dependency to an application.
- `@epam/cap-pattern-helpers` is private, unpublished, experimental, and optional. A
  helper-based recommendation appears only as a `helperAlternative` marked
  `requiresReview`. It requires explicit review and is never presented as production-ready
  or as a mandatory dependency.
- Discovery metadata lives in a JSON catalog next to the scanner. An explicitly invoked
  factory skill interprets deterministic evidence and proposes changes; developers decide.
- Do not build a vector database, hosted service, universal code rewriter, or automatic
  background agent for this MVP.
- CAP-AI-12 may eventually propose new or improved helpers. Any contribution must pass
  testing, security and license checks, and approval by an owner who has not yet been
  named. Nothing publishes automatically, and no CAP-AI-12 intake is implemented here.
- No registry, package ownership, license, security review, or customer acceptance for
  the helper has been requested or approved; none is being pursued now.

Historical decision (superseded): the first draft of this ADR kept reusable implementation
in a versioned npm package and had the skill propose versioned adoption of it. The
assessment in `tools/cap-pattern-scanner/helpers/ASSESSMENT.md` found the package too
immature to propose, and the catalog does not need it, so the package-first design was
dropped. That assessment also lists what a future release would need.

```mermaid
C4Container
  Person(developer, "Developer", "Chooses scope, reviews, and decides adoption")
  Container(skill, "cap-suggest-patterns", "Factory skill", "Reviews candidates")
  Container(scanner, "Pattern scanner", "Node.js CLI", "Local scan and review; writes only explicit new files")
  ContainerDb(project, "Client project", "CDS and handlers", "Explicit scan scope; changed only by an approved apply step")
  ContainerDb(catalog, "Pattern catalog", "Versioned JSON", "Rules, native examples, compatibility gates")
  Container(helpers, "CAP helper package", "Private, unpublished, experimental", "Optional alternative, needs review")
  Rel(developer, skill, "Invokes and reviews")
  Rel(skill, scanner, "Runs")
  Rel(scanner, project, "Reads without executing")
  Rel(scanner, catalog, "Matches")
  Rel(skill, helpers, "May cite as a review-gated alternative")
```

## Contracts

- Scanner: Node.js 22+, explicit CAP Node.js project root and optional file/folder
  scopes; no network, project imports, lifecycle scripts, or installation. The scanned
  project is never written by scanning, review, or the sheet; their only write is an optional
  new `--output` file that refuses existing files and paths inside the project. A separate
  `apply.mjs` writes the project only for a proposal the developer approved, bound to the exact
  verified diff, after a confirmation that shows it, and records the real test result.
- Inventory: sorted scanned paths, excluded paths/reasons, unreadable/oversize
  paths, CDS version declaration, candidate evidence with file and line. Empty
  results mean only no heuristic matches within the recorded scope.
- Catalog: stable pattern ID, kind, maturity, source documentation, positive signals,
  compatibility checks, contraindications, and a native adoption example. An entry may add
  a `helperAlternative` (experimental, `requiresReview`) with its own example.
- Report: versioned JSON with deterministic finding IDs. Candidates are not
  semantic proofs. The skill must inspect surrounding handlers and the effective
  CDS model before recommending a replacement. No confidence percentages.
- Package contract (optional): `@epam/cap-pattern-helpers` is a proposed name only.
  It is private, unpublished, experimental, and has no owner, registry, or license decided.
  Nothing in the scanner, catalog, skill, adapters, or tests depends on it at run time. It
  exports one function, and any adoption is a separate reviewed change in the target
  project, tested on that project's CAP runtime. There is no claim of an existing vetted
  internal library. CAP version certification would be a release gate for the package,
  not inferred from unit tests.

## Implemented Scope

Detect manual properties-file access, query-limit mutation, draft annotations,
and upstream error-message forwarding. Recommend native APIs for all four. For forwarded
errors the default is a plain `req.reject` with an allowlisted static code, applied only
after checking the service contract. The experimental helper is an optional,
review-gated alternative, never the default. Retain CAP's error sanitization. No
universal upstream error parsing.
The 0.1.0 catalog also reviews remote-service consumption, declarative validation,
common CDS aspects, query parameterization, and transaction boundaries (nine entries).
The scanner uses bounded reads, worker deadlines, and evidence fingerprints. It
returns compact grouped review JSON by default; --full provides the inventory,
--report prepares saved reports, --context reads selected source excerpts, and
--decisions reconciles declared evidence and per-ID progress. Incomplete coverage
returns exit 2 with JSON; invalid input returns 1. Changed fingerprints reopen reviews.
A `proposed` decision must carry severity, an uncertainty list, and a structured solution whose unified diff the
tool verifies against the source. A separate `sheet.mjs` records the developer's approve, reject, needs-changes or
defer apart from the AI's decisions, as new files only; only `apply.mjs` changes files, after approval and
confirmation, and it records the actual test result.

All new governed components, catalog, policy, scanner, and helper package start at
0.1.0 for this first EPAM baseline. Earlier public GitHub pilot tags are retained as
historical experiments, not renamed or presented as factory releases. A release tag
should be created only after this baseline has been reviewed; none exists yet.

The agent is a thin host-neutral entry point and the skill owns one procedure.
It loads guidance once and keeps results needs-review when evidence is unresolved.
Query gates cover input/null/type behavior, association semantics, backend functions,
authorization path, clean diffs, and fixture-based expectations. Decision validation
checks declarations and counts, not semantic truth, test execution, or acceptance.
Tests use synthetic entities only. Native adapters register this same workflow for
each supported host; model obedience still needs live-session acceptance evidence.
Read batches are limited to three IDs, 10 preceding/20 following lines, and 8,000
characters per excerpt, with selected source/manifest hashes checked before reading.
This bounds tool-supplied context, not total LLM tokens or provider billing.
Java is explicitly unsupported; TypeScript is inspected heuristically, not compiled.
No AST or CDS compilation occurs in the scanner; semantic verification belongs to
the skill using the target project's supported CAP tooling with user permission.

## Adoption And Contribution Boundaries

Default outcome is a local proposal with an example/diff and tests, never edits,
dependency installation, registry publishing, or client-code upload. Project rules
and established libraries can justify declining every suggestion.

CAP-AI-12 is a future intake workflow: rights clearance, anonymized isolated
submission, duplicate comparison by intent/API/semantics, maintainer review,
compatibility tests, versioned release, then catalog update. Anonymization is not
permission to reuse client code. No client extraction or publication is implemented.
CAP-AI-10 hybrid testing is a separate use case and is not implemented here.

## Validation And Release

Run Node unit/CLI tests, the synthetic fixture evaluation test, factory dependency/schema
checks, adapter packaging tests, and registry regeneration checks. Before production use
of the scanner workflow, select supported CDS majors and run real CAP HTTP/error/i18n
tests for each. The helper package stays `experimental`; the approvals it would need
(registry, ownership, license, rights, security review) are not being pursued and are listed
in `helpers/ASSESSMENT.md` for any future decision.
Reopening is a process rule, not a scanner status: if later evidence invalidates an
accepted recommendation, record the reason and the prior decision rather than silently
overwriting approval. The scanner does not implement a `reopened` status or an audit
history. A changed snapshot makes saved decisions invalid, so the review is redone, and
`previous` only prevents a resumed submission from silently dropping decided IDs.
The supplied 10% and 40% figures are planning assumptions, not measured savings.
Real OData HTTP tests passed for the helper and for the native `req.reject` example on
CAP 9.9.3 and 10.1.1 (Node 24.5.0, macOS), with production sanitization and test-only
dummy authentication; the native check was an uncommitted scratch run. The CI matrix is
configured for Node 22/24, and the full Node suite also passed locally on Node 22.23.3
and 24.5.0; configured checks are not proof of a completed pipeline.
The helper remains experimental and is not being pursued for release at this time.

The documented Assistant -> Agent -> Skill -> Tool route is incomplete: the owning
Developer Assistant and controlled role/use-case/operation IDs still need practice
approval. Preserve CAP-AI-11 as the pilot selector rather than inventing approval.
Nine baseline factory-validator errors remain a repository merge-admission blocker.

Sources: [CAP i18n](https://cap.cloud.sap/docs/node.js/cds-i18n),
[generic providers](https://cap.cloud.sap/docs/guides/services/served-ootb),
[request errors](https://cap.cloud.sap/docs/node.js/events#req-reject).
The supplied SAP skill references informed workflow boundaries; their content was
not copied and their incomplete reference trees are not runtime dependencies.

## Customer Environment Testing

For a short environment-by-environment guide, see
`docs/user-guide/cap-patterns-quickstart.md`.

Use the portable workflow in `tools/cap-pattern-scanner/README.md`. Export the live
working tree with the existing factory packager, transfer the ZIP through an approved
customer channel, and run the scanner from the extracted folder outside the client
checkout. No Git push, customer-to-EPAM access, npm install, or client mutation is
required. Source/reports remain inside the customer environment; AI review uses only an approved provider.

## Factory Installation (Optional)

For a new disposable workspace only, the factory adapter can install the use case.
Every adapter overwrites its generated entry files (`CLAUDE.md`,
`.cursor/rules/factory.mdc`, `.github/copilot-instructions.md`) and the Copilot adapter
updates VS Code settings; do not use any of them on an established customer workspace
(see Follow-Up: Installer Overwrite Behavior):

```sh
python3 scripts/github-copilot/adapter/install.py --project /path/to/cap-project --use-case CAP-AI-11
```

In that client workspace, explicitly ask the assistant to use `cap-suggest-patterns`
on the named handler/model folders, or run the deterministic evidence scan directly:

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project srv db
```

This does not install the helper as an application dependency. The factory adapter
copies its source alongside the scanner; adoption requires a separate reviewed
decision. Test the implementation in the factory with:

```sh
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs tools/cap-pattern-scanner/scripts/delivery.test.mjs tools/cap-pattern-scanner/scripts/fixtures.test.mjs tools/cap-pattern-scanner/helpers/index.test.js
```

## Portable Baseline

Keep the current factory component layout. It separates the responsibilities
needed by CAP-AI-11 without introducing a server, model vendor SDK, or orchestration
framework. A recommendation to use native CAP is valid; the default workflow needs no
custom helper for any pattern. The one bundled npm helper remains private/experimental.
Move it into an independently released library only when ownership, compatibility,
and real reusable APIs justify that release, not to increase the catalog count.

```text
agents/cap-pattern-advisor/       bounded entry point and output contract
skills/cap-suggest-patterns/     one shared review procedure
tools/cap-pattern-scanner/       catalog, deterministic CLI, policy, tests
  scripts/                      scan, match, prepare, context, reconcile
  helpers/                      private experimental npm helper
scripts/<host>/adapter/          native delivery, not separate domain logic
docs/adr/                       architecture and acceptance boundaries
```

Supported packaging adapters (same CLI/catalog/policy in every layout):

| Host | Agent | Skill | Entry |
|---|---|---|---|
| Claude Code | `.claude/agents/cap-pattern-advisor.md` | `.claude/skills/cap-suggest-patterns/` | `CLAUDE.md` |
| GitHub Copilot | `.github/agents/cap-pattern-advisor.md` | `.agents/skills/cap-suggest-patterns/` | `.github/copilot-instructions.md` |
| Cursor | `.cursor/agents/cap-pattern-advisor.md` | `.cursor/skills/cap-suggest-patterns/` | `.cursor/rules/factory.mdc` |

Adapter installation and identical shared scanner content are tested for all three.
Do not confuse packaging tests with live-host certification. Current VS Code docs
allow plain .md files under .github/agents even though .agent.md is the conventional
extension; do not change shared adapter APIs speculatively. Existing adapters can
overwrite their generated entry files, so run them into fresh staging/tooling folders,
not blindly over established customer configuration.

Other approved assistants can use the same CLI/JSON contracts if they can execute
local commands and read files. A browser-only assistant needs an approved external
local execution step. No automatic native registration is claimed for hosts without
an adapter. CAP Java remains unsupported; inspecting an application's Node version
does not execute it or change its runtime dependencies.

Cost policy: no AI-based JSON extraction, one skill/guidance load, small requested
samples, hash-checked --context batches, named dependency follow-ups only, and stop
at needs-review when evidence is unavailable. Do not launch a coordinator just to
run one skill or reread full files for repeated matches. Measure end-to-end token
usage on the next approved pilot; a tool excerpt budget is not a measured savings claim.

## Follow-Up: Installer Overwrite Behavior

Status: open, outside CAP-AI-11 scope; needs the Factory infrastructure owner.

Observed 2026-10-18 by installing `--use-case CAP-AI-11` with each adapter over a
workspace holding pre-existing files: `claude-code`, `cursor`, and `github-copilot`
silently replaced `CLAUDE.md`, `.cursor/rules/factory.mdc`,
`.github/copilot-instructions.md`, and the installed agent/skill files, with no prompt
or backup. This is by design for generated files (the generated header says it will
overwrite), and it affects every use case because the logic is shared
(`scripts/adapter_common.py` and each `install.py`). CAP-AI-11 therefore keeps the
documented rule of installing only into an empty staging folder; a delivery test pins
the exact file set each adapter writes. A possible fix, not approved or implemented,
is to refuse to replace files that are absent from `factory-lock.json` unless forced.
Changing it requires an owner decision and regression tests across all use cases.

## Commit History

- `2ffbb1e` feat: add CAP-AI-11 portable review baseline (the three governed components,
  this ADR, generated registry outputs, and the CI jobs).
- `463a181` feat: harden CAP-AI-11 decisions, add --output, add evaluation fixtures.

Both are on `feature/cap-ai-11-suggest-patterns` and pushed to origin. No tag or release
exists. Changes made after `463a181` stay uncommitted until someone commits them.

Stage explicitly (do not use git add .), and do not stage the reference copies
(`cap-skill*.md`, `how-to-contribute.md`), generated delivery ZIPs outside this clone,
customer source or reports, or unrelated files. Push the feature branch to EPAM for
review, not the full factory tree or history to the public ZIP host. Production
admission is still blocked by the governance, runtime, customer-acceptance, and
baseline-validator gaps above.

Do not refactor all three existing installer implementations or invent new versioned
dependency syntax as part of this feature. Those platform changes need a separate,
tested proposal rather than being mixed into the CAP review baseline.
