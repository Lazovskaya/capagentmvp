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
  Transcripts show no read of the labels. One run on each of two public student projects was
  added; for the observation that points at a `try`/`catch`, a rule fixed beforehand requires the
  final report to name the file and, within 600 characters, mention what the `catch` does.
- **Scoring (mechanical, from the validator's computed decision):** PASS if the decision is in
  `acceptableDecisions`; SOFT if it is `needs-review` but not acceptable (over-cautious);
  FAIL otherwise. Real issues may be proposed or held but not dismissed; ambiguous items may
  not be proposed (the association-path query must stay `needs-review`); traps must be
  dismissed.

## Scanner results (measured)

16 review candidates: 9 true positives, 3 ambiguous (correctly flagged for review), 4 false
positives, 0 unlabelled. 1 opportunity missed. Strict precision 0.563, lenient 0.75, recall
0.9 (9 of 10). No candidates on the correct-native fixture.

These describe a fixture set built to contain traps and say nothing about real projects.

- **Alias handling:** the validation rule follows a single simple `const x = req.data` alias and
  flat destructuring such as `const { a, b: c } = req.data`, for names declared once in the
  file. Fixtures cover found aliases and destructuring, a role-conditional alias (flagged
  ambiguous), and two database-row look-alikes that are correctly not flagged. On two real
  student projects the same changes turned 0 candidates into the 4 expected required-field
  checks (aliased, `startup-crm-cap`) and 4 required-parameter checks (destructured,
  `warehouse-management`), with no extras and the projects left byte-identical.
- **Observations:** the brief now lists context-only signals (up to 100) as leads that need no
  decision, and `--context` can read them. On both real projects the remote-consumption
  observation marked the code with real defects; that lead was previously invisible. The
  brownfield fixture has a long `try` (lines 6-43 of `srv/rates.js`) around a `fetch` whose `catch`
  turns 404 and 502 into 500, so the default excerpt window hides both the `try` and the `catch`.
- **Missed:** `where(condition)` where `condition` was concatenated earlier; the scanner
  does not follow data flow.
- **False positives:** commented-out code, a string literal containing the pattern, a
  concatenation of a module constant, and `err.message` from a local validator. Excluding
  comments and strings would also drop signals inside string arguments, so it needs its own
  tested change.

## AI review results (14 valid runs: 4 fixtures x 3 repetitions, plus 2 real projects)

Current scanner: observations listed, destructuring followed, excerpts widened to the enclosing
`try`/`catch`.

| Fixture | Decisions per repetition (proposed / needs-review / not-applicable) | Pass / fail |
|---|---|---|
| greenfield-clean | 0 candidates in all three | n/a |
| brownfield-opportunities (9 items) | 3/6/0, 2/7/0, 3/6/0 | 27 pass, 0 fail |
| ambiguous-evidence (4 items) | 0/1/3, 1/0/3, 0/1/3 | 11 pass, **1 fail** |
| misleading-signals (3 items) | 0/0/3 in all three | 9 pass, 0 fail |

**Totals: 47 of 48 decisions pass, 0 over-cautious, 1 fail** (the association-path query was
proposed once in three repetitions, as in the previous round). 13 of 16 reviewable items got the
identical decision every time; the ones that varied were that query, the paging item, and one
query item (all acceptable except the fail). The previous round, before these changes, scored
44 of 45 with 12 of 15 stable, so the changes did not weaken decision safety.

The two real projects returned 4 candidates each and no proposals. Cost for the 14 valid runs:
$2.98 (about $0.21 each), 153 turns, 82,236 output tokens, about 12 minutes. Two further
attempts failed for harness reasons (below), cost $0.22, and were repeated once.

### Does the model act on the observation leads?

**No, not reliably.** The pre-registered rule scored 0 of 5 (three brownfield repetitions, two
real projects). What happened:

| Run | Context requested for the observation? | What the report said |
|---|---|---|
| brownfield x3 | No (read with `cat \| head -30`, `catch` not reached) | "already rejects with 502 and 404 and redacts failures to a generic 500"; "handles errors with `req.reject`, so no change is suggested"; no claim |
| warehouse-management | **Yes, widened excerpt with the whole `try`/`catch`** | "uses `req.reject` with static messages", with no mention that the `catch` turns 404 and 502 into 500 |
| startup-crm-cap | Yes, widened excerpt | Correct lead: "the catch swallows all errors, so a failed lookup silently uses the fallback rates". Mechanically MISS only because the file name was not within the 600 characters; the content was right |

So the excerpt change delivers the code, as the transcripts show, but the model either did not ask
for it or did not draw the conclusion. In 3 of the 5 reports it gave an assurance about error
handling that is wrong in effect. Treat the observations as a lead list, not as a review of those
code paths. Possible next steps, none done: flag an observation that sits inside a `try` in the
brief itself, and keep the model from reading files with `cat | head`.

### Other observations

- The validator found 0 blockers in this round; every effective decision is the one scored.
- Two runs (the misleading-signals and greenfield repetitions) produced no brief: the model built
  commands with shell variables or `; echo $?`, which my headless allowlist rejects. It stopped
  without inventing results, and one report said it did "not substitute a manual read". Each was
  repeated once under the same conditions; that is a harness failure, not a scanner failure.
- `--output` wrote every brief; the model hand-wrote only `decisions.json`.

## What this supports, and what it does not

Supported: the workflow runs end to end on Claude Code; clean code gave no proposals; planted
traps were dismissed every time; real issues were never dismissed; no run claimed a confirmed
exploit; the excerpt widening and the observation list work as designed when used.

Not established: that proposed changes are correct, that the model acts on observation leads or
reads the `catch` it was given, how often it is right on real code, stability beyond three
repetitions, other hosts or models, or savings against manual review.

## Re-running

```sh
node --test tools/cap-pattern-scanner/scripts/fixtures.test.mjs
node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs
```

Adapters copy the whole tool folder, `expected.json` included, into staging. For an AI
evaluation, copy a fixture without `expected.json`, rename it neutrally, and remove
`fixtures/` from the staged tooling so the model cannot see the labels. Allow the scanner command
in both its relative and absolute forms; commands built with shell variables, `cd … &&` chains, or
a trailing `; echo $?` were denied and made 3 of about 40 attempts fail across the evaluation rounds.
