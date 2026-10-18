# CAP Pattern Review: Offline Customer Pilot

Business reference: CAP-AI-11. First EPAM baseline: 0.1.0.
Scanner, catalog, review policy, governed components, and helper package: 0.1.0.
Release state: tested pilot that reads the project and writes only an optional new `--output` file; not an approved production helper release.

Earlier public pilot uploads retain their original labels and are not the version
line for this first factory contribution. No release tag exists and no publication is
implied. See docs/user-guide/cap-patterns-quickstart.md for the short usage guide.

Native SAP CAP implementations are the default recommendation. Nothing here needs the
`@epam/cap-pattern-helpers` package, which is private, unpublished, experimental, and
optional; a helper-based suggestion always needs explicit review.

## Assistant Portability

The agent, skill, catalog, and Node.js CLI are shared source, not Claude-specific
domain logic. Use an existing adapter only to generate a host's native entry files
in a new tooling/staging directory:

```sh
python3 scripts/claude-code/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
python3 scripts/github-copilot/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
python3 scripts/cursor/adapter/install.py --project /new/tooling-folder --use-case CAP-AI-11
```

Choose one command for the desired host; these commands run from the factory clone,
not the exported ZIP. Three adapters are structurally tested with the same shared
scanner; live-host behavior still needs acceptance testing in each environment.
Other approved local-capable assistants may use the generic CLI and shared skill
explicitly. Browser-only tools cannot directly scan local folders. No universal
automatic discovery or support for unimplemented adapters is claimed.

For a selected batch of up to three IDs in a saved brief, the shared tool can return
bounded source context instead of loading whole files into an AI session:

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project --report /approved/brief.json --context FINDING_ID
```

Repeat --context for additional IDs, at most three total. Each excerpt has 10 lines
before/20 after and an 8,000-character ceiling; stale manifest/source hashes fail.
The output contains actual customer source. Keep it within approved customer/model
boundaries. It is not a complete-function proof; expand only a named unresolved
dependency or leave the item needs-review. This bounds input, not all model tokens.

### Saving output: `--output`

Add `--output /approved/brief.json` to any mode to save the exact JSON it prints.
Stdout does not change. The file must be new (existing files, symlinked or dangling
targets, and missing folders are refused), is created owner-only (0600 on POSIX; on Windows it inherits the folder's permissions), and, when a
project is given, must be outside it. Nothing is written on refusal. Exit code 2 still
saves the report. Use this instead of shell redirection, which agent hosts commonly
block, and never retype or copy report JSON by hand: a live Claude Code test showed
an incomplete hand-copy failing later steps. Without a project (`--report`,
`--decisions`) choosing a location outside application source is on the caller.

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs /path/to/cap-project --output /approved/brief.json
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/brief.json --decisions /approved/decisions.json --output /approved/validated.json
```

### Windows notes

Verified by emulation on macOS, not on a real Windows machine: CRLF line endings and a UTF-8
BOM in sources give identical findings, and a BOM in `package.json` (common from Windows
editors and PowerShell 5) is accepted. The entry point also runs when the path is typed
in a different letter case; before, it exited 0 with no output.

```powershell
node tools\cap-pattern-scanner\scripts\scan.mjs "C:\work\cap-app" srv db --output "C:\approved\brief.json"
```

- Prefer `--output` over `>`; Windows PowerShell 5 redirection writes UTF-16, which breaks
  later steps.
- Quote paths with spaces. Scopes are relative to the project root.
- Symlinks and junctions are not followed; they are reported as skipped and make coverage
  incomplete (exit 2).
- Creating file symlinks needs a privilege on Windows, so the tests skip that one check
  without it. Real Windows behavior (path edge cases, long paths, antivirus) is untested.

## Separate EPAM And Customer Environments

Do not connect the customer repository to EPAM Git or copy customer code out of the customer environment.
The factory exporter reads the current EPAM working tree, including uncommitted
files. Neither an EPAM push nor a customer push is required for a local pilot.
Uncommitted files are not available on another machine until you transfer the
generated package through an approved route. A Git branch name alone transfers nothing.

On the EPAM machine, from the factory clone:

```sh
python3 scripts/package_client_artifacts.py --client-name cap-ai-11 --use-case CAP-AI-11 --out-dir ../cap-ai-11-delivery
shasum -a 256 ../cap-ai-11-delivery/client-artifacts-cap-ai-11.zip
```

Review the archive inventory. It should contain only the selected skill, agent,
scanner, catalog, helper source, tests, and this guide, not client code, credentials,
node_modules, or the full factory. The archive is factory-shaped, not a self-installing
VS Code extension; it does not contain factory unpack/adapter scripts or sidecars.

Transfer the ZIP only through the customer-approved artifact/file-transfer process.
If the customer environment prohibits uploads, ask the customer administrator to distribute an approved
package or approved internal artifact location. Do not bypass SSO, clipboard,
network, endpoint, or data-transfer restrictions. Compare SHA-256 against the value
received through a trusted channel. A checksum detects changes; it is not a signature
or legal/security approval. Do not add an EPAM Git credential to the customer environment.

## Run Inside The Customer Environment Without Installing Anything In The Client Repo

Prerequisite: an approved Node.js 22+ executable. Python, npm, network, CAP CLI,
database credentials, BTP access, and EPAM authentication are not needed to scan.
Use a local customer checkout and keep the extracted package outside it. Stop
generators/watchers first; scan a trusted, quiescent checkout rather than a hostile
filesystem. Windows/customer-environment behavior still needs a smoke test in the customer's environment.

Extract to an approved tools directory. Open a terminal in the extracted directory:

```sh
node --version
node --test tools/cap-pattern-scanner/scripts/scan.test.mjs tools/cap-pattern-scanner/scripts/fixtures.test.mjs tools/cap-pattern-scanner/helpers/index.test.js
node tools/cap-pattern-scanner/scripts/scan.mjs "/path/to/customer-cap-project" srv db
```

The default is now a compact grouped review brief, not the complete raw inventory.
Only review candidates are included; context-only observations are counted and
omitted from the shortlist, and pattern guidance is included once. Initial verdict
is needs-review until the candidates have been reviewed. To retain the previous
inventory for an audit, append `--full`.

A saved fingerprinted raw report or compact brief can be prepared without rescanning:

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs --report /path/to/saved-report.json
```

The agent/skill runs this conversion itself when an existing report is supplied.
No manual PowerShell filtering, chunk-reading, or AI extraction subagent is needed.
Windows UTF-8 BOM reports are supported. The converter preserves the original
evidence fingerprints; it does not certify that current project files still match.

## Validated Review Decisions

The updated agent asks for an approved local folder outside application source to
save its brief and decisions. It then validates the declared review evidence:

```sh
node tools/cap-pattern-scanner/scripts/scan.mjs --report /approved/brief.json --decisions /approved/decisions.json
```

The decisions file has this shape (replace all placeholders with real local evidence):

```json
{
  "snapshotSha256": "copy the exact snapshot.sha256 from the brief",
  "decisions": [
    {
      "id": "copy one actual finding ID",
      "decision": "needs-review",
      "reason": "Input/null behavior or adapter equivalence has not been established"
    }
  ]
}
```

For a proposed decision, add a `checks` object with all applicable IDs in the brief's
`reviewPolicy`. Each check is `{ "status": "verified", "evidence": "specific local evidence" }`.
Do not copy verified as a default: mark unknowns unverified, and use not-applicable
with evidence only for conditional association/function checks. The validator
downgrades unsupported proposals and computes progress for every finding ID.
It rejects stale/duplicate/unknown IDs and cannot record developer acceptance.

Only `snapshotSha256`, `decisions`, and `previous` are accepted at the top level, and
only `id`, `decision`, `reason`, and `checks` per decision (each check holds only
`status` and `evidence`). Any other field, such as `status`, `verdict`, `progress`, or
a count, is rejected: statuses, counts, and the verdict are always computed.

### Resuming a review

Save the validator's JSON output after each session. To continue, add it as `previous`
and list every earlier decision again plus the new ones:

```json
{
  "snapshotSha256": "same snapshot.sha256",
  "previous": "the complete JSON output of the earlier --decisions run",
  "decisions": [
    { "id": "earlier ID", "decision": "not-applicable", "reason": "carried forward unchanged" },
    { "id": "newly reviewed ID", "decision": "needs-review", "reason": "..." }
  ]
}
```

A submission that omits any ID already decided in `previous` is rejected, as is a
`previous` for a different snapshot. `requestedDecision`, `blockers`, and `reviewed`
echoed from earlier output are ignored and recomputed; entries with `reviewed: false`
are placeholders and must be dropped or actually reviewed. To retry a downgraded
proposal, submit `proposed` again with its `checks`.

Limitation: this prevents silent loss of decisions. It is not an append-only audit
history. The scanner does not authenticate `previous`, keep superseded reasons, or
detect a reviewer changing an earlier decision.

Query review explicitly covers null/undefined/string/number behavior, association
cardinality/path/adapter semantics, backend functions, authorization execution paths,
clean diffs, and fixture-derived expectations. A quoted test value can legitimately
match a fixture row. Bound values alone do not establish access control or make
database-specific functions portable. Unverified equivalence remains needs-review.

Validation checks declarations and counts, not semantic truth, live databases,
patch applicability, or executed tests. Keep artifacts inside the customer environment. If local review
writes are not approved, the agent must return a provisional needs-review instead.

PowerShell uses the same Node commands; for example:

```powershell
Get-FileHash .\client-artifacts-cap-ai-11.zip -Algorithm SHA256
Expand-Archive .\client-artifacts-cap-ai-11.zip -DestinationPath .\cap-ai-11-pilot
Set-Location .\cap-ai-11-pilot
node tools/cap-pattern-scanner/scripts/scan.mjs "C:\work\customer-cap-project" srv db
$LASTEXITCODE
```

The supplied project must declare `@sap/cds` in package.json. For a monorepo,
select the CAP application's directory, not the repository root. Replace `srv db`
with the actual handler/model paths. This is Node.js CAP only, not CAP Java.

Exit codes:
- `0`: traversal completed within the stated scope and exclusion policy; findings
  are still candidates, not defects or proof that the project is correct.
- `2`: incomplete coverage, for example missing scope, unreadable/oversize file,
  symlink, resource limit, or a requested scope that is excluded (such as `node_modules`)
  or not a source file. Review skipped reasons and rerun smaller scopes.
- `1`: invalid input, unsupported project/runtime, or fatal failure; no valid report.

Reports go to stdout. Optional redirection is your shell's write, not a scanner
write; use a new approved report path outside the client repo. Keep reports inside
the customer boundary: paths and identifiers can be confidential even without source.
Inspect `coverage` before findings; no findings is not a completeness claim.
Inspect `summary`: context-only observations are not actionable proposals. Retain
the scanner/catalog/source fingerprints and `snapshot.sha256` with decisions.
Before applying any proposal, rescan and reopen decisions if fingerprints differ.
Findings include source hashes, so unchanged file/line positions cannot silently
reuse approvals after source changes. Hashes do not guarantee an atomic snapshot.

The scanner does not load customer modules, run package scripts, call services,
modify source, install helpers, or change Git/VS Code configuration. Its text rules
can match comments/strings and miss aliases; it is not a security audit or AST/CSN
proof. Default exclusions include hidden/generated/vendor folders; .gitignore is
not interpreted. Limits: 1 MiB per source/manifest, 32 MiB source total, 2,000 source
files, 10,000 visited entries, 5,000 findings, depth 64. Matching runs in a worker
with a 1-second per-file deadline; analysis-timeout/matcher-failure makes coverage
incomplete. Filesystem latency/whole-scan duration are not bounded by that deadline.
Split large applications.

## Transfer Approved Artifacts Into The Customer Environment

Public release requires explicit rights to redistribute this EPAM-origin tooling;
permission to test it privately is not sufficient. Never publish customer source,
reports, credentials, EPAM repository history, or the full factory as a workaround
for email restrictions. Customer policy must independently allow the download host.

Use a versioned archive from the approved internal artifact location, or an
explicitly authorized public release. Select the archive for the intended host
and its checksum; the generic archive supports direct CLI use. Verify integrity
through a trusted checksum/review process before extracting outside application
source. No customer Git push or EPAM credentials in the customer environment are required.

If the download host or its CDN is blocked, request an approved internal mirror or
administrator transfer. Do not disable certificate checks, tunnel around controls,
or use personal credentials to bypass restrictions. A checksum downloaded from the
same location checks consistency, not publisher authenticity. Historical pilot ZIPs
must not be relabeled as this baseline without rebuilding from the reviewed source.

## Optional AI Review In The Customer Environment

Use only the customer's approved AI tool/model and data policy. The scanner is
offline; AI review is not necessarily offline. Never upload source or reports to
EPAM/public tools merely to get recommendations. Without approved AI access, review
the catalog's compatibility checks and examples manually.

For Claude Code, use the Claude-ready ZIP and run `claude` from its extracted root,
not from the customer application. It includes `.claude/agents/cap-pattern-advisor.md`,
`.claude/skills/cap-suggest-patterns/SKILL.md`, `CLAUDE.md`, and the scanner. This is
one-time native registration in the tooling folder, with no customer-repo changes.
Review Claude's trust/access prompts under customer policy. Then ask:

> Use cap-pattern-advisor to review C:\work\your-cap-app with the existing report
> at C:\work\your-scan-report.json. Review one query and one remote-error candidate first.

Use the actual project/report paths. The agent loads the skill and converts saved
JSON locally before review; no corrective prompt should be needed. The brief
embeds guidance once, CAP error-handling guardrails, groups, and progress counts.
Only code-independent extraction is deterministic; AI semantic review still needs
human verification and a customer Claude-session acceptance test.

For other approved assistants, the generic bundle still allows explicit attachment
of `skills/cap-suggest-patterns/SKILL.md` with project/report/tooling paths. They must
follow the same deterministic preparation workflow rather than manually reading JSON.

If the assistant cannot access external files, have an authorized person add only
the skill folder to the tool's supported skill location and explicitly give the
external scanner path. Review every addition. Do not use the general factory adapter
on an established client workspace for this pilot: every adapter overwrites its
generated entry files (see the file table above) and the Copilot adapter updates VS Code
settings. The standalone scanner avoids that risk entirely. Never run an installer that
was not in the bundle.

## Acceptance Checklist

1. Customer transfer/security/AI policies approve the selected procedure.
2. Extracted tests pass and scanner emits parseable JSON without client changes.
3. Coverage includes the intended application paths; incomplete items are resolved
   or explicitly accepted. Triage representative true and false positives.
4. A developer confirms at least one proposal against actual handlers, model, and
   project conventions; no measured efficiency claim is made without evidence.
5. Any code/helper adoption gets its own reviewed change and target-runtime tests.
   Do not install the proposed package name from a public registry.

## Verified Evidence And Remaining Gates

- Local scanner/helper tests and export-extract-execute tests are automated: 50 Node
  tests pass on Node 22.23.3 and on 24.5.0 (macOS), and the Python suite passes.
- Four synthetic fixtures with hand-labelled expectations pin the scanner's measured
  precision, recall, and known limitations (`fixtures/EVALUATION.md`). Small, single
  author, not independent; they say nothing about real projects.
- AI review quality and run-to-run stability are not established. The few live runs so
  far (Claude Code only) are recorded, with their confounds, in `fixtures/EVALUATION.md`.
- GitHub Copilot and Cursor were only checked statically (install layout, identical
  shared files). No live Copilot or Cursor session has been run.
- The default compact brief and Claude registration layout are tested. Instructions
  require normal CAP req.error phase handling and production 5xx sanitization checks;
  they do not prove that any particular model always follows those instructions.
- Real production-mode OData tests passed with @sap/cds 9.9.3 and 10.1.1 on Node
  24.5.0/macOS: success values, mapped 409, German localization, field target, and
  sanitized unknown 502. Test-only dummy auth and loopback listener; this does not
  certify customer SSO, authorization, BTP destinations, databases, or other versions.
- Synthetic CQN construction checks also pass on those runtimes: quoted null versus
  actual null differ, literal quoted data stays a value, and a static function can
  remain while the comparison value is bound. This is not HANA/SQLite execution or
  association-filter equivalence certification.
- CI checks Node 22/24 with those exact CAP versions. A configured job is not evidence
  that the pipeline has run or that all runtime combinations have passed.
- The helper remains private, unpublished, experimental at 0.1.0. Production
  release still needs registry/name/license/reuse-rights approval, maintainers,
  supported-runtime policy, and customer acceptance.
- Factory governance still needs the practice-approved owning Developer Assistant,
  role/operation/use-case IDs, and complete-path routing. No controlled IDs were
  silently renamed or new role approvals invented. CAP-AI-11 remains the pilot selector.
- The repository-wide factory validator has nine pre-existing errors outside this
  use case. They remain a merge-admission blocker unless maintainers resolve or
  explicitly disposition them. Do not label the whole factory production-ready.

To reproduce the real CAP HTTP checks on an approved development machine, install
an exact runtime in an isolated directory (not the customer project):

```sh
npm install --prefix /path/to/isolated-runtime --ignore-scripts --no-audit --no-fund @sap/cds@9.9.3
NODE_ENV=production CAP_TEST_PROJECT=/path/to/isolated-runtime node --test tools/cap-pattern-scanner/helpers/cap.integration.mjs
```

Repeat in a separate process/runtime directory with `@sap/cds@10.1.1`. This test
uses a real loopback HTTP server and writes only temporary synthetic fixtures.
