# CAP-AI-11 Recommendation-Quality Evaluation

Run 2026-10-18 against the 0.1.0 scanner and catalog, on synthetic fixtures only (no
customer source). A small pilot measurement, not an accuracy claim.

## Method

- **Fixtures:** four synthetic CAP Node.js projects in this folder: `greenfield-clean`,
  `brownfield-opportunities`, `ambiguous-evidence`, `misleading-signals`. Each has an
  `expected.json` of labelled locations (`opportunity`, `ambiguous`, `not-applicable`,
  `context`) anchored to unique source text.
- **Labels:** written by one author from CAP semantics, not independent ground truth.
  The correct AI decisions (`acceptableDecisions`) were written before the AI runs below.
  One label was changed before these runs, with its reason: the falsy-check `copies` guard
  now accepts `not-applicable`, because it rejects 0 and `@mandatory` would not.
- **Scanner metrics:** `node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs`, pinned
  by `scripts/fixtures.test.mjs`. Deterministic and identical on Node 22 and 24.
- **AI review:** Claude Code headless (`claude -p`, 2.1.302), model `claude-sonnet-5-5`,
  macOS, adapter installed into an empty staging folder, same prompt for every run. Each
  fixture was reviewed in three separate repetitions (12 runs) as neutrally named projects
  (`p1`..`p4`, package `synthetic-app`) in shuffled order, without `expected.json`.
  Transcripts show no read of the labels.
- **Scoring (mechanical, from the validator's computed decision):** PASS if the decision is in
  `acceptableDecisions`; SOFT if it is `needs-review` but not acceptable (over-cautious);
  FAIL otherwise. Real issues may be proposed or held but not dismissed; ambiguous items may
  not be proposed (the association-path query must stay `needs-review`); traps must be
  dismissed.

## Scanner results (measured)

15 review candidates: 8 true positives, 3 ambiguous (correctly flagged for review), 4 false
positives, 0 unlabelled. 1 opportunity missed. Strict precision 0.533, lenient 0.733, recall
0.889 (8 of 9). No candidates on the correct-native fixture.

These describe a fixture set built to contain traps and say nothing about real projects.

- **Alias handling:** the validation rule follows a single simple `const x = req.data` alias,
  declared once in the file. Fixtures cover a found alias, a role-conditional alias (flagged
  ambiguous), and a database-row check that is correctly not flagged. On a real student
  project the same change turned 0 candidates into the 4 expected required-field checks,
  with no extras.
- **Missed:** `where(condition)` where `condition` was concatenated earlier; the scanner
  does not follow data flow.
- **False positives:** commented-out code, a string literal containing the pattern, a
  concatenation of a module constant, and `err.message` from a local validator. Excluding
  comments and strings would also drop signals inside string arguments, so it needs its own
  tested change.

## AI review results (12 valid runs: 4 fixtures x 3 repetitions)

| Fixture | Decisions per repetition (proposed / needs-review / not-applicable) | Pass / fail |
|---|---|---|
| greenfield-clean | 0 candidates in all three | n/a |
| brownfield-opportunities (8 flagged items) | 1/7/0, 2/6/0, 2/6/0 | 24 pass, 0 fail |
| ambiguous-evidence (4 items) | 1/1/2, 0/1/3, 0/1/3 | 11 pass, **1 fail** |
| misleading-signals (3 items) | 0/0/3 in all three | 9 pass, 0 fail |

**Totals: 44 of 45 decisions pass, 0 over-cautious, 1 fail.** The fail was a `proposed` for the
association-path query in one of three repetitions; the other two held it at `needs-review`.
Cost $2.60 for the 12 runs (about $0.22 each), 135 turns, 69,725 output tokens, about 10
minutes. One extra attempt failed (see below) and cost $0.12.

What this measures, and what it does not: the pass bar is a *safety* bar. For real issues,
proposing and holding both pass, so only dismissing would fail; the score does not say whether
a proposed change is correct. No proposed diff was applied or tested.

### Stability across the three repetitions

12 of 15 reviewable items got the identical decision every time. The three that varied:

| Item | Decisions across repetitions | Result |
|---|---|---|
| Association-path query (`author.name`) | proposed / needs-review / needs-review | one fail |
| Falsy-check guard (`copies`) | needs-review / not-applicable / not-applicable | all acceptable |
| Remote-error forwarding in the brownfield fixture | needs-review / proposed / proposed | all acceptable |

Proposals per fixture varied: brownfield 1, 2, 2; ambiguous 1, 0, 0. So decisions are mostly,
but not fully, stable, and the unstable cases are the ambiguous ones.

### Other observations

- The validator downgraded one unsupported proposal (the model requested `proposed` without
  three evidence checks; effective decision `needs-review`). The safeguard worked, and the
  scores use the effective decision.
- The only "confirmed injection" phrases in all decisions were negations ("not a confirmed
  injection"). No run claimed a confirmed exploit.
- `--output` wrote every brief; the model hand-wrote only `decisions.json`. Each run had 1-4
  denied compound commands outside my headless allowlist and recovered.
- **Failed attempt:** one brownfield run produced no brief. The model called the scanner with
  an absolute path that missed the allowlist, was denied, and returned a provisional
  `needs-review` instead of inventing results. That is a harness failure with no decision to
  score, so that run was repeated once under the same conditions; both attempts are counted
  in the cost.

## What this supports, and what it does not

Supported: the workflow runs end to end on Claude Code; clean code gave no proposals; planted
traps were dismissed every time; real issues were never dismissed; no run claimed a confirmed
exploit; the validator caught an unsupported proposal.

Not established: that proposed changes are correct, how often the model is right on real code,
stability beyond three repetitions, other hosts or models, or savings against manual review.

## Re-running

```sh
node --test tools/cap-pattern-scanner/scripts/fixtures.test.mjs
node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs
```

Adapters copy the whole tool folder, `expected.json` included, into staging. For an AI
evaluation, copy a fixture without `expected.json`, rename it neutrally, and remove
`fixtures/` from the staged tooling so the model cannot see the labels. Allow the scanner
command in the form the skill uses (relative to the staging folder).
