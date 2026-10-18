# CAP-AI-11 Recommendation-Quality Evaluation

Run 2026-10-18 against the 0.1.0 scanner and catalog, on synthetic fixtures only (no
customer source). A small pilot measurement, not an accuracy claim.

## Method

- **Fixtures:** four synthetic CAP Node.js projects in this folder: `greenfield-clean`,
  `brownfield-opportunities`, `ambiguous-evidence`, `misleading-signals`. Each has an
  `expected.json` of labelled locations (`opportunity`, `ambiguous`, `not-applicable`,
  `context`) anchored to unique source text.
- **Labels:** written by one author from CAP semantics before the scanner ran, and not
  adjusted afterwards. They are judgements, not independent ground truth.
- **Scanner metrics:** `node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs`, pinned
  by `scripts/fixtures.test.mjs`. Deterministic, and identical on Node 22 and 24.
- **AI review:** Claude Code headless (`claude -p`, 2.1.302), model `claude-sonnet-5-5`,
  macOS, adapter installed into an empty staging folder, same prompt per fixture, one run
  per fixture. The model got copies without `expected.json`, with neutral project names
  (`p1`..`p4`) in shuffled order. Session transcripts show no read of the labels. Pass
  criteria were fixed before the runs.

## Scanner results (measured)

13 review candidates: 7 true positives, 2 ambiguous (correctly flagged for review), 4 false
positives, 0 unlabelled. 1 opportunity missed. Strict precision 0.538, lenient 0.692,
recall 0.875 (7 of 8). No candidates on the correct-native fixture.

These describe a fixture set built to contain traps and say nothing about real projects.
Known limitations they show:

- **Missed:** `where(condition)` where `condition` was concatenated earlier; the scanner
  matches text and does not follow data flow.
- **False positives:** commented-out code, a string literal containing the pattern, a
  concatenation of a module constant, and `err.message` from a local validator. Excluding
  comments and strings would also drop signals that live inside string arguments, so it
  needs its own tested change.

## AI review results (measured, n = 1 per fixture)

| Fixture | Criterion | Decisions (validator-computed) | Result | Turns | Time | Output tokens | Cost |
|---|---|---|---|---|---|---|---|
| greenfield-clean | No candidates, no proposals | 0 candidates | Met | 8 | 22 s | 2,049 | $0.12 |
| brownfield-opportunities | Every ID decided; no proposal without verified checks; no claimed exploit | 0 proposed, 7 needs-review | Met | 14 | 53 s | 6,603 | $0.23 |
| ambiguous-evidence | Both ambiguous IDs end needs-review | 1 proposed, 2 not-applicable | **Not met** | 14 | 62 s | 7,073 | $0.23 |
| misleading-signals | All three traps not-applicable | 3 not-applicable | Met | 9 | 35 s | 3,570 | $0.19 |
| Total | | | | 45 | 172 s | 19,295 | $0.77 |

Cost is the host-reported figure. The validator accepted every decision; it checks that
declarations are present, not that they are true.

- **Not met:** the association-path query (`author.name`) was `proposed` where the label
  expected needs-review. The reasoning is careful (it flags the `null`/`undefined` change)
  but nothing ran against a CAP runtime, so path equivalence is unverified. The falsy-check
  guard ended not-applicable with a defensible reason; that label may be wrong. Neither was
  relabelled.
- **No overclaiming:** the only "confirmed vulnerability" in the decisions was "a candidate,
  not a confirmed vulnerability".
- `--output` wrote every brief; the model hand-wrote only `decisions.json`. Each run had 2-5
  denied compound commands (`cd … &&`) outside the allowlist and recovered.

### Decisions vary between runs

Same brownfield fixture, prompt, and model:

| Run | Catalog | Names | Proposed / needs-review | Cost |
|---|---|---|---|---|
| 1 | helper example default | visible | 1 / 6 | $0.27 |
| 2 | native default | visible | 4 / 3 | $0.37 |
| 3 (blind, above) | native default | neutral | 0 / 7 | $0.23 |

Proposals went 1, 4, then 0. Runs 1 and 2 saw fixture names that hint at the answer, so only
run 3 is a clean comparison, and three runs cannot separate catalog effects from ordinary
variation. They do show decisions are not stable. In run 2 the remote-error item became a
proposal of the dependency-free `req.reject` form (the intended default), and pagination was
proposed while the model stated it changes client behaviour; those are my readings.

## What this supports, and what it does not

Supported: the workflow runs end to end on Claude Code; clean code gave no proposals;
planted traps were dismissed; no run claimed a confirmed exploit.

Not measured: savings against manual review, any accuracy percentage, run-to-run stability,
other hosts or models, real or large projects, or whether a proposal applies cleanly and
keeps tests green.

## Re-running

```sh
node --test tools/cap-pattern-scanner/scripts/fixtures.test.mjs
node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs
```

Adapters copy the whole tool folder, `expected.json` included, into staging. For an AI
evaluation, copy a fixture without `expected.json`, rename it neutrally, and remove
`fixtures/` from the staged tooling so the model cannot see the labels.
