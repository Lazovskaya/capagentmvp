import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateFixtures } from './evaluate-fixtures.mjs'

test('synthetic fixtures keep documented scanner precision, recall, and known limitations', async () => {
  const first = await evaluateFixtures()
  const byName = Object.fromEntries(first.fixtures.map(fixture => [fixture.fixture, fixture]))
  assert.deepEqual(Object.keys(byName), ['ambiguous-evidence', 'brownfield-opportunities', 'greenfield-clean', 'misleading-signals'])
  assert.ok(first.fixtures.every(fixture => fixture.coverageComplete))

  // Correct native code produces observations only, never review candidates.
  const clean = byName['greenfield-clean']
  assert.equal(clean.truePositives.length + clean.falsePositives.length + clean.unexpectedCandidates.length, 0)
  assert.equal(clean.contextMissed.length + clean.unexpectedContext.length, 0)

  // Known limitation: text heuristics cannot follow data flow into where(condition).
  assert.deepEqual(byName['brownfield-opportunities'].missedOpportunities, ['CAP-QUERY-001 srv/reports.js:8'])
  assert.equal(byName['brownfield-opportunities'].truePositives.length, 8)
  assert.ok(byName['brownfield-opportunities'].truePositives.includes('CAP-VALIDATION-001 srv/inventory.js:6'), 'an aliased required-field check is found')

  // Known limitation: commented code, string literals, constants, and local errors are flagged.
  assert.deepEqual(byName['misleading-signals'].falsePositives, [
    'CAP-QUERY-001 srv/notes-service.js:9', 'CAP-REMOTE-ERROR-001 srv/notes-service.js:11', 'CAP-QUERY-001 srv/notes-service.js:14'
  ])
  assert.deepEqual(byName['ambiguous-evidence'].falsePositives, ['CAP-REMOTE-ERROR-001 srv/library-service.js:22'])
  assert.equal(byName['ambiguous-evidence'].ambiguousFlagged.length, 3)
  // A database row checked with the same shape as request validation must not be flagged.
  assert.deepEqual(byName['misleading-signals'].trueNegatives, ['CAP-VALIDATION-001 srv/notes-service.js:21'])

  // Nothing unlabelled appears, so the labels fully describe the scanner's output on these fixtures.
  assert.equal(first.totals.unexpectedCandidates, 0)
  assert.ok(first.fixtures.every(fixture => fixture.contextMissed.length === 0 && fixture.unexpectedContext.length === 0))
  assert.deepEqual(first.totals, {
    reviewCandidates: 15, opportunities: 9, truePositives: 8, missedOpportunities: 1, ambiguousFlagged: 3,
    falsePositives: 4, unexpectedCandidates: 0, strictPrecision: 0.533, lenientPrecision: 0.733, recall: 0.889
  })

  // Reproducible: an identical second run, including snapshot fingerprints.
  assert.deepEqual(await evaluateFixtures(), first)
})
