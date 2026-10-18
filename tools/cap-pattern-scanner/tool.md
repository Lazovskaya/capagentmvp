# CAP Pattern Scanner

Inspects explicitly scoped local CAP Node.js CDS and handler sources for catalog
signals, returning deterministic candidate evidence and coverage without executing
project code, calling external services, or changing the scanned project.

## Interface

Requires Node.js 22+. No npm install or third-party dependencies required.

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project [relative-path ...]
node tools/cap-pattern-scanner/scripts/scan.mjs --report /path/to/existing-report.json
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/brief.json --decisions /approved/decisions.json
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project --report /approved/brief.json --context FINDING_ID
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project srv db --full
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project --output /approved/brief.json
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs tools/cap-pattern-scanner/scripts/fixtures.test.mjs tools/cap-pattern-scanner/helpers/index.test.js
node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs
```

Default scope: `srv db`. Accepts directories or individual `.cds`, `.js`, `.cjs`,
`.mjs`, and `.ts` files contained within the project. Package.json must declare
`@sap/cds`; Java-only projects are rejected. No CAP version compatibility is inferred
from a dependency range. Symbolic links, hidden/generated/vendor folders, and source
files larger than 1 MiB are excluded; missing/unreadable/oversize/link paths mark
coverage incomplete. `.gitignore` is not interpreted; select scope accordingly.
Reports may contain confidential relative paths even though source text is omitted.

## Output Contract

Default CLI output is a `format: cap-pattern-review` brief. Findings include only
review candidates. Context-only observations are counted in `summary.contextOnly` and
also listed compactly in `observations`: one group per pattern and file with the file
`sha256` and `items` of `{ id, line }`, at most 100 in total, with `observationsOmitted`
counting any left out. An observation is a lead, not a candidate: it needs no decision, it
never counts in `progress`, and a decision submitted for its ID is rejected. Guidance for
every listed pattern, candidates and observations alike, appears once in `patterns`
(listing observations adds up to about 5 KB when all four context patterns fire), and
`groups` maps file/pattern to finding IDs. Initial
`progress` is unreviewed/needs-review, never an automatically established proposal.
Pass `--full` for the old complete inventory. The direct `scanProject` API retains
that full shape. This is the initial 0.1.0 baseline contract; old public pilot
labels are not the factory release version line.

`--report` converts an existing raw report or brief locally, accepts Windows UTF-8
BOM JSON, preserves evidence fingerprints, and requires no project access. Inputs
must be regular JSON files under 32 MiB. It cannot combine with a project or --full.
This is the mandatory agent preparation step for saved reports; AI JSON extraction
or repeated chunk-reading is not the fallback for an unavailable command.

`--output <path>` works with every mode. Stdout is unchanged; the identical JSON is also
saved to a new file created owner-only (0600 on POSIX; on Windows it inherits the folder's
permissions, so choose a private folder). It refuses an existing
file, a dangling or symlinked target, a missing parent folder, and (when a project is
given) any path inside that project; nothing is written on refusal and stdout stays
empty. Exit codes are unchanged, so an incomplete scan exits 2 and is still saved. Use
it instead of shell redirection or copying JSON by hand. In `--report`/`--decisions`
mode no project is known, so keeping the path outside application source is the
caller's responsibility. This is the only write the scanner performs.

`--decisions` adds deterministic decision reconciliation to a saved report or new
scan. It cannot combine with --full. It reads JSON and prints the result without
changing input files. The submission contains the exact `snapshotSha256` plus
`decisions`, each with `id`, `decision`, and `reason`. Unknown/duplicate IDs or stale
snapshots are invalid input. Supported decisions are proposed/not-applicable/needs-review;
developer acceptance is deliberately not a supported scanner decision.

To resume a review, add `previous` to the submission: the prior reconciled output for
the same snapshot. A submission that omits any ID decided there is invalid input, so
earlier decisions cannot be dropped silently. Without `previous`, a submission is
treated as complete and omitted IDs remain unreviewed.

Submissions are strict: only `snapshotSha256`, `decisions`, and `previous` at the top
level, and `id`, `decision`, `reason`, and `checks` per decision. Unknown fields, unknown
check IDs, and extra keys inside a check are invalid input; statuses, counts, and the
verdict are computed. Echoed `requestedDecision`, `blockers`, and `reviewed` are ignored,
and `reviewed: false` placeholders cannot be resubmitted. This prevents silent loss of
decisions; it is not an append-only audit history, and `previous` is not authenticated.

Every requested proposal needs `checks` keyed by the brief's reviewPolicy IDs:
source-current, diff-integrity, fixture-expectations; query proposals also need
input-contract, association-semantics, backend-functions, authorization-path. Each
check supplies a status and specific evidence. Required checks must be verified;
conditional checks may be not-applicable with evidence. Missing/unverified evidence
downgrades proposed to needs-review with blockers. All omitted finding IDs remain
unreviewed/needs-review. Final counts and verdict are computed from these results.

This validates reviewer declarations, not whether a claim is true, a patch applies,
or tests have run. Reviewers must not invent evidence to pass. Saving review files
is a separate, approved local write; prefer `--output` over saving by hand, since it
is the only write the scanner performs. Keep artifacts inside the customer boundary
and retain prior review history.

`--context` is an optional read-only, assistant-independent context operation. It
requires a project and saved report plus one to three unique IDs of review candidates or
listed observations (repeat the flag). It checks current manifest/source hashes, path containment, source
exclusions, and symlinks before returning 10 lines before/20 after each finding,
at most 8,000 characters per excerpt. When the evidence line sits inside a `try`
block, the excerpt is widened to the whole try/catch/finally statement if that fits the
8,000-character ceiling, because a catch that rewrites errors changes what the code in
the try means; the excerpt then carries `enclosing: { kind, startLine, endLine, widened }`.
If it does not fit, `widened` is false, the default window is kept, and the catch may be
missing. The statement is found by brace matching that skips strings, template literals,
and comments; it is a heuristic, and unbalanced braces simply mean no widening. Stale/invalid evidence fails with exit 1.
Incomplete original coverage retains exit 2. This is not a rescan or complete
function analysis. Output includes actual customer source and must remain inside
approved customer/AI boundaries. Truncation is explicit. Larger analysis requires
a specific justified follow-up dependency, not an unbounded folder read.

Exit 0: JSON on stdout (`schemaVersion: 1`, `useCaseId: CAP-AI-11`, `catalogVersion`,
`runtime`, `coverage`, `caveats`, `findings`) with complete traversal within the
scope/exclusion policy. Empty findings is valid, not proof of correctness.
Exit 2: the same JSON with incomplete coverage; inspect skipped paths/reasons and
rerun smaller scopes. Do not interpret this code as successful full analysis.
Exit 1: invalid root/manifest/scope or unsupported runtime; diagnostic on stderr.

Resource limits are recorded under `coverage.limits`: 1 MiB per source/manifest,
32 MiB source total, 2,000 source files, 10,000 visited entries, 5,000 findings,
depth 64. Bounded reads also detect a file growing beyond its limit. Use a trusted,
quiescent checkout; this is not a sandbox against adversarial concurrent mutation.
Rule evaluation runs in a worker with a 1-second per-file deadline. A timeout or
worker error records `analysis-timeout`/`matcher-failure`, marks coverage incomplete,
and replaces the worker before proceeding. This bounds rule CPU time per file,
not total traversal time or blocked filesystem operations.

Each finding has deterministic source-aware `id`, stable catalog `patternId`,
`status: candidate`, and `evidence: { file, line, sha256 }`. The default brief keeps
guidance once in `patterns`; the full inventory embeds it in each `recommendation`.
Guidance includes kind, maturity, compatibility checks, contraindications,
authoritative docs, non-applied example, and verification plan. An entry may add a
`helperAlternative` (experimental, `requiresReview`); the default `example` never needs it.
IDs change when source locations change; retain history when reconciling rescans.
Reports additionally include scanner version/hash, catalog hash, raw source and
manifest hashes, and a deterministic snapshot fingerprint over evidence/coverage.
Finding IDs incorporate source hashes. Reviewers must compare fingerprints before
adoption and reopen stale approvals. An unchanged hash is not semantic proof or
an atomic snapshot guarantee; continue using a quiescent checkout.

`assessment` separates `context-only` observations from `review-candidate` matches;
`summary` counts both. A connection, UUID key, draft annotation, or manual transaction
is not itself an improvement opportunity. All matches remain candidates until review.

Rules are heuristic text matching, not AST or CSN analysis: comments/strings may
match; multiline expressions and most aliases may be missed. The one exception is the
validation rule, which also follows a single simple `const x = req.data` alias and flat
destructuring such as `const { a, b: c } = req.data`. A name counts only when it is
declared once in the file; there is no scope analysis, and function parameters, nested,
default, and rest destructuring, and compound conditions are not tracked. Contextual skill review
must disconfirm false positives and check the effective model before adoption.
Coverage completeness is traversal completeness within scope, not semantic proof.

## Pattern Recipes

The catalog contains these nine entries:

| Pattern ID | Evidence signal | Review outcome |
|---|---|---|
| CAP-I18N-001 | `readFile`/`readFileSync` of a `.properties` file | Consider `cds.i18n.messages.at`; first confirm it is a CAP translation bundle, `cds.i18n` is available in the installed version, and custom fallback and placeholder behavior is preserved. |
| CAP-PAGING-001 | Assignment to `SELECT.limit` | Consider generic CAP paging; first confirm the generic READ provider serves the entity and that custom handlers, upstream limits, sorting, count, and paging contracts are preserved. |
| CAP-REMOTE-CONSUME-001 | CAP connections or direct axios/fetch calls | Review imported model, consumption/service projections, configuration, and READ delegation; no helper dependency needed. |
| CAP-REMOTE-ERROR-001 | Forwarded error messages or raw errors through req.reject/req.error | Propose service-specific safe mapping with plain `req.reject` (the default example); the optional experimental helper requires review and only suits immediate rejection. |
| CAP-VALIDATION-001 | Negated or null/undefined req.data field guards | Consider native constraints only after proving equivalent validation and error/UI behavior. |
| CAP-MODEL-001 | Explicit UUID ID keys, timestamp audit fields, or manual request UUID assignment | Review cuid/managed equivalence; preserve existing data, schema, and API. |
| CAP-QUERY-001 | Concatenated where clauses or interpolated query strings | Review data provenance and parameterization; not a confirmed vulnerability finding. |
| CAP-TX-001 | Explicit CAP tx calls and tx commit/rollback | Inspect managed vs standalone boundaries, finalization, tenant/user propagation, and async failures. |
| CAP-DRAFT-001 | `@odata.draft.enabled` in CDS (context-only) | Retain CAP-native draft handling; the annotation alone is an observation, not evidence of duplicated draft logic. |

Remote-consumption signals are context, not evidence of a defect. Local/database
connections and already-correct delegation need no changes. The catalog's example
service/entity names are illustrative; obtain real names from the target project.
For a modeled remote API, review these layers before proposing a handler:

1. Imported service model and matching `cds.requires` key/service mapping.
2. Domain-friendly consumption projection and exposed application-service projection.
3. READ delegation of the incoming CQN, preserving query and security semantics.

For example, after confirming those layers and resolving the actual entity names:

```js
const remote = await cds.connect.to('RemoteService')
const { Customers } = this.entities
this.on('READ', Customers, req => remote.run(req.query))
```

Remote/local joins and expands need their own explicit design review, not automatic
replication. Credentials never belong in examples or committed configuration.

Validation is not a mechanical replacement of `if (!req.data.title)`. If the
unconditional requirement and client contract are equivalent, an illustrative
service-level annotation is:

```cds
annotate CatalogService.Books with {
  title @mandatory;
};
```

Check false/zero, whitespace, partial PATCH, draft/deep writes, error codes,
localization, field targets, and aggregation before removing any handler code.
Conditional or external-state validation may need to remain custom.

## Extending The Catalog

1. Establish the reusable intent and check existing entries for duplicates. Prefer
	native CAP capabilities; a recommendation does not require a new npm helper.
2. Add an entry to `catalog.json`: unique stable `id`, title, native/helper kind,
	maturity, source extensions, JavaScript regex signal strings, official docs,
	compatibility checks, contraindications, non-applied example, and verification
	plan. Signals are OR-ed, findings deduplicated per pattern/file/line. A pattern
	whose signals contain `req\\s*\\.\\s*data` can set `"dataAliases": true` to also match
	a single simple alias or flat destructuring of `req.data` (see the rules above); it is not shown in guidance.
	Text matching does not establish semantic applicability. Avoid unbounded or nested
	regex quantifiers that could make scans expensive.
3. Add positive, negative, and combined-fixture tests to `scripts/scan.test.mjs`.
	Verify exact pattern IDs and evidence lines, not just the total match count.
	Add the contextual decision test to the skill if a new area needs one.
4. Bump the catalog and tool versions for new capabilities. Keep existing IDs;
	record changed semantics and never silently reinterpret prior approvals.

## Extending The Helper Package

1. Obtain reuse-rights clearance before introducing any client-derived code;
	anonymization alone is insufficient. No automatic extraction or publication.
2. Add an opt-in exported implementation to `helpers/index.js` and behavioral,
	failure, and safety tests to `helpers/index.test.js`. Keep executable helper
	implementations in code, not Markdown, and avoid wrapping native APIs solely
	to populate the library. Preserve request, tenant, and transaction boundaries.
3. Document the API/customization points in `helpers/README.md`, bump the package
	version according to API compatibility, and link the catalog entry to the exact
	package version/export. The initial catalog and helper are both 0.1.0; later
	releases can version them independently according to their own contracts.
4. Run the Node tests above and `npm pack ./tools/cap-pattern-scanner/helpers --dry-run`.
	Obtain maintainer approval and real CAP-version integration tests before any
	production recommendation. Publishing additionally requires approved registry,
	ownership, license, and rights. Keep the package private/unpublished until then.

## Offline Delivery And Release Evidence

`README.md` in this folder is the customer-facing runbook and survives packaging
(`tool.md` does not). It explains EPAM-to-customer-environment transfer, checksum verification,
scanner-only testing outside the client repo, optional policy-approved AI review,
and the remaining production/merge-admission gates. The archive reads the working
tree, so a Git push is not required. Do not claim SSO/customer-environment verification from local tests.

Factory-only archive test (Python stdlib plus Node, no customer project required):

```sh
node --test tools/cap-pattern-scanner/scripts/delivery.test.mjs
```
