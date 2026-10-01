# CI pipelines

What `.gitlab-ci.yml` runs, when, and what it needs from project settings. This is the
operator's view; the reasoning behind each design choice lives in the comments of
`.gitlab-ci.yml` itself and is not repeated here.

## When a pipeline starts

| Trigger | Starts when | Jobs that run |
|---|---|---|
| **Run Pipeline** (web) | Someone clicks *CI/CD → Pipelines → Run pipeline* on any branch | `lint-dependencies`, `pytest`, plus whichever of `package` / `package-for-tool` / `sync-*` its inputs enable |
| **Merge request** | An MR is opened or updated, targeting any branch | `lint-dependencies`, `pytest`, `check-mr-approvals` |
| **Push to `main`** | Only while `FACTORY_DATA_AUTOREGEN` is `true` (see below); an MR merge counts as a push | `regenerate-factory-data` only |

Stages run in order: `validate` → `sync` → `package`.

## Jobs

| Job | Stage | Runs on | What it does |
|---|---|---|---|
| `lint-dependencies` | validate | web, MR | `scripts/lint_dependencies.py`. Fails only on a missing `skill.meta.md`; the full dependency-graph comparison is printed but not enforced yet (no `--strict`). |
| `pytest` | validate | web, MR | `pytest tests/`. |
| `check-mr-approvals` | validate | MR | `scripts/check_mr_approvals.py`. Stands in for GitLab Premium's required approvers: fails until the required people have approved. |
| `package` | package | web, `CLIENT_NAME` set | `scripts/package_client_artifacts.py`. Produces a tool-agnostic bundle in the factory's own layout under `dist/` (job artifact, kept 30 days). |
| `package-for-tool` | package | web, `CLIENT_NAME` set | `scripts/unpack.py` once per `TARGET_TOOL`. Produces `dist/client-artifacts-<name>-<tool>/` in the tool's own shape, with internal `tool.md`/`schema.json` stripped. |
| `sync-check` | sync | web, `TEST_SOURCE_BRANCH` set | Clones `sap-ai-factory-test`, runs `scripts/sync_back.py --check`, reports whether an MR is needed. |
| `sync-open-mr` | sync | after `sync-check` | If `sync-check` found changes worth contributing, applies them and opens an MR into `TARGET_BRANCH`. Stops on a CONFLICT, which a human has to resolve. |
| `regenerate-factory-data` | sync | push to `main`, switch on | Regenerates `factory-data.json` from the `*.meta.md` sidecars and commits it to `main`. See [Auto-regeneration](#auto-regeneration-of-factory-datajson). |

## Run Pipeline inputs

Shown as form fields in *Run pipeline*.

| Input | Used by | Meaning |
|---|---|---|
| `CLIENT_NAME` | `package`, `package-for-tool` | Required for either to run; names the output. |
| `TARGET_TOOL` | `package-for-tool` | `claude-code` (default), `cursor`, `github-copilot`; comma-separated for several. |
| `INCLUDED_ASSISTANTS` | both package jobs | Assistant names or `*`. Usually enough on its own; the full dependency chain is resolved automatically. |
| `INCLUDED_USE_CASE` | both package jobs | One `use_case_id`; an alternative to naming assistants/agents. |
| `INCLUDED_SKILLS`, `INCLUDED_AGENTS` | both package jobs | Explicit names or `*`. |
| `DRY_RUN` | both package jobs | `true` = report what would be packaged, write nothing. |
| `TEST_SOURCE_BRANCH` | `sync-*` | Branch in `sap-ai-factory-test` with the SME's changes; required for sync to run. |
| `TARGET_BRANCH` | `sync-open-mr` | Branch to open the MR into; default `feature/architecture-assistant`. |

## Project variables (one-time setup)

Set under *Settings → CI/CD → Variables*. None of these are in `.gitlab-ci.yml`, because they are
secrets or project configuration.

| Variable | Needed by | Setup |
|---|---|---|
| `MR_APPROVAL_CHECK_TOKEN` | `check-mr-approvals` | Masked, protected. Token with `read_api`. |
| `MR_REQUIRED_APPROVERS` | `check-mr-approvals` | Comma-separated GitLab usernames, e.g. `alice,bob`. |
| `SAP_AI_FACTORY_TEST_READ_TOKEN` | `sync-*` | Masked, protected. `read_repository` on `sap-ai-factory-test`. Fallback only; the job token normally works. |
| `SYNC_BACK_PUSH_TOKEN` | `sync-open-mr` | Masked, protected. Project access token, `write_repository` on this project, role Developer. |
| `FACTORY_DATA_PUSH_TOKEN` | `regenerate-factory-data` | Masked, protected. Project access token, `write_repository` only, role **Maintainer** (pushing to `main` is Maintainer-only). |
| `FACTORY_DATA_AUTOREGEN` | `regenerate-factory-data` | Visible, not a secret. `true` turns auto-regeneration on; anything else, or unset, leaves it off. |

For `check-mr-approvals` to actually block a merge, the protected-branch settings of `main` and
`feature/architecture-assistant` must require *Pipelines must succeed*.

Project access tokens expire. When one does, its job fails on the push or API step; create a new
token and replace the variable's value.

## Auto-regeneration of `factory-data.json`

**Off by default.** Merging `.gitlab-ci.yml` changes nothing until someone sets
`FACTORY_DATA_AUTOREGEN` to `true`.

When it is on, after every push to `main` (normally an MR merge):

1. The job runs `scripts/generate_factory_data.py --write` and `build.py`.
2. If `factory-data.json`, `index.html` and `factory-data.js` are unchanged, it ends green with
   nothing committed.
3. Otherwise it commits them to `main` as `factory-data-bot`, with `[skip ci]` in the message so
   its own push does not start another pipeline.

**To turn it off**, set `FACTORY_DATA_AUTOREGEN` to `false` or delete the variable. This takes
effect from the next push; no code change is needed.

**What a red job means:**
- *"FACTORY_DATA_PUSH_TOKEN is not set"*: the sidecars changed but the job has no token to push
  with. Set the variable.
- Push rejected: either the token expired or lacks the Maintainer role, or another merge landed
  on `main` at the same moment. In the second case the next merge regenerates everything anyway.

**Before turning it on**, run `python3 scripts/generate_factory_data.py --check` locally on
`main`. Whatever it reports is exactly what the first automatic commit will contain, including
fields it will reset, such as the `desc` of a component whose body file is missing.

Auto-regeneration keeps the repository up to date only. Re-uploading `factory-data.json` to the
Confluence page is still a manual step (see [README](../README.md#where-people-actually-view-this-page)).
