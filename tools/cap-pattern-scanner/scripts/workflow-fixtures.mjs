import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { scanProject } from './scan.mjs'
import { prepareReview, reconcileDecisions } from './review.mjs'
import { checkProposalPatches } from './proposals.mjs'

export const originalLine = "SELECT.from(Items).where('code=' + input)"
export const patchFor = (file = 'srv/service.js') => `--- a/${file}\n+++ b/${file}\n@@ -1 +1 @@\n-${originalLine}\n+SELECT.from(Items).where({ code: input })\n`
export const checks = {
  'source-current': { status: 'verified', evidence: 'hash matched the brief' },
  'diff-integrity': { status: 'verified', evidence: 'diff copied from current source' },
  'fixture-expectations': { status: 'verified', evidence: 'expectations from the input contract' },
  'input-contract': {
    status: 'verified', evidence: 'null, undefined, empty, quoted compared against the string form',
    cases: {
      null: { outcome: 'regression', evidence: 'concatenation yields the text null; a bound value is a real null', listedAs: 'null becomes a real null, not the text null' },
      undefined: { outcome: 'regression', evidence: 'concatenation yields the text undefined; the bound value is omitted', listedAs: 'an omitted input no longer matches the text undefined' },
      'empty-string': { outcome: 'equivalent', evidence: 'both forms compare code to an empty string' },
      quoted: { outcome: 'regression', evidence: 'a quote changed the query before and is plain data now', listedAs: 'quoted input is matched as data instead of changing the query' }
    }
  },
  'association-semantics': { status: 'not-applicable', evidence: 'scalar field' },
  'backend-functions': { status: 'not-applicable', evidence: 'no backend function' },
  'authorization-path': { status: 'verified', evidence: 'service handler; no access predicate to preserve' }
}
export const solution = patch => ({
  severity: { level: 'medium', basis: 'Client input reaches a where string' },
  uncertainty: ['Behavior for a missing input value is not specified'],
  proposal: {
    patch, compatibility: ['Plain CQN object form works on all supported CAP versions'], regressions: ['null becomes a real null, not the text null', 'an omitted input no longer matches the text undefined', 'quoted input is matched as data instead of changing the query'],
    verification: { steps: ['Run the service tests'], tests: ['A quoted value is matched as data'] }
  }
})

/** A three-candidate project (query, validation, remote error) reviewed with one verified proposal. */
export async function reviewedProject(context, { mutate = async () => {}, patch = patchFor() } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'cap-workflow-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, 'srv'))
  await mkdir(path.join(root, 'db'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^9' } }))
  await writeFile(path.join(root, 'srv', 'service.js'), [originalLine, "if (!req.data.name) return req.reject(400, 'NAME_REQUIRED')", 'req.reject(502, err.message)', ''].join('\n'))
  await mutate(root)
  const report = await scanProject(root)
  const brief = prepareReview(report)
  const idOf = pattern => brief.findings.find(finding => finding.patternId === pattern).id
  const ids = { query: idOf('CAP-QUERY-001'), validation: idOf('CAP-VALIDATION-001'), remote: idOf('CAP-REMOTE-ERROR-001') }
  const submission = { snapshotSha256: brief.snapshot.sha256, decisions: [
    { id: ids.query, decision: 'proposed', reason: 'Client input is concatenated into a where string; bind it instead.', checks, ...solution(patch) },
    { id: ids.validation, decision: 'needs-review', reason: 'Truthiness is not @mandatory; whitespace and zero are unproven', uncertainty: ['No test shows how 0 is meant to behave'] },
    { id: ids.remote, decision: 'not-applicable', reason: 'Local validator error, not upstream' }
  ] }
  const validated = reconcileDecisions(report, submission, { patchChecks: await checkProposalPatches(root, report, submission) })
  return { root, report, brief, submission, validated, ids }
}

// Edits one item's form in the generated sheet, the way a developer would in an editor.
export function tick(sheet, id, { approve, reject, needsChanges, defer, notes } = {}) {
  const marker = `<!-- id: ${id} -->`
  const start = sheet.indexOf(marker)
  assert.ok(start >= 0, `sheet has ${id}`)
  const next = sheet.indexOf('<!-- id:', start + marker.length)
  let block = sheet.slice(start, next < 0 ? undefined : next)
  for (const [on, label] of [[approve, 'approve'], [reject, 'reject'], [needsChanges, 'needs-changes'], [defer, 'defer']]) if (on) block = block.replace(`- [ ] ${label}`, `- [x] ${label}`)
  if (notes) block = block.replace('Reason or notes:', `Reason or notes: ${notes}`)
  return sheet.slice(0, start) + block + (next < 0 ? '' : sheet.slice(next))
}
