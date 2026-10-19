import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, rm, symlink, readFile, readdir, stat, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { scanProject, readReviewContext } from './scan.mjs'
import { createMatcher } from './matcher.mjs'
import { prepareReview, reconcileDecisions } from './review.mjs'

async function treeDigest(directory) {
  const entries = (await readdir(directory, { recursive: true, withFileTypes: true })).filter(item => item.isFile())
  const parts = []
  for (const item of entries.sort((left, right) => (path.join(left.parentPath, left.name) < path.join(right.parentPath, right.name) ? -1 : 1))) {
    const file = path.join(item.parentPath, item.name)
    parts.push(`${path.relative(directory, file)}:${(await readFile(file)).toString('base64')}`)
  }
  return parts.join('\n')
}

async function fixture(context) {
  const root = await mkdtemp(path.join(tmpdir(), 'cap-patterns-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, 'srv'))
  await mkdir(path.join(root, 'db'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^9' } }))
  return root
}

test('catalog has unique IDs and valid executable signal expressions', async () => {
  const catalog = JSON.parse(await readFile(new URL('../catalog.json', import.meta.url)))
  assert.equal(catalog.version, '0.1.0')
  assert.equal(new Set(catalog.patterns.map(pattern => pattern.id)).size, catalog.patterns.length)
  for (const pattern of catalog.patterns) {
    assert.ok(pattern.compatibilityChecks.length)
    assert.ok(pattern.contraindications.length)
    assert.ok(pattern.example)
    for (const signal of pattern.signals) assert.doesNotThrow(() => new RegExp(signal, 'g'))
  }
})

test('every default example is dependency-free and the helper stays an optional, review-gated alternative', async () => {
  const catalog = JSON.parse(await readFile(new URL('../catalog.json', import.meta.url)))
  assert.ok(catalog.patterns.every(pattern => pattern.kind === 'native' && pattern.maturity === 'documented-native'))
  for (const pattern of catalog.patterns) assert.doesNotMatch(pattern.example, /@epam|require\(|import /, pattern.id)
  const withHelper = catalog.patterns.filter(pattern => pattern.helperAlternative)
  assert.deepEqual(withHelper.map(pattern => pattern.id), ['CAP-REMOTE-ERROR-001'])
  const [pattern] = withHelper
  assert.match(pattern.example, /req\.reject\(/)
  assert.doesNotMatch(pattern.example, /\.message/)
  assert.doesNotThrow(() => new Function(`const Customers = 1, remote = {}; const service = { on() {} }; (function () { ${pattern.example.replace('this.on', 'service.on')} })`))
  assert.equal(pattern.helperAlternative.maturity, 'experimental')
  assert.equal(pattern.helperAlternative.requiresReview, true)
  assert.equal(pattern.helperAlternative.package.published, false)
  assert.match(pattern.helperAlternative.example, /@epam\/cap-pattern-helpers/)
})

test('returns evidence, native alternatives, experimental helper, and reproducible IDs without source leakage', async context => {
  const root = await fixture(context)
  const source = "readFileSync('_i18n/messages.properties')\nreq.query.SELECT.limit = {}\nreq.reject(502, error.message) // client-secret\n"
  await writeFile(path.join(root, 'srv', 'service.js'), source)
  await writeFile(path.join(root, 'db', 'schema.cds'), '@odata.draft.enabled\nentity Orders {};')
  const report = await scanProject(root)
  assert.equal(report.scanner.version, '0.1.0')
  assert.equal(prepareReview(report).reviewPolicy.version, '0.2.0')
  assert.equal(report.findings.length, 4)
  const remote = report.findings.find(finding => finding.patternId === 'CAP-REMOTE-ERROR-001')
  assert.equal(remote.evidence.file, 'srv/service.js')
  assert.equal(remote.evidence.line, 3)
  assert.match(remote.evidence.sha256, /^[a-f0-9]{64}$/)
  assert.equal(remote.recommendation.helperAlternative.package.published, false)
  assert.equal(remote.recommendation.helperAlternative.requiresReview, true)
  assert.equal(remote.recommendation.kind, 'native')
  assert.equal(report.runtime.compatibility, 'unverified')
  assert.equal(JSON.stringify(report).includes('client-secret'), false)
  assert.deepEqual(await scanProject(root), report)
  assert.equal(await readFile(path.join(root, 'srv', 'service.js'), 'utf8'), source)
})

test('records missing, oversize, excluded, and symlinked paths and rejects traversal', async context => {
  const root = await fixture(context)
  await mkdir(path.join(root, 'srv', 'node_modules'))
  await writeFile(path.join(root, 'srv', 'node_modules', 'hidden.js'), 'req.reject(502, error.message)')
  await writeFile(path.join(root, 'srv', 'large.js'), ' '.repeat(1024 * 1024 + 1))
  await symlink(tmpdir(), path.join(root, 'srv', 'outside'), 'junction')
  const report = await scanProject(root, ['srv', 'missing', 'srv/outside/anything'])
  assert.equal(report.coverage.complete, false)
  assert.equal(report.findings.length, 0)
  for (const reason of ['excluded-path', 'over-1MiB', 'symlink', 'unreadable-or-missing']) {
    assert.ok(report.coverage.skipped.some(item => item.reason === reason), reason)
  }
  await assert.rejects(scanProject(root, ['../outside']), /within the project/)
  await assert.rejects(scanProject(root, []), /at least one/)
})

test('explicit scope limits the report and overlapping scopes do not duplicate findings', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'service.ts'), 'req.reject(502, err.message)')
  assert.equal((await scanProject(root, ['db'])).findings.length, 0)
  assert.equal((await scanProject(root, ['srv', 'srv/service.ts'])).findings.length, 1)
})

test('remote consumption finds CAP connections and direct HTTP as review context', async context => {
  const root = await fixture(context)
  const source = [
    "const remote = await cds.connect.to('RemoteService')",
    'await axios.get(endpoint)',
    'await fetch(endpoint)',
    'await axios(endpoint)',
    "await cds.connect.to('db')"
  ].join('\n')
  await writeFile(path.join(root, 'srv', 'remote.js'), source)
  const report = await scanProject(root)
  assert.deepEqual(report.findings.map(finding => finding.patternId), Array(5).fill('CAP-REMOTE-CONSUME-001'))
  assert.deepEqual(report.findings.map(finding => finding.evidence.line), [1, 2, 3, 4, 5])
  for (const finding of report.findings) {
    assert.equal(finding.status, 'candidate')
    assert.equal(finding.assessment, 'context-only')
    assert.equal(finding.recommendation.kind, 'native')
    assert.ok(finding.recommendation.contraindications.includes('Connection is to a local service or database'))
    assert.match(finding.recommendation.verification, /not a defect/)
  }
})

test('validation finds only supported field-guard forms and carries semantic review gates', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'validation.ts'), [
    "if (!req.data.title) req.reject(400, 'TITLE_REQUIRED')",
    "if (req.data.title == null) req.reject(400, 'TITLE_REQUIRED')",
    "if (req.data.title === undefined) req.reject(400, 'TITLE_REQUIRED')",
    "if (req.data.title === null) req.reject(400, 'TITLE_REQUIRED')",
    'if (req.data.active) performBusinessAction()',
    "if (req.user.is('Admin')) performAdminAction()"
  ].join('\n'))
  const findings = (await scanProject(root)).findings
  assert.deepEqual(findings.map(finding => finding.patternId), Array(4).fill('CAP-VALIDATION-001'))
  assert.deepEqual(findings.map(finding => finding.evidence.line), [1, 2, 3, 4])
  assert.ok(findings[0].recommendation.compatibilityChecks.some(check => check.includes('truthiness is not equivalent')))
  assert.ok(findings[0].recommendation.contraindications.some(check => check.includes('default')))
})

test('remote-error review covers positional, object, raw, and collected errors across lines', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'errors.js'), [
    'req.reject(502, error.message)',
    'req.reject({',
    '  status: 502,',
    '  message: err.message',
    '})',
    'req.error({ message: error.message })',
    'req.reject(error)',
    'req.error(err)',
    'req.reject(\n  502,\n  err.message\n)',
    'req.reject(error.status, error.message)'
  ].join('\n'))
  const findings = (await scanProject(root)).findings
  assert.deepEqual(findings.map(finding => finding.patternId), Array(7).fill('CAP-REMOTE-ERROR-001'))
  assert.deepEqual(findings.map(finding => finding.evidence.line), [1, 2, 6, 7, 8, 9, 13])
  assert.ok(findings[0].recommendation.contraindications.some(check => check.includes('not a drop-in replacement')))
})

test('safe errors and declarative constraints do not trigger error or validation rules', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'safe.js'), [
    "req.reject({ status: 409, code: 'ORDER_CONFLICT', target: 'ID' })",
    "req.error(400, 'TITLE_REQUIRED', 'title')",
    'req.reject({ message: errorMapping.safeCode })',
    'const connected = connection.toString()',
    'const client = axios.create(options)'
  ].join('\n'))
  await writeFile(path.join(root, 'srv', 'constraints.cds'), 'annotate CatalogService.Books with { title @mandatory; };')
  assert.deepEqual((await scanProject(root)).findings, [])
})

test('combined remote consumption, error handling, and field checks retain independent evidence', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'combined.js'), [
    "const remote = await cds.connect.to('RemoteService')",
    "if (!req.data.title) req.reject(400, 'TITLE_REQUIRED')",
    'req.reject({ status: 502, message: error.message })'
  ].join('\n'))
  const report = await scanProject(root)
  assert.equal(report.catalogVersion, '0.1.0')
  assert.deepEqual(report.findings.map(finding => finding.patternId), [
    'CAP-REMOTE-CONSUME-001', 'CAP-VALIDATION-001', 'CAP-REMOTE-ERROR-001'
  ])
  assert.deepEqual(report.findings.map(finding => finding.evidence.line), [1, 2, 3])
  assert.equal(new Set(report.findings.map(finding => finding.id)).size, 3)
})

test('clean project is not a failure or proof of exhaustive coverage', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'native.js'), "cds.i18n.messages.at('ORDER_CONFLICT')\nreq.reject(409, 'ORDER_CONFLICT')")
  const report = await scanProject(root)
  assert.deepEqual(report.findings, [])
  assert.ok(report.caveats.some(caveat => caveat.includes('does not prove')))
})

test('modeling candidates distinguish shorthand from required schema changes', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'db', 'schema.cds'), [
    'entity Books {',
    '  key ID : UUID;',
    '  createdAt : Timestamp;',
    '  modifiedAt : Timestamp;',
    '}'
  ].join('\n'))
  const findings = (await scanProject(root)).findings
  assert.deepEqual(findings.map(finding => finding.patternId), Array(3).fill('CAP-MODEL-001'))
  assert.deepEqual(findings.map(finding => finding.evidence.line), [2, 3, 4])
  assert.match(findings[0].recommendation.verification, /migration impact/)
})

test('query review finds concatenation and parenthesized interpolation, not bound values or tags', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), [
    "SELECT.from(Books).where('ID=' + input)",
    'SELECT.from(Books).where(`ID=${input}`)',
    'db.run(`SELECT * FROM Books WHERE ID=${input}`)',
    'SELECT.from(Books).where({ ID: input })',
    'SELECT.from(Books).where`ID=${input}`',
    "db.run('SELECT * FROM Books WHERE ID=?', [input])"
  ].join('\n'))
  const findings = (await scanProject(root)).findings
  assert.deepEqual(findings.map(finding => finding.patternId), Array(3).fill('CAP-QUERY-001'))
  assert.deepEqual(findings.map(finding => finding.evidence.line), [1, 2, 3])
})

test('manual transaction signals remain contextual and native aspects do not trigger modeling', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'db', 'schema.cds'), "using { cuid, managed } from '@sap/cds/common';\nentity Books : cuid, managed { title : String; }")
  await writeFile(path.join(root, 'srv', 'transactions.js'), [
    'const tx = db.tx()',
    'await tx.commit()',
    'await tx.rollback(error)',
    'await db.run(query)'
  ].join('\n'))
  const findings = (await scanProject(root)).findings
  assert.deepEqual(findings.map(finding => finding.patternId), Array(3).fill('CAP-TX-001'))
  assert.deepEqual(findings.map(finding => finding.evidence.line), [1, 2, 3])
  assert.ok(findings[0].recommendation.contraindications.some(item => item.includes('standalone/background')))
})

test('refuses a symlinked manifest rather than reading outside the project', async context => {
  const root = await fixture(context)
  await rm(path.join(root, 'package.json'))
  try {
    await symlink(path.join(tmpdir(), 'outside-package.json'), path.join(root, 'package.json'))
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      context.skip('Windows policy does not allow file symlinks; symlink refusal still needs authorized environment verification')
      return
    }
    throw error
  }
  await assert.rejects(scanProject(root), /Symlinked package.json/)
})

test('CLI emits parseable JSON, fails unsupported projects, and never runs package scripts', async context => {
  const root = await fixture(context)
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const success = spawnSync(process.execPath, [cli, root], { encoding: 'utf8' })
  assert.equal(success.status, 0)
  assert.equal(JSON.parse(success.stdout).useCaseId, 'CAP-AI-11')
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { prepare: 'exit 99' } }))
  const failure = spawnSync(process.execPath, [cli, root], { encoding: 'utf8' })
  assert.equal(failure.status, 1)
  assert.match(failure.stderr, /CAP Node.js dependency/)
  assert.equal(failure.stdout, '')
})

test('validates API inputs and refuses oversized manifests', async context => {
  const root = await fixture(context)
  for (const scopes of [null, 'srv', [''], [1], ['srv', '  ']]) {
    await assert.rejects(scanProject(root, scopes), /scope/)
  }
  await assert.rejects(scanProject(''), /project path/)
  await writeFile(path.join(root, 'package.json'), ' '.repeat(1024 * 1024 + 1))
  await assert.rejects(scanProject(root), error => error.code === 'FILE_LIMIT')
  await rm(path.join(root, 'package.json'))
  await mkdir(path.join(root, 'package.json'))
  await assert.rejects(scanProject(root), /regular file/)
})

test('bounds finding counts and preserves exact evidence under a dense scan', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'dense.js'), 'req.reject(error)\n'.repeat(5100))
  const report = await scanProject(root)
  assert.equal(report.findings.length, report.coverage.limits.findings)
  assert.equal(report.coverage.complete, false)
  assert.ok(report.coverage.skipped.some(item => item.reason === 'finding-limit'))
  assert.equal(report.findings.at(-1).evidence.line, 5000)
  assert.ok(report.coverage.bytesRead > 0)
})

test('limits directory depth and CLI distinguishes incomplete coverage from no matches', async context => {
  const root = await fixture(context)
  const deep = path.join(root, 'srv', ...Array(66).fill('n'))
  await mkdir(deep, { recursive: true })
  const report = await scanProject(root)
  assert.equal(report.coverage.complete, false)
  assert.ok(report.coverage.skipped.some(item => item.reason === 'depth-limit'))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [cli, root, 'missing'], { encoding: 'utf8' })
  assert.equal(result.status, 2)
  assert.equal(JSON.parse(result.stdout).coverage.complete, false)
  assert.equal(result.stderr, '')
})

test('repeated incomplete calls no longer trigger quadratic remote-error matching', { timeout: 5000 }, async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'repeated.js'), 'req.reject('.repeat(24000))
  const report = await scanProject(root)
  assert.equal(report.coverage.complete, true)
  assert.deepEqual(report.findings, [])
})

test('matcher terminates pathological expressions and recovers for the next file', { timeout: 5000 }, async context => {
  const matcher = createMatcher([{ id: 'TEST', extensions: ['.js'], signals: ['(a+)+$'] }], 250)
  context.after(() => matcher.close())
  const timedOut = await matcher.match(`${'a'.repeat(40)}!`, '.js', 10)
  assert.equal(timedOut.reason, 'analysis-timeout')
  const recovered = await matcher.match('a', '.js', 10)
  assert.deepEqual(recovered.matches, [{ patternId: 'TEST', line: 1 }])
})

test('fingerprints invalidate stale findings even when the matching line is unchanged', async context => {
  const root = await fixture(context)
  const source = path.join(root, 'srv', 'errors.js')
  await writeFile(source, 'req.reject(502, error.message)\nconst marker = 1')
  const before = await scanProject(root)
  await writeFile(source, 'req.reject(502, error.message)\nconst marker = 2')
  const after = await scanProject(root)
  assert.notEqual(before.snapshot.sha256, after.snapshot.sha256)
  assert.notEqual(before.findings[0].id, after.findings[0].id)
  assert.notEqual(before.findings[0].evidence.sha256, after.findings[0].evidence.sha256)
  assert.equal(before.findings[0].evidence.line, after.findings[0].evidence.line)
  assert.match(after.scanner.sha256, /^[a-f0-9]{64}$/)
  assert.match(after.catalogSha256, /^[a-f0-9]{64}$/)
  assert.deepEqual(after.snapshot.sources.map(item => item.file), ['srv/errors.js'])
  const priorSnapshot = after.snapshot.sha256
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^10' } }))
  assert.notEqual((await scanProject(root)).snapshot.sha256, priorSnapshot)
})

test('context-only observations are counted separately from review candidates', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'context.js'), "cds.connect.to('RemoteService')\nreq.reject(error)")
  const report = await scanProject(root)
  assert.deepEqual(report.summary, { contextOnly: 1, reviewCandidates: 1 })
  assert.equal(report.findings[1].assessment, 'review-candidate')
})

test('default CLI emits a compact grouped review; --full retains raw evidence', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'review.js'), "cds.connect.to('RemoteService')\nreq.reject(error)\nreq.reject(err)")
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [cli, root], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const brief = JSON.parse(result.stdout)
  assert.equal(brief.format, 'cap-pattern-review')
  assert.equal(brief.findings.length, 2)
  assert.equal(brief.patterns.length, 2, 'candidate guidance plus the guidance for the listed observation')
  assert.equal(brief.groups.length, 1)
  assert.equal(brief.groups[0].findingIds.length, 2)
  assert.equal(brief.summary.contextOnly, 1)
  assert.deepEqual(brief.observations.map(group => [group.patternId, group.file, group.items.map(item => item.line)]), [['CAP-REMOTE-CONSUME-001', 'srv/review.js', [1]]])
  assert.equal(brief.findings[0].recommendation, undefined)
  assert.equal(brief.progress.verdict, 'needs-review')
  const full = spawnSync(process.execPath, [cli, root, '--full'], { encoding: 'utf8' })
  assert.equal(full.status, 0, full.stderr)
  assert.equal(JSON.parse(full.stdout).findings.length, 3)
})

test('existing Windows UTF-8 BOM reports compact locally without a client project or rescanning', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'errors.js'), 'req.reject(error)')
  const full = await scanProject(root)
  const reportPath = path.join(root, 'saved-report.json')
  await writeFile(reportPath, `\uFEFF${JSON.stringify(full)}`)
  await rm(path.join(root, 'package.json'))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [cli, '--report', reportPath], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const brief = JSON.parse(result.stdout)
  assert.equal(brief.snapshot.sha256, full.snapshot.sha256)
  assert.deepEqual(brief.findings[0].evidence, full.findings[0].evidence)
  assert.deepEqual(prepareReview(brief), brief)
})

test('context-only and incomplete reports cannot become proposals', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'native.js'), "cds.connect.to('RemoteService')")
  const full = await scanProject(root)
  assert.equal(prepareReview(full).progress.verdict, 'no-applicable-patterns')
  full.coverage.complete = false
  assert.equal(prepareReview(full).progress.verdict, 'needs-review')
  assert.throws(() => prepareReview({ findings: [] }), /fingerprinted/)
})

test('large synthetic pilot reports include guidance once and preserve every review ID', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'errors.js'), 'req.reject(error)')
  const report = await scanProject(root)
  const template = report.findings[0]
  report.findings = Array.from({ length: 202 }, (_, index) => ({
    ...template, id: `SYNTHETIC-${index}`,
    assessment: index < 24 ? 'review-candidate' : 'context-only',
    evidence: { ...template.evidence, line: index + 1 },
    recommendation: { ...template.recommendation, verification: 'Synthetic guidance. '.repeat(100) }
  }))
  const brief = prepareReview(report)
  assert.deepEqual(brief.summary, { reviewCandidates: 24, contextOnly: 178 })
  assert.equal(brief.patterns.length, 1)
  assert.equal(brief.groups.length, 1)
  assert.equal(brief.groups[0].findingIds.length, 24)
  assert.equal(new Set(brief.findings.map(finding => finding.id)).size, 24)
  assert.equal(brief.progress.reviewed, 0)
  assert.equal(brief.progress.remaining, 24)
  assert.equal(brief.progress.verdict, 'needs-review')
  assert.ok(JSON.stringify(brief).length < JSON.stringify(report).length / 4)
  assert.ok(brief.reviewRules.some(rule => rule.includes('automatically rejects')))
  assert.ok(brief.reviewRules.some(rule => rule.includes('sanitized by default')))
})

test('query proposals need explicit input, association, backend, authorization, diff, and fixture evidence', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)")
  const brief = prepareReview(await scanProject(root))
  const entry = { id: brief.findings[0].id, decision: 'proposed', reason: 'Bind a value rather than concatenate it', checks: {} }
  const submission = { snapshotSha256: brief.snapshot.sha256, decisions: [entry] }
  const unsupported = reconcileDecisions(brief, submission)
  assert.equal(unsupported.decisions[0].requestedDecision, 'proposed')
  assert.equal(unsupported.decisions[0].decision, 'needs-review')
  assert.equal(unsupported.decisions[0].blockers.length, 5, '3 blocking evidence checks (source, diff, authorization) plus missing severity and proposal')
  for (const check of [...brief.reviewPolicy.proposalChecks, ...brief.reviewPolicy.queryChecks]) {
    entry.checks[check.id] = { status: check.required ? 'verified' : 'not-applicable', evidence: 'Synthetic reviewer evidence; not proof of executed tests.' }
  }
  entry.checks['input-contract'].cases = Object.fromEntries(['null', 'undefined', 'empty-string', 'quoted'].map(name => [name, { outcome: 'regression', evidence: 'Synthetic case evidence.', listedAs: 'null becomes a real null, not the text null' }]))
  // Evidence checks alone are no longer enough: a proposal needs a structured solution that checks out.
  assert.equal(reconcileDecisions(brief, submission).progress.verdict, 'needs-review')
  Object.assign(entry, {
    severity: { level: 'medium', basis: 'Client input reaches a where string' }, uncertainty: [],
    proposal: {
      patch: '--- a/srv/queries.js\n+++ b/srv/queries.js\n@@ -1 +1 @@\n-SELECT.from(Items).where(\'code=\' + input)\n+SELECT.from(Items).where({ code: input })\n',
      compatibility: ['Plain CQN object form on all supported CAP versions'], regressions: ['null becomes a real null, not the text null'],
      verification: { steps: ['Run the service tests'], tests: ['A quoted value is matched as data'] }
    }
  })
  const withPatchCheck = { patchChecks: new Map([[entry.id, { ok: true, patchSha256: 'a'.repeat(64), files: [] }]]) }
  assert.equal(reconcileDecisions(brief, submission).decisions[0].blockers.at(-1), 'Patch not checked against the project (run --decisions with the project path)')
  assert.equal(reconcileDecisions(brief, submission, withPatchCheck).progress.verdict, 'proposals')
  for (const check of [...brief.reviewPolicy.proposalChecks, ...brief.reviewPolicy.queryChecks]) {
    const prior = entry.checks[check.id]
    entry.checks[check.id] = { status: 'unverified', evidence: 'Still needs local verification' }
    const result = reconcileDecisions(brief, submission, withPatchCheck)
    // Source, diff, and authorization evidence guard the diff and stay blocking; the rest is behavior the AI could not establish.
    if (['source-current', 'diff-integrity', 'authorization-path'].includes(check.id)) assert.equal(result.progress.verdict, 'needs-review', check.id)
    else {
      assert.equal(result.progress.verdict, 'proposals', check.id)
      assert.equal(result.decisions[0].equivalence.proven, false, check.id)
    }
    entry.checks[check.id] = prior
  }
})

test('decision reconciliation counts every ID, rejects stale/duplicate/unknown IDs, and never implies acceptance', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)\nreq.reject(error)")
  const brief = prepareReview(await scanProject(root))
  const submission = { snapshotSha256: brief.snapshot.sha256, decisions: [
    { id: brief.findings[0].id, decision: 'not-applicable', reason: 'Synthetic false positive' }
  ] }
  const partial = reconcileDecisions(brief, submission)
  assert.equal(partial.progress.remaining, 1)
  assert.equal(partial.progress.needsReview, 1)
  assert.equal(partial.progress.verdict, 'needs-review')
  assert.throws(() => reconcileDecisions(brief, { ...submission, snapshotSha256: 'stale' }), /stale/)
  assert.throws(() => reconcileDecisions(brief, { ...submission, decisions: [...submission.decisions, ...submission.decisions] }), /duplicate/)
  assert.throws(() => reconcileDecisions(brief, { ...submission, decisions: [{ ...submission.decisions[0], id: 'unknown' }] }), /Unknown/)
  assert.throws(() => reconcileDecisions(brief, { ...submission, decisions: [{ ...submission.decisions[0], decision: 'accepted' }] }), /supported decision/)
})

test('decision resume rejects submissions that drop previously decided IDs', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)\nSELECT.from(Items).where('name=' + input)")
  const brief = prepareReview(await scanProject(root))
  assert.ok(brief.findings.length >= 2)
  const [first, second] = brief.findings
  const base = { snapshotSha256: brief.snapshot.sha256 }
  const previous = reconcileDecisions(brief, { ...base, decisions: [
    { id: first.id, decision: 'not-applicable', reason: 'Synthetic false positive' }
  ] })
  const secondDecision = { id: second.id, decision: 'not-applicable', reason: 'Synthetic second review' }
  assert.throws(() => reconcileDecisions(brief, { ...base, previous, decisions: [secondDecision] }), /drops previously decided IDs: .*/)
  const resumed = reconcileDecisions(brief, { ...base, previous, decisions: [previous.decisions[0], secondDecision] })
  assert.equal(resumed.progress.reviewed, 2)
  assert.equal(resumed.progress.notApplicable, 2)
  assert.throws(() => reconcileDecisions(brief, { ...base, previous: { ...previous, snapshot: { sha256: 'stale' } }, decisions: [] }), /stale/)
  assert.throws(() => reconcileDecisions(brief, { ...base, previous: {}, decisions: [] }), /Previous review/)
  assert.equal(reconcileDecisions(brief, { ...base, decisions: [secondDecision] }).progress.reviewed, 1)
})

test('decision submissions cannot inject statuses, counts, or unknown checks', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)\nSELECT.from(Items).where('name=' + input)")
  const brief = prepareReview(await scanProject(root))
  const [first, second] = brief.findings
  const base = { snapshotSha256: brief.snapshot.sha256 }
  const entry = { id: first.id, decision: 'not-applicable', reason: 'Synthetic false positive' }
  for (const injected of [{ status: 'accepted' }, { verdict: 'proposals' }, { progress: { reviewed: 99 } }, { count: 1 }]) {
    assert.throws(() => reconcileDecisions(brief, { ...base, decisions: [{ ...entry, ...injected }] }), /Unsupported decision field/)
    assert.throws(() => reconcileDecisions(brief, { ...base, decisions: [entry], ...injected }), /Unsupported decision submission field/)
  }
  assert.throws(() => reconcileDecisions(brief, { ...base, decisions: [{ ...entry, checks: { 'made-up': { status: 'verified', evidence: 'x' } } }] }), /Unknown decision check ID/)
  assert.throws(() => reconcileDecisions(brief, { ...base, decisions: [{ ...entry, checks: { 'source-current': { status: 'verified', evidence: 'x', trusted: true } } }] }), /only status and evidence/)
  assert.throws(() => reconcileDecisions(brief, { ...base, decisions: [{ ...entry, reviewed: false }] }), /placeholder/)
  // Echoed derived fields are ignored and recomputed, so a previous output can be resubmitted.
  const echoed = reconcileDecisions(brief, { ...base, decisions: [{ ...entry, blockers: [], requestedDecision: 'proposed', reviewed: true }] })
  assert.equal(echoed.decisions[0].decision, 'not-applicable')
  assert.equal(echoed.decisions[0].requestedDecision, 'not-applicable')
  assert.deepEqual(echoed.decisions[0].blockers, [])
  assert.equal(echoed.progress.reviewed, 1)
  assert.equal(echoed.progress.remaining, brief.findings.length - 1)
  assert.equal(echoed.decisions.find(item => item.id === second.id).reviewed, false)
  assert.throws(() => prepareReview({ ...brief, summary: { ...brief.summary, contextOnly: -1 } }), /contextOnly/)
})

test('CLI resume workflow accepts saved output as previous and rejects dropped IDs with exit 1', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)\nSELECT.from(Items).where('name=' + input)")
  const brief = prepareReview(await scanProject(root))
  const [first, second] = brief.findings
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const run = async submission => {
    await writeFile(path.join(root, 'brief.json'), JSON.stringify(brief))
    await writeFile(path.join(root, 'decisions.json'), JSON.stringify(submission))
    return spawnSync(process.execPath, [cli, '--report', path.join(root, 'brief.json'), '--decisions', path.join(root, 'decisions.json')], { encoding: 'utf8' })
  }
  const base = { snapshotSha256: brief.snapshot.sha256 }
  const sessionOne = await run({ ...base, decisions: [{ id: first.id, decision: 'not-applicable', reason: 'Synthetic false positive' }] })
  assert.equal(sessionOne.status, 0, sessionOne.stderr)
  const previous = JSON.parse(sessionOne.stdout)
  const second2 = { id: second.id, decision: 'not-applicable', reason: 'Synthetic second review' }
  const dropped = await run({ ...base, previous, decisions: [second2] })
  assert.equal(dropped.status, 1)
  assert.equal(dropped.stdout, '')
  const resumed = await run({ ...base, previous, decisions: [previous.decisions[0], second2] })
  assert.equal(resumed.status, 0, resumed.stderr)
  assert.equal(JSON.parse(resumed.stdout).progress.reviewed, 2)
})

test('an explicitly requested scope that scans nothing is incomplete, not a clean review', async context => {
  const root = await fixture(context)
  await mkdir(path.join(root, 'node_modules', 'dep'), { recursive: true })
  for (const scope of ['node_modules', 'package.json']) {
    const report = await scanProject(root, [scope])
    assert.equal(report.coverage.complete, false, scope)
    assert.equal(report.coverage.scanned.length, 0)
    assert.equal(prepareReview(report).progress.verdict, 'needs-review')
  }
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  assert.equal(spawnSync(process.execPath, [cli, root, 'node_modules'], { encoding: 'utf8' }).status, 2)
})

test('snapshot ordering and fingerprint do not depend on locale collation', async context => {
  const root = await fixture(context)
  for (const name of ['a.js', 'B.js', '_c.js']) await writeFile(path.join(root, 'srv', name), 'const x = 1')
  const report = await scanProject(root, ['srv'])
  const files = report.snapshot.sources.map(source => source.file)
  assert.deepEqual(files, ['srv/B.js', 'srv/_c.js', 'srv/a.js'])
  assert.deepEqual(report.coverage.scanned, files)
  assert.equal((await scanProject(root, ['srv'])).snapshot.sha256, report.snapshot.sha256)
})

test('CLI names the rejected decision rule without echoing paths or input', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)")
  const brief = prepareReview(await scanProject(root))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  await writeFile(path.join(root, 'brief.json'), JSON.stringify(brief))
  await writeFile(path.join(root, 'decisions.json'), JSON.stringify({ snapshotSha256: brief.snapshot.sha256, decisions: [], verdict: 'proposals' }))
  const rejected = spawnSync(process.execPath, [cli, '--report', path.join(root, 'brief.json'), '--decisions', path.join(root, 'decisions.json')], { encoding: 'utf8' })
  assert.equal(rejected.status, 1)
  assert.equal(rejected.stdout, '')
  assert.match(rejected.stderr, /Unsupported decision submission field: verdict/)
  await writeFile(path.join(root, 'decisions.json'), '{"secret-token": nope')
  const malformed = spawnSync(process.execPath, [cli, '--report', path.join(root, 'brief.json'), '--decisions', path.join(root, 'decisions.json')], { encoding: 'utf8' })
  assert.equal(malformed.status, 1)
  assert.doesNotMatch(malformed.stderr, /secret-token|decisions\.json/)
})

test('--output saves the exact stdout JSON to a new owner-only file and keeps stdout unchanged', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)")
  const outDir = await mkdtemp(path.join(tmpdir(), 'cap-output-'))
  context.after(() => rm(outDir, { recursive: true, force: true }))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const before = await treeDigest(root)
  const plain = spawnSync(process.execPath, [cli, root], { encoding: 'utf8' })
  const target = path.join(outDir, 'brief.json')
  const saved = spawnSync(process.execPath, [cli, root, '--output', target], { encoding: 'utf8' })
  assert.equal(saved.status, 0, saved.stderr)
  assert.equal(saved.stdout, plain.stdout)
  assert.equal(await readFile(target, 'utf8'), plain.stdout)
  if (process.platform !== 'win32') assert.equal((await stat(target)).mode & 0o777, 0o600)
  assert.equal(await treeDigest(root), before)
  // The saved brief feeds the other modes unchanged.
  const context1 = spawnSync(process.execPath, [cli, root, '--report', target, '--context', JSON.parse(plain.stdout).findings[0].id, '--output', path.join(outDir, 'context.json')], { encoding: 'utf8' })
  assert.equal(context1.status, 0, context1.stderr)
  assert.equal(await readFile(path.join(outDir, 'context.json'), 'utf8'), context1.stdout)
  // Incomplete coverage still exits 2 and still saves the report.
  const incomplete = spawnSync(process.execPath, [cli, root, 'missing', '--output', path.join(outDir, 'incomplete.json')], { encoding: 'utf8' })
  assert.equal(incomplete.status, 2)
  assert.equal(JSON.parse(await readFile(path.join(outDir, 'incomplete.json'), 'utf8')).coverage.complete, false)
})

test('--output refuses overwrites, project paths, missing folders, and symlinked targets without stdout', async context => {
  const root = await fixture(context)
  const outDir = await mkdtemp(path.join(tmpdir(), 'cap-output-'))
  context.after(() => rm(outDir, { recursive: true, force: true }))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const run = target => spawnSync(process.execPath, [cli, root, '--output', target], { encoding: 'utf8' })
  const existing = path.join(outDir, 'existing.json')
  await writeFile(existing, 'PRIOR REVIEW')
  const overwrite = run(existing)
  assert.equal(overwrite.status, 1)
  assert.equal(overwrite.stdout, '')
  assert.match(overwrite.stderr, /EEXIST/)
  assert.equal(await readFile(existing, 'utf8'), 'PRIOR REVIEW')
  const inside = run(path.join(root, 'srv', 'brief.json'))
  assert.equal(inside.status, 1)
  assert.match(inside.stderr, /outside the analyzed project/)
  await assert.rejects(stat(path.join(root, 'srv', 'brief.json')))
  const viaLink = path.join(outDir, 'link-to-project')
  await symlink(root, viaLink, 'junction')
  assert.match(run(path.join(viaLink, 'brief.json')).stderr, /outside the analyzed project/)
  const missing = run(path.join(outDir, 'no-such-folder', 'brief.json'))
  assert.equal(missing.status, 1)
  assert.equal(missing.stdout, '')
  const dangling = path.join(outDir, 'dangling.json')
  const canLinkFiles = await symlink(path.join(outDir, 'elsewhere.json'), dangling).then(() => true, error => error.code === 'EPERM' ? false : Promise.reject(error))
  if (canLinkFiles) {
    assert.equal(run(dangling).status, 1)
    await assert.rejects(stat(path.join(outDir, 'elsewhere.json')))
  }
  assert.equal(spawnSync(process.execPath, [cli, root, '--output', ''], { encoding: 'utf8' }).status, 1)
})

test('the validation signal follows a single simple alias of req.data, not reused names or other objects', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'aliased.js'), [
    'module.exports = srv => {',
    "  srv.before('CREATE', 'Items', req => {",
    '    const order = req.data',
    "    if (!order.name) return req.reject(400, 'NAME_REQUIRED')",
    "    if (order.stock === undefined) return req.reject(400, 'STOCK_REQUIRED')",
    '  })',
    "  srv.before('UPDATE', 'Items', req => {",
    '    let $payload = req.data;',
    "    if ($payload.code == null) return req.reject(400, 'CODE_REQUIRED')",
    '  })',
    '}', ''
  ].join('\n'))
  await writeFile(path.join(root, 'srv', 'reused.js'), [
    'module.exports = srv => {',
    "  srv.before('CREATE', 'Items', async req => {",
    '    const order = req.data',
    "    if (!order.name) return req.reject(400, 'NAME_REQUIRED')",
    '  })',
    "  srv.on('READ', 'Items', async () => {",
    "    const order = await SELECT.one.from('Items')",
    '    if (!order.name) return null',
    '  })',
    '}', ''
  ].join('\n'))
  await writeFile(path.join(root, 'srv', 'other.js'), [
    "const row = await SELECT.one.from('Items')",
    "if (!row.name) throw new Error('missing row')",
    'const header = req.data.header',
    "if (!header.id) throw new Error('no header')",
    'const { name } = req.data',
    "if (!name) throw new Error('no name')", ''
  ].join('\n'))
  await writeFile(path.join(root, 'srv', 'direct.js'), "srv.before('CREATE', 'Items', req => {\n  if (!req.data.name) return req.reject(400, 'NAME_REQUIRED')\n})\n")
  const report = await scanProject(root)
  const found = report.findings.filter(finding => finding.patternId === 'CAP-VALIDATION-001')
    .map(finding => `${finding.evidence.file}:${finding.evidence.line}`)
  // other.js:6 is flat destructuring of req.data, which is followed; its row and req.data.header checks are not.
  assert.deepEqual(found, ['srv/aliased.js:4', 'srv/aliased.js:5', 'srv/aliased.js:9', 'srv/direct.js:2', 'srv/other.js:6'])
  // A name declared more than once is ambiguous and ignored, which also skips the genuine alias in reused.js.
  assert.equal(found.some(item => item.startsWith('srv/reused.js')), false)
  assert.equal('dataAliases' in report.findings.find(finding => finding.patternId === 'CAP-VALIDATION-001').recommendation, false)
  assert.deepEqual(await scanProject(root), report)
})

test('the validation signal follows flat destructuring of req.data, but not defaults, nesting, reuse, or other sources', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'destructured.js'), [
    'module.exports = srv => {',
    "  srv.on('transfer', req => {",
    '    const { product, qty: amount, $id } = req.data',
    "    if (!product) return req.reject(400, 'PRODUCT_REQUIRED')",
    "    if (amount == null) return req.reject(400, 'AMOUNT_REQUIRED')",
    "    if (!$id) return req.reject(400, 'ID_REQUIRED')",
    '    if (!product || amount < 1) return req.reject(400, \'COMPOUND_IS_NOT_A_SINGLE_GUARD\')',
    '  })',
    "  srv.on('skipped', req => {",
    "    const { note = 'x', ...rest } = req.data",
    "    if (!note) return req.reject(400, 'NOTE')",
    "    if (!rest) return req.reject(400, 'REST')",
    '  })',
    "  srv.on('nested', req => {",
    '    const { header: { id } } = req.data',
    "    if (!id) return req.reject(400, 'ID')",
    '  })',
    '}', ''
  ].join('\n'))
  await writeFile(path.join(root, 'srv', 'reused.js'), [
    'module.exports = srv => {',
    "  srv.before('A', req => { const { code } = req.data; if (!code) return req.reject(400, 'CODE') })",
    "  srv.before('B', req => { const { code } = req.data; if (!code) return req.reject(400, 'CODE') })",
    "  srv.before('C', req => { const { size } = req.data; if (!size) return req.reject(400, 'SIZE') })",
    "  srv.on('D', () => { const size = 3; return size })",
    '}', ''
  ].join('\n'))
  await writeFile(path.join(root, 'srv', 'other.js'), [
    "const { text } = await SELECT.one.from('Notes')",
    "if (!text) throw new Error('no row text')",
    'const { items } = req.data.items',
    "if (!items) throw new Error('no items')",
    'const [first] = req.data',
    "if (!first) throw new Error('no first')", ''
  ].join('\n'))
  const report = await scanProject(root)
  const found = report.findings.filter(finding => finding.patternId === 'CAP-VALIDATION-001')
    .map(finding => `${finding.evidence.file}:${finding.evidence.line}`)
  assert.deepEqual(found, ['srv/destructured.js:4', 'srv/destructured.js:5', 'srv/destructured.js:6'])
  assert.deepEqual(await scanProject(root), report)
})

test('context-only observations are listed compactly, need no decision, and can be read with --context', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'remote.js'), "const api = await cds.connect.to('Rates')\nawait fetch('https://example.invalid/rates')\n")
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)")
  const full = await scanProject(root)
  const brief = prepareReview(full)
  assert.equal(brief.summary.contextOnly, 2)
  assert.equal(brief.observationsOmitted, 0)
  assert.equal(brief.progress.total, 1, 'observations never count as candidates')
  const [group] = brief.observations
  assert.equal(group.patternId, 'CAP-REMOTE-CONSUME-001')
  assert.deepEqual(group.items.map(item => item.line), [1, 2])
  assert.match(group.sha256, /^[a-f0-9]{64}$/)
  assert.ok(brief.patterns.some(pattern => pattern.id === 'CAP-REMOTE-CONSUME-001'), 'guidance travels with the observation')
  // No decision may be recorded for an observation.
  const observationId = group.items[1].id
  assert.throws(() => reconcileDecisions(brief, { snapshotSha256: brief.snapshot.sha256, decisions: [{ id: observationId, decision: 'needs-review', reason: 'x' }] }), /Unknown/)
  assert.equal(reconcileDecisions(brief, { snapshotSha256: brief.snapshot.sha256, decisions: [] }).progress.remaining, 1)
  // A saved compact brief keeps its observations when prepared again.
  assert.deepEqual(prepareReview(JSON.parse(JSON.stringify(brief))).observations, brief.observations)
  // The excerpt of an observation is hash-checked like a candidate's.
  const excerpt = await readReviewContext(root, brief, [observationId])
  assert.equal(excerpt.excerpts[0].findingId, observationId)
  assert.equal(excerpt.excerpts[0].file, 'srv/remote.js')
  assert.match(excerpt.excerpts[0].text, /^1: const api/)
  await writeFile(path.join(root, 'srv', 'remote.js'), 'changed')
  await assert.rejects(readReviewContext(root, brief, [observationId]), /Source changed/)
  await assert.rejects(readReviewContext(root, brief, ['CAP-FINDING-nope']), /Unknown/)
})

async function contextFor(root, source, pattern = 'CAP-REMOTE-CONSUME-001') {
  await writeFile(path.join(root, 'srv', 'handler.js'), source)
  const brief = prepareReview(await scanProject(root))
  const id = brief.observations.find(group => group.patternId === pattern).items[0].id
  return (await readReviewContext(root, brief, [id])).excerpts[0]
}

test('an excerpt inside a try block is widened to the whole try/catch when it fits the ceiling', async context => {
  const root = await fixture(context)
  const filler = (count, prefix) => Array.from({ length: count }, (_, index) => `      const ${prefix}${index} = ${index}`)
  const source = [
    'module.exports = srv => {', "  srv.on('rate', async req => {", '    try {', ...filler(17, 'before'),
    '      const response = await fetch(url)', ...filler(39, 'after'),
    '    } catch (error) {', "      return req.reject(500, 'Could not retrieve rate')", '    }', '  })', '}', ''
  ].join('\n')
  const excerpt = await contextFor(root, source)
  // Without widening, the 10-before/20-after window (lines 11-41) would hide both `try {` and the catch.
  assert.deepEqual([excerpt.startLine, excerpt.endLine], [3, 63])
  assert.deepEqual(excerpt.enclosing, { kind: 'try', startLine: 3, endLine: 63, widened: true })
  assert.match(excerpt.text, /^3:     try \{/)
  assert.match(excerpt.text, /63:     \}$/)
  assert.ok(excerpt.text.includes('catch (error)') && excerpt.text.includes('await fetch(url)'))
  assert.equal(excerpt.truncated, false)
})

test('a try block too large for the character ceiling keeps the default window and says so', async context => {
  const root = await fixture(context)
  const comment = `      // ${'x'.repeat(190)}`
  const source = [
    "srv.on('rate', async req => {", '  try {', ...Array(40).fill(comment), '    const response = await fetch(url)',
    ...Array(40).fill(comment), '  } catch (error) {', "    return req.reject(500, 'Could not retrieve rate')", '  }', '})', ''
  ].join('\n')
  const excerpt = await contextFor(root, source)
  assert.equal(excerpt.enclosing.widened, false)
  assert.deepEqual([excerpt.startLine, excerpt.endLine], [33, 63])
  assert.ok(excerpt.text.includes('await fetch(url)'))
  assert.ok(excerpt.text.length <= 8000)
  assert.equal(excerpt.text.includes('catch (error)'), false)
})

test('the innermost try is used, and strings, comments, templates, and unbalanced braces cannot mislead it', async context => {
  const root = await fixture(context)
  const nested = [
    'const note = "try { not a statement }"', '// try { also not a statement', 'const template = `${1} { try {`',
    "srv.on('a', async req => {", '  try {', ...Array.from({ length: 30 }, (_, index) => `    const outer${index} = ${index}`),
    '    try {', '      await fetch(url)', '    } catch (inner) {', '      throw inner', '    }',
    ...Array.from({ length: 30 }, (_, index) => `    const tail${index} = ${index}`), '  } catch (outer) {', '    throw outer', '  }', '})', ''
  ].join('\n')
  const inner = await contextFor(root, nested)
  assert.deepEqual([inner.enclosing.startLine, inner.enclosing.endLine], [36, 40])
  assert.equal(inner.enclosing.widened, true)

  const unbalanced = ['srv.on(\'a\', async req => {', '  try {', '    await fetch(url)', '  } catch (error) {', '    throw error', '  }', ''].join('\n')
  const broken = await contextFor(root, unbalanced)
  assert.equal('enclosing' in broken, false, 'unbalanced braces mean no widening')
  assert.equal(broken.startLine, 1)

  const plain = await contextFor(root, "srv.on('a', async req => {\n  await fetch(url)\n})\n")
  assert.equal('enclosing' in plain, false)
})

test('the observation list is capped and says how many signals it left out', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'many.js'), Array.from({ length: 130 }, (_, index) => `cds.tx(req${index})`).join('\n'))
  const full = await scanProject(root)
  const brief = prepareReview(full)
  assert.equal(brief.summary.contextOnly, 130)
  assert.equal(brief.observations.reduce((count, group) => count + group.items.length, 0), 100)
  assert.equal(brief.observationsOmitted, 30)
  const again = prepareReview(JSON.parse(JSON.stringify(brief)))
  assert.equal(again.observationsOmitted, 30)
  assert.ok(JSON.stringify(brief).length < JSON.stringify(full).length / 2)
})

test('a UTF-8 BOM in package.json, as saved by many Windows editors, does not stop a scan', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'package.json'), `\uFEFF${JSON.stringify({ dependencies: { '@sap/cds': '^9' } })}`)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)\r\n")
  const report = await scanProject(root)
  assert.equal(report.coverage.complete, true)
  assert.equal(report.runtime.cdsDeclared, '^9')
  assert.equal(report.findings.length, 1)
})

test('the CLI still runs when invoked through a differently cased path on a case-insensitive volume', async context => {
  const root = await mkdtemp(path.join(tmpdir(), 'cap-case-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const scripts = path.join(root, 'Mixed-Case-Dir', 'scripts')
  await mkdir(scripts, { recursive: true })
  for (const file of ['scan.mjs', 'matcher.mjs', 'review.mjs', 'patch.mjs', 'proposals.mjs']) await copyFile(fileURLToPath(new URL(`./${file}`, import.meta.url)), path.join(scripts, file))
  await copyFile(fileURLToPath(new URL('../catalog.json', import.meta.url)), path.join(root, 'Mixed-Case-Dir', 'catalog.json'))
  const altered = path.join(root, 'mixed-case-dir', 'scripts', 'scan.mjs')
  if (!existsSync(altered)) return context.skip('Volume is case-sensitive; this failure mode does not apply')
  const result = spawnSync(process.execPath, [altered, '--help'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Usage: node scan\.mjs/)
})

test('CLI validates saved decisions locally and preserves explicit blockers without writes', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'queries.js'), "SELECT.from(Items).where('code=' + input)")
  const brief = prepareReview(await scanProject(root))
  const reportPath = path.join(root, 'brief.json')
  const decisionPath = path.join(root, 'decisions.json')
  await writeFile(reportPath, JSON.stringify(brief))
  const submission = { snapshotSha256: brief.snapshot.sha256, decisions: [
    { id: brief.findings[0].id, decision: 'proposed', reason: 'Synthetic proposal without equivalence evidence' }
  ] }
  await writeFile(decisionPath, `\uFEFF${JSON.stringify(submission)}`)
  await rm(path.join(root, 'package.json'))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [cli, '--report', reportPath, '--decisions', decisionPath], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const validated = JSON.parse(result.stdout)
  assert.equal(validated.decisions[0].decision, 'needs-review')
  assert.equal(validated.decisions[0].blockers.length, 5)
  assert.equal(validated.progress.reviewed, 1)
  assert.equal(validated.progress.proposed, 0)
  assert.equal(validated.progress.verdict, 'needs-review')
  assert.equal(await readFile(reportPath, 'utf8'), JSON.stringify(brief))
  assert.equal(await readFile(decisionPath, 'utf8'), `\uFEFF${JSON.stringify(submission)}`)
  submission.snapshotSha256 = 'stale'
  await writeFile(decisionPath, JSON.stringify(submission))
  const stale = spawnSync(process.execPath, [cli, '--report', reportPath, '--decisions', decisionPath], { encoding: 'utf8' })
  assert.equal(stale.status, 1)
  assert.equal(stale.stdout, '')
})

test('bounded context reads selected evidence only, preserves line numbers, and rejects stale hashes', async context => {
  const root = await fixture(context)
  const sourcePath = path.join(root, 'srv', 'source.js')
  const lines = Array.from({ length: 100 }, (_, index) => `const syntheticValue${index} = ${index}`)
  lines[49] = 'req.reject(error)'
  await writeFile(sourcePath, lines.join('\n'))
  const brief = prepareReview(await scanProject(root))
  const result = await readReviewContext(root, brief, [brief.findings[0].id])
  assert.equal(result.excerpts[0].startLine, 40)
  assert.equal(result.excerpts[0].endLine, 70)
  assert.equal(result.excerpts[0].truncated, false)
  assert.match(result.excerpts[0].text, /50: req.reject\(error\)/)
  assert.doesNotMatch(result.excerpts[0].text, /syntheticValue0 =/)
  await assert.rejects(readReviewContext(root, brief, ['unknown']), /Unknown/)
  await assert.rejects(readReviewContext(root, brief, Array(4).fill(brief.findings[0].id)), /one to three/)
  await writeFile(sourcePath, `${lines.join('\n')}\nchanged`)
  await assert.rejects(readReviewContext(root, brief, [brief.findings[0].id]), /Source changed/)
})

test('context CLI bounds minified source and rejects traversal or a changed manifest', async context => {
  const root = await fixture(context)
  await writeFile(path.join(root, 'srv', 'minified.js'), `req.reject(error);${'x'.repeat(16000)}`)
  const brief = prepareReview(await scanProject(root))
  const reportPath = path.join(root, 'brief.json')
  await writeFile(reportPath, JSON.stringify(brief))
  const cli = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [cli, root, '--report', reportPath, '--context', brief.findings[0].id], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const excerpt = JSON.parse(result.stdout).excerpts[0]
  assert.equal(excerpt.text.length, 8000)
  assert.equal(excerpt.truncated, true)
  brief.findings[0].evidence.file = 'settings.env'
  await assert.rejects(readReviewContext(root, brief, [brief.findings[0].id]), /allowed source path/)
  brief.findings[0].evidence.file = '../outside.js'
  await assert.rejects(readReviewContext(root, brief, [brief.findings[0].id]), /inside the selected project/)
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^10' } }))
  await assert.rejects(readReviewContext(root, brief, [brief.findings[0].id]), /manifest changed/)
})
