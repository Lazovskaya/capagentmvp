# CAP-AI-11: Handoff Prompt For The Next Coding Agent

Use the text below as the initial prompt in Claude or another approved coding assistant.
This is for continuing the factory implementation, not reviewing customer source here.
For a human-oriented summary see `cap-patterns-pilot-handoff.md`.

---

You are continuing CAP-AI-11 in the SAP AI Factory repository. Read the existing code
before changing it, preserve user work, and keep the implementation tool-agnostic.

## Baseline And Goal

- Repository: SAP AI Factory, a governed component/content repository, not a CAP app.
- Branch: `feature/cap-ai-11-suggest-patterns`, pushed to origin.
- Commits: `2ffbb1e` (portable review baseline) and `463a181` (decision hardening,
  `--output`, evaluation fixtures). Later working-tree changes may be uncommitted. No tag.
- Initial EPAM source version: **0.1.0** across agent, skill, tool, catalog, policy,
  and private npm helper. Older public 1.x/2.x pilot labels are historical experiments,
  not this source baseline's release/version line. Do not rewrite those tags.
- Confirm current Git state; do not assume anything above is still unchanged.
  The local workspace used a nested clone, so verify `git rev-parse --show-toplevel`.
- Goal: review CAP Node.js CDS/handlers for applicable native CAP patterns, producing
  evidence-backed proposals without automatic edits. Native SAP CAP is the default
  recommendation. `@epam/cap-pattern-helpers` is an optional, experimental alternative
  that always needs explicit review (see the ADR's current decision).
- Applies to Greenfield, Brownfield, Bluefield, Product Development; Realize phase.
- Do not expand into CAP-AI-10 hybrid environments or CAP-AI-12 code harvesting.

## Read First

1. `CONTRIBUTING.md`, `CLAUDE.md`, `docs/skill-design-conventions.md`.
2. `docs/adr/cap-ai-11-pattern-suggestions.md` (current vs historical decision),
   `docs/user-guide/cap-patterns-quickstart.md`, `cap-patterns-pilot-handoff.md`, and
   `cap-patterns-pilot-checklist.md`.
3. `agents/cap-pattern-advisor/agent.md` and `agent.meta.md` in that directory.
4. `skills/cap-suggest-patterns/SKILL.md` and `skill.meta.md` in that directory.
5. `tools/cap-pattern-scanner/tool.md`, `tool.meta.md`, and `catalog.json`.
6. Tool implementation/tests under `tools/cap-pattern-scanner/scripts/`, the fixtures in
   `tools/cap-pattern-scanner/fixtures/` (with `EVALUATION.md`), and
   `tools/cap-pattern-scanner/helpers/ASSESSMENT.md`.

## What Is Implemented

- A thin `cap-pattern-advisor` entry point loads the shared `cap-suggest-patterns`
  procedure. Business rules are not reimplemented separately per AI provider.
- A dependency-free Node.js 22+ CLI scans explicit local source scopes, defaulting
  to srv/db. It does not import or execute the application or call external systems.
  An explicitly requested scope that scans nothing (excluded or non-source) is incomplete.
- Nine catalog patterns cover i18n, pagination, remote errors/consumption, validation,
  common CDS aspects, query parameterization, transactions, and draft context. Every
  entry has a native example.
- Matching is heuristic text/regex analysis, NOT AST analysis or compiled CSN review.
  Worker deadlines and filesystem/result limits prevent unbounded rule evaluation.
- Default CLI output is a compact review brief: review candidates only, guidance once,
  groups by file/pattern, coverage, fingerprints, progress, and reviewPolicy checks.
- `--full` emits the complete inventory; the direct scanProject API also stays full.
- `--report` prepares saved raw/compact JSON locally, including Windows UTF-8 BOM.
- `--context` returns hash-checked source excerpts for 1-3 selected IDs: 10 lines
  before/20 after, maximum 8,000 characters each. Output includes customer source.
- `--decisions` validates a saved decision submission against the snapshot and IDs. The
  schema is strict: only `snapshotSha256`, `decisions`, and `previous` at the top level;
  only `id`, `decision`, `reason`, `checks` per decision. Statuses and counts are always
  computed. Unknown/duplicate IDs or stale snapshots fail; missing proposal evidence
  downgrades it to needs-review. Unreviewed IDs remain counted; developer acceptance is
  separate. `previous` (a prior reconciled output) rejects a submission that drops decided
  IDs. That is not an append-only audit history, and `previous` is not authenticated.
- `--output <path>` also saves the exact stdout JSON to a new owner-only file. It refuses
  existing files, symlinked or dangling targets, missing folders, and paths inside the
  analyzed project. It is the only write the scanner performs.
- Fingerprints cover scanner/catalog/manifest/source evidence. They do not guarantee
  an atomic filesystem snapshot; context checks only selected source and manifest.
- `@epam/cap-pattern-helpers@0.1.0` is private, unpublished, and experimental, with one
  export (`withRemoteError`). No scanner, catalog, skill, or adapter code depends on it.
  It appears only as a `helperAlternative` (`requiresReview`). See `helpers/ASSESSMENT.md`
  for its limitations; do not pursue its release without a separate decision.
- Existing Claude Code, GitHub Copilot, and Cursor adapters install the same core.
  Structural parity/export tests exist and pin the exact files each adapter writes. Other
  local-capable assistants can explicitly use the shared skill and CLI; browser-only
  assistants cannot directly scan folders. Only Claude Code has been run live.
- CI: `cap-pattern-tests` (Node 22/24 x CAP 9.9.3/10.1.1, including the fixtures test) and
  `cap-pattern-delivery`. Configuration alone is not evidence that remote pipelines or
  all host sessions have passed.

## Contracts And Safety

The CLI never writes the analyzed project and prints JSON. Review files are written only
with `--output` (or by an assistant) to an approved location outside application source.

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs /actual/cap-app srv db --output /approved/brief.json
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/scan.json
node tools/cap-pattern-scanner/scripts/scan.mjs /actual/cap-app --report /approved/brief.json --context FINDING_ID
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/brief.json --decisions /approved/decisions.json --output /approved/validated.json
```

Exit codes: 0 means scope traversal completed under policy, 2 means incomplete
coverage with JSON, and 1 means invalid input/fatal failure. None proves correctness.
See `tool.md` for the full decision schema. Policy gates validate declarations and
bookkeeping, not their truth, successful tests, patch applicability, or approval.

No automatic code adoption, dependency install, live service/migration execution,
client-code extraction, public upload, commit, push, tag, package publication, or release
without approval. Preserve unrelated changes and the untracked reference copies
(`cap-skill*.md`, `how-to-contribute.md` at the repo root). Do not use `git add .`.

Customer repos are in a separate SSO-protected customer environment. Transfer only
approved tooling, keep source/reports inside the customer environment, and use only
approved AI providers. Every adapter overwrites its generated entry files, so install
into empty staging/tooling folders. That overwrite is a Factory-level issue for the
infrastructure owner; do not change `adapter_common.py` or the installers here. No EPAM
credentials belong in the customer environment.

## Lessons From The Pilot

- Do not use AI subagents or repeated chunk reads to extract JSON. Parse locally.
- Do not ask the model to save JSON it printed: use `--output`. Hand-copying dropped
  guidance once and broke later steps.
- Load skill/guidance once; review selected IDs in small batches. Expand only a
  named dependency. Bounded excerpts do not guarantee total token usage or billing.
- Earlier sessions consumed around 44.7k reported tokens for two samples. No
  verified end-to-end savings claim exists for the bounded-context improvement yet.
- Never give the model fixture names, paths, or package names that reveal the expected
  answer (the first evaluation did, through directory names such as `misleading-signals`).
  Use neutral names and exclude `expected.json`.
- AI decisions vary between runs on the same fixture. Do not claim stability or quality.
- All candidate IDs need decisions; reviewing one item does not finish its file.
- req.error collects errors; CAP automatically rejects them after handler phases.
  Missing req.reject is not itself defective. Production CAP 5xx responses are
  sanitized by default by response handling, not specifically the HANA adapter.
- Unsafe query text is not automatically proof of exploitable SQL injection. Typed
  null differs from quoted 'null'; undefined/numeric/string behavior needs evidence.
- Association-path/nested-object equivalence needs cardinality/CQN/adapter evidence.
  Static backend functions can remain while dynamic values are bound. Binding values
  does not establish authorization; distinguish application-service and direct DB calls.
- Generate clean non-applied diffs from actual source. No HUNK narration in code,
  invented old lines, raw-error logging suggestions, or fixture-free test assumptions.
- Public tests/fixtures contain synthetic examples only. Do not copy client reports,
  names, code, or paths into this repository or public release assets.

## Verified Evidence And Known Blockers

- Verified this session on macOS: 50 Node tests pass on Node 22.23.3 and on 24.5.0, and
  46 Python tests pass. Rerun them; do not present these as your own fresh verification.
- Real OData HTTP checks passed for the helper and for the native `req.reject` example on
  @sap/cds 9.9.3 and 10.1.1, Node 24.5.0, loopback HTTP, test-only dummy auth. The native
  check was a scratch run, not a committed test. This does not certify SSO/BTP, HANA
  execution, all versions, or association-filter equivalence.
- The factory validator has nine previously reproduced baseline failures: missing
  Artifact/business-process-scope and Skill/workshop-scheduling; orphan Artifacts
  brownfield-adr-log/brownfield-sad; orphan Knowledge config/custom-code/data/
  extensibility/process. Dependency lint also reports unrelated pre-existing drift.
  Do not silently fix unrelated components or suppress failures to claim readiness.
- The owning Developer Assistant and practice-controlled role/use-case/operation
  approvals are still missing. Keep CAP-AI-11 as the pilot selector until approved;
  do not invent governance approval or attach it to the incompatible architect path.
- Live GitHub Copilot and Cursor sessions have not been run. Claude Code live runs are few,
  small, and synthetic (`fixtures/EVALUATION.md`).
- Production admission also needs runtime policy and customer acceptance. No 1.0 claim.
  Helper registry, ownership, license, and security approvals are not being pursued.

## Recommended Next Work

1. Verify Git state and rerun the tests. Give a short findings-first assessment.
2. Agree governance routing and release responsibilities with the practice owner.
3. Run live Copilot and Cursor sessions on the same synthetic fixtures, with neutral
   names, if licences and environments exist. Record anything not run as not run.
4. Measure an approved bounded-context pilot: tokens, calls, elapsed time, false
   positives, and accepted proposals, with several runs per project to see variance.
5. Improve detector precision with synthetic regression cases (comments and string
   literals are flagged today). Consider a proven JS/TS parser or opt-in supplied CSN only
   when evidence justifies extra packaging dependencies. Preserve offline delivery and do
   not build a hosted/vector service.
6. Treat the installer overwrite issue and baseline-validator cleanup as separately
   scoped Factory work.

Follow the repo's metadata/semver conventions. Do not introduce unimplemented version
syntax into dependency graphs or refactor all existing adapters as incidental cleanup.
Keep one source procedure, deterministic reusable tools, small tests, and thin host
adapters. Explain trade-offs before broadening scope.

## Validation Commands

```sh
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs tools/cap-pattern-scanner/scripts/delivery.test.mjs tools/cap-pattern-scanner/scripts/fixtures.test.mjs tools/cap-pattern-scanner/helpers/index.test.js
python3 scripts/lint_dependencies.py
python3 scripts/generate_factory_data.py --check
python3 validators/validate_factory.py
python3 -m pytest tests/
git diff --check
```

`python3 build.py --regenerate` and `scripts/generate_factory_data.py --write` rewrite
tracked generated files; run them only when needed and verify the exact diff.
pytest/jsonschema may need an isolated Python environment. Do not rely on earlier
temporary /tmp test environments. For optional real CAP tests, use isolated exact
runtime installs and CAP_TEST_PROJECT with NODE_ENV=production; never install into
the customer application just to run factory checks. See the tool README.

Start by reporting current Git state, what you verified, the highest-priority gap,
and one focused next change. Implement authorized small fixes with tests rather
than proposing a wholesale rewrite. Keep user changes intact and disclose blockers.
