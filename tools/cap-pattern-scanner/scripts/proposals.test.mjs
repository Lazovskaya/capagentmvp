import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { applyHunks, parsePatch, patchSha256, reversePatch, safeProjectPath } from './patch.mjs'
import { checkProposalPatches } from './proposals.mjs'
import { reconcileDecisions } from './review.mjs'
import { recordDeveloperDecisions, renderReviewSheet, reviewRows } from './developer-review.mjs'
import { originalLine, patchFor, reviewedProject, tick } from './workflow-fixtures.mjs'

const script = name => fileURLToPath(new URL(`./${name}`, import.meta.url))
const run = (name, args) => spawnSync(process.execPath, [script(name), ...args], { encoding: 'utf8' })
const diff = (file, hunks) => `--- a/${file}\n+++ b/${file}\n${hunks}`

test('the patch parser accepts edits to existing source and refuses everything else', () => {
  const parsed = parsePatch(patchFor())
  assert.deepEqual(parsed.map(entry => [entry.file, entry.hunks.length]), [['srv/service.js', 1]])
  const refused = {
    'creating a file': '--- /dev/null\n+++ b/srv/new.js\n@@ -0,0 +1 @@\n+x\n',
    'deleting a file': '--- a/srv/service.js\n+++ /dev/null\n@@ -1 +0,0 @@\n-x\n',
    'renaming': '--- a/srv/a.js\n+++ b/srv/b.js\n@@ -1 +1 @@\n-x\n+y\n',
    'git new-file header': 'diff --git a/srv/n.js b/srv/n.js\nnew file mode 100644\n--- /dev/null\n+++ b/srv/n.js\n',
    'wrong line counts': diff('srv/service.js', '@@ -1,2 +1 @@\n-x\n+y\n'),
    'no hunks': '--- a/srv/service.js\n+++ b/srv/service.js\n',
    'plain prose': 'Replace the where string with an object.',
    'a path leaving the project': diff('../outside.js', '@@ -1 +1 @@\n-x\n+y\n'),
    'a hidden folder': diff('.github/workflow.js', '@@ -1 +1 @@\n-x\n+y\n'),
    'node_modules': diff('node_modules/dep/index.js', '@@ -1 +1 @@\n-x\n+y\n'),
    'a non-source file': diff('package.json', '@@ -1 +1 @@\n-x\n+y\n'),
    'an absolute path': diff('/etc/passwd.js', '@@ -1 +1 @@\n-x\n+y\n'),
    'a drive path': diff('C:\\\\work\\\\x.js', '@@ -1 +1 @@\n-x\n+y\n'),
    'the same file twice': `${diff('srv/a.js', '@@ -1 +1 @@\n-x\n+y\n')}${diff('srv/a.js', '@@ -2 +2 @@\n-x\n+y\n')}`
  }
  for (const [name, patch] of Object.entries(refused)) assert.throws(() => parsePatch(patch), TypeError, name)
  assert.equal(safeProjectPath('srv\\handlers\\a.js'), 'srv/handlers/a.js')
})

test('hunks apply only where they match exactly, preserve line endings, and reverse cleanly', () => {
  const original = ['one', 'two', 'three', 'four', 'five', 'six', ''].join('\n')
  const patch = parsePatch(diff('srv/a.js', '@@ -2,2 +2,3 @@\n one\n-two\n+TWO\n+two-b\n three\n@@ -5,2 +6,1 @@\n five\n-six\n'.replace(' one\n', '').replace('@@ -2,2 +2,3 @@', '@@ -2,2 +2,3 @@')))[0]
  const first = applyHunks(original, patch.hunks)
  assert.equal(first.text, ['one', 'TWO', 'two-b', 'three', 'four', 'five', ''].join('\n'))
  const back = parsePatch(reversePatch([{ file: 'srv/a.js', hunks: first.hunks }]))[0]
  assert.equal(applyHunks(first.text, back.hunks).text, original, 'the reverse patch restores the original')
  const off = parsePatch(diff('srv/a.js', '@@ -3 +3 @@\n-two\n+TWO\n'))[0]
  assert.throws(() => applyHunks(original, off.hunks), /does not match the source at line 3: expects "two", the file has "three"/)
  const windows = applyHunks('a\r\nb\r\nc\r\n', parsePatch(diff('srv/a.js', '@@ -2 +2 @@\n-b\n+B\n'))[0].hunks)
  assert.equal(windows.text, 'a\r\nB\r\nc\r\n')
  assert.equal(applyHunks('a\nb', parsePatch(diff('srv/a.js', '@@ -2 +2 @@\n-b\n+B\n'))[0].hunks).text, 'a\nB', 'no final newline stays absent')
  assert.throws(() => applyHunks(original, parsePatch(diff('srv/a.js', '@@ -4 +4 @@\n-four\n+4\n@@ -2 +2 @@\n-two\n+2\n'))[0].hunks), /overlaps or precedes/)
})

test('a proposed decision needs severity, uncertainty, and a complete solution whose patch checks out', async context => {
  const { report, submission, ids } = await reviewedProject(context)
  const base = submission.decisions[0]
  const withPatch = { patchChecks: new Map([[ids.query, { ok: true, patchSha256: patchSha256(patchFor()), files: [{ file: 'srv/service.js', baseSha256: 'a'.repeat(64), afterSha256: 'b'.repeat(64), hunks: [] }] }]]) }
  const decide = (mutate, options = withPatch) => {
    const entry = structuredClone(base)
    mutate(entry)
    return reconcileDecisions(report, { snapshotSha256: submission.snapshotSha256, decisions: [entry] }, options === null ? undefined : options).decisions.find(item => item.id === ids.query)
  }
  const good = decide(() => {})
  assert.equal(good.decision, 'proposed')
  assert.equal(good.verifiedPatch.patchSha256, patchSha256(patchFor()))
  const blocked = (mutate, text, options) => { const result = decide(mutate, options); assert.equal(result.decision, 'needs-review'); assert.ok(result.blockers.some(blocker => blocker.includes(text)), `${text} in ${result.blockers}`) }
  blocked(entry => { delete entry.severity }, 'Missing severity')
  blocked(entry => { delete entry.uncertainty }, 'Missing uncertainty')
  blocked(entry => { delete entry.proposal }, 'Missing proposal')
  blocked(entry => { delete entry.proposal.patch }, 'needs a unified diff')
  blocked(entry => { entry.proposal.compatibility = [] }, 'compatibility')
  blocked(entry => { entry.proposal.regressions = [] }, 'regressions')
  blocked(entry => { entry.proposal.verification.steps = [] }, 'verification steps')
  blocked(entry => { entry.proposal.verification.tests = [] }, 'proposed tests')
  blocked(entry => { entry.proposal.patch = 'Use a bound value instead.' }, 'not a valid unified diff')
  blocked(() => {}, 'not checked against the project', null)
  blocked(() => {}, 'does not apply to the current source: hunk 1 expects', { patchChecks: new Map([[ids.query, { ok: false, error: 'hunk 1 expects the old line' }]]) })
  assert.equal(decide(entry => { entry.verifiedPatch = { patchSha256: 'forged' } }, null).verifiedPatch, undefined, 'a submitted verifiedPatch is never trusted')
  for (const [mutate, message] of [
    [entry => { entry.severity = { level: 'critical', basis: 'x' } }, /severity needs a level/], [entry => { entry.proposal.extra = 1 }, /Unsupported proposal field/],
    [entry => { entry.proposal.patch = 42 }, /unified diff string/], [entry => { entry.proposal.compatibility = 'text' }, /list of non-empty strings/],
    [entry => { entry.proposal.verification.command = 'rm -rf' }, /only steps and tests/], [entry => { entry.uncertainty = [''] }, /uncertainty must be a list/]
  ]) assert.throws(() => decide(mutate), message)
})

test('patches are checked against the real source: evidence hash, exact lines, paths, and symlinks', async context => {
  const { root, report, submission, ids } = await reviewedProject(context)
  const check = async patch => (await checkProposalPatches(root, report, { ...submission, decisions: [{ ...submission.decisions[0], proposal: { ...submission.decisions[0].proposal, patch } }] })).get(ids.query)
  const ok = await check(patchFor())
  assert.equal(ok.ok, true)
  assert.match(ok.files[0].baseSha256, /^[a-f0-9]{64}$/)
  assert.equal('afterText' in ok.files[0] || 'beforeText' in ok.files[0], false, 'no source text is stored in the result')
  assert.match((await check(diff('srv/service.js', '@@ -1 +1 @@\n-SELECT.from(Other)\n+SELECT.from(Items)\n'))).error, /does not match the source at line 1/)
  assert.match((await check(diff('srv/missing.js', '@@ -1 +1 @@\n-x\n+y\n'))).error, /does not exist/)
  assert.match((await check(diff('db/../../escape.js', '@@ -1 +1 @@\n-x\n+y\n'))).error, /leaves the project/)
  await symlink(path.join(root, 'srv', 'service.js'), path.join(root, 'srv', 'alias.js'))
  assert.match((await check(diff('srv/alias.js', `@@ -1 +1 @@\n-${originalLine}\n+x\n`))).error, /symlink/)
  await writeFile(path.join(root, 'srv', 'service.js'), `// edited after the scan\n${originalLine}\n`)
  assert.match((await check(patchFor())).error, /evidence file changed since the scan/)
})

test('scan.mjs --decisions checks patches when it is given the project and refuses to call them verified otherwise', async context => {
  const { root, report, submission, ids } = await reviewedProject(context)
  const out = await mkdtemp(path.join(tmpdir(), 'cap-proposal-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  await writeFile(path.join(out, 'brief.json'), JSON.stringify(report))
  await writeFile(path.join(out, 'decisions.json'), JSON.stringify(submission))
  const withProject = run('scan.mjs', [root, '--report', path.join(out, 'brief.json'), '--decisions', path.join(out, 'decisions.json')])
  assert.equal(withProject.status, 0, withProject.stderr)
  const checked = JSON.parse(withProject.stdout).decisions.find(item => item.id === ids.query)
  assert.equal(checked.decision, 'proposed')
  assert.equal(checked.verifiedPatch.files[0].file, 'srv/service.js')
  const without = JSON.parse(run('scan.mjs', ['--report', path.join(out, 'brief.json'), '--decisions', path.join(out, 'decisions.json')]).stdout).decisions.find(item => item.id === ids.query)
  assert.equal(without.decision, 'needs-review')
  assert.match(without.blockers.join(' '), /not checked against the project/)
})

// A reviewed project whose query proposal the developer approved, with every file the CLIs need on disk.
async function approved(context, options) {
  const project = await reviewedProject(context, options)
  const out = await mkdtemp(path.join(tmpdir(), 'cap-apply-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const { rows, brief } = reviewRows(project.report, project.validated)
  const developer = recordDeveloperDecisions({ report: project.report, validated: project.validated, reviewer: 'A. Developer',
    sheet: tick(renderReviewSheet({ brief, rows }), project.ids.query, { approve: true }) })
  const files = { report: path.join(out, 'brief.json'), decisions: path.join(out, 'validated.json'), developer: path.join(out, 'developer.json') }
  await writeFile(files.report, JSON.stringify(project.report))
  await writeFile(files.decisions, JSON.stringify(project.validated))
  await writeFile(files.developer, JSON.stringify(developer))
  const common = ['--report', files.report, '--decisions', files.decisions, '--developer-decisions', files.developer, '--project', project.root, '--id', project.ids.query]
  return { ...project, out, files, common, developer, source: path.join(project.root, 'srv', 'service.js') }
}
const nodeCommand = code => `"${process.execPath}" -e "${code}"`

test('workflow: preview shows the diff and changes nothing; apply needs the exact confirmation; tests are recorded', async context => {
  const w = await approved(context)
  const before = await readFile(w.source, 'utf8')
  const hash = w.developer.decisions[0].patchSha256
  const preview = run('apply.mjs', ['preview', ...w.common])
  assert.equal(preview.status, 0, preview.stderr)
  for (const expected of ['NOTHING HAS BEEN CHANGED', `--confirm ${hash}`, `+SELECT.from(Items).where({ code: input })`, 'Approved by: A. Developer', 'srv/service.js']) assert.ok(preview.stdout.includes(expected), expected)
  assert.equal(await readFile(w.source, 'utf8'), before)

  const record = path.join(w.out, 'application.json')
  for (const [name, args] of [['no confirmation', ['--output', record]], ['a wrong confirmation', ['--confirm', 'f'.repeat(64), '--output', record]],
    ['no output', ['--confirm', hash]], ['an output inside the project', ['--confirm', hash, '--output', path.join(w.root, 'application.json')]]]) {
    const refused = run('apply.mjs', ['apply', ...w.common, ...args])
    assert.equal(refused.status, 1, name)
    assert.equal(await readFile(w.source, 'utf8'), before, `${name}: nothing changed`)
  }
  const applied = run('apply.mjs', ['apply', ...w.common, '--confirm', hash, '--output', record, '--test-command', nodeCommand('process.exit(0)')])
  assert.equal(applied.status, 0, applied.stderr)
  const result = JSON.parse(applied.stdout)
  assert.equal(await readFile(record, 'utf8'), applied.stdout)
  assert.deepEqual([result.state, result.result, result.verification.exitCode, result.verification.timedOut], ['applied', 'test-passed', 0, false])
  assert.equal(result.patchSha256, hash)
  assert.deepEqual(result.files.map(file => file.file), ['srv/service.js'])
  const after = await readFile(w.source, 'utf8')
  assert.equal(after, before.replace(originalLine, 'SELECT.from(Items).where({ code: input })'))
  assert.equal(result.files[0].baseSha256 === result.files[0].afterSha256, false)
  assert.equal(applyHunks(after, parsePatch(result.reversePatch)[0].hunks).text, before, 'the recorded reverse patch undoes the change')

  const again = run('apply.mjs', ['apply', ...w.common, '--confirm', hash, '--output', path.join(w.out, 'second.json')])
  assert.equal(again.status, 1, 'a second apply is refused because the source no longer matches')
  assert.equal(await readFile(w.source, 'utf8'), after)
  const status = JSON.parse(run('apply.mjs', ['status', '--report', w.files.report, '--decisions', w.files.decisions, '--developer-decisions', w.files.developer, '--application', record, '--project', w.root]).stdout)
  assert.equal(status.items.find(item => item.id === w.ids.query).state, 'applied, tests passed')
  const notApplied = JSON.parse(run('apply.mjs', ['status', '--report', w.files.report, '--decisions', w.files.decisions, '--developer-decisions', w.files.developer]).stdout)
  assert.deepEqual([notApplied.items.find(item => item.id === w.ids.query).state, notApplied.items.find(item => item.id === w.ids.validation).state], ['approved, not applied', 'awaiting your decision (not ready for approval)'])
})

test('failed tests and missing tests are never reported as success, and a changed file is flagged', async context => {
  const failed = await approved(context)
  const hash = failed.developer.decisions[0].patchSha256
  const record = path.join(failed.out, 'failed.json')
  const applied = run('apply.mjs', ['apply', ...failed.common, '--confirm', hash, '--output', record, '--test-command', nodeCommand('console.log(1234); process.exit(3)')])
  assert.equal(applied.status, 2, 'a failing test run is a non-zero exit')
  const result = JSON.parse(applied.stdout)
  assert.deepEqual([result.result, result.verification.exitCode], ['test-failed', 3])
  assert.match(result.verification.outputTail, /1234/)
  assert.match(result.note, /not reverted/)
  assert.match(await readFile(failed.source, 'utf8'), /where\(\{ code: input \}\)/, 'the change stays; undoing is the developer\'s choice')
  const status = run('apply.mjs', ['status', '--report', failed.files.report, '--decisions', failed.files.decisions, '--developer-decisions', failed.files.developer, '--application', record])
  assert.equal(JSON.parse(status.stdout).items.find(item => item.id === failed.ids.query).state, 'applied, tests FAILED')

  const untested = await approved(context)
  const untestedRecord = path.join(untested.out, 'untested.json')
  const ran = run('apply.mjs', ['apply', ...untested.common, '--confirm', untested.developer.decisions[0].patchSha256, '--output', untestedRecord])
  assert.equal(ran.status, 0)
  assert.deepEqual([JSON.parse(ran.stdout).result, JSON.parse(ran.stdout).verification], ['unverified', null])
  await writeFile(untested.source, 'edited by hand afterwards')
  const later = JSON.parse(run('apply.mjs', ['status', '--report', untested.files.report, '--decisions', untested.files.decisions, '--developer-decisions', untested.files.developer, '--application', untestedRecord, '--project', untested.root]).stdout)
  assert.equal(later.items.find(item => item.id === untested.ids.query).state, 'applied, unverified (no tests run); files changed since')
})

test('only an approved, unchanged proposal can be applied', async context => {
  const w = await approved(context)
  const hash = w.developer.decisions[0].patchSha256
  const attempt = (extra = {}, files = w.files) => run('apply.mjs', ['apply', '--report', files.report, '--decisions', files.decisions, '--developer-decisions', files.developer, '--project', w.root, '--id', w.ids.query, '--confirm', hash, '--output', path.join(w.out, `${Math.random()}.json`)])
  const before = await readFile(w.source, 'utf8')
  const rejected = { ...w.developer, decisions: [{ ...w.developer.decisions[0], decision: 'rejected', notes: 'no' }] }
  await writeFile(path.join(w.out, 'rejected.json'), JSON.stringify(rejected))
  assert.match(attempt({}, { ...w.files, developer: path.join(w.out, 'rejected.json') }).stderr, /is not approved \(developer decision: rejected\)/)
  const heldId = run('apply.mjs', ['apply', '--report', w.files.report, '--decisions', w.files.decisions, '--developer-decisions', w.files.developer, '--project', w.root, '--id', w.ids.validation, '--confirm', hash, '--output', path.join(w.out, 'held.json')])
  assert.match(heldId.stderr, /is not approved/)
  const revised = structuredClone(w.validated)
  revised.decisions.find(item => item.id === w.ids.query).proposal.patch = patchFor().replace('{ code: input }', '{ code: String(input) }')
  await writeFile(path.join(w.out, 'revised.json'), JSON.stringify(revised))
  assert.match(attempt({}, { ...w.files, decisions: path.join(w.out, 'revised.json') }).stderr, /different patch than the current proposal/)
  const otherScan = { ...w.developer, snapshotSha256: 'f'.repeat(64) }
  await writeFile(path.join(w.out, 'other-scan.json'), JSON.stringify(otherScan))
  assert.match(attempt({}, { ...w.files, developer: path.join(w.out, 'other-scan.json') }).stderr, /different scan/)
  assert.match(run('apply.mjs', ['apply', ...w.common.slice(0, -1), 'CAP-FINDING-unknown', '--confirm', hash, '--output', path.join(w.out, 'u.json')]).stderr, /Unknown finding ID/)
  await writeFile(w.source, `// edited after approval\n${before}`)
  assert.match(attempt().stderr, /evidence file changed since the scan/)
  assert.equal(await readFile(w.source, 'utf8'), `// edited after approval\n${before}`, 'every refusal left the file as it was')
})

test('a write failure part-way rolls back the files already written', async context => {
  if (process.platform === 'win32' || process.getuid?.() === 0) return context.skip('needs a read-only folder that the user cannot override')
  const patch = `${patchFor()}${diff('locked/other.js', '@@ -1 +1 @@\n-const keep = 1\n+const keep = 2\n')}`
  const w = await approved(context, { patch, mutate: async root => { await mkdir(path.join(root, 'locked')); await writeFile(path.join(root, 'locked', 'other.js'), 'const keep = 1\n') } })
  const before = await readFile(w.source, 'utf8')
  await chmod(path.join(w.root, 'locked'), 0o555)
  try {
    const applied = run('apply.mjs', ['apply', ...w.common, '--confirm', w.developer.decisions[0].patchSha256, '--output', path.join(w.out, 'rollback.json')])
    assert.equal(applied.status, 1)
    assert.equal(await readFile(w.source, 'utf8'), before, 'the first file was restored')
    assert.equal(await readFile(path.join(w.root, 'locked', 'other.js'), 'utf8'), 'const keep = 1\n')
    await assert.rejects(readFile(path.join(w.out, 'rollback.json')), 'no record claims a change that was rolled back')
  } finally {
    await chmod(path.join(w.root, 'locked'), 0o755)
  }
})
