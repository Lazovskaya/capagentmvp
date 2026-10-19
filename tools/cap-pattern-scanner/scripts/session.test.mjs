import assert from 'node:assert/strict'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { access, chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { checkProposalPatches } from './proposals.mjs'
import { prepareReview, reconcileDecisions } from './review.mjs'
import { scanProject } from './scan.mjs'
import { applyApproved, combinedDiff, commitSession, decideItem, describeItem, itemStates, loadSession, pendingApprovals, renderItem, reviseSession, startSession } from './session-core.mjs'
import { reviewLoop } from './session-terminal.mjs'
import { checks, originalLine, solution } from './workflow-fixtures.mjs'

Object.assign(process.env, { GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 't@example.com' })
const sessionCli = fileURLToPath(new URL('./session.mjs', import.meta.url))
const execFileAsync = promisify(execFile)
const hasGit = (() => { try { execFileSync('git', ['--version'], { stdio: 'ignore' }); return true } catch { return false } })()
const gitIn = (cwd, ...args) => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=Test', '-c', 'commit.gpgsign=false', '-C', cwd, ...args], { encoding: 'utf8' })
const validationLine = "if (!req.data.name) return req.reject(400, 'NAME_REQUIRED')"
const remoteLine = 'req.reject(502, err.message)'
const queryPatch = file => `--- a/${file}\n+++ b/${file}\n@@ -1 +1 @@\n-${originalLine}\n+SELECT.from(Items).where({ code: input })\n`
const coherentPatch = `--- a/srv/service.js\n+++ b/srv/service.js\n@@ -1,2 +1,2 @@\n-${originalLine}\n-${validationLine}\n+SELECT.from(Items).where({ code: input })\n+if (!req.data.name?.trim()) return req.reject(400, 'NAME_REQUIRED')\n`
const blocker = { missingEvidence: 'Whether name is @mandatory in the model', investigated: ['db/schema.cds has no Items entity', 'No test covers an empty name'], unblockingCheck: 'Add the Items entity or point to the model that defines name' }

/** Two files: srv/service.js (query, validation, remote error) and srv/other.js (a second, independent query). */
async function fixture(context, { git = false, dirty = false, subdir, crlf = false } = {}) {
  const repo = await mkdtemp(path.join(tmpdir(), 'cap-session-'))
  context.after(() => rm(repo, { recursive: true, force: true }))
  const root = subdir ? path.join(repo, subdir) : repo
  if (subdir) await mkdir(root)
  await mkdir(path.join(root, 'srv'))
  await mkdir(path.join(root, 'db'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^9' }, scripts: { test: 'node srv/check.js' } }))
  await writeFile(path.join(root, 'srv', 'service.js'), [originalLine, validationLine, remoteLine, ''].join('\n'))
  await writeFile(path.join(root, 'srv', 'other.js'), `${originalLine}\n`)
  await writeFile(path.join(root, 'srv', 'check.js'), "const fs = require('fs')\nprocess.exit(fs.readdirSync(__dirname).some(name => fs.readFileSync(__dirname + '/' + name, 'utf8').includes('BRO' + 'KEN')) ? 1 : 0)\n")
  await writeFile(path.join(root, '.gitignore'), 'node_modules\n')
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
  const ids = { query: find('CAP-QUERY-001', 'srv/service.js'), validation: find('CAP-VALIDATION-001', 'srv/service.js'), remote: find('CAP-REMOTE-ERROR-001', 'srv/service.js'), other: find('CAP-QUERY-001', 'srv/other.js') }
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
  const session = await startSession({ report: f.report, validated, project: f.root, session: path.join(out, 'session'), mode: options.mode ?? 'auto', reviewer: 'Vera' })
  return { ...f, validated, session, out }
}
const read = (...parts) => readFile(path.join(...parts), 'utf8')

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
  const results = await applyApproved(session, { confirm: approved.approval.patchSha256, testCommand: 'node srv/check.js' })
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
  const preview = await cli('apply', '--session', files.session)
  assert.match(preview.stdout, /NOT APPLIED\. Exact diff for/)
  const approval = JSON.parse(await read(files.session, 'developer-decisions.json')).decisions.find(decision => decision.decision === 'approved')
  const wrong = await cli('apply', '--session', files.session, '--confirm', 'wrong')
  assert.equal(wrong.code, 1)
  assert.match(wrong.stderr, /--confirm must be the 64-character sha256/)
  const mismatched = await cli('apply', '--session', files.session, '--confirm', 'a'.repeat(64))
  assert.equal(mismatched.code, 1)
  assert.match(mismatched.stderr, /--confirm must be the sha256 of the diff shown for/)
  const applied = await cli('apply', '--session', files.session, '--confirm', approval.patchSha256, '--test-command', 'node srv/check.js')
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
