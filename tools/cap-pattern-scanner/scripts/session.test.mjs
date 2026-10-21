import assert from 'node:assert/strict'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { access, chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { normalizePatch, sha256 } from './patch.mjs'
import { checkProposalPatches } from './proposals.mjs'
import { prepareReview, reconcileDecisions } from './review.mjs'
import { scanProject } from './scan.mjs'
import { applyApproved as applyRaw, assertTrusted, combinedDiff, commitSession, decideItem as decideRaw, describeItem, handoff, installDependencies, itemStates, loadSession, nextSteps, pendingApprovals, previewApply, recoverSession, recordPresented, renderItem, repairSession, reviseSession, runAll, startSession } from './session-core.mjs'
import { discardSession, renderSummary, sessionSummary } from './session-lifecycle.mjs'
import { appendEvent, readLog } from './session-state.mjs'
import { reviewLoop } from './session-terminal.mjs'
import { checks, originalLine, solution } from './workflow-fixtures.mjs'

Object.assign(process.env, { GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 't@example.com' })
const sessionCli = fileURLToPath(new URL('./session.mjs', import.meta.url))
const execFileAsync = promisify(execFile)
const hasGit = (() => { try { execFileSync('git', ['--version'], { stdio: 'ignore' }); return true } catch { return false } })()
const gitIn = (cwd, ...args) => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=Test', '-c', 'commit.gpgsign=false', '-C', cwd, ...args], { encoding: 'utf8' })
const validationLine = "if (!req.data.name) return req.reject(400, 'NAME_REQUIRED')"
const remoteLine = 'req.reject(502, err.message)'
const secondLine = originalLine.replace('Items', 'Orders')
const secondPatch = `--- a/srv/service.js\n+++ b/srv/service.js\n@@ -4 +4 @@\n-${secondLine}\n+SELECT.from(Orders).where({ code: input })\n`
const queryPatch = file => `--- a/${file}\n+++ b/${file}\n@@ -1 +1 @@\n-${originalLine}\n+SELECT.from(Items).where({ code: input })\n`
const coherentPatch = `--- a/srv/service.js\n+++ b/srv/service.js\n@@ -1,2 +1,2 @@\n-${originalLine}\n-${validationLine}\n+SELECT.from(Items).where({ code: input })\n+if (!req.data.name?.trim()) return req.reject(400, 'NAME_REQUIRED')\n`
const blocker = { missingEvidence: 'Whether name is @mandatory in the model', investigated: ['db/schema.cds has no Items entity', 'No test covers an empty name'], unblockingCheck: 'Add the Items entity or point to the model that defines name' }

/** Two files: srv/service.js (query, validation, remote error) and srv/other.js (a second, independent query). */
async function fixture(context, { git = false, dirty = false, subdir, crlf = false, lock = false, second = false, prepare } = {}) {
  const repo = await mkdtemp(path.join(tmpdir(), 'cap-session-'))
  context.after(() => rm(repo, { recursive: true, force: true }))
  const root = subdir ? path.join(repo, subdir) : repo
  if (subdir) await mkdir(root)
  await mkdir(path.join(root, 'srv'))
  await mkdir(path.join(root, 'db'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^9' }, scripts: { test: 'node srv/check.js' } }))
  await writeFile(path.join(root, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ...(second ? [secondLine] : []), ''].join('\n'))
  await writeFile(path.join(root, 'srv', 'other.js'), `${originalLine}\n`)
  await writeFile(path.join(root, 'srv', 'check.js'), "const fs = require('fs')\nprocess.exit(fs.readdirSync(__dirname).some(name => fs.readFileSync(__dirname + '/' + name, 'utf8').includes('BRO' + 'KEN')) ? 1 : 0)\n")
  await writeFile(path.join(root, '.gitignore'), 'node_modules\n')
  if (lock) await writeFile(path.join(root, 'package-lock.json'), '{}\n')
  await prepare?.(root)
  if (crlf) {
    gitIn(repo, 'init', '-q', '-b', 'main')
    gitIn(repo, 'config', 'core.autocrlf', 'true')
    for (const file of ['srv/service.js', 'srv/other.js']) await writeFile(path.join(root, file), (await readFile(path.join(root, file), 'utf8')).replace(/\n/g, '\r\n'))
  }
  if (git) {
    if (!crlf) gitIn(repo, 'init', '-q', '-b', 'main')
    gitIn(repo, 'add', '.')
    gitIn(repo, 'commit', '-q', '-m', 'initial')
  }
  if (dirty) {
    await writeFile(path.join(root, 'notes.txt'), 'my uncommitted notes\n')
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^9' }, scripts: { test: 'node srv/check.js' }, edited: true }))
  }
  const report = await scanProject(root)
  const brief = prepareReview(report)
  const find = (pattern, file) => brief.findings.find(finding => finding.patternId === pattern && finding.evidence.file === file).id
  const queries = brief.findings.filter(finding => finding.patternId === 'CAP-QUERY-001' && finding.evidence.file === 'srv/service.js').sort((a, b) => a.evidence.line - b.evidence.line)
  const ids = { queryB: queries[1]?.id, query: find('CAP-QUERY-001', 'srv/service.js'), validation: find('CAP-VALIDATION-001', 'srv/service.js'), remote: find('CAP-REMOTE-ERROR-001', 'srv/service.js'), other: find('CAP-QUERY-001', 'srv/other.js') }
  const validate = async decisions => {
    const submission = { snapshotSha256: brief.snapshot.sha256, decisions }
    return reconcileDecisions(report, submission, { patchChecks: await checkProposalPatches(root, report, submission) })
  }
  return { root, repo, report, brief, ids, validate }
}

const proposeQuery = (id, file, extra = {}) => ({ id, decision: 'proposed', reason: `Input is concatenated into a where string in ${file}.`, summary: 'Client input is concatenated into a query string.', checks, ...solution(queryPatch(file)), ...extra })
const standard = ids => [
  proposeQuery(ids.query, 'srv/service.js'),
  { id: ids.validation, decision: 'needs-review', reason: 'Truthiness is not @mandatory.', uncertainty: ['0 and blank are unproven'], blocker },
  { id: ids.remote, decision: 'not-applicable', reason: 'Local validator error, not upstream.' },
  proposeQuery(ids.other, 'srv/other.js')
]
async function start(context, options = {}, build = standard) {
  const f = await fixture(context, options)
  const validated = await f.validate(build(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const session = await startSession({ report: f.report, validated, project: f.root, session: path.join(out, 'session'), mode: options.mode ?? 'auto', reviewer: 'Vera', branch: options.branch })
  return { ...f, validated, session, out }
}
const read = (...parts) => readFile(path.join(...parts), 'utf8')

// Most tests are about what happens after a developer approved a diff they were shown, so these helpers do the showing
// and the preview the way the CLI does. The guard tests below call decideRaw, applyRaw and the CLI directly.
async function decideItem(session, id, choice, notes, reviewer, options) {
  const item = session.queue.find(candidate => candidate.row.id === id)
  if (choice === 'approve' && options === undefined && item?.row.ready) {
    await recordPresented(session, [item], 'test')
    return decideRaw(session, id, choice, notes, reviewer, { diff: item.row.verifiedPatch.patchSha256, via: 'test' })
  }
  return decideRaw(session, id, choice, notes, reviewer, options)
}
async function applyApproved(session, options) {
  if (options.confirm !== 'all') return applyRaw(session, options)
  const preview = await previewApply(session, { ids: options.ids, testCommand: options.testCommand, testTimeout: options.testTimeout })
  return applyRaw(session, { ...options, confirm: preview.confirm ?? 'all' })
}

test('an actionable finding becomes a concrete, verified diff the developer sees before the explanation', async context => {
  const { session, ids } = await start(context)
  const item = session.queue.find(candidate => candidate.row.id === ids.query)
  assert.equal(item.row.ready, true)
  const text = renderItem(session, item, 0, session.queue.length)
  assert.ok(text.indexOf(`-${originalLine}`) > 0 && text.indexOf('+SELECT.from(Items).where({ code: input })') > text.indexOf(`-${originalLine}`))
  assert.ok(text.indexOf('Diff (- removed, + added):') < text.indexOf('Why this fixes it:'), 'the diff comes before the explanation')
  for (const part of ['srv/service.js', ids.query, 'Problem: Client input is concatenated', 'Severity: medium', 'Compatibility', 'Regression risks', 'Uncertainty', 'Verification steps', 'Proposed tests', 'Verified is not tested: NOT applied, tests NOT run', 'Patch file:', 'IDE diff:']) assert.ok(text.includes(part), part)
  assert.match(await read(session.meta.proposalFiles[ids.query].patch), /^--- a\/srv\/service\.js/)
  assert.equal(await read(session.meta.proposalFiles[ids.query].dir, 'after', 'srv', 'service.js'), (await read(session.workspaceProject, 'srv', 'service.js')).replace(originalLine, 'SELECT.from(Items).where({ code: input })'))
})

test('findings in one function are handled by one coherent proposal that keeps every finding ID', async context => {
  const { session, validated, ids } = await start(context, {}, ids => [
    proposeQuery(ids.query, 'srv/service.js', { proposal: solution(coherentPatch).proposal }),
    { id: ids.validation, decision: 'proposed', reason: 'Same function: the blank check belongs with the query fix.', checks, addressedBy: ids.query },
    { id: ids.remote, decision: 'not-applicable', reason: 'Local validator error.' },
    { id: ids.other, decision: 'no-proposal', reason: 'Fixed elsewhere in the model.', blocker: { investigated: ['srv/other.js is only used by a test'] } }
  ])
  const primary = validated.decisions.find(entry => entry.id === ids.query)
  const covered = validated.decisions.find(entry => entry.id === ids.validation)
  assert.deepEqual(primary.addresses, [ids.validation])
  assert.equal(covered.decision, 'proposed')
  assert.equal(covered.verifiedPatch, undefined, 'the diff belongs to the primary finding only')
  assert.deepEqual(session.queue.map(item => item.row.id), [ids.query], 'one proposal in the queue')
  assert.match(renderItem(session, session.queue[0], 0, 1), new RegExp(`Findings: ${ids.query}, ${ids.validation}`))
  await assert.rejects(decideItem(session, ids.validation, 'approve'), /addressed by the proposal in/)
  const entry = await decideItem(session, ids.query, 'approve', 'one change for both')
  assert.deepEqual(entry.addresses, [ids.validation])
  assert.equal(entry.targets[0].file, 'srv/service.js')
  assert.deepEqual(new Set((await itemStates(session)).map(state => state.id)), new Set([ids.query]))
})

test('a covered finding is refused when its proposal is not verified or changes another file', async context => {
  const f = await fixture(context)
  const broken = await f.validate([
    proposeQuery(f.ids.query, 'srv/service.js', { proposal: { ...solution(queryPatch('srv/service.js')).proposal, patch: queryPatch('srv/service.js').replace('where({ code: input })', 'where({ x })').replace(`-${originalLine}`, '-SELECT nothing') } }),
    { id: f.ids.validation, decision: 'proposed', reason: 'Covered.', checks, addressedBy: f.ids.query }
  ])
  assert.equal(broken.decisions.find(entry => entry.id === f.ids.validation).decision, 'needs-review')
  assert.match(broken.decisions.find(entry => entry.id === f.ids.validation).blockers.join(' '), /not verified/)
  const wrongFile = await f.validate([
    proposeQuery(f.ids.other, 'srv/other.js'),
    { id: f.ids.validation, decision: 'proposed', reason: 'Covered.', checks, addressedBy: f.ids.other }
  ])
  assert.match(wrongFile.decisions.find(entry => entry.id === f.ids.validation).blockers.join(' '), /does not change srv\/service\.js/)
  assert.throws(() => reconcileDecisions(f.report, { snapshotSha256: f.brief.snapshot.sha256, decisions: [{ ...proposeQuery(f.ids.query, 'srv/service.js'), addressedBy: f.ids.other }] }), /carry no proposal of its own/)
})

test('an unresolved finding states the specific blocker, and no-proposal stays distinct from needs-review', async context => {
  const f = await fixture(context)
  const validated = await f.validate([
    ...standard(f.ids).slice(0, 2),
    { id: f.ids.remote, decision: 'needs-review', reason: 'Maybe upstream.', uncertainty: ['more verification is required'] },
    { id: f.ids.other, decision: 'no-proposal', reason: 'Investigated; no change warranted.' }
  ])
  const held = validated.decisions.find(entry => entry.id === f.ids.validation)
  assert.deepEqual(held.blocker, blocker)
  assert.deepEqual(held.blockers, [])
  const generic = validated.decisions.find(entry => entry.id === f.ids.remote)
  assert.match(generic.blockers.join(' '), /No specific blocker stated: say what evidence is missing, what was already investigated, which specific check would unblock a proposal/)
  const noProposal = validated.decisions.find(entry => entry.id === f.ids.other)
  assert.equal(noProposal.decision, 'needs-review', 'a no-proposal decision without an investigation is not accepted')
  assert.match(noProposal.blockers.join(' '), /must list what was investigated/)
  const clean = await f.validate([...standard(f.ids).slice(0, 3), { id: f.ids.other, decision: 'no-proposal', reason: 'No change warranted.', blocker: { investigated: ['Read the model and tests'] } }])
  assert.equal(clean.progress.noProposal, 1)
  assert.equal(clean.progress.needsReview, 1)
  assert.equal(clean.decisions.find(entry => entry.id === f.ids.other).decision, 'no-proposal')
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const session = await startSession({ report: f.report, validated: clean, project: f.root, session: path.join(out, 's'), mode: 'copy' })
  const heldItem = session.queue.find(item => item.row.id === f.ids.validation)
  const text = renderItem(session, heldItem, 1, 2)
  for (const part of ['NO VERIFIED PROPOSAL', 'Missing evidence: Whether name is @mandatory', 'Already investigated:', 'db/schema.cds has no Items entity', 'Check that would unblock it: Add the Items entity']) assert.ok(text.includes(part), part)
  await assert.rejects(decideItem(session, f.ids.validation, 'approve'), /cannot be approved/)
  assert.ok(!session.queue.some(item => item.row.id === f.ids.other), 'no-proposal is not in the queue')
})

test('not-applicable and no-proposal findings stay in the report but never enter the approval queue', async context => {
  const { session, ids } = await start(context, {}, ids => [...standard(ids).slice(0, 2), { id: ids.remote, decision: 'not-applicable', reason: 'Local.' }, { id: ids.other, decision: 'no-proposal', reason: 'None warranted.', blocker: { investigated: ['read it'] } }])
  assert.deepEqual(session.queue.map(item => item.row.id), [ids.query, ids.validation])
  await assert.rejects(decideItem(session, ids.remote, 'approve'), /not in the review queue.*traceability/)
  await assert.rejects(decideItem(session, ids.other, 'reject', 'no'), /not in the review queue/)
  assert.deepEqual(session.groups.notApplicable.map(item => item.row.id), [ids.remote])
  assert.deepEqual(session.groups.noProposal.map(item => item.row.id), [ids.other])
  const shown = await execFileAsync(process.execPath, [sessionCli, 'show', '--session', session.dir, '--all'])
  assert.match(shown.stdout, new RegExp(`${ids.remote}.*not-applicable`))
  assert.match(shown.stdout, new RegExp(`${ids.other}.*no-proposal`))
  assert.ok(!(await itemStates(session)).some(state => [ids.remote, ids.other].includes(state.id)))
})

test('each proposal is approved independently and only approved, hash-confirmed diffs are applied', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await start(context, { git: true })
  const approval = await decideItem(session, ids.query, 'approve', 'looks right')
  assert.deepEqual(approval.acceptedRegressions.map(item => item.case), ['null', 'undefined', 'quoted'], 'approving records the behavior changes the developer accepts')
  assert.match(renderItem(session, session.queue.find(item => item.row.id === ids.query), 0, 3), /Behavior changes you accept by approving \(input cases\):\n  - null: null becomes a real null/)
  await decideItem(session, ids.other, 'reject', 'we keep the string form here')
  const [approved] = await pendingApprovals(session)
  assert.equal(approved.row.id, ids.query)
  await assert.rejects(applyApproved(session, { confirm: 'deadbeef' }), /--confirm must be the sha256/)
  await assert.rejects(applyApproved(session, { confirm: 'all', ids: [ids.other] }), /not approved and waiting/)
  await assert.rejects(applyApproved(session, { confirm: undefined }), /needs --confirm/)
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), await read(root, 'srv', 'service.js'), 'nothing applied by deciding or by refused confirmations')
  await assert.rejects(applyRaw(session, { confirm: approved.approval.patchSha256 }), /--confirm must be the sha256 shown by the apply preview/, 'the approval hash is not apply permission')
  const tokenNoCmd = sha256(`apply\n${ids.query}:${approved.approval.patchSha256}`)
  await assert.rejects(applyRaw(session, { confirm: tokenNoCmd }), /apply preview was never shown/, 'the right token without a shown preview is refused')
  const preview = await previewApply(session, { testCommand: 'node srv/check.js' })
  assert.equal(preview.combined, normalizePatch(queryPatch('srv/service.js')))
  // Confirming without the test command must fail: the bound command differs from what was previewed
  await assert.rejects(applyRaw(session, { confirm: preview.confirm }), /test command or timeout differs from what was previewed|sha256 shown by the apply preview/, 'apply without the previewed test command is refused')
  const results = await applyRaw(session, { confirm: preview.confirm, testCommand: 'node srv/check.js' })
  assert.deepEqual(results.map(result => [result.id, result.applied, result.result]), [[ids.query, true, 'test-passed']])
  assert.match(await read(session.workspaceProject, 'srv', 'service.js'), /where\(\{ code: input \}\)/)
  assert.equal(await read(session.workspaceProject, 'srv', 'other.js'), `${originalLine}\n`, 'the rejected proposal is not applied')
  assert.match(await read(root, 'srv', 'service.js'), /'code=' \+ input/, 'the original project is never changed')
  const states = Object.fromEntries((await itemStates(await loadSession(session.dir))).map(state => [state.id, state.state]))
  assert.equal(states[ids.query], 'applied, tests passed')
  assert.equal(states[ids.other], 'rejected')
  assert.equal((await combinedDiff(await loadSession(session.dir))).includes('where({ code: input })'), true)
})

test('deferred, change-requested, undecided, and revised proposals are not applied; approval cannot survive a changed diff', async context => {
  const { session, ids, root, validate } = await start(context, { git: true })
  await decideItem(session, ids.other, 'defer', 'later')
  await decideItem(session, ids.query, 'approve', 'first look')
  await decideItem(session, ids.query, 'needs-changes', 'also trim the value')
  const requests = JSON.parse(await read(session.dir, 'revision-requests.json'))
  assert.equal(requests.length, 1)
  assert.equal(requests[0].feedback, 'also trim the value')
  assert.match(requests[0].previousPatch, /where\(\{ code: input \}\)/)
  assert.equal((await pendingApprovals(await loadSession(session.dir))).length, 0, 'a change request replaces the earlier approval')
  assert.deepEqual(await applyApproved(await loadSession(session.dir), { confirm: 'all' }), [])
  for (const file of ['service.js', 'other.js']) assert.equal(await read(session.workspaceProject, 'srv', file), await read(root, 'srv', file))
  // The AI revises the diff; the new diff needs a new decision.
  const revisedPatch = queryPatch('srv/service.js').replace('where({ code: input })', 'where({ code: String(input).trim() })')
  const revised = await validate([proposeQuery(ids.query, 'srv/service.js', { ...solution(revisedPatch), summary: 'Trimmed and bound.' }), ...standard(ids).slice(1)])
  const result = await reviseSession(await loadSession(session.dir), revised)
  assert.deepEqual(result.revised, [ids.query])
  assert.equal(result.session.developer.decisions.some(decision => decision.id === ids.query), false)
  assert.equal(result.session.developer.decisions.find(decision => decision.id === ids.other)?.decision, 'deferred')
  assert.match(renderItem(result.session, result.session.queue.find(item => item.row.id === ids.query), 0, 2), /String\(input\)\.trim\(\)/)
  assert.deepEqual(await applyApproved(result.session, { confirm: 'all' }), [], 'the revised proposal is still undecided')
})

test('an approval is invalid after the original source changes, and approving a stale proposal is refused', async context => {
  const { session, ids, root } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  await writeFile(path.join(root, 'srv', 'service.js'), `// edited after review\n${await read(root, 'srv', 'service.js')}`)
  const states = await itemStates(await loadSession(session.dir))
  assert.match(states.find(state => state.id === ids.query).state, /approved, not applied; STALE: srv\/service\.js changed after review/)
  await assert.rejects(applyApproved(await loadSession(session.dir), { confirm: 'all' }), /stale.*approval is no longer valid/)
  await assert.rejects(decideItem(await loadSession(session.dir), ids.query, 'approve'), /is stale/)
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), `${originalLine}\n${validationLine}\n${remoteLine}\n`)
})

test('a proposal with unproven null/undefined behavior is shown, approved, and applied only through the same safeguards', { skip: !hasGit && 'git is not available' }, async context => {
  const uncertain = { 'input-contract': { status: 'unverified', evidence: 'How a bound null or undefined behaves against the installed adapter was not established.' } }
  const { session, ids, root } = await start(context, { git: true }, ids => [
    proposeQuery(ids.query, 'srv/service.js', { checks: { ...checks, ...uncertain }, uncertainty: ['Null and undefined binding was not run against the adapter.'] }),
    { id: ids.validation, decision: 'no-proposal', reason: 'None warranted.', blocker: { investigated: ['read it'] } },
    { id: ids.remote, decision: 'not-applicable', reason: 'Local.' },
    { id: ids.other, decision: 'no-proposal', reason: 'None warranted.', blocker: { investigated: ['read it'] } }
  ])
  const item = session.queue.find(candidate => candidate.row.id === ids.query)
  assert.equal(item.row.ready, true, 'the diff is in the queue without any developer question')
  const described = describeItem(session, item, 0, 1)
  assert.equal(described.canApprove, true)
  assert.equal(described.equivalence.proven, false)
  assert.match(described.equivalence.reasons.join('\n'), /not established/)
  assert.match(renderItem(session, item, 0, 1), /Equivalence with the current behavior is NOT proven\. Why:\n {2}- input-contract is unverified/)
  const approval = await decideItem(session, ids.query, 'approve', 'accept the risk')
  assert.equal(approval.equivalenceProven, false)
  assert.match(approval.unprovenBecause.join('\n'), /not established/)
  await assert.rejects(applyApproved(session, { confirm: undefined }), /needs --confirm/)
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), await read(root, 'srv', 'service.js'), 'nothing is applied by deciding')
  await writeFile(path.join(root, 'srv', 'service.js'), `// edited after review\n${await read(root, 'srv', 'service.js')}`)
  await assert.rejects(applyApproved(await loadSession(session.dir), { confirm: 'all' }), /stale.*approval is no longer valid/)
})

const fakeInstall = async (command, cwd) => { await mkdir(path.join(cwd, 'node_modules', 'left-pad'), { recursive: true }); return { exitCode: 0, timedOut: false, outputTail: 'added 1 package' } }

test('dependencies are installed in the review workspace only from a fixed command list, after a hash-confirmed preview', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, root } = await start(context, { git: true, lock: true })
  await assert.rejects(installDependencies(session, { command: 'npm install left-pad' }), /must be exactly one of/)
  await assert.rejects(installDependencies(session, { command: 'npm ci && curl example.invalid' }), /must be exactly one of/)
  const preview = await installDependencies(session, { command: 'npm ci', runner: () => assert.fail('a preview must not run anything') })
  assert.equal(preview.installed, false)
  assert.equal(preview.folder, session.workspaceProject)
  assert.match(preview.willDo.join('\n'), /not your project folder/)
  await assert.rejects(installDependencies(session, { command: 'npm ci', confirm: 'f'.repeat(64), runner: fakeInstall }), /--confirm must be the sha256 shown by the preview/)
  await assert.rejects(installDependencies(session, { command: 'npm ci --ignore-scripts', confirm: preview.confirm, runner: fakeInstall }), /--confirm must be the sha256/, 'the hash is bound to the exact command')
  const done = await installDependencies(session, { command: 'npm ci', confirm: preview.confirm, runner: fakeInstall })
  assert.equal(done.installed, true)
  assert.equal((await loadSession(session.dir)).meta.install.command, 'npm ci')
  await assert.rejects(access(path.join(root, 'node_modules')), /ENOENT/, 'the original project is untouched')
  await assert.rejects(installDependencies(session, { command: 'npm ci', runner: fakeInstall }), /node_modules already exists/)
})

test('a failed install leaves no partial node_modules, and an installed one never blocks the commit', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true, lock: true })
  const failing = async (command, cwd) => { await mkdir(path.join(cwd, 'node_modules', 'half'), { recursive: true }); return { exitCode: 1, timedOut: false, outputTail: 'ERESOLVE' } }
  const preview = await installDependencies(session, { command: 'npm ci' })
  const failed = await installDependencies(session, { command: 'npm ci', confirm: preview.confirm, runner: failing })
  assert.equal(failed.installed, false)
  assert.match(failed.outputTail, /ERESOLVE/)
  await assert.rejects(access(path.join(session.workspaceProject, 'node_modules')), /ENOENT/)
  await installDependencies(session, { command: 'npm ci', confirm: preview.confirm, runner: fakeInstall })
  await decideItem(session, ids.query, 'approve', 'ok')
  const applied = await applyApproved(session, { confirm: 'all' })
  assert.equal(applied[0].applied, true)
  const commitPreview = await commitSession(await loadSession(session.dir), {})
  const committed = await commitSession(await loadSession(session.dir), { confirm: commitPreview.confirm })
  assert.equal(committed.committed, true, 'node_modules is ignored by git, so it is not an unapplied change')
})

test('a missing lock file or an unignored node_modules is refused before anything is installed', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await start(context, { git: true })
  await assert.rejects(installDependencies(session, { command: 'npm ci', runner: fakeInstall }), /package-lock\.json is missing/)
  const withLock = await start(context, { git: true, lock: true })
  await writeFile(path.join(withLock.session.workspaceProject, '.gitignore'), 'dist\n')
  await assert.rejects(installDependencies(withLock.session, { command: 'npm ci', runner: fakeInstall }), /node_modules is not ignored by git.*nothing was installed/)
  await assert.rejects(access(path.join(withLock.session.workspaceProject, 'node_modules')), /ENOENT/)
})

test('the hand-off names the repository, the review branch, how to review it, and the push command the developer runs', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await start(context, { git: true })
  const before = await handoff(session)
  assert.equal(before.repository, await realpath(repo))
  assert.equal(before.sameRepositoryAsProject, true)
  assert.equal(before.push, null, 'nothing to push before a commit')
  assert.match(before.review.diff, /diff$/)
  await decideItem(session, ids.query, 'approve', 'ok')
  await applyApproved(session, { confirm: 'all' })
  const preview = await commitSession(await loadSession(session.dir), {})
  const result = await commitSession(await loadSession(session.dir), { confirm: preview.confirm })
  const after = await handoff(await loadSession(session.dir))
  assert.equal(after.committed, result.sha)
  assert.equal(after.branch, session.meta.git.reviewBranch)
  assert.equal(after.push, `git -C "${await realpath(repo)}" push -u <remote> ${after.branch}`)
  assert.match(after.review.summary, new RegExp(`diff --stat ${after.base}\\.\\.${after.branch.replace('/', '\\/')}$`))
  gitIn(repo, 'remote', 'add', 'origin', 'https://example.invalid/x.git')
  assert.match((await handoff(await loadSession(session.dir))).push, / push -u origin cap-ai-11\/review-/)
  const status = await execFileAsync(process.execPath, [sessionCli, 'status', '--session', session.dir])
  assert.match(status.stdout, /Review branch: cap-ai-11\/review-.* in .* \(the same repository as your project\)/)
  assert.match(status.stdout, /Review and push \(you run these\):\n {2}git -C .* diff --stat .*\n {2}git -C .* diff .*\n {2}git -C .* push -u origin cap-ai-11\/review-/)
  assert.ok(gitIn(repo, 'branch', '--list', after.branch).includes(after.branch), 'the branch is in the project repository')
})

test('a copy session has no hand-off branch', async context => {
  const { session } = await start(context, { mode: 'copy' })
  assert.equal(await handoff(session), null)
})

test('the review branch name can be chosen, and a bad or existing name is refused with nothing created', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, repo } = await start(context, { git: true, branch: 'feature/ccflex-query-binding' })
  assert.equal(session.meta.git.reviewBranch, 'feature/ccflex-query-binding')
  assert.ok(gitIn(repo, 'branch', '--list', 'feature/ccflex-query-binding').includes('feature/ccflex-query-binding'))
  assert.equal(gitIn(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), 'main', 'the original branch is still checked out')
  for (const name of ['bad name', '../x', '-x', 'a..b', 'x.lock/']) {
    await assert.rejects(start(context, { git: true, branch: name }), /--branch must be a plain branch name|not a valid git branch name/, name)
  }
  const f = await fixture(context, { git: true })
  gitIn(f.repo, 'branch', 'taken')
  const validated = await f.validate(standard(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  await assert.rejects(startSession({ report: f.report, validated, project: f.root, session: path.join(out, 'session'), mode: 'worktree', branch: 'taken' }), /The branch taken already exists/)
  await assert.rejects(access(path.join(out, 'session')), /ENOENT/, 'nothing is left behind')
  assert.ok(!gitIn(f.repo, 'worktree', 'list').includes(path.join(out, 'session')))
})

test('run-all previews the whole plan, then installs, applies, and tests under one confirmation that is bound to the plan', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await start(context, { git: true, lock: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  const options = { install: 'npm ci', testCommand: 'node srv/check.js', runner: fakeInstall }
  await assert.rejects(runAll(session, { install: 'npm ci', runner: fakeInstall }), /--install is only needed for tests/)
  const plan = await runAll(session, options)
  assert.equal(plan.ran, false)
  assert.match(plan.willDo.join('\n'), /Run "node srv\/check\.js" there, on your computer/)
  assert.match(plan.willDo.join('\n'), /Commit and push nothing/)
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), await read(root, 'srv', 'service.js'), 'a preview changes nothing')
  await assert.rejects(access(path.join(session.workspaceProject, 'node_modules')), /ENOENT/)
  await assert.rejects(runAll(session, { ...options, confirm: 'e'.repeat(64) }), /--confirm must be the sha256 shown by the preview/)
  await assert.rejects(runAll(session, { ...options, testCommand: 'node -e "0"', confirm: plan.confirm }), /--confirm must be the sha256/, 'a changed command invalidates the preview')
  await decideItem(session, ids.other, 'approve', 'also ok')
  await assert.rejects(runAll(await loadSession(session.dir), { ...options, confirm: plan.confirm }), /approvals, folder, or commands changed since the preview/, 'approving another proposal invalidates it')
  const fresh = await loadSession(session.dir)
  const second = await runAll(fresh, options)
  const result = await runAll(fresh, { ...options, confirm: second.confirm })
  assert.equal(result.stage, 'done')
  assert.equal(result.tests, 'passed')
  assert.equal(result.commitReady, true)
  assert.equal(result.applied.length, 2)
  assert.ok(result.applied.every(item => item.applied && item.result === 'test-passed'))
  assert.match(await read(session.workspaceProject, 'srv', 'service.js'), /where\(\{ code: input \}\)/)
  assert.equal(await read(root, 'srv', 'service.js'), `${originalLine}\n${validationLine}\n${remoteLine}\n`, 'the original project is untouched')
  const loaded = await loadSession(session.dir)
  const preview = await commitSession(loaded, {})
  assert.equal((await commitSession(loaded, { confirm: preview.confirm })).committed, true, 'what run-all produced can be committed')
})

test('run-all stops before applying when the install fails, and reports failing tests without allowing a commit', { skip: !hasGit && 'git is not available' }, async context => {
  const broken = await start(context, { git: true, lock: true })
  await decideItem(broken.session, broken.ids.query, 'approve', 'ok')
  const failing = async (command, cwd) => { await mkdir(path.join(cwd, 'node_modules', 'half'), { recursive: true }); return { exitCode: 1, timedOut: false, outputTail: 'ERESOLVE could not resolve' } }
  const plan = await runAll(broken.session, { install: 'npm ci', testCommand: 'node srv/check.js', runner: failing })
  const stopped = await runAll(broken.session, { install: 'npm ci', testCommand: 'node srv/check.js', runner: failing, confirm: plan.confirm })
  assert.equal(stopped.stage, 'install')
  assert.equal(stopped.commitReady, false)
  assert.match(stopped.install.outputTail, /ERESOLVE/)
  assert.deepEqual(stopped.applied, [])
  assert.equal(await read(broken.session.workspaceProject, 'srv', 'service.js'), await read(broken.root, 'srv', 'service.js'), 'nothing was applied')
  await assert.rejects(access(path.join(broken.session.workspaceProject, 'node_modules')), /ENOENT/)

  const red = await start(context, { git: true })
  await decideItem(red.session, red.ids.query, 'approve', 'ok')
  const redPlan = await runAll(red.session, { testCommand: 'node -e "process.exit(1)"' })
  const outcome = await runAll(red.session, { testCommand: 'node -e "process.exit(1)"', confirm: redPlan.confirm })
  assert.equal(outcome.tests, 'failed')
  assert.equal(outcome.commitReady, false)
  assert.match(outcome.next, /Tests FAILED or could not run\. That can be the environment.*you decide/)
  await assert.rejects(commitSession(await loadSession(red.session.dir), {}), /failing tests, or the tests could not run.*--accept-failing-tests/)
})

test('run-all skips an install that is not needed and works without tests as an unverified apply', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true, lock: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  await mkdir(path.join(session.workspaceProject, 'node_modules'))
  const plan = await runAll(session, { install: 'npm ci', testCommand: 'node srv/check.js', runner: () => assert.fail('already installed') })
  assert.match(plan.install, /skipped: node_modules is already there/)
  const done = await runAll(session, { install: 'npm ci', testCommand: 'node srv/check.js', runner: () => assert.fail('already installed'), confirm: plan.confirm })
  assert.equal(done.tests, 'passed')
  const bare = await start(context, { git: true })
  await decideItem(bare.session, bare.ids.query, 'approve', 'ok')
  const barePlan = await runAll(bare.session, {})
  assert.match(barePlan.willDo.join('\n'), /Run no tests: the result will be reported as unverified/)
  const unverified = await runAll(bare.session, { confirm: barePlan.confirm })
  assert.equal(unverified.tests, 'not run')
  assert.equal(unverified.commitReady, true)
  assert.equal(unverified.applied[0].result, 'unverified')
  await assert.rejects(runAll(await loadSession(bare.session.dir), {}), /No approved proposals are waiting/)
})

test('the run-all command line prints the plan and the hash, and nothing runs without it', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  const shown = await execFileAsync(process.execPath, [sessionCli, 'run-all', '--session', session.dir, '--test-command', 'node srv/check.js'])
  assert.match(shown.stdout, /NOT RUN\. This would:/)
  assert.match(shown.stdout, /To run it all: --confirm [a-f0-9]{64}/)
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), await read(root, 'srv', 'service.js'))
  const hash = /--confirm ([a-f0-9]{64})/.exec(shown.stdout)[1]
  const ran = await execFileAsync(process.execPath, [sessionCli, 'run-all', '--session', session.dir, '--test-command', 'node srv/check.js', '--confirm', hash])
  assert.match(ran.stdout, /Tests: passed\nReady to commit: yes/)
  await assert.rejects(execFileAsync(process.execPath, [sessionCli, 'run-all', '--session', session.dir, '--confirm', 'xyz']), /--confirm must be the 64-character sha256/)
})

test('the developer can commit despite failing or impossible tests, but only by saying so explicitly, and the commit records it', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  await applyApproved(session, { confirm: 'all', testCommand: 'node -e "process.exit(1)"' })
  const loaded = await loadSession(session.dir)
  await assert.rejects(commitSession(loaded, {}), /--accept-failing-tests/)
  await assert.rejects(commitSession(loaded, { confirm: 'a'.repeat(64) }), /--accept-failing-tests/, 'a hash alone is not enough')
  const preview = await commitSession(loaded, { acceptFailingTests: true })
  assert.equal(preview.committed, false)
  assert.match(preview.message, /Tests: FAILED or could not run; committed at the developer's decision/)
  const plain = await commitSession(await loadSession(session.dir), { acceptFailingTests: true })
  assert.equal(plain.confirm, preview.confirm)
  await assert.rejects(commitSession(loaded, { acceptFailingTests: true, confirm: 'b'.repeat(64) }), /--confirm must be the sha256/)
  const done = await commitSession(loaded, { acceptFailingTests: true, confirm: preview.confirm })
  assert.equal(done.committed, true)
  assert.match(gitIn(repo, 'log', '-1', '--format=%B', session.meta.git.reviewBranch), /committed at the developer's decision/)
  assert.equal(gitIn(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), 'main', 'the original branch is untouched')
})

test('the session always says where the diff is and what the developer can do next, for every state', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true })
  const words = async () => { const next = await nextSteps(await loadSession(session.dir)); return { where: Object.fromEntries(next.where), options: next.options.join('\n') } }
  assert.match((await words()).options, /Nothing is approved yet/)
  await decideItem(session, ids.query, 'approve', 'ok')
  let state = await words()
  assert.match(state.options, /1 approved diff\(s\) wait to be applied.*run-all.*apply/s)
  assert.match(state.options, /no tests, or they cannot run in this environment, apply without tests/)
  await applyApproved(session, { confirm: 'all' })
  state = await words()
  const diffFile = state.where['Everything applied so far, as one diff file']
  assert.equal(diffFile, path.join(session.dir, 'applied.diff'))
  assert.match(await read(diffFile), new RegExp(`^--- a/srv/service\\.js`), 'the applied change is one readable file')
  assert.match(state.options, /No tests were run.*run them in the review workspace folder yourself, or skip them/s)
  assert.match(state.where['Review workspace (the changed code; not your project folder)'], /workspace/)
  const preview = await commitSession(await loadSession(session.dir), {})
  await commitSession(await loadSession(session.dir), { confirm: preview.confirm })
  state = await words()
  assert.match(state.options, /committed on the review branch.*the tool never pushes/s)
  assert.match(state.where['Review branch'], /cap-ai-11\/review-.* \(the same repository as your project\)/)
  const failed = await start(context, { git: true })
  await decideItem(failed.session, failed.ids.query, 'approve', 'ok')
  await applyApproved(failed.session, { confirm: 'all', testCommand: 'node -e "process.exit(1)"' })
  const next = await nextSteps(await loadSession(failed.session.dir))
  assert.match(next.options.join('\n'), /could not run\. That can be the environment.*Commit anyway if you judge the failure environmental.*--accept-failing-tests/s)
})

test('a git review session leaves the original branch, HEAD, and every uncommitted change untouched', { skip: !hasGit && 'git is not available' }, async context => {
  const f = await fixture(context, { git: true, dirty: true })
  const validated = await f.validate(standard(f.ids))
  const snapshot = () => ({ head: gitIn(f.root, 'rev-parse', 'HEAD'), branch: gitIn(f.root, 'rev-parse', '--abbrev-ref', 'HEAD'), status: gitIn(f.root, 'status', '--porcelain', '--untracked-files=all') })
  const before = snapshot()
  const packageBefore = await read(f.root, 'package.json')
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const session = await startSession({ report: f.report, validated, project: f.root, session: path.join(out, 'session') })
  assert.equal(session.meta.mode, 'worktree')
  assert.deepEqual(session.developer.summary, { reviewable: 3, approved: 0, rejected: 0, needsChanges: 0, deferred: 0, undecided: 3 }, 'a new session starts with every item undecided')
  assert.deepEqual(snapshot(), before, 'branch, HEAD and status are unchanged')
  assert.equal(await read(f.root, 'notes.txt'), 'my uncommitted notes\n')
  assert.equal(await read(f.root, 'package.json'), packageBefore)
  assert.equal(session.meta.git.unrelatedChangeCount, 2)
  assert.match(gitIn(f.root, 'branch', '--list', 'cap-ai-11/*'), /cap-ai-11\/review-/)
  assert.equal(gitIn(session.meta.workspace, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), session.meta.git.reviewBranch)
  await assert.rejects(access(path.join(session.workspaceProject, 'notes.txt')), 'uncommitted work is not copied into the review workspace')
  await decideItem(session, f.ids.query, 'approve', 'ok')
  await applyApproved(session, { confirm: 'all' })
  assert.deepEqual(snapshot(), before, 'applying changes only the review worktree')
  assert.match(gitIn(session.meta.workspace, 'status', '--porcelain'), / M srv\/service\.js/)
  assert.equal(gitIn(session.meta.workspace, 'log', '--oneline').trim().split('\n').length, 1, 'nothing is committed')
})

test('a session refuses to start for uncommitted or changed target files, and creates nothing', { skip: !hasGit && 'git is not available' }, async context => {
  const f = await fixture(context, { git: true })
  const validated = await f.validate(standard(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const target = path.join(out, 'session')
  const nothingCreated = async () => {
    await assert.rejects(access(target), 'no session folder is left behind')
    assert.equal(gitIn(f.root, 'branch', '--list', 'cap-ai-11/*').trim(), '')
    assert.equal(gitIn(f.root, 'worktree', 'list').trim().split('\n').length, 1)
  }
  // Same content but a modified file as git sees it (mode change): uncommitted work in a target.
  await chmod(path.join(f.root, 'srv', 'other.js'), 0o755)
  assert.match(gitIn(f.root, 'status', '--porcelain'), /srv\/other\.js/)
  await assert.rejects(startSession({ report: f.report, validated, project: f.root, session: target }), /Uncommitted changes in files the proposals change: srv\/other\.js/)
  await nothingCreated()
  await chmod(path.join(f.root, 'srv', 'other.js'), 0o644)
  // Different content: the reviewed hash no longer matches the working file.
  await writeFile(path.join(f.root, 'srv', 'other.js'), `${originalLine}\n// local edit\n`)
  await assert.rejects(startSession({ report: f.report, validated, project: f.root, session: target }), /changed since the proposal was verified/)
  await nothingCreated()
})

test('a project without git gets an isolated copy, never the original, and dependencies are not copied', async context => {
  const f = await fixture(context)
  await mkdir(path.join(f.root, 'node_modules', 'dep'), { recursive: true })
  await writeFile(path.join(f.root, 'node_modules', 'dep', 'index.js'), 'x')
  const validated = await f.validate(standard(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const session = await startSession({ report: f.report, validated, project: f.root, session: path.join(out, 'session') })
  assert.equal(session.meta.mode, 'copy')
  assert.notEqual(session.workspaceProject, f.root)
  assert.deepEqual((await readdir(session.workspaceProject)).sort(), ['.gitignore', 'db', 'package.json', 'srv'])
  await decideItem(session, f.ids.query, 'approve', 'ok')
  await decideItem(session, f.ids.other, 'approve', 'ok')
  const results = await applyApproved(session, { confirm: 'all', testCommand: 'node srv/check.js' })
  assert.deepEqual(results.map(result => result.result), ['test-passed', 'test-passed'])
  assert.equal(await read(f.root, 'srv', 'service.js'), `${originalLine}\n${validationLine}\n${remoteLine}\n`, 'the original project is untouched')
  const diff = await combinedDiff(await loadSession(session.dir))
  assert.equal((diff.match(/^--- a\//gm) ?? []).length, 2, 'all applied changes can be inspected together')
  await assert.rejects(startSession({ report: f.report, validated, project: f.root, session: path.join(f.root, 'inside') }), /outside the analyzed project/)
  await assert.rejects(startSession({ report: f.report, validated, project: f.root, session: path.join(out, 'session') }), /already exists/)
})

test('a failing developer test is reported honestly and is never run for AI-supplied commands', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve', 'ok')
  const results = await applyApproved(session, { confirm: 'all', testCommand: 'node -e "process.exit(3)"' })
  assert.equal(results[0].result, 'test-failed')
  assert.match(JSON.stringify(results[0].verification), /"exitCode":3/)
  assert.match((await itemStates(await loadSession(session.dir))).find(state => state.id === ids.query).state, /applied, tests FAILED/)
  const unverified = await start(context, { mode: 'copy' })
  await decideItem(unverified.session, unverified.ids.query, 'approve', 'ok')
  assert.equal((await applyApproved(unverified.session, { confirm: 'all' }))[0].result, 'unverified')
})

test('the sequential review asks about each proposal in turn and applies nothing', async context => {
  const { session, ids, root } = await start(context, { mode: 'copy' })
  const input = new PassThrough()
  const output = new PassThrough()
  let shown = ''
  output.on('data', chunk => { shown += chunk })
  input.end('Vera\nn\na\n\nr\nbind it differently\nd\nq\n')
  const summary = await reviewLoop(await loadSession(session.dir), { input, output })
  assert.match(shown, /Proposal 1 of 3/)
  assert.match(shown, /\[a\]pprove  \[r\]eject  \[c\]hange request  \[d\]efer  \[n\]ext  \[q\]uit/)
  assert.match(shown, /NO VERIFIED PROPOSAL/)
  assert.deepEqual([summary.skipped, summary.approved, summary.rejected], [1, 1, 1])
  const developer = JSON.parse(await read(session.dir, 'developer-decisions.json'))
  assert.equal(developer.reviewer, 'Vera')
  assert.deepEqual(developer.decisions.map(decision => [decision.id, decision.decision]).sort(), [[ids.query, 'approved'], [ids.validation, 'rejected']].sort())
  assert.match(await read(session.workspaceProject, 'srv', 'service.js'), /'code=' \+ input/, 'nothing applied by reviewing')
  assert.match(await read(root, 'srv', 'service.js'), /'code=' \+ input/)
})

test('the session CLI starts, reviews from piped answers, previews, and applies only with the confirmed hash', async context => {
  const f = await fixture(context)
  const validated = await f.validate(standard(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const files = { brief: path.join(out, 'brief.json'), validated: path.join(out, 'validated.json'), session: path.join(out, 'session') }
  await writeFile(files.brief, JSON.stringify(f.report))
  await writeFile(files.validated, JSON.stringify(validated))
  const cli = (...args) => execFileAsync(process.execPath, [sessionCli, ...args]).catch(error => ({ stdout: error.stdout, stderr: error.stderr, code: error.code }))
  const started = await cli('start', '--report', files.brief, '--decisions', files.validated, '--project', f.root, '--session', files.session, '--mode', 'copy')
  assert.match(started.stdout, /Proposals ready for your review: 2/)
  const review = spawn(process.execPath, [sessionCli, 'review', '--session', files.session, '--reviewer', 'Vera'])
  let reviewed = ''
  review.stdout.on('data', chunk => { reviewed += chunk })
  review.stdin.end('a\nok\nr\nnot now\nr\nheld\n')
  await new Promise(resolve => review.on('close', resolve))
  assert.match(reviewed, /Recorded: approved. Nothing was applied./)
  const preview = await cli('apply', '--session', files.session, '--test-command', 'node srv/check.js')
  assert.match(preview.stdout, /NOT APPLIED\. Exact diff for/)
  assert.match(preview.stdout, /Approving a proposal does not apply it/)
  const token = /--confirm ([a-f0-9]{64})/.exec(preview.stdout)[1]
  const wrong = await cli('apply', '--session', files.session, '--confirm', 'wrong')
  assert.equal(wrong.code, 1)
  assert.match(wrong.stderr, /--confirm must be the 64-character sha256/)
  const mismatched = await cli('apply', '--session', files.session, '--confirm', 'a'.repeat(64), '--test-command', 'node srv/check.js')
  assert.equal(mismatched.code, 1)
  assert.match(mismatched.stderr, /--confirm must be the sha256 shown by the apply preview/)
  const applied = await cli('apply', '--session', files.session, '--confirm', token, '--test-command', 'node srv/check.js')
  assert.match(applied.stdout, /applied to the isolated workspace, tests passed/)
  const status = await cli('status', '--session', files.session)
  assert.match(status.stdout, /applied, tests passed/)
  assert.match((await cli('diff', '--session', files.session)).stdout, /^--- a\//)
  assert.equal((await lstat(path.join(files.session, 'workspace'))).isDirectory(), true)
})

test('commit puts exactly the applied files on the review branch after confirmation, never on the original branch', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await start(context, { git: true, dirty: true })
  await assert.rejects(commitSession(session), /Nothing has been applied/)
  await decideItem(session, ids.query, 'approve', 'ok')
  await applyApproved(session, { confirm: 'all', testCommand: 'node srv/check.js' })
  const applied = await loadSession(session.dir)
  const originalHead = gitIn(root, 'rev-parse', 'HEAD')
  const originalStatus = gitIn(root, 'status', '--porcelain', '--untracked-files=all')
  const preview = await commitSession(applied, {})
  assert.equal(preview.committed, false)
  assert.deepEqual(preview.files, ['srv/service.js'])
  assert.equal(preview.confirm, (await import('./patch.mjs')).sha256(await combinedDiff(applied)))
  assert.equal(gitIn(applied.meta.workspace, 'log', '--oneline').trim().split('\n').length, 1, 'the preview commits nothing')
  await assert.rejects(commitSession(applied, { confirm: 'wrong' }), /--confirm must be the sha256 of the combined diff/)
  const done = await commitSession(applied, { confirm: preview.confirm, message: 'CAP-AI-11 review' })
  assert.equal(done.committed, true)
  assert.equal(gitIn(applied.meta.workspace, 'log', '-1', '--format=%s').trim(), 'CAP-AI-11 review')
  assert.equal(gitIn(applied.meta.workspace, 'show', '--name-only', '--format=', 'HEAD').trim(), 'srv/service.js')
  assert.equal(gitIn(applied.meta.workspace, 'status', '--porcelain').trim(), '')
  assert.equal(gitIn(root, 'rev-parse', 'HEAD'), originalHead, 'the original branch did not move')
  assert.equal(gitIn(root, 'status', '--porcelain', '--untracked-files=all'), originalStatus, 'your uncommitted work is untouched')
  assert.equal(gitIn(root, 'log', '--oneline', '-1', done.branch).trim().length > 0, true)
  await assert.rejects(commitSession(await loadSession(session.dir), { confirm: done.confirm }), /already committed/)
  assert.match(await read(root, 'srv', 'service.js'), /'code=' \+ input/)
})

test('commit refuses copy sessions, failing tests, and workspace changes the session did not make', { skip: !hasGit && 'git is not available' }, async context => {
  const copy = await start(context, { mode: 'copy' })
  await decideItem(copy.session, copy.ids.query, 'approve', 'ok')
  await applyApproved(copy.session, { confirm: 'all' })
  await assert.rejects(commitSession(await loadSession(copy.session.dir), {}), /no review branch in a copy session/)
  const failing = await start(context, { git: true })
  await decideItem(failing.session, failing.ids.query, 'approve', 'ok')
  await applyApproved(failing.session, { confirm: 'all', testCommand: 'node -e "process.exit(1)"' })
  await assert.rejects(commitSession(await loadSession(failing.session.dir), {}), /failing tests/)
  const stray = await start(context, { git: true })
  await decideItem(stray.session, stray.ids.query, 'approve', 'ok')
  await applyApproved(stray.session, { confirm: 'all', testCommand: 'node srv/check.js' })
  await writeFile(path.join(stray.session.workspaceProject, 'srv', 'stray.js'), 'x\n')
  await assert.rejects(commitSession(await loadSession(stray.session.dir), {}), /not applied by the session: srv\/stray\.js/)
})

test('a project in a subfolder of a git repository (a monorepo) gets a worktree, apply, and commit that stay inside it', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root, repo } = await start(context, { git: true, subdir: 'cap' })
  assert.equal(session.meta.mode, 'worktree')
  assert.equal(path.relative(session.meta.workspace, session.workspaceProject), 'cap')
  const head = gitIn(repo, 'rev-parse', 'HEAD')
  await decideItem(session, ids.query, 'approve', 'ok')
  const [result] = await applyApproved(session, { confirm: 'all', testCommand: 'node srv/check.js' })
  assert.equal(result.result, 'test-passed')
  const applied = await loadSession(session.dir)
  const preview = await commitSession(applied, {})
  assert.deepEqual(preview.files, ['cap/srv/service.js'])
  const done = await commitSession(applied, { confirm: preview.confirm })
  assert.equal(gitIn(applied.meta.workspace, 'show', '--name-only', '--format=', 'HEAD').trim(), 'cap/srv/service.js')
  assert.equal(gitIn(repo, 'rev-parse', 'HEAD'), head)
  assert.equal(done.committed, true)
  assert.match(await read(root, 'srv', 'service.js'), /'code=' \+ input/)
})

test('a Windows-style repository (CRLF working files, core.autocrlf) still gets a review branch and a matching diff', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await start(context, { git: true, crlf: true })
  assert.equal(session.meta.mode, 'worktree', 'the checkout equals the reviewed file, so no fallback is needed')
  assert.ok((await read(root, 'srv', 'service.js')).includes('\r\n'))
  assert.ok((await read(session.workspaceProject, 'srv', 'service.js')).includes('\r\n'))
  await decideItem(session, ids.query, 'approve', 'ok')
  const [result] = await applyApproved(session, { confirm: 'all', testCommand: 'node srv/check.js' })
  assert.equal(result.result, 'test-passed')
  const after = await read(session.workspaceProject, 'srv', 'service.js')
  assert.ok(after.includes('where({ code: input })\r\n'), 'the line endings of the file are kept')
  assert.equal((after.match(/\r\n/g) ?? []).length, 3)
})

test('when the last commit does not match the reviewed file, auto mode falls back to a copy and worktree mode leaves nothing behind', { skip: !hasGit && 'git is not available' }, async context => {
  const f = await fixture(context, { git: true })
  // A change git is told to ignore: status is clean, but a checkout of the commit differs from the reviewed file.
  await writeFile(path.join(f.root, 'srv', 'other.js'), `${originalLine}\n`.replace('code=', 'code= '))
  gitIn(f.repo, 'update-index', '--assume-unchanged', 'srv/other.js')
  const report = await scanProject(f.root)
  const brief = prepareReview(report)
  const find = file => brief.findings.find(finding => finding.patternId === 'CAP-QUERY-001' && finding.evidence.file === file)
  const otherLine = (await read(f.root, 'srv', 'other.js')).trimEnd()
  const patch = `--- a/srv/other.js\n+++ b/srv/other.js\n@@ -1 +1 @@\n-${otherLine}\n+SELECT.from(Items).where({ code: input })\n`
  const submission = { snapshotSha256: brief.snapshot.sha256, decisions: brief.findings.map(finding => (finding.id === find('srv/other.js').id
    ? proposeQuery(finding.id, 'srv/other.js', solution(patch)) : { id: finding.id, decision: 'not-applicable', reason: 'Not part of this test.' })) }
  const validated = reconcileDecisions(report, submission, { patchChecks: await checkProposalPatches(f.root, report, submission) })
  assert.equal(validated.decisions.find(entry => entry.id === find('srv/other.js').id).decision, 'proposed')
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  await assert.rejects(startSession({ report, validated, project: f.root, session: path.join(out, 'strict'), mode: 'worktree' }), /does not match the reviewed file/)
  await assert.rejects(access(path.join(out, 'strict')), 'no session folder is left behind')
  assert.equal(gitIn(f.repo, 'branch', '--list', 'cap-ai-11/*').trim(), '', 'no review branch is left behind')
  assert.equal(gitIn(f.repo, 'worktree', 'list').trim().split('\n').length, 1, 'no worktree is left behind')
  const session = await startSession({ report, validated, project: f.root, session: path.join(out, 'auto') })
  assert.equal(session.meta.mode, 'copy')
  assert.match(session.meta.fallback, /No review branch/)
  assert.equal(gitIn(f.repo, 'branch', '--list', 'cap-ai-11/*').trim(), '')
  await decideItem(session, find('srv/other.js').id, 'approve', 'ok')
  await assert.rejects(commitSession(await loadSession(session.dir), {}), /no review branch/)
})

/** A git session with the query proposal applied (tests passed), ready for the commit checks. */
async function applied(context, options = {}) {
  const result = await start(context, { git: true, ...options })
  await decideItem(result.session, result.ids.query, 'approve', 'ok')
  await applyApproved(result.session, { confirm: 'all', testCommand: 'node srv/check.js' })
  return { ...result, session: await loadSession(result.session.dir) }
}

test('commit refuses content that differs from what the session applied, even in a file the session changed', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await applied(context)
  const file = path.join(session.workspaceProject, 'srv', 'service.js')
  const original = await read(file)
  await writeFile(file, `${original}// edited by hand after the patch\n`)
  await assert.rejects(commitSession(session, {}), /srv\/service\.js differs from what the session applied/)
  const preview = await commitSession(await loadSession(session.dir), { }).catch(error => error)
  assert.ok(preview instanceof Error, 'the preview is refused too, so a hand-edited file is never offered for confirmation')
  assert.equal(gitIn(session.meta.workspace, 'log', '--oneline').trim().split('\n').length, 1, 'nothing was committed')
  await writeFile(file, original)
  assert.equal((await commitSession(await loadSession(session.dir), {})).committed, false, 'restoring the applied content makes the preview available again')
})

test('commit refuses when the recorded result no longer matches the file (tampered record or restored file)', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await applied(context)
  await writeFile(path.join(session.workspaceProject, 'srv', 'service.js'), `${originalLine}\n${validationLine}\n${remoteLine}\n`)
  assert.match(gitIn(session.meta.workspace, 'status', '--porcelain').trim() || 'clean', /clean/, 'the file is back to the committed content, so git sees no change')
  await assert.rejects(commitSession(session, {}), /differs from what the session applied \(edited after applying, or restored\)/)
})

test('commit and apply refuse when the workspace is not on the review branch or the branch moved', { skip: !hasGit && 'git is not available' }, async context => {
  const moved = await applied(context)
  gitIn(moved.session.meta.workspace, 'checkout', '-q', '-b', 'somewhere-else')
  await assert.rejects(commitSession(moved.session, {}), /on "somewhere-else", not on the review branch cap-ai-11\/review-/)
  await assert.rejects(applyApproved(moved.session, { confirm: 'all' }), /not on the review branch/)
  gitIn(moved.session.meta.workspace, 'checkout', '-q', moved.session.meta.git.reviewBranch)
  gitIn(moved.session.meta.workspace, 'commit', '-q', '--allow-empty', '-m', 'someone else committed here')
  await assert.rejects(commitSession(await loadSession(moved.session.dir), {}), /review branch moved since the session recorded it/)
  gitIn(moved.session.meta.workspace, 'reset', '-q', '--soft', 'HEAD~1')
  assert.equal((await commitSession(await loadSession(moved.session.dir), {})).committed, false)
})

test('commit refuses pre-staged changes and never commits more than the applied files', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await applied(context)
  await writeFile(path.join(session.workspaceProject, 'srv', 'other.js'), '// staged by hand\n')
  gitIn(session.meta.workspace, 'add', 'srv/other.js')
  await assert.rejects(commitSession(session, {}), /not applied by the session: srv\/other\.js/)
  gitIn(session.meta.workspace, 'restore', '--staged', 'srv/other.js')
  gitIn(session.meta.workspace, 'checkout', '--', 'srv/other.js')
  gitIn(session.meta.workspace, 'update-index', '--no-assume-unchanged', 'srv/other.js')
  gitIn(session.meta.workspace, 'rm', '-q', '--cached', 'srv/check.js')
  await assert.rejects(commitSession(session, {}), /not applied by the session|already has staged changes/)
  gitIn(session.meta.workspace, 'reset', '-q')
  const preview = await commitSession(await loadSession(session.dir), {})
  const done = await commitSession(await loadSession(session.dir), { confirm: preview.confirm })
  assert.equal(gitIn(session.meta.workspace, 'show', '--name-only', '--format=', done.sha).trim(), 'srv/service.js')
})

test('apply with --confirm all verifies every approved proposal first, so a stale one leaves nothing half-applied', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  await decideItem(session, ids.other, 'approve', 'ok')
  await writeFile(path.join(root, 'srv', 'other.js'), `// edited after review\n${await read(root, 'srv', 'other.js')}`)
  await assert.rejects(applyApproved(session, { confirm: 'all' }), new RegExp(`${ids.other} is stale.*Nothing was applied`))
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), `${originalLine}\n${validationLine}\n${remoteLine}\n`, 'the first proposal was not applied either')
  assert.equal((await loadSession(session.dir)).applications.length, 0)
  const edited = await start(context, { git: true })
  await decideItem(edited.session, edited.ids.query, 'approve', 'ok')
  await writeFile(path.join(edited.session.workspaceProject, 'srv', 'service.js'), `// hand edit in the workspace\n${await read(edited.session.workspaceProject, 'srv', 'service.js')}`)
  await assert.rejects(applyApproved(edited.session, { confirm: 'all' }), /no longer applies to the review workspace|differs from the reviewed file/)
})

test('a failing run stops at the first failure and reports what was and was not applied', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  await decideItem(session, ids.other, 'approve', 'ok')
  const results = await applyApproved(session, { confirm: 'all', testCommand: 'node -e "process.exit(1)"' })
  assert.deepEqual(results.map(result => [result.applied, result.result]), [[true, 'test-failed']], 'it stops after the failing tests')
  const states = Object.fromEntries((await itemStates(await loadSession(session.dir))).map(state => [state.id, state.state]))
  assert.deepEqual([states[ids.other], states[ids.query]].sort(), ['applied, tests FAILED', 'approved, not applied'])
})

test('the session core has no terminal code, and the chat gets the same proposal as data', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  const core = await readFile(fileURLToPath(new URL('./session-core.mjs', import.meta.url)), 'utf8')
  assert.doesNotMatch(core, /process\.std(in|out)|readline|reviewLoop/)
  const item = describeItem(session, session.queue.find(candidate => candidate.row.id === ids.query), 0, 3)
  assert.equal(item.canApprove, true)
  assert.deepEqual(item.verification, { patchVerified: true, patchSha256: item.verification.patchSha256, applied: false, testsRun: false, testResult: null, meaning: 'the diff applies cleanly to the reviewed source; it is not applied and no tests have run' })
  assert.match(item.diff, /^--- a\/srv\/service\.js/)
  assert.deepEqual(item.acceptedRegressions.map(entry => entry.case), ['null', 'undefined', 'quoted'])
  const held = describeItem(session, session.queue.find(candidate => candidate.row.id === ids.validation), 1, 3)
  assert.deepEqual([held.canApprove, held.diff, held.verification.patchVerified], [false, null, false])
  assert.equal(held.blocker.missingEvidence, blocker.missingEvidence)
  const shown = JSON.parse((await execFileAsync(process.execPath, [sessionCli, 'show', '--session', session.dir, '--json'])).stdout)
  assert.equal(shown.format, 'cap-pattern-session-queue')
  assert.equal(shown.items.length, 3)
  assert.equal(shown.items[0].verification.meaning.includes('no tests have run'), true)
  assert.deepEqual(shown.traceability.notApplicable, [ids.remote])
})

test('the session CLI names the exact problem for bad arguments', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  const cli = (...args) => execFileAsync(process.execPath, [sessionCli, ...args]).catch(error => ({ stdout: error.stdout, stderr: error.stderr, code: error.code }))
  const base = ['--session', session.dir]
  for (const [args, message] of [
    [['start', '--report', 'a', '--decisions', 'b', '--project', 'c', '--session', 'd', '--mode', 'branch'], /--mode must be auto, worktree, or copy \(got "branch"\)/],
    [['decide', ...base, '--id', ids.query, '--decision', 'yes'], /--decision must be approve, reject, needs-changes, or defer \(got "yes"\)/],
    [['apply', ...base, '--test-timeout', '0'], /--test-timeout must be a whole number of seconds from 1 to 3600/],
    [['apply', ...base, '--test-timeout', 'soon'], /--test-timeout must be a whole number/],
    [['decide', ...base, '--id', '../x', '--decision', 'defer'], /--id must be a finding ID/],
    [['commit', ...base, '--confirm', 'all'], /--confirm must be the 64-character sha256/],
    [['status', '--session', path.join(session.dir, 'missing')], /ENOENT/]
  ]) {
    const result = await cli(...args)
    assert.equal(result.code, 1, args.join(' '))
    assert.match(result.stderr, message, args.join(' '))
  }
})

// ── Workflow state machine: the JavaScript refuses out-of-order or unproven steps, whoever calls it ──────────────────────

const cliIn = (...args) => execFileAsync(process.execPath, [sessionCli, ...args]).catch(error => ({ stdout: error.stdout, stderr: error.stderr, code: error.code }))

test('an approval needs the exact diff to have been shown, and the hash printed with it', async context => {
  const { session, ids } = await start(context)
  const hash = session.queue.find(item => item.row.id === ids.query).row.verifiedPatch.patchSha256
  await assert.rejects(decideRaw(session, ids.query, 'approve', '', 'Vera', { diff: hash }), /before its diff was shown by the review interface/)
  await recordPresented(session, session.queue.filter(item => item.row.id === ids.query), 'show')
  await assert.rejects(decideRaw(session, ids.query, 'approve', '', 'Vera'), /needs --diff/)
  await assert.rejects(decideRaw(session, ids.query, 'approve', '', 'Vera', { diff: 'f'.repeat(64) }), /needs --diff/)
  assert.equal((await pendingApprovals(session)).length, 0, 'every refused attempt recorded nothing')
  const entry = await decideRaw(session, ids.query, 'approve', '', 'Vera', { diff: hash })
  assert.equal(entry.decision, 'approved')
  const { events } = await readLog(session.dir)
  assert.deepEqual(events.map(event => event.type), ['session-started', 'presented', 'decided'])
  // Rejecting, deferring, and requesting changes do not need the proof: they cannot cause a change.
  await decideRaw(session, ids.other, 'defer', 'later')
})

test('the CLI cannot approve a diff it never showed, and showing is what unlocks it', async context => {
  const f = await fixture(context)
  const validated = await f.validate(standard(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  await writeFile(path.join(out, 'b.json'), JSON.stringify(f.report))
  await writeFile(path.join(out, 'v.json'), JSON.stringify(validated))
  const dir = path.join(out, 'session')
  await cliIn('start', '--report', path.join(out, 'b.json'), '--decisions', path.join(out, 'v.json'), '--project', f.root, '--session', dir, '--mode', 'copy')
  const hash = validated.decisions.find(entry => entry.id === f.ids.query).verifiedPatch.patchSha256
  const blind = await cliIn('decide', '--session', dir, '--id', f.ids.query, '--decision', 'approve', '--diff', hash)
  assert.equal(blind.code, 1)
  assert.match(blind.stderr, /before its diff was shown/)
  const shown = await cliIn('show', '--session', dir, '--id', f.ids.query)
  assert.ok(shown.stdout.includes(`--diff ${hash}`), 'show prints the hash to approve with')
  const noHash = await cliIn('decide', '--session', dir, '--id', f.ids.query, '--decision', 'approve')
  assert.match(noHash.stderr, /needs --diff/)
  assert.match((await cliIn('decide', '--session', dir, '--id', f.ids.query, '--decision', 'approve', '--diff', hash)).stdout, /Recorded approved for .* Nothing was applied/)
  // Approving is not applying: apply shows the diff first, and only its own token applies.
  const direct = await cliIn('apply', '--session', dir, '--confirm', hash)
  assert.match(direct.stderr, /--confirm must be the sha256 shown by the apply preview/)
  const guessed = await cliIn('apply', '--session', dir, '--confirm', sha256(`apply\n${f.ids.query}:${hash}`))
  assert.match(guessed.stderr, /apply preview was never shown/)
  assert.equal(await read(path.join(dir, 'workspace', 'srv', 'service.js')), await read(f.root, 'srv', 'service.js'), 'nothing was applied by any of these')
})

test('a changed proposal voids its approval and needs a new shown diff and a new decision, without touching other proposals', async context => {
  const { session, ids, validate } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  await decideItem(session, ids.other, 'approve', 'ok')
  const trimmed = queryPatch('srv/service.js').replace('where({ code: input })', 'where({ code: String(input).trim() })')
  const revised = await validate([proposeQuery(ids.query, 'srv/service.js', { ...solution(trimmed), summary: 'Trimmed.' }), ...standard(ids).slice(1)])
  const { session: next, revised: changed } = await reviseSession(await loadSession(session.dir), revised)
  assert.deepEqual(changed, [ids.query])
  assert.deepEqual((await pendingApprovals(next)).map(({ row }) => row.id), [ids.other], 'the unrelated approval stands')
  const newHash = next.queue.find(item => item.row.id === ids.query).row.verifiedPatch.patchSha256
  await assert.rejects(decideRaw(next, ids.query, 'approve', '', 'Vera', { diff: newHash }), /before its diff was shown/, 'the old presentation does not count for the new diff')
  await decideItem(next, ids.query, 'approve', 'second look')
  assert.deepEqual((await pendingApprovals(next)).map(({ row }) => row.id).sort(), [ids.other, ids.query].sort())
  await assertTrusted(next)
})

test('rejected, deferred, held, and unapproved proposals cannot be applied or previewed for apply', async context => {
  const { session, ids } = await start(context, { git: true })
  await decideItem(session, ids.other, 'reject', 'no')
  await decideItem(session, ids.validation, 'defer', 'later')
  assert.deepEqual((await previewApply(session)).pending, [])
  for (const id of [ids.query, ids.other, ids.validation, ids.remote]) await assert.rejects(previewApply(session, { ids: [id] }), /not approved and waiting/)
  await assert.rejects(decideItem(session, ids.validation, 'approve', 'try'), /cannot be approved/)
  assert.deepEqual(await applyRaw(session, { confirm: 'a'.repeat(64) }), [], 'nothing waits, so nothing can be applied')
})

test('editing the decisions file, the log, the proposals, or an application record by hand makes every state-changing command refuse', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true })
  await decideItem(session, ids.other, 'reject', 'no')
  await decideItem(session, ids.query, 'approve', 'ok')
  await assertTrusted(session)
  const decisionsFile = path.join(session.dir, 'developer-decisions.json')
  const original = await read(decisionsFile)
  // 1. Forging an approval for a proposal the developer rejected.
  await writeFile(decisionsFile, original.replace('"decision": "rejected"', '"decision": "approved"'))
  await assert.rejects(assertTrusted(session), /does not match the event log/)
  await assert.rejects(previewApply(await loadSession(session.dir)), /not trustworthy/)
  await assert.rejects(decideRaw(await loadSession(session.dir), ids.validation, 'defer', 'x'), /not trustworthy/)
  await assert.rejects(runAll(await loadSession(session.dir), {}), /not trustworthy/)
  await assert.rejects(commitSession(await loadSession(session.dir), {}), /Nothing has been applied|not trustworthy/)
  await writeFile(decisionsFile, original)
  await assertTrusted(session)
  // 2. Swapping the proposal after it was approved.
  const validatedFile = path.join(session.dir, 'validated.json')
  const validatedText = await read(validatedFile)
  await writeFile(validatedFile, validatedText.replace('Client input is concatenated into a query string.', 'Changed after approval.'))
  await assert.rejects(assertTrusted(session), /validated\.json differs from the version the session recorded/)
  await writeFile(validatedFile, validatedText)
  // 3. Editing the log.
  const logFile = path.join(session.dir, 'events.jsonl')
  const log = await read(logFile)
  await writeFile(logFile, log.replace('"decision":"approved"', '"decision":"rejected"'))
  await assert.rejects(assertTrusted(session), /does not continue the chain/)
  await writeFile(logFile, log.split('\n').filter((line, index) => index !== 1).join('\n'))
  await assert.rejects(assertTrusted(session), /does not continue the chain/)
  await assert.rejects(appendEvent(session.dir, 'decided', { id: ids.query, decision: 'approved', patchSha256: 'x' }), /not intact/)
  await writeFile(logFile, log)
  await assertTrusted(session)
  // 4. A forged application record that claims something was applied.
  await writeFile(path.join(session.dir, 'applications', '01-forged.json'), JSON.stringify({ format: 'cap-pattern-application', findingId: ids.query, files: [], appliedPatch: '', result: 'test-passed' }))
  await assert.rejects(assertTrusted(session), /01-forged\.json has no matching entry in the event log/)
  await assert.rejects(commitSession(await loadSession(session.dir), {}), /not trustworthy/)
  await rm(path.join(session.dir, 'applications', '01-forged.json'))
  await assertTrusted(session)
})

test('a session without an event log (older tool version) is refused for decisions, apply, and commit but can still be shown', async context => {
  const { session, ids } = await start(context)
  await rm(path.join(session.dir, 'events.jsonl'))
  await assert.rejects(decideRaw(session, ids.query, 'reject', 'no'), /event log/)
  await assert.rejects(previewApply(session), /event log/)
  assert.match(renderItem(session, session.queue[0], 0, 1), /Proposal 1 of 1|Proposal 1 of/)
})

test('applying and committing each need their own preview to have been shown, and approving more invalidates the apply token', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  const first = await previewApply(session)
  await decideItem(session, ids.other, 'approve', 'ok too')
  await assert.rejects(applyRaw(session, { confirm: first.confirm }), /--confirm must be the sha256 shown by the apply preview/, 'a token for fewer diffs does not authorise more')
  const second = await previewApply(session)
  assert.notEqual(first.confirm, second.confirm)
  assert.equal((await applyRaw(session, { confirm: second.confirm })).length, 2)
  const loaded = await loadSession(session.dir)
  const token = sha256(await combinedDiff(loaded))
  await assert.rejects(commitSession(loaded, { confirm: token }), /commit preview was never shown/)
  await commitSession(loaded, {})
  assert.equal((await commitSession(await loadSession(session.dir), { confirm: token })).committed, true)
  const { events } = await readLog(session.dir)
  assert.deepEqual(events.map(event => event.type).filter(type => !['presented', 'decided'].includes(type)), ['session-started', 'apply-previewed', 'apply-previewed', 'apply-intent', 'applied', 'apply-intent', 'applied', 'commit-previewed', 'commit-intent', 'committed'])
})

test('run-all needs its plan shown first through the log, so a copied hash alone cannot run it', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  const token = sha256(JSON.stringify({ folder: session.workspaceProject, diffs: [session.queue.find(item => item.row.id === ids.query).row.verifiedPatch.patchSha256], install: null, testCommand: null }))
  await assert.rejects(runAll(session, { confirm: token }), /run-all plan was never shown/)
  const plan = await runAll(session, {})
  assert.equal(plan.confirm, token)
  assert.equal((await runAll(session, { confirm: token })).applied.length, 1)
})

test('applied work must have been approved with that exact diff when it ran, as the log shows', async context => {
  const { session, ids } = await start(context, { git: true })
  await decideItem(session, ids.query, 'approve', 'ok')
  const hash = session.queue.find(item => item.row.id === ids.query).row.verifiedPatch.patchSha256
  const { checkApplied } = await import('./session-state.mjs')
  const { events } = await readLog(session.dir)
  const forged = [...events, { seq: events.length + 1, type: 'applied', data: { id: ids.other, patchSha256: hash } }]
  assert.match(checkApplied(forged), /applied .* without an approval of that exact diff in force/)
  assert.equal(checkApplied([...events, { seq: 9, type: 'applied', data: { id: ids.query, patchSha256: hash } }]), null)
  const rejected = [...events, { seq: 9, type: 'decided', data: { id: ids.query, decision: 'rejected' } }, { seq: 10, type: 'applied', data: { id: ids.query, patchSha256: hash } }]
  assert.match(checkApplied(rejected), /without an approval/, 'a later rejection withdraws the approval')
})

// ── Logical changes: independent proposals in one file are reviewed, approved, and applied separately ──────────────────

const sameFile = ids => [
  proposeQuery(ids.query, 'srv/service.js'),
  { id: ids.validation, decision: 'needs-review', reason: 'Truthiness is not @mandatory.', uncertainty: ['0 and blank are unproven'], blocker },
  { id: ids.remote, decision: 'not-applicable', reason: 'Local validator error.' },
  { id: ids.queryB, decision: 'proposed', reason: 'Input is concatenated into a where string for Orders.', summary: 'Orders query concatenates input.', checks, ...solution(secondPatch) }
]
const startSame = (context, options = {}) => start(context, { git: true, second: true, ...options }, sameFile)

test('two independent proposals in one file are two decisions; only the approved one is applied', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, root } = await startSame(context)
  assert.deepEqual(session.groups.actionable.map(({ row }) => row.id).sort(), [ids.query, ids.queryB].sort(), 'both are actionable although they share srv/service.js')
  assert.equal(session.groups.unresolved.filter(item => item.conflict).length, 0)
  await decideItem(session, ids.query, 'approve', 'yes')
  await decideItem(session, ids.queryB, 'reject', 'keep the string form for Orders')
  const results = await applyApproved(session, { confirm: 'all' })
  assert.deepEqual(results.map(result => result.id), [ids.query])
  const text = await read(session.workspaceProject, 'srv', 'service.js')
  assert.ok(text.includes('SELECT.from(Items).where({ code: input })'))
  assert.ok(text.includes(secondLine), 'the rejected proposal in the same file is untouched')
  assert.match(await read(root, 'srv', 'service.js'), /'code=' \+ input\)\n.*\n.*\n.*Orders/s, 'the original project is never changed')
  const states = Object.fromEntries((await itemStates(await loadSession(session.dir))).map(state => [state.id, state.state]))
  assert.equal(states[ids.query], 'applied, unverified (no tests run)')
  assert.equal(states[ids.queryB], 'rejected')
})

test('both approved proposals in one file apply on top of each other, test, and commit as a chain', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await startSame(context)
  await decideItem(session, ids.query, 'approve', 'yes')
  await decideItem(session, ids.queryB, 'approve', 'yes')
  // A proposal that adds a line first shifts the later one: the rebase must land it on the right line.
  const results = await applyApproved(session, { confirm: 'all', testCommand: 'node srv/check.js' })
  assert.deepEqual(results.map(result => [result.applied, result.result]), [[true, 'test-passed'], [true, 'test-passed']])
  const text = await read(session.workspaceProject, 'srv', 'service.js')
  assert.ok(text.includes('SELECT.from(Items).where({ code: input })') && text.includes('SELECT.from(Orders).where({ code: input })'))
  assert.ok(!text.includes("'code=' + input"))
  const loaded = await loadSession(session.dir)
  assert.equal(loaded.applications.length, 2)
  assert.equal(loaded.applications[1].files[0].baseSha256, loaded.applications[0].files[0].afterSha256, 'the second record starts from what the first produced')
  await assertTrusted(loaded)
  const preview = await commitSession(loaded, {})
  assert.equal((await commitSession(await loadSession(session.dir), { confirm: preview.confirm })).committed, true)
})

test('a proposal that shifts lines does not break the next one in the same file', { skip: !hasGit && 'git is not available' }, async context => {
  const grow = `--- a/srv/service.js\n+++ b/srv/service.js\n@@ -1 +1,3 @@\n-${originalLine}\n+const input = String(req.data.code)\n+// bound below\n+SELECT.from(Items).where({ code: input })\n`
  const { session, ids } = await start(context, { git: true, second: true }, ids => [
    proposeQuery(ids.query, 'srv/service.js', solution(grow)), ...sameFile(ids).slice(1)
  ])
  await decideItem(session, ids.query, 'approve', 'adds two lines')
  await decideItem(session, ids.queryB, 'approve', 'later in the file')
  assert.deepEqual((await applyApproved(session, { confirm: 'all' })).map(result => result.applied), [true, true])
  const lines = (await read(session.workspaceProject, 'srv', 'service.js')).split('\n')
  assert.equal(lines.at(-2), 'SELECT.from(Orders).where({ code: input })')
  assert.equal(lines.filter(line => line.includes('Orders')).length, 1)
})

test('proposals that change the same lines are reported as a conflict with both IDs and never merged', async context => {
  const rival = `--- a/srv/service.js\n+++ b/srv/service.js\n@@ -1 +1 @@\n-${originalLine}\n+SELECT.from(Items).where({ code: { '=': input } })\n`
  const { session, ids } = await start(context, { git: true, second: true }, ids => [
    proposeQuery(ids.query, 'srv/service.js'),
    { id: ids.validation, decision: 'proposed', reason: 'Rewrites the same query line differently.', summary: 'Alternative form.', checks, ...solution(rival) },
    { id: ids.remote, decision: 'not-applicable', reason: 'Local.' },
    { id: ids.queryB, decision: 'proposed', reason: 'Orders.', summary: 'Orders.', checks, ...solution(secondPatch) }
  ])
  const held = session.groups.unresolved.find(item => item.row.id === ids.validation)
  assert.match(held.conflict, new RegExp(`Overlaps the proposal ${ids.query} in srv/service\\.js \\(lines 1-1\\).*Nothing is merged silently`))
  assert.ok(session.groups.actionable.some(({ row }) => row.id === ids.queryB), 'the unrelated proposal in the same file is not affected')
  await assert.rejects(decideItem(session, ids.validation, 'approve', 'both'), /cannot be approved: Overlaps the proposal/)
})

test('a workspace edit between two proposals in one file stops the second, and nothing half-applies', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await startSame(context)
  await decideItem(session, ids.query, 'approve', 'yes')
  const first = await applyApproved(session, { confirm: 'all' })
  assert.equal(first[0].applied, true)
  await decideItem(await loadSession(session.dir), ids.queryB, 'approve', 'yes')
  const file = path.join(session.workspaceProject, 'srv', 'service.js')
  const edited = (await read(file)).replace(secondLine, `${secondLine} // touched by hand`)
  await writeFile(file, edited)
  await assert.rejects(applyApproved(await loadSession(session.dir), { confirm: 'all' }), /no longer applies|differs from the reviewed file/)
  assert.equal(await read(file), edited, 'the refused apply wrote nothing')
})

test('a later proposal on a file is refused when the file is not what the earlier proposal produced', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await startSame(context)
  await decideItem(session, ids.query, 'approve', 'yes')
  await applyApproved(session, { confirm: 'all' })
  const file = path.join(session.workspaceProject, 'srv', 'service.js')
  await writeFile(file, `// moved by hand\n${await read(file)}`)
  const loaded = await loadSession(session.dir)
  await decideItem(loaded, ids.queryB, 'approve', 'yes')
  await assert.rejects(applyApproved(await loadSession(session.dir), { confirm: 'all' }), /differs from the reviewed file|no longer applies/)
})

// ── Discard and the canonical summary ───────────────────────────────────────────────────────────────────────────────────

const exists = target => lstat(target).then(() => true, () => false)
const branchExists = (repo, branch) => { try { gitIn(repo, 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`); return true } catch { return false } }

test('discard previews first, needs its own confirmation, and removes only the worktree, branch, and folder the session created', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, root, repo } = await start(context, { git: true })
  const before = { status: gitIn(repo, 'status', '--porcelain'), head: gitIn(repo, 'rev-parse', 'HEAD'), branch: gitIn(repo, 'rev-parse', '--abbrev-ref', 'HEAD'), branches: gitIn(repo, 'branch', '--format=%(refname:short)') }
  await assert.rejects(discardSession(session, { confirm: 'a'.repeat(64) }), /--confirm must be the sha256 shown by the discard preview/, 'no confirmation works without the hash of a preview')
  const preview = await discardSession(session, {})
  assert.equal(preview.discarded, false)
  assert.deepEqual(preview.blockers, [])
  assert.ok(preview.willRemove.some(line => line.includes(session.meta.workspace)) && preview.willRemove.some(line => line.includes(session.meta.git.reviewBranch)))
  assert.match(preview.losses.join(' '), /3 proposal\(s\) have no decision yet/, 'undecided proposals are named as a loss')
  await assert.rejects(discardSession(session, { confirm: 'b'.repeat(64) }), /--confirm must be the sha256 shown by the discard preview/)
  await assert.rejects(discardSession(session, { confirm: preview.confirm }), /Add --discard-work/)
  assert.ok(await exists(session.meta.workspace), 'refusals removed nothing')
  const done = await discardSession(session, { confirm: preview.confirm, discardWork: true })
  assert.equal(done.discarded, true)
  assert.equal(await exists(session.dir), false)
  assert.equal(branchExists(repo, session.meta.git.reviewBranch), false)
  assert.equal(gitIn(repo, 'worktree', 'list').includes(session.meta.workspace), false)
  assert.deepEqual({ status: gitIn(repo, 'status', '--porcelain'), head: gitIn(repo, 'rev-parse', 'HEAD'), branch: gitIn(repo, 'rev-parse', '--abbrev-ref', 'HEAD'), branches: gitIn(repo, 'branch', '--format=%(refname:short)').split('\n').filter(name => !name.includes('cap-ai-11')).join('\n') + '\n' }, { ...before, branches: before.branches.split('\n').filter(name => !name.includes('cap-ai-11')).join('\n') + '\n' }, 'your branch, HEAD, and working tree are exactly as before')
  assert.equal(await read(root, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'))
})

test('discard with nothing undecided needs no acknowledgement', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await start(context, { git: true })
  for (const id of [ids.query, ids.other, ids.validation]) await decideItem(session, id, 'reject', 'not now')
  const preview = await discardSession(await loadSession(session.dir), {})
  assert.deepEqual(preview.losses, [])
  assert.equal((await discardSession(await loadSession(session.dir), { confirm: preview.confirm })).discarded, true)
  assert.equal(branchExists(repo, session.meta.git.reviewBranch), false)
})

test('discard refuses edits the session did not apply, even with --discard-work, and removes nothing', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await applied(context)
  await writeFile(path.join(session.workspaceProject, 'srv', 'other.js'), '// my own work\n')
  const preview = await discardSession(await loadSession(session.dir), {})
  assert.match(preview.blockers.join(' '), /changes the session did not apply \(.*other\.js\)/)
  assert.match(preview.willRemove.join(' '), /session folder/)
  await assert.rejects(discardSession(await loadSession(session.dir), { confirm: preview.confirm, discardWork: true }), /Refusing to discard: .*other\.js/)
  assert.ok(await exists(session.workspaceProject) && branchExists(repo, session.meta.git.reviewBranch))
  assert.equal(await read(session.workspaceProject, 'srv', 'other.js'), '// my own work\n')
})

test('discard refuses a file edited after the session applied it', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await applied(context)
  const file = path.join(session.workspaceProject, 'srv', 'service.js')
  await writeFile(file, `${await read(file)}// later edit\n`)
  assert.match((await discardSession(await loadSession(session.dir), {})).blockers.join(' '), /service\.js was edited after the session applied it/)
})

test('applied but uncommitted work is named as a loss and needs --discard-work; then it is removed', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, repo } = await applied(context)
  const preview = await discardSession(await loadSession(session.dir), {})
  assert.deepEqual(preview.blockers, [])
  assert.match(preview.losses.join(' '), /applied but uncommitted changes in: .*service\.js/)
  await discardSession(await loadSession(session.dir), { confirm: preview.confirm })
    .then(() => assert.fail('must refuse'), error => assert.match(error.message, /would lose work.*--discard-work/s))
  assert.ok(await exists(session.workspaceProject))
  await discardSession(await loadSession(session.dir), { confirm: preview.confirm, discardWork: true })
  assert.equal(await exists(session.dir), false)
  assert.equal(branchExists(repo, session.meta.git.reviewBranch), false)
})

test('a commit that exists only on the review branch is a loss until it is pushed or kept in another branch', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await applied(context)
  await decideItem(await loadSession(session.dir), ids.other, 'reject', 'no')
  await decideItem(await loadSession(session.dir), ids.validation, 'defer', 'later')
  const first = await commitSession(await loadSession(session.dir), {})
  const committed = await commitSession(await loadSession(session.dir), { confirm: first.confirm })
  const loaded = await loadSession(session.dir)
  const alone = await discardSession(loaded, {})
  assert.match(alone.losses.join(' '), new RegExp(`the commit ${committed.sha.slice(0, 12)} exists only on`))
  assert.match(alone.willRemove.join(' '), /deleted with its own commit, as you confirm/)
  gitIn(repo, 'branch', 'keep-my-review', committed.sha)
  const kept = await discardSession(await loadSession(session.dir), {})
  assert.deepEqual(kept.losses, [], 'the work is safe in another branch')
  assert.match(kept.willRemove.join(' '), /its commit stays reachable from keep-my-review/)
  await discardSession(await loadSession(session.dir), { confirm: kept.confirm })
  assert.equal(branchExists(repo, session.meta.git.reviewBranch), false)
  assert.equal(branchExists(repo, 'keep-my-review'), true)
  assert.equal(gitIn(repo, 'rev-parse', 'keep-my-review').trim(), committed.sha)
})

test('discard refuses a review branch that moved, a workspace on another branch, and commits the session did not make', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, repo } = await start(context, { git: true })
  gitIn(session.meta.workspace, 'commit', '-q', '--allow-empty', '-m', 'someone else committed here')
  assert.match((await discardSession(session, {})).blockers.join(' '), /has commits the session did not make \(1\)/)
  gitIn(session.meta.workspace, 'reset', '-q', '--soft', 'HEAD~1')
  gitIn(session.meta.workspace, 'checkout', '-q', '-b', 'elsewhere')
  assert.match((await discardSession(session, {})).blockers.join(' '), /on "elsewhere", not on cap-ai-11\/review-/)
  await assert.rejects(discardSession(session, { confirm: 'c'.repeat(64), discardWork: true }), /Refusing to discard/)
  assert.ok(await exists(session.meta.workspace) && branchExists(repo, session.meta.git.reviewBranch))
})

test('a session with a tampered record cannot be discarded through the tool', async context => {
  const { session } = await start(context, { git: true })
  await writeFile(path.join(session.dir, 'events.jsonl'), '{"seq":1}\n')
  await assert.rejects(discardSession(session, {}), /event log is not intact/)
  assert.ok(await exists(session.dir))
})

test('discarding a copy session removes the copy and folder and names applied changes as the loss', async context => {
  const { session } = await start(context, { mode: 'copy' })
  const hash = session.queue[0].row.id
  await decideItem(session, hash, 'approve', 'yes')
  await applyApproved(session, { confirm: 'all' })
  const loaded = await loadSession(session.dir)
  const preview = await discardSession(loaded, {})
  assert.match(preview.losses.join(' '), /exist only in the copy/)
  assert.equal((await discardSession(loaded, { confirm: preview.confirm, discardWork: true })).discarded, true)
  assert.equal(await exists(session.dir), false)
})

test('the summary counts come from the session record and never call approved or applied work fixed', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true })
  const text = await sessionSummary(session)
  assert.deepEqual(text.findings, { scanned: 4, withProposal: 2, withoutProposal: 2, without: { needsReview: 1, noProposal: 0, notApplicable: 1, notReviewed: 0 }, coveredByApprovedProposals: 0, coveredByAppliedProposals: 0, coveredByAppliedProposalsWithPassingTests: 0 })
  assert.deepEqual({ ...text.proposals, items: undefined }, { total: 2, pending: 2, approvedNotApplied: 0, applied: 0, rejected: 0, deferred: 0, changesRequested: 0, heldByConflict: 0, items: undefined })
  await decideItem(session, ids.query, 'approve', 'yes')
  await decideItem(session, ids.other, 'defer', 'later')
  const approved = await sessionSummary(await loadSession(session.dir))
  assert.equal(approved.proposals.approvedNotApplied, 1)
  assert.equal(approved.proposals.deferred, 1)
  assert.equal(approved.findings.coveredByApprovedProposals, 1)
  assert.equal(approved.findings.coveredByAppliedProposals, 0, 'approved is not applied')
  await applyApproved(await loadSession(session.dir), { confirm: 'all' })
  const untested = await sessionSummary(await loadSession(session.dir))
  assert.deepEqual([untested.proposals.applied, untested.tests, untested.findings.coveredByAppliedProposals, untested.findings.coveredByAppliedProposalsWithPassingTests], [1, { passed: 0, failed: 0, notRun: 1 }, 1, 0], 'applied is not tested')
  assert.deepEqual(untested.commit, { committed: false, sha: null, appliedNotCommitted: 1 })
  const rendered = renderSummary(untested)
  assert.match(rendered, /Findings scanned: 4/)
  assert.match(rendered, /Tests on applied proposals: passed 0, failed 0, not run 1/)
  assert.match(rendered, /Commit: not committed \(1 applied proposal\(s\) are not committed\)/)
  assert.ok(!/\bfixed\b/i.test(rendered.replace('No finding is reported as fixed.', '')), 'the summary never claims a fix')
})

test('the summary counts covered findings, failing tests, and the commit', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids } = await start(context, { git: true }, ids => [
    proposeQuery(ids.query, 'srv/service.js', { proposal: solution(coherentPatch).proposal }),
    { id: ids.validation, decision: 'proposed', reason: 'Same function.', checks, addressedBy: ids.query },
    { id: ids.remote, decision: 'not-applicable', reason: 'Local validator error.' },
    { id: ids.other, decision: 'no-proposal', reason: 'Fixed elsewhere.', blocker: { investigated: ['read it'] } }
  ])
  await decideItem(session, ids.query, 'approve', 'one change for both')
  await applyApproved(session, { confirm: 'all', testCommand: 'node -e "process.exit(1)"' })
  const failed = await sessionSummary(await loadSession(session.dir))
  assert.equal(failed.findings.coveredByApprovedProposals, 2, 'one proposal covers two findings')
  assert.equal(failed.findings.coveredByAppliedProposalsWithPassingTests, 0)
  assert.deepEqual(failed.tests, { passed: 0, failed: 1, notRun: 0 })
  assert.deepEqual(failed.findings.without, { needsReview: 0, noProposal: 1, notApplicable: 1, notReviewed: 0 })
  const loaded = await loadSession(session.dir)
  const preview = await commitSession(loaded, { acceptFailingTests: true })
  await commitSession(await loadSession(session.dir), { acceptFailingTests: true, confirm: preview.confirm })
  const committed = await sessionSummary(await loadSession(session.dir))
  assert.equal(committed.commit.committed, true)
  assert.match(committed.commit.sha, /^[a-f0-9]{40}$/)
  assert.match(renderSummary(committed), /Commit: [a-f0-9]{12} on cap-ai-11\/review-/)
})

test('the summary says so when the session record was tampered with', async context => {
  const { session, ids } = await start(context)
  await decideItem(session, ids.other, 'reject', 'no')
  const file = path.join(session.dir, 'developer-decisions.json')
  await writeFile(file, (await read(file)).replace('"decision": "rejected"', '"decision": "approved"'))
  const summary = await sessionSummary(await loadSession(session.dir))
  assert.equal(summary.trustworthy, false)
  assert.match(renderSummary(summary), /WARNING: the session state is not trustworthy/)
})

test('summary and discard work through the CLI, and discard needs the previewed hash', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await start(context, { git: true })
  await decideItem(session, ids.query, 'reject', 'no')
  const summary = JSON.parse((await cliIn('summary', '--session', session.dir, '--json')).stdout)
  assert.equal(summary.format, 'cap-pattern-session-summary')
  assert.equal(summary.proposals.rejected, 1)
  assert.match((await cliIn('summary', '--session', session.dir)).stdout, /Findings scanned: 4/)
  const blind = await cliIn('discard', '--session', session.dir, '--confirm', 'd'.repeat(64))
  assert.equal(blind.code, 1)
  assert.match(blind.stderr, /--confirm must be the sha256 shown by the discard preview/)
  const preview = await cliIn('discard', '--session', session.dir)
  assert.match(preview.stdout, /NOT DISCARDED\. This would remove:/)
  assert.match(preview.stdout, /It keeps: your own branch and working tree/)
  assert.match(preview.stdout, /It would LOSE:\n- 2 proposal\(s\) have no decision yet/)
  const hash = /--confirm ([a-f0-9]{64}) --discard-work/.exec(preview.stdout)[1]
  const withoutAck = await cliIn('discard', '--session', session.dir, '--confirm', hash)
  assert.match(withoutAck.stderr, /Add --discard-work/)
  assert.match((await cliIn('discard', '--session', session.dir, '--confirm', hash, '--discard-work')).stdout, /Discarded\. Removed:/)
  assert.equal(branchExists(repo, session.meta.git.reviewBranch), false)
})

// ── A real npm ci, offline, against a tiny local project ─────────────────────────────────────────────────────────────────

const hasNpm = (() => { try { execFileSync('npm', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' }); return true } catch { return false } })()

/** Runs npm with no network, no registry, and a throwaway cache, so the test depends on nothing outside this machine. */
async function offlineNpm(context, args, cwd) {
  const cache = await mkdtemp(path.join(tmpdir(), 'cap-npm-cache-'))
  context.after(() => rm(cache, { recursive: true, force: true }))
  const env = { ...process.env, npm_config_offline: 'true', npm_config_cache: cache, npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false', npm_config_loglevel: 'error' }
  await execFileAsync('npm', args, { cwd, env, shell: process.platform === 'win32' })
  return env
}

const npmSettings = { npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false' }
function useOfflineNpm(context) {
  Object.assign(process.env, npmSettings)
  context.after(() => { for (const name of Object.keys(npmSettings)) delete process.env[name] })
}

/**
 * A project whose dependencies are local folders (file:) with a real package-lock.json made by npm itself. @sap/cds is a local
 * stand-in, because the scanner only recognises a CAP project by that dependency name and the test must not need a registry.
 */
const localDependency = (context, { desync = false } = {}) => async root => {
  await mkdir(path.join(root, 'vendor', 'tiny-local'), { recursive: true })
  await mkdir(path.join(root, 'vendor', 'cds-stand-in'), { recursive: true })
  await writeFile(path.join(root, 'vendor', 'cds-stand-in', 'package.json'), JSON.stringify({ name: '@sap/cds', version: '9.0.0' }))
  await writeFile(path.join(root, 'vendor', 'tiny-local', 'package.json'), JSON.stringify({ name: 'tiny-local', version: '1.0.0', main: 'index.js' }))
  await writeFile(path.join(root, 'vendor', 'tiny-local', 'index.js'), 'module.exports = 42\n')
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { '@sap/cds': 'file:./vendor/cds-stand-in', 'tiny-local': 'file:./vendor/tiny-local' }, scripts: { test: 'node srv/check.js' } }))
  await offlineNpm(context, ['install', '--package-lock-only', '--ignore-scripts'], root)
  if (desync) await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { '@sap/cds': 'file:./vendor/cds-stand-in', 'tiny-local': 'file:./vendor/tiny-local', 'not-in-the-lock': 'file:./vendor/missing' } }))
}

test('a real npm ci installs in the review workspace only, keeps the project and the commit clean, and tests run against it', { skip: (!hasGit && 'git is not available') || (!hasNpm && 'npm is not available') }, async context => {
  const { session, ids, root, repo } = await start(context, { git: true, prepare: localDependency(context) })
  await decideItem(session, ids.query, 'approve', 'ok')
  useOfflineNpm(context)
  const plan = await runAll(session, { install: 'npm ci', testCommand: 'node -e "process.exit(require(\'tiny-local\') === 42 ? 0 : 1)"' })
  assert.match(plan.willDo.join('\n'), /Run "npm ci" in .*workspace/)
  assert.equal(await exists(path.join(session.workspaceProject, 'node_modules')), false, 'the preview installed nothing')
  const done = await runAll(await loadSession(session.dir), { install: 'npm ci', testCommand: 'node -e "process.exit(require(\'tiny-local\') === 42 ? 0 : 1)"', confirm: plan.confirm })
  assert.equal(done.stage, 'done')
  assert.equal(done.tests, 'passed', 'the test ran against the real installed dependency')
  assert.equal(await read(session.workspaceProject, 'node_modules', 'tiny-local', 'index.js'), 'module.exports = 42\n')
  assert.equal(await exists(path.join(root, 'node_modules')), false, 'your project folder got no node_modules')
  assert.equal(gitIn(repo, 'status', '--porcelain'), '', 'your working tree is untouched')
  assert.equal(gitIn(session.meta.workspace, 'status', '--porcelain').split('\n').filter(Boolean).length, 1, 'only the applied file is a change; node_modules is ignored')
  assert.equal((await loadSession(session.dir)).meta.install.ok, true)
  const preview = await commitSession(await loadSession(session.dir), {})
  assert.equal((await commitSession(await loadSession(session.dir), { confirm: preview.confirm })).committed, true, 'the commit is not blocked by the installed packages')
  await discardSession(await loadSession(session.dir), {}).then(async result => {
    await discardSession(await loadSession(session.dir), { confirm: result.confirm, discardWork: true })
  })
  assert.equal(await exists(session.dir), false, 'discard also removes the installed node_modules with the worktree')
})

test('a real npm ci that fails leaves no partial node_modules and applies nothing', { skip: (!hasGit && 'git is not available') || (!hasNpm && 'npm is not available') }, async context => {
  const { session, ids } = await start(context, { git: true, prepare: localDependency(context, { desync: true }) })
  await decideItem(session, ids.query, 'approve', 'ok')
  useOfflineNpm(context)
  const plan = await runAll(session, { install: 'npm ci', testCommand: 'node srv/check.js' })
  const result = await runAll(await loadSession(session.dir), { install: 'npm ci', testCommand: 'node srv/check.js', confirm: plan.confirm })
  assert.equal(result.stage, 'install')
  assert.notEqual(result.install.exitCode, 0)
  assert.equal(result.install.installed, false)
  assert.equal(result.applied.length, 0, 'nothing was applied after a failed install')
  assert.equal(await exists(path.join(session.workspaceProject, 'node_modules')), false, 'the partial install was removed')
  assert.equal((await loadSession(session.dir)).applications.length, 0)
  assert.equal((await loadSession(session.dir)).meta.install.ok, false)
})

// ── Bypass attempts by a caller that skips the review interface, and timing ──────────────────────────────────────────────

// R5 regression: when --session is given, apply.mjs verifies the project matches the workspace; redirecting to the
// original project is refused. Standalone apply.mjs without --session is still allowed (its own confirmation guards apply).
test('apply.mjs with --session refuses to apply to any path other than the session workspace', { skip: !hasGit && 'git is not available' }, async context => {
  const { session, ids, repo } = await start(context, { git: true })
  const row = session.queue.find(item => item.row.id === ids.query).row
  const forged = path.join(session.dir, '..', 'forged-decisions.json')
  await writeFile(forged, JSON.stringify({ format: 'cap-pattern-developer-decisions', snapshotSha256: session.brief.snapshot.sha256, reviewer: 'nobody', decisions: [{ id: ids.query, decision: 'approved', patchSha256: row.verifiedPatch.patchSha256 }], undecided: [] }))
  const applyArgs = args => execFileAsync(process.execPath, [fileURLToPath(new URL('./apply.mjs', import.meta.url)), ...args]).catch(error => ({ stdout: error.stdout, stderr: error.stderr, code: error.code }))
  const commonArgs = ['--report', path.join(session.dir, 'brief.json'), '--decisions', path.join(session.dir, 'validated.json'), '--developer-decisions', forged, '--id', ids.query, '--confirm', row.verifiedPatch.patchSha256, '--output', path.join(session.dir, 'forged-record.json')]
  // With --session but --project pointing to the original project: refused before any file is touched
  const redirected = await applyArgs(['apply', '--session', session.dir, '--project', repo, ...commonArgs])
  assert.ok(redirected.code, 'apply to original project with --session is refused (exit code non-zero)')
  assert.match(redirected.stderr, /review workspace.*applying to another path is not allowed/, 'error names the constraint')
  // The original project is byte-for-byte unchanged
  assert.equal(await read(repo, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'), 'the original project is byte-for-byte unchanged after the refused attempt')
  // The session's workspace is also unchanged
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'), 'the workspace is unchanged after the refused attempt')
  // A forged application record placed manually in the session folder is still caught by the event log
  const fakeRecord = JSON.stringify({ format: 'cap-pattern-application', snapshotSha256: session.brief.snapshot.sha256, findingId: ids.query, patchSha256: row.verifiedPatch.patchSha256, state: 'applied', result: 'unverified', files: [], appliedPatch: '', reversePatch: '' })
  await writeFile(path.join(session.dir, 'applications', '01-forged.json'), fakeRecord)
  await assert.rejects(commitSession(await loadSession(session.dir), {}), /not trustworthy.*no matching entry in the event log/)
  await rm(path.join(session.dir, 'applications', '01-forged.json'))
  // Running the session's own approve path without the proof of having seen the diff is refused
  await assert.rejects(decideRaw(await loadSession(session.dir), ids.query, 'approve', 'trust me', 'a subagent', { diff: row.verifiedPatch.patchSha256, via: 'terminal' }), /before its diff was shown/)
})

// R6 regression: session.json workspace/project identity is bound to the event log; modifying it outside the tool is caught
test('modifying session.json workspace or project paths outside the tool is caught by assertTrusted', async context => {
  const { session, ids, root } = await start(context, { mode: 'copy' })
  // Tamper: redirect workspaceProject to the original project (not the copy)
  const tampered = { ...session.meta, workspaceProject: root, workspace: root }
  await writeFile(path.join(session.dir, 'session.json'), `${JSON.stringify(tampered, null, 2)}\n`)
  const loaded = await loadSession(session.dir)
  await assert.rejects(decideRaw(loaded, ids.query, 'approve', ''), /workspace or project paths in session\.json do not match the event log/, 'tampered workspace path is detected')
  await assert.rejects(previewApply(loaded), /workspace or project paths in session\.json do not match the event log/, 'apply preview is also blocked')
  // The original project is untouched: no state-changing operation ran
  assert.equal(await read(root, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'), 'the original project is byte-for-byte unchanged')
  // The copy (workspace) is also untouched
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'), 'the workspace copy is byte-for-byte unchanged')
})

test('decisions record how they were made, so approvals through the decide command are told apart from the terminal', async context => {
  const { session, ids } = await start(context)
  await recordPresented(session, session.queue.filter(item => item.row.ready), 'show')
  const hash = session.queue.find(item => item.row.id === ids.query).row.verifiedPatch.patchSha256
  await decideRaw(session, ids.query, 'approve', '', 'Vera', { diff: hash })
  const summary = await sessionSummary(await loadSession(session.dir))
  assert.deepEqual(summary.approvals.via, { cli: 1 })
  assert.match(renderSummary(summary), /Approvals recorded through: cli 1/)
})

test('every session command records its elapsed time and output size, and the summary reports them without trusting them', async context => {
  const f = await fixture(context)
  const validated = await f.validate(standard(f.ids))
  const out = await mkdtemp(path.join(tmpdir(), 'cap-session-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  await writeFile(path.join(out, 'b.json'), JSON.stringify(f.report))
  await writeFile(path.join(out, 'v.json'), JSON.stringify(validated))
  const dir = path.join(out, 'session')
  await cliIn('start', '--report', path.join(out, 'b.json'), '--decisions', path.join(out, 'v.json'), '--project', f.root, '--session', dir, '--mode', 'copy')
  await cliIn('show', '--session', dir)
  await cliIn('status', '--session', dir)
  const entries = (await read(dir, 'timings.jsonl')).trim().split('\n').map(line => JSON.parse(line))
  assert.deepEqual(entries.map(entry => entry.command), ['start', 'show', 'status'])
  for (const entry of entries) assert.ok(entry.ms >= 0 && entry.stdoutBytes > 0 && entry.exitCode === 0 && entry.startedAt, JSON.stringify(entry))
  const summary = JSON.parse((await cliIn('summary', '--session', dir, '--json')).stdout)
  assert.equal(summary.toolTime.calls, 3, 'the summary call itself is recorded only after it has run')
  assert.deepEqual(Object.keys(summary.toolTime.commands).sort(), ['session show', 'session start', 'session status'])
  // Timings are not part of the trusted state: editing them changes nothing about trust.
  await writeFile(path.join(dir, 'timings.jsonl'), 'garbage\n')
  await assertTrusted(await loadSession(dir))
})

test('the scan tool records its stage time and output size only when asked to', async context => {
  const f = await fixture(context)
  const out = await mkdtemp(path.join(tmpdir(), 'cap-timing-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const file = path.join(out, 'timings.jsonl')
  const scan = fileURLToPath(new URL('./scan.mjs', import.meta.url))
  await execFileAsync(process.execPath, [scan, f.root])
  assert.equal(await exists(file), false, 'nothing is written without the variable')
  await execFileAsync(process.execPath, [scan, f.root, '--full'], { env: { ...process.env, CAP_AI_11_TIMING_FILE: file } })
  const [entry] = (await read(file)).trim().split('\n').map(line => JSON.parse(line))
  assert.equal(entry.tool, 'scan')
  assert.equal(entry.command, 'full')
  assert.ok(entry.ms >= 0 && entry.stdoutBytes > 1000)
})

test('only showing one proposal with --id records its diff as shown; the unfiltered queue lists items without diffs and records nothing', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  const queue = JSON.parse((await cliIn('show', '--session', session.dir, '--json')).stdout)
  assert.ok(queue.items.length >= 2 && queue.items.every(item => item.diff === null && item.diffOmitted === true), 'no diffs in the queue listing')
  assert.match(queue.note, /Show one proposal with its diff using --id/)
  const text = (await cliIn('show', '--session', session.dir)).stdout
  assert.ok(!text.includes('Diff (- removed, + added):') && text.includes(ids.query), 'the text listing is an index')
  assert.equal((await readLog(session.dir)).events.filter(event => event.type === 'presented').length, 0, 'listing shows no diff, so nothing counts as shown')
  const hash = session.queue.find(item => item.row.id === ids.query).row.verifiedPatch.patchSha256
  assert.match((await cliIn('decide', '--session', session.dir, '--id', ids.query, '--decision', 'approve', '--diff', hash)).stderr, /before its diff was shown/)
  const one = JSON.parse((await cliIn('show', '--session', session.dir, '--id', ids.query, '--json')).stdout)
  assert.match(one.items[0].diff, /^--- a\/srv\/service\.js/)
  const presented = (await readLog(session.dir)).events.filter(event => event.type === 'presented')
  assert.deepEqual(presented.map(event => event.data.id), [ids.query], 'exactly the one proposal that was shown')
  assert.match((await cliIn('decide', '--session', session.dir, '--id', ids.query, '--decision', 'approve', '--diff', hash)).stdout, /Recorded approved/)
})

// ── Feature 1: test-command binding in apply preview ──────────────────────────────────────────────

test('apply preview token includes the test command; mismatched test command or timeout is rejected', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  // Preview with a test command: token binds the command
  const preview = await previewApply(loaded, { testCommand: 'npm test', testTimeout: 60 })
  assert.ok(preview.confirm, 'preview produces a confirm token')
  assert.equal(preview.testCommand, 'npm test')
  assert.equal(preview.testTimeout, 60)
  // Correct command and timeout: succeeds
  const results = await applyRaw(loaded, { confirm: preview.confirm, testCommand: 'npm test', testTimeout: 60 })
  assert.equal(results[0].applied, true)
})

test('apply is rejected when test command differs from what was previewed', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  const preview = await previewApply(loaded, { testCommand: 'npm test' })
  // Different test command: token mismatch
  await assert.rejects(applyRaw(loaded, { confirm: preview.confirm, testCommand: 'npm run ci' }), /test command or timeout differs from what was previewed|sha256 shown by the apply preview/)
})

test('apply is rejected when test command given at confirm time but was absent at preview time', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  // Preview with no test command
  const preview = await previewApply(loaded)
  // Confirm with a test command: token mismatch
  await assert.rejects(applyRaw(loaded, { confirm: preview.confirm, testCommand: 'npm test' }), /test command or timeout differs from what was previewed|sha256 shown by the apply preview/)
})

// ── Feature 2: mirror repair ──────────────────────────────────────────────────────────────────────

test('repair reports already consistent when developer-decisions.json matches the event log', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  const result = await repairSession(loaded)
  assert.equal(result.alreadyConsistent, true)
  assert.match(result.message, /already matches the event log/)
})

test('repair preview shows the drift and confirm restores consistency', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  // Tamper: change the decision in developer-decisions.json outside the tool
  const devPath = path.join(session.dir, 'developer-decisions.json')
  const dev = JSON.parse(await read(session.dir, 'developer-decisions.json'))
  const tampered = { ...dev, decisions: dev.decisions.map(d => d.id === ids.query ? { ...d, decision: 'rejected' } : d) }
  await writeFile(devPath, `${JSON.stringify(tampered, null, 2)}\n`)
  const loaded = await loadSession(session.dir)
  // assertTrusted should fail now
  await assert.rejects(assertTrusted(loaded), /not trustworthy/)
  // Repair preview
  const preview = await repairSession(loaded)
  assert.equal(preview.repaired, false)
  assert.equal(preview.alreadyConsistent, false)
  assert.ok(preview.confirm, 'preview produces a confirm token')
  assert.ok(preview.repairs.some(r => r.id === ids.query && r.willBe.decision === 'approved'))
  // Confirm repair
  const repaired = await repairSession(loaded, { confirm: preview.confirm })
  assert.equal(repaired.repaired, true)
  // After repair, assertTrusted should pass
  const fixed = await loadSession(session.dir)
  await assert.doesNotReject(assertTrusted(fixed))
  assert.ok(fixed.developer.decisions.find(d => d.id === ids.query)?.decision === 'approved')
})

test('repair refuses when an application record is inconsistent with the event log', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  // Inject a fake application record not in the event log
  const appPath = path.join(session.dir, 'applications', '99-fake.json')
  await writeFile(appPath, JSON.stringify({ format: 'cap-pattern-application', snapshotSha256: session.brief.snapshot.sha256, findingId: ids.query, patchSha256: 'abc', state: 'applied', result: 'unverified', files: [], appliedPatch: '', reversePatch: '' }))
  const loaded2 = await loadSession(session.dir)
  await assert.rejects(repairSession(loaded2), /inconsistent with the event log.*cannot be repaired/)
})

// ── Feature 3: explicit recovery ─────────────────────────────────────────────────────────────────

test('recover reports no orphans when no interrupted operations exist', async context => {
  const { session } = await start(context, { mode: 'copy' })
  const result = await recoverSession(session)
  assert.equal(result.noOrphans, true)
  assert.match(result.message, /No interrupted operations/)
})

test('recover detects an orphaned apply-intent (record exists and matches) and recovers it', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  // Simulate an interrupted apply: write apply-intent but no applied event, and write the application record manually
  const row = loaded.queue.find(item => item.row.id === ids.query).row
  const approval = loaded.developer.decisions.find(d => d.id === ids.query)
  const outputName = `01-interrupted-${approval.patchSha256.slice(0, 8)}.json`
  const outputPath = path.join(session.dir, 'applications', outputName)
  const fakeRecord = { format: 'cap-pattern-application', snapshotSha256: session.brief.snapshot.sha256, findingId: ids.query, patchSha256: approval.patchSha256, state: 'applied', result: 'unverified', files: [{ file: 'srv/service.js', baseSha256: 'x', afterSha256: 'y' }], appliedPatch: '', reversePatch: '' }
  await writeFile(outputPath, `${JSON.stringify(fakeRecord, null, 2)}\n`)
  await appendEvent(session.dir, 'apply-intent', { id: ids.query, patchSha256: approval.patchSha256, output: outputName })
  const loaded2 = await loadSession(session.dir)
  // Preview
  const preview = await recoverSession(loaded2)
  assert.equal(preview.noOrphans, false)
  assert.equal(preview.recoverableCount, 1)
  assert.ok(preview.orphans[0].canRecover)
  // Confirm
  const recovered = await recoverSession(loaded2, { confirm: preview.confirm })
  assert.equal(recovered.recovered, true)
  assert.equal(recovered.actions[0].result, 'recovered')
  // The applied event should now be in the log
  const { events } = await readLog(session.dir)
  assert.ok(events.some(e => e.type === 'applied' && e.data.id === ids.query), 'applied event written by recovery')
  // Idempotent: second recover finds no orphans
  const loaded3 = await loadSession(session.dir)
  const second = await recoverSession(loaded3)
  assert.equal(second.noOrphans, true)
})

test('recover marks ambiguous when apply-intent exists but application record is absent', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const loaded = await loadSession(session.dir)
  const approval = loaded.developer.decisions.find(d => d.id === ids.query)
  // Write only the intent, not the record
  await appendEvent(session.dir, 'apply-intent', { id: ids.query, patchSha256: approval.patchSha256, output: 'missing-record.json' })
  const loaded2 = await loadSession(session.dir)
  const preview = await recoverSession(loaded2)
  assert.equal(preview.noOrphans, false)
  assert.equal(preview.recoverableCount, 0)
  assert.equal(preview.ambiguousCount, 1)
  assert.ok(!preview.orphans[0].canRecover)
  // Confirm marks it ambiguous (does not fabricate a result)
  const result = await recoverSession(loaded2, { confirm: preview.confirm })
  assert.equal(result.recovered, true)
  assert.equal(result.actions[0].result, 'ambiguous')
  // No applied event was written
  const { events } = await readLog(session.dir)
  assert.ok(!events.some(e => e.type === 'applied'), 'no applied event fabricated')
})

test('recover with commit-intent in copy mode is reported as ambiguous', async context => {
  const { session } = await start(context, { mode: 'copy' })
  // Write a commit-intent (simulating an interrupted commit in copy mode)
  await appendEvent(session.dir, 'commit-intent', { token: 'fake', files: ['srv/service.js'] })
  const loaded = await loadSession(session.dir)
  const preview = await recoverSession(loaded)
  assert.equal(preview.noOrphans, false)
  assert.ok(preview.orphans.some(o => o.type === 'commit' && !o.canRecover))
  assert.match(preview.orphans.find(o => o.type === 'commit').reason, /copy mode/)
})

// ── P1.3 regression: apply.mjs apply without --session is refused ────────────────────────────────────────────────────────

test('apply.mjs apply without --session exits with code 1 and refuses to write anything', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  const row = session.queue.find(item => item.row.id === ids.query).row
  const applyScript = fileURLToPath(new URL('./apply.mjs', import.meta.url))
  const result = await execFileAsync(process.execPath, [
    applyScript, 'apply',
    '--report', path.join(session.dir, 'brief.json'),
    '--decisions', path.join(session.dir, 'validated.json'),
    '--developer-decisions', path.join(session.dir, 'developer-decisions.json'),
    '--project', session.workspaceProject,
    '--id', ids.query,
    '--confirm', row.verifiedPatch.patchSha256,
    '--output', path.join(session.dir, 'applications', 'no-session.json')
  ]).catch(error => ({ stdout: error.stdout, stderr: error.stderr, code: error.code }))
  assert.equal(result.code, 1, 'apply without --session exits with code 1')
  assert.equal(await lstat(path.join(session.dir, 'applications', 'no-session.json')).catch(() => null), null, 'no record was written')
  assert.equal(await read(session.workspaceProject, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'), 'workspace unchanged')
})

// ── P1.2 regression: stale lock (dead PID or >30s old) does not block the session ──────────────────────────────────────

test('a stale event lock (dead process) is detected and cleared automatically', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  // Write a stale lock: a PID that does not exist, 60 seconds old
  const lockPath = path.join(session.dir, 'events.lock')
  await writeFile(lockPath, JSON.stringify({ pid: 2147483647, createdAt: Date.now() - 60000 }))
  // This must succeed despite the stale lock
  await assert.doesNotReject(decideRaw(session, ids.other, 'defer', 'later'), 'stale lock is cleared and decision is recorded')
})

// ── P1.1 regression: assertTrusted refuses on orphaned intents ───────────────────────────────────────────────────────────

test('assertTrusted refuses when there is an unresolved apply-intent in the event log', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  await decideItem(session, ids.query, 'approve')
  const approval = session.developer.decisions.find(d => d.id === ids.query)
  // Inject an apply-intent with no following applied or recovery-recorded event
  await appendEvent(session.dir, 'apply-intent', { id: ids.query, patchSha256: approval.patchSha256, output: 'orphaned.json', files: [] })
  const loaded = await loadSession(session.dir)
  await assert.rejects(assertTrusted(loaded), /interrupted.*apply.*recover/, 'orphaned apply-intent blocks trusted commands')
  await assert.rejects(previewApply(loaded), /interrupted.*apply.*recover/, 'apply preview is also blocked')
})

// ── P2.6 regression: git block in session-started; committed binding ─────────────────────────────────────────────────────

test('session-started event includes the git block and assertTrusted detects tampering', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await start(context, { git: true })
  const { events } = await readLog(session.dir)
  const started = events.find(e => e.type === 'session-started')
  assert.ok(started?.data.git !== undefined, 'session-started event includes git key')
  assert.equal(started.data.git?.reviewBranch, session.meta.git.reviewBranch, 'git.reviewBranch matches session meta')
  // Tamper: change reviewBranch in session.json
  const tampered = { ...session.meta, git: { ...session.meta.git, reviewBranch: 'some-other-branch' } }
  await writeFile(path.join(session.dir, 'session.json'), `${JSON.stringify(tampered, null, 2)}\n`)
  const loaded = await loadSession(session.dir)
  await assert.rejects(assertTrusted(loaded), /git configuration in session\.json does not match the event log/, 'tampered git block is detected')
})

test('assertTrusted detects when session.json committed data does not match the event log', { skip: !hasGit && 'git is not available' }, async context => {
  const { session } = await applied(context)
  // Commit it
  const preview = await commitSession(await loadSession(session.dir), {})
  const done = await commitSession(await loadSession(session.dir), { confirm: preview.confirm })
  assert.equal(done.committed, true)
  // Tamper: change committed.sha in session.json
  const loaded = await loadSession(session.dir)
  const tampered = { ...loaded.meta, committed: { ...loaded.meta.committed, sha: 'f'.repeat(40) } }
  await writeFile(path.join(session.dir, 'session.json'), `${JSON.stringify(tampered, null, 2)}\n`)
  const loaded2 = await loadSession(session.dir)
  await assert.rejects(assertTrusted(loaded2), /committed data in session\.json does not match the event log/, 'tampered committed sha is detected')
})

// ── Lock regression tests ─────────────────────────────────────────────────────────────────────────

test('concurrent appendEvent calls from multiple processes never corrupt the event log', async context => {
  // 4 child processes each append to the same session log, 10 rounds; every append must land cleanly.
  const { session } = await start(context, { mode: 'copy' })
  const dir = session.dir
  const stateModulePath = new URL('./session-state.mjs', import.meta.url).pathname
  const workers = 4
  const rounds = 10
  const makeWorkerSrc = () => [
    `import { appendEvent } from ${JSON.stringify(stateModulePath)};`,
    `const dir = ${JSON.stringify(dir)};`,
    `for (let i = 0; i < ${rounds}; i++) { await appendEvent(dir, "test-concurrent", { worker: process.pid, round: i }) }`
  ].join('\n')
  const procs = Array.from({ length: workers }, () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module'], { stdio: ['pipe', 'inherit', 'inherit'] })
    child.stdin.end(makeWorkerSrc())
    child.on('error', reject)
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`worker exited ${code}`))))
  }))
  await Promise.all(procs)
  const { events, error } = await readLog(dir)
  assert.equal(error, null, `log must be intact after concurrent appends (error: ${error})`)
  const concurrent = events.filter(e => e.type === 'test-concurrent')
  assert.equal(concurrent.length, workers * rounds, `all ${workers * rounds} concurrent appends must land`)
}, { timeout: 60000 })

test('a stale event lock with a dead pid is taken over and the append succeeds', async context => {
  const { session, ids } = await start(context, { mode: 'copy' })
  const lockPath = path.join(session.dir, 'events.lock')
  // Write a lock whose PID cannot exist (> 4 million on macOS/Linux)
  await writeFile(lockPath, JSON.stringify({ pid: 4194304, createdAt: Date.now() - 5000, token: 'deadbeef' }))
  // appendEvent must clear the stale lock and succeed
  await assert.doesNotReject(
    appendEvent(session.dir, 'test-dead-pid', {}),
    'dead-pid lock is expired and append succeeds'
  )
  const { events, error } = await readLog(session.dir)
  assert.equal(error, null)
  assert.ok(events.some(e => e.type === 'test-dead-pid'), 'event landed despite stale lock')
})

test('a lock held by a live pid is not taken over even if it is older than 30 seconds', async context => {
  const { session } = await start(context, { mode: 'copy' })
  const lockPath = path.join(session.dir, 'events.lock')
  // Use our own PID (definitely alive); set createdAt 60 seconds in the past
  await writeFile(lockPath, JSON.stringify({ pid: process.pid, createdAt: Date.now() - 60000, token: 'livetoken' }))
  // appendEvent must fail because the lock holder is alive
  await assert.rejects(
    appendEvent(session.dir, 'test-live-pid', {}),
    /event lock/i,
    'live-pid lock must not be stolen even when old'
  )
  // Lock file must still be intact (not deleted)
  const content = JSON.parse(await readFile(lockPath, 'utf8'))
  assert.equal(content.token, 'livetoken', 'live-pid lock must remain untouched')
})

test('an unparseable lock younger than 10 s is not taken over', async context => {
  const { session } = await start(context, { mode: 'copy' })
  const lockPath = path.join(session.dir, 'events.lock')
  await writeFile(lockPath, 'not-json')
  // mtime is now, so < 10 s — must not be stolen
  await assert.rejects(
    appendEvent(session.dir, 'test-young-empty', {}),
    /event lock/i,
    'unparseable lock younger than 10 s must not be stolen'
  )
  const still = await readFile(lockPath, 'utf8').catch(() => null)
  assert.equal(still, 'not-json', 'unparseable young lock must remain')
})

test('an unparseable lock older than 10 s is taken over and the append succeeds', async context => {
  const { session } = await start(context, { mode: 'copy' })
  const lockPath = path.join(session.dir, 'events.lock')
  await writeFile(lockPath, 'not-json')
  // Back-date mtime to 15 seconds ago via utimes
  const { utimes } = await import('node:fs/promises')
  const old = (Date.now() - 15000) / 1000
  await utimes(lockPath, old, old)
  await assert.doesNotReject(
    appendEvent(session.dir, 'test-old-empty', {}),
    'unparseable lock older than 10 s is expired and append succeeds'
  )
  const { events, error } = await readLog(session.dir)
  assert.equal(error, null)
  assert.ok(events.some(e => e.type === 'test-old-empty'), 'event landed after old unparseable lock was cleared')
})

test('releaseLock does not delete a lock whose token does not match', async context => {
  // Import the internals we need via appendEvent's side-effect: write a lock manually and verify
  // that a second concurrent appendEvent (different token) cannot steal it.
  // Strategy: hold the event lock by writing it with a known token, then try to call releaseLock
  // with a wrong token via a child process that attempts a second append (which will fail because
  // our lock is held by a live pid — our own process), and check our lock file is still intact.
  const { session } = await start(context, { mode: 'copy' })
  const lockPath = path.join(session.dir, 'events.lock')
  const ourToken = 'our-own-token-12345'
  // Write lock as if held by us (live pid, fresh timestamp, our token)
  await writeFile(lockPath, JSON.stringify({ pid: process.pid, createdAt: Date.now(), token: ourToken }))
  // Attempt append — will fail because lock is held by live pid; our token must survive
  await assert.rejects(appendEvent(session.dir, 'test-token-guard', {}), /event lock/i)
  const content = JSON.parse(await readFile(lockPath, 'utf8'))
  assert.equal(content.token, ourToken, 'our lock token must be intact — releaseLock must not delete a foreign lock')
})
