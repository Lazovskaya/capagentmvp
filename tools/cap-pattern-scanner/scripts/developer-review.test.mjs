import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadSheetExcerpts, parseReviewSheet, recordDeveloperDecisions, renderReviewSheet, reviewRows } from './developer-review.mjs'
import { reviewedProject, tick } from './workflow-fixtures.mjs'

const cli = fileURLToPath(new URL('./sheet.mjs', import.meta.url))

test('the sheet gives each item its evidence, problem, verified diff, targets, compatibility, regressions, tests, and uncertainty', async context => {
  const { root, report, brief, validated, ids } = await reviewedProject(context)
  const { rows } = reviewRows(report, validated)
  assert.deepEqual(rows.map(row => [row.section, row.ready]), [['proposed', true], ['needs-review', false], ['not-applicable', false]])
  const sheet = renderReviewSheet({ brief, rows, excerpts: await loadSheetExcerpts(root, report, rows) })
  for (const id of Object.values(ids)) assert.ok(sheet.includes(`<!-- id: ${id} -->`))
  for (const expected of [
    /Finding CAP-FINDING-\w+ · source `[a-f0-9]{12}…`/, /\*\*ready for approval\*\*/, /\*\*not ready for approval\*\*/,
    /Severity: \*\*medium\*\* \(the AI's assessment of impact if the finding is real, not a scanner result\)/, /Severity: not assessed\./,
    /Source evidence \(current code\):/, /^ +1 > SELECT\.from\(Items\)\.where\('code=' \+ input\)$/m,
    /Problem and why a change is warranted:/, /Proposed solution \(unified diff, not applied\):/, /^-SELECT\.from\(Items\)/m, /^\+SELECT\.from\(Items\)\.where\(\{ code: input \}\)/m,
    /Verified against the current source: the diff applies exactly/, /- `srv\/service\.js` lines 1-1/, /CAP\/runtime compatibility:/, /Potential regressions:/,
    /Verification steps:/, /Proposed tests \(descriptions only; the tool never runs a command from the AI\)/, /Uncertainty and missing evidence:/,
    /No concrete solution has been formulated/, /approve: unavailable, there is no verified proposal/, /Neither this sheet nor deciding on it changes any code/
  ]) assert.match(sheet, expected)
  assert.equal(sheet.split('- [ ] reject').length - 1, 2, 'a form for the proposed and the held item only')
  assert.equal(sheet.includes('I have applied'), false, 'applied is never a tick; it comes from an application record')
  await writeFile(path.join(root, 'srv', 'service.js'), 'changed since the scan')
  await assert.rejects(loadSheetExcerpts(root, report, rows), /Source changed/)
})

test('approve, reject, needs-changes and defer are recorded; approval is bound to the exact diff', async context => {
  const { report, brief, validated, ids } = await reviewedProject(context)
  const { rows } = reviewRows(report, validated)
  const blank = renderReviewSheet({ brief, rows })
  const record = sheet => recordDeveloperDecisions({ report, validated, sheet, reviewer: 'A. Developer' })

  assert.deepEqual(record(blank).summary, { reviewable: 2, approved: 0, rejected: 0, needsChanges: 0, deferred: 0, undecided: 2 })
  const approved = record(tick(blank, ids.query, { approve: true }))
  const [decision] = approved.decisions
  assert.deepEqual([decision.decision, decision.aiDecision, decision.id], ['approved', 'proposed', ids.query])
  assert.match(decision.patchSha256, /^[a-f0-9]{64}$/)
  assert.equal(decision.patchSha256, validated.decisions.find(item => item.id === ids.query).verifiedPatch.patchSha256)
  assert.deepEqual(decision.targets.map(target => target.file), ['srv/service.js'])
  assert.match(approved.note, /nothing is applied or verified until apply\.mjs/)
  assert.equal('applied' in decision, false)

  const mixed = record(tick(tick(blank, ids.query, { needsChanges: true, notes: 'also handle a missing term' }), ids.validation, { defer: true }))
  assert.deepEqual(mixed.summary, { reviewable: 2, approved: 0, rejected: 0, needsChanges: 1, deferred: 1, undecided: 0 })
  assert.equal(mixed.decisions.find(item => item.id === ids.query).notes, 'also handle a missing term')
  const rejected = record(tick(blank, ids.validation, { reject: true, notes: 'zero is a valid value here' }))
  assert.deepEqual([rejected.decisions[0].decision, rejected.decisions[0].aiDecision, rejected.decisions[0].notes], ['rejected', 'needs-review', 'zero is a valid value here'])
  assert.equal(rejected.decisions.some(item => item.id === ids.remote), false, 'not-applicable items take no decision')
})

test('contradictory or unsupported ticks are refused instead of guessed', async context => {
  const { report, brief, validated, ids } = await reviewedProject(context)
  const { rows } = reviewRows(report, validated)
  const blank = renderReviewSheet({ brief, rows })
  const record = sheet => recordDeveloperDecisions({ report, validated, sheet })
  assert.throws(() => record(tick(blank, ids.query, { approve: true, reject: true, notes: 'x' })), /more than one decision ticked/)
  assert.throws(() => record(tick(blank, ids.query, { reject: true })), /rejected without a reason/)
  assert.throws(() => record(tick(blank, ids.query, { needsChanges: true })), /sent back without a reason/)
  assert.throws(() => record(tick(blank, ids.validation, { approve: true })), /cannot be approved: the AI has no verified proposal/)
  assert.throws(() => record(`${blank}\n<!-- id: CAP-FINDING-unknown -->\n- [x] approve`), /not in this review/)
  assert.throws(() => record(`${blank}\n<!-- id: ${ids.query} -->\n`), /more than once/)
  assert.throws(() => record(blank.replace(`<!-- id: ${ids.remote} -->`, `<!-- id: ${ids.remote} -->\n- [x] approve`)), /cannot take a developer decision/)
  const other = await reviewedProject(context, { mutate: root => writeFile(path.join(root, 'srv', 'extra.js'), 'const unrelated = 1\n') })
  assert.throws(() => recordDeveloperDecisions({ report, validated: other.validated, sheet: blank }), /different snapshot/)
})

test('a sheet saved by a Windows editor (CRLF and BOM) is read the same way', async context => {
  const { report, brief, validated, ids } = await reviewedProject(context)
  const { rows } = reviewRows(report, validated)
  const edited = tick(tick(renderReviewSheet({ brief, rows }), ids.query, { approve: true }), ids.validation, { reject: true, notes: 'line one\nline two' })
  const windows = `﻿${edited.replace(/\n/g, '\r\n')}`
  const decisions = recordDeveloperDecisions({ report, validated, sheet: windows }).decisions
  assert.deepEqual(decisions.map(item => [item.decision, item.notes]), [['approved', ''], ['rejected', 'line one line two']])
  assert.equal(parseReviewSheet(windows).size, 3)
})

test('the CLI writes the sheet and the record to new files only, never inside the project', async context => {
  const { root, report, validated, ids } = await reviewedProject(context)
  const out = await mkdtemp(path.join(tmpdir(), 'cap-sheet-out-'))
  context.after(() => rm(out, { recursive: true, force: true }))
  const files = ['brief', 'validated', 'sheet', 'ticked', 'record'].reduce((map, name) => ({ ...map, [name]: path.join(out, `${name}.${name === 'sheet' || name === 'ticked' ? 'md' : 'json'}`) }), {})
  await writeFile(files.brief, JSON.stringify(report))
  await writeFile(files.validated, JSON.stringify(validated))
  const run = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })
  const made = run(['sheet', '--report', files.brief, '--decisions', files.validated, '--project', root, '--output', files.sheet])
  assert.equal(made.status, 0, made.stderr)
  assert.equal(await readFile(files.sheet, 'utf8'), made.stdout)
  const again = run(['sheet', '--report', files.brief, '--decisions', files.validated, '--output', files.sheet])
  assert.equal(again.status, 1)
  assert.match(again.stderr, /EEXIST/)
  assert.equal(await readFile(files.sheet, 'utf8'), made.stdout, 'the existing sheet is untouched')
  const inside = run(['sheet', '--report', files.brief, '--decisions', files.validated, '--project', root, '--output', path.join(root, 'sheet.md')])
  assert.equal(inside.status, 1)
  assert.match(inside.stderr, /outside the analyzed project/)
  await writeFile(files.ticked, tick(made.stdout, ids.query, { approve: true }))
  const recorded = run(['record', '--report', files.brief, '--decisions', files.validated, '--sheet', files.ticked, '--reviewer', 'Dev', '--output', files.record])
  assert.equal(recorded.status, 0, recorded.stderr)
  assert.equal(await readFile(files.record, 'utf8'), recorded.stdout)
  assert.deepEqual(JSON.parse(recorded.stdout).summary, { reviewable: 2, approved: 1, rejected: 0, needsChanges: 0, deferred: 0, undecided: 1 })
  assert.equal(run(['record', '--report', files.brief, '--decisions', files.validated]).status, 1)
  assert.match(run(['--help']).stdout, /approve, reject, needs-changes, or defer/)
})
