# @epam/cap-pattern-helpers 0.1.0: Boundary And Readiness Assessment

Assessed 2026-10-18 for CAP-AI-11. This file is not part of the npm package (`files` lists
only `index.js` and `README.md`). It records what was verified and what is unknown. It does
not approve, publish, or register anything.

## Three different things

| Category | What it is | Needs an npm dependency? |
|---|---|---|
| Scanner internals | `scripts/matcher.mjs` and `scripts/review.mjs`, imported by `scan.mjs`. The scanner imports nothing from `helpers/`. | No. Shipped with the tool. |
| Native CAP patterns | Eight of the nine catalog entries (`kind: native`, `documented-native`): i18n, pagination, remote consumption, validation, common aspects, query binding, transactions, draft. | No. The proposal is a change to the application's own CDS or handlers. |
| Reusable application helper | `withRemoteError`, the only export, referenced only by `CAP-REMOTE-ERROR-001` (`kind: helper`, `maturity: experimental`, `published: false`). | Yes, if an application adopts it. Not adopted by default. |

For the pilot, every recommendation is usable without publishing or installing the helper.
The catalog originally gave `CAP-REMOTE-ERROR-001` only a helper-based example. It now also
carries `nativeExample`: a plain `try/catch` with `req.reject` and an allowlisted static code,
and the skill says to propose that first. I ran that literal shape against real CAP (a scratch
copy of `cap.integration.mjs` with the helper calls replaced) on `@sap/cds` 9.9.3 and 10.1.1,
Node 24.5.0, production OData over loopback HTTP. It passed the same assertions as the helper:
409 with the localized message and target, a sanitized 502, and no upstream text or headers.
That scratch run is not committed, and the catalog test only checks that the example parses.

## What the package is (verified)

- 19 lines of code, one export, zero dependencies, no peer dependencies, ESM only
  (`"type": "module"`, `"exports": "./index.js"`), `"private": true`, `engines.node >=22`.
- Behaviour: runs an operation; on failure, maps the error through an optional allowlist
  `mapError` and calls `req.reject` with only a validated status (4xx/5xx), a static
  upper-case message key, and an optional string target. Invalid mappings throw `TypeError`.
  Mapper failures propagate.
- Four unit tests pass (request double, not a CAP runtime).
- Live-runtime integration test (`cap.integration.mjs`) passed on `@sap/cds` 9.9.3 and
  10.1.1, Node 24.5.0, macOS, `NODE_ENV=production`, loopback OData over HTTP with the dummy
  auth kind, in isolated installs outside any application. It checks the mapped status, code,
  target, localized message, the 502 fallback, success passthrough, and that no upstream text,
  header, or `$sanitize` flag reaches the client.
- `npm pack` yields three files (`index.js`, `package.json`, `README.md`). The tarball installs
  into an empty consumer project and loads with `import` and with `require` on Node 24.5.0.

## Limitations (verified or evident from the code)

1. **No root-cause logging.** The upstream error is discarded; the test asserts
   `cause` is undefined. CAP's own server log for the 502 case shows only
   `502 - Error at withRemoteError` and none of the upstream detail, so operators cannot see
   why the upstream call failed. Adopters must log the redacted cause inside `mapError`.
2. **CommonJS loading depends on the Node patch version.** `require()` works where Node
   loads ESM from `require` by default (22.12 and later). With that disabled it fails with
   `ERR_REQUIRE_ESM`; I simulated this with `--no-experimental-require-module` and did not run
   Node 22.0 to 22.11. `engines: >=22` admits those releases. `import()` works everywhere.
   Many CAP projects are CommonJS.
3. **Wraps every failure inside the operation, including local ones.** A CAP rejection with
   a 4xx status thrown inside the callback is mapped to the 502 fallback unless `mapError`
   handles it. The README says not to wrap local validation, authorization, or transactions;
   nothing enforces that.
4. **Narrow evidence.** Two CAP versions, one Node version, one OS, OData only, dummy auth,
   no SSO/BTP, no HANA, no remote service call through `cds.connect`, no draft or batch
   requests. The supported CAP range is not declared (`peerDependencies` is absent).
5. **No release metadata.** No `license`, `repository`, `author`, `publishConfig`, changelog,
   or `LICENSE` file in the package or at the repository root.
6. **No owner.** No maintainer, support channel, or security contact is recorded.

## Maturity verdict

Not mature enough to propose as a reusable internal dependency. It is a small, tested
prototype of one idea. It is fit for evaluation as an explicitly approved local file
dependency in a disposable project. It stays `experimental`, and any proposal that uses it
stays `needs-review`, as the agent and skill already require.

## Information needed before any publication (none of it is documented in the repository)

`@epam/sap` in the factory metadata is a component-namespace label, not a registry scope.

| Item | Status |
|---|---|
| Approved registry (internal or customer-approved) and its URL | Unknown |
| Package name and scope ownership (`@epam/…`) | Unknown; do not assume the proposed name is free or reserved |
| Who may publish, and the authentication method | Unknown |
| License and reuse rights for customer delivery | Unknown; no license file exists |
| Security review (dependencies none; code review, provenance, SBOM) | Not done |
| Support owner, escalation path, and deprecation policy | Unknown |
| Supported CAP and Node matrix | Partly measured (above); not declared or approved |
| Release procedure and who approves each release | Not defined |
| Customer acceptance for adding an EPAM-authored dependency to their application | Not obtained |

Do not invent a registry URL, install from a public registry under this name, or publish.

## Reproducible validation (verified locally) and a draft release procedure (not executed)

Validation, runnable today with no publication:

```sh
cd tools/cap-pattern-scanner/helpers
npm test
# per supported @sap/cds version, in an empty folder outside any application:
npm init -y && npm install @sap/cds@<exact> express
CAP_TEST_PROJECT=<that folder> NODE_ENV=production node --test cap.integration.mjs
npm pack --pack-destination <scratch>      # inspect file list; record the tarball sha256
# in an empty consumer project: npm install <tarball>, then require() and import()
```

If the owner approves the helper, a release would additionally need, in this order:

1. Governance items above answered and recorded, including the registry and owner.
2. Package changes: `license`, `repository`, `publishConfig` for the approved registry,
   a CommonJS entry (`exports` with `require` and `import`) or a raised `engines` floor,
   `peerDependencies` for the verified `@sap/cds` range, and optional cause logging.
3. A recorded compatibility matrix from the validation above, run by CI.
4. A semver bump and tag by the owner, with `private` removed only in the release change.
5. Publication by an authorized maintainer through the approved pipeline, as a separate
   action from any CAP-AI-11 commit.
6. Afterwards: set the catalog `published` flag, add the registry reference, regenerate the
   factory registry files, and re-run the delivery tests.

Steps 2 to 6 are proposals. None has been done or approved.
