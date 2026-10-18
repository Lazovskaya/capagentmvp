# CAP-AI-11 Recommendation-Quality Evaluation

Evaluated 2026-10-18 against the CAP-AI-11 0.1.0 scanner and catalog. Synthetic fixtures
only; no customer source. This is a small pilot measurement, not an accuracy claim.

## Method

- **Fixtures:** four synthetic CAP Node.js projects in this folder (`greenfield-clean`,
  `brownfield-opportunities`, `ambiguous-evidence`, `misleading-signals`). Each has an
  `expected.json` of labelled locations (`opportunity`, `ambiguous`, `not-applicable`,
  `context`), anchored to unique source text instead of line numbers.
- **Labels:** written by one author from CAP semantics before the scanner was run, and not
  adjusted afterwards. They are judgements, not independent ground truth.
- **Deterministic scanner metrics:** `node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs`
  (pinned by `scripts/fixtures.test.mjs`). Reproducible; two runs are identical, including
  snapshot fingerprints.
- **AI review:** one run per fixture, Claude Code headless (`claude -p`, `2.1.302 (Claude Code)`), model
  `claude-sonnet-5-5`, Node 24.5.0 on macOS, adapter installed into an empty staging folder,
  fixture copies without `expected.json`. Same prompt for every fixture; pass criteria were
  fixed before the runs (below). One run each means no variance estimate.

## Scanner results (measured)

| Measure | Result |
|---|---|
| Review candidates | 13 |
| True positives (labelled opportunity) | 7 |
| Ambiguous, correctly flagged for review | 2 |
| False positives (labelled not-applicable) | 4 |
| Unlabelled candidates | 0 |
| Missed opportunities | 1 |
| Strict precision (TP / candidates) | 0.538 |
| Lenient precision ((TP + ambiguous) / candidates) | 0.692 |
| Recall (TP / opportunities) | 0.875 (7 of 8) |
| Candidates on the correct-native fixture | 0 |

These ratios describe a fixture set built to contain traps. They say nothing about
precision or recall on real projects.

Known limitations shown by the fixtures:

- **Missed:** `where(condition)` where `condition` was concatenated earlier. The scanner
  matches text on one expression and does not follow data flow.
- **False positives:** commented-out code, a string literal that contains the pattern, a
  concatenation of a module constant, and `err.message` from a local validator. Matching is
  text-based, so comments and strings are not excluded. Excluding them would also drop
  signals that live inside string arguments, so it needs its own tested change.

## AI review results (measured, n = 1 per fixture)

| Fixture | Decisions (validator-computed) | Turns | Wall time | Output tokens | Cost |
|---|---|---|---|---|---|
| greenfield-clean | 0 candidates, verdict no-applicable-patterns | 9 | 28 s | 2,920 | $0.14 |
| brownfield-opportunities | 7 reviewed: 1 proposed, 6 needs-review | 13 | 70 s | 8,427 | $0.27 |
| ambiguous-evidence | 3 reviewed: 2 not-applicable, 1 needs-review | 11 | 48 s | 5,768 | $0.20 |
| misleading-signals | 3 reviewed: 3 not-applicable | 10 | 37 s | 4,091 | $0.17 |
| Total | | 43 | 183 s | 21,206 | $0.78 |

Cost is the figure the host reported. Cache reads dominate input and are not shown.

Pass criteria, fixed beforehand, against the outcome:

| Criterion | Outcome |
|---|---|
| Greenfield: no candidates, no proposals | Met |
| Brownfield: every ID decided; no proposal without verified checks; no claim of a confirmed exploit or leak | Met. The single proposal (`CAP-QUERY-001`, `catalog-service.js:18`) is a non-applied tagged-template rewrite with all seven checks supplied; I judged it behaviour-preserving, including for a null term. |
| Ambiguous: both ambiguous IDs end needs-review; the local `err.message` ends not-applicable or needs-review | **Not met.** The association-path query ended needs-review as expected, but the falsy-check `copies` guard ended not-applicable. Its stated reason (action parameter, 0 is rejected, custom message) is defensible and arguably better than the label, so the label is probably wrong. It is recorded here rather than relabelled. |
| Misleading: all three traps not-applicable, none proposed | Met |

Other observations:

- The model was conservative: 1 of 7 true opportunities became a proposal. The other six
  stopped at needs-review, mostly because the fixtures contain no seed data, tests or
  service configuration. That follows the skill's rule and is not a quality score.
- The model did not mention the opportunity the scanner missed (`reports.js` line 8).
- `--context` was used in every run that had candidates, and `--output` wrote every brief.
  Only `decisions.json` was hand-written. The earlier smoke run (before `--output`)
  retyped `brief.json` three times. The two runs used different fixtures, so the lower
  turn count here is suggestive only, not a measured saving.
- Each run had 2-3 denied commands. All were compound commands (`cd … &&`, `ls; node -e`)
  that missed the headless allowlist for the single scanner command. The model recovered.

## Not measured

- Time or cost savings against manual review, and any accuracy percentage.
- Any host other than Claude Code, any other model, and run-to-run AI variance.
- Behaviour on real customer code or large projects. The fixtures exercise all nine
  catalog patterns, but only a few instances of each.
- Whether any proposal applies cleanly to real code and keeps tests green.

## Re-running

```sh
node --test tools/cap-pattern-scanner/scripts/fixtures.test.mjs
node tools/cap-pattern-scanner/scripts/evaluate-fixtures.mjs
```

The adapters copy the whole tool folder, including `expected.json`, into a staging folder.
For an AI evaluation, copy a fixture without `expected.json` and remove `fixtures/` from the
staged tooling so the model cannot read the labels.
