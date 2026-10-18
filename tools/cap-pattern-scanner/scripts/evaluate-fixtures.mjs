import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanProject } from './scan.mjs'

const fixturesDirectory = fileURLToPath(new URL('../fixtures/', import.meta.url))
const ratio = (numerator, denominator) => (denominator ? Number((numerator / denominator).toFixed(3)) : null)

async function lineOf(root, file, anchor) {
  const lines = (await readFile(path.join(root, file), 'utf8')).split(/\r?\n/)
  const hits = lines.flatMap((text, index) => (text.includes(anchor) ? [index + 1] : []))
  if (hits.length !== 1) throw new Error(`Anchor must match exactly one line in ${file}: ${anchor}`)
  return hits[0]
}

/** Compares deterministic scanner output with the hand-labelled expectations of one fixture. */
export async function evaluateFixture(root) {
  const expected = JSON.parse(await readFile(path.join(root, 'expected.json'), 'utf8'))
  const report = await scanProject(root)
  const found = new Map(report.findings.map(finding => [`${finding.patternId}|${finding.evidence.file}|${finding.evidence.line}`, finding]))
  const labelled = new Set()
  const result = {
    fixture: expected.fixture, coverageComplete: report.coverage.complete, snapshotSha256: report.snapshot.sha256,
    truePositives: [], missedOpportunities: [], falsePositives: [], unexpectedCandidates: [],
    ambiguousFlagged: [], ambiguousUnflagged: [], trueNegatives: [],
    contextFound: [], contextMissed: [], unexpectedContext: []
  }
  for (const entry of expected.entries) {
    const line = await lineOf(root, entry.file, entry.anchor)
    const key = `${entry.patternId}|${entry.file}|${line}`
    labelled.add(key)
    const finding = found.get(key)
    const item = `${entry.patternId} ${entry.file}:${line}`
    const flagged = finding?.assessment === 'review-candidate'
    if (entry.label === 'opportunity') (flagged ? result.truePositives : result.missedOpportunities).push(item)
    else if (entry.label === 'ambiguous') (flagged ? result.ambiguousFlagged : result.ambiguousUnflagged).push(item)
    else if (entry.label === 'not-applicable') (flagged ? result.falsePositives : result.trueNegatives).push(item)
    else if (entry.label === 'context') (finding?.assessment === 'context-only' ? result.contextFound : result.contextMissed).push(item)
    else throw new Error(`Unknown label ${entry.label}`)
  }
  for (const [key, finding] of found) {
    if (labelled.has(key)) continue
    const [patternId, file, line] = key.split('|')
    ;(finding.assessment === 'review-candidate' ? result.unexpectedCandidates : result.unexpectedContext).push(`${patternId} ${file}:${line}`)
  }
  return result
}

export async function evaluateFixtures(directory = fixturesDirectory) {
  const names = (await readdir(directory, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  const fixtures = []
  for (const name of names) fixtures.push(await evaluateFixture(path.join(directory, name)))
  const total = key => fixtures.reduce((sum, fixture) => sum + fixture[key].length, 0)
  const candidates = total('truePositives') + total('ambiguousFlagged') + total('falsePositives') + total('unexpectedCandidates')
  return {
    schemaVersion: 1,
    method: 'Deterministic scanner output versus single-author labels; AI review quality is not measured here.',
    fixtures,
    totals: {
      reviewCandidates: candidates,
      opportunities: total('truePositives') + total('missedOpportunities'),
      truePositives: total('truePositives'), missedOpportunities: total('missedOpportunities'),
      ambiguousFlagged: total('ambiguousFlagged'), falsePositives: total('falsePositives'),
      unexpectedCandidates: total('unexpectedCandidates'),
      strictPrecision: ratio(total('truePositives'), candidates),
      lenientPrecision: ratio(total('truePositives') + total('ambiguousFlagged'), candidates),
      recall: ratio(total('truePositives'), total('truePositives') + total('missedOpportunities'))
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await evaluateFixtures(), null, 2))
  } catch (error) {
    console.error(`Evaluation failed: ${error.message}`)
    process.exitCode = 1
  }
}
