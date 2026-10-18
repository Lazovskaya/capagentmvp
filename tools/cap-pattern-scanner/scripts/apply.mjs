import { spawn } from 'node:child_process'
import { realpath, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { reviewRows } from './developer-review.mjs'
import { normalizePatch, patchSha256, readProjectFile, reversePatch, safeProjectPath, verifyPatchAgainstProject } from './patch.mjs'
import { readJsonInput, resolveNewFileTarget, writeNewFile } from './scan.mjs'

const usage = `Usage:
  node apply.mjs preview --report <brief.json> --decisions <validated.json> --developer-decisions <developer.json> --project <cap-project> --id <finding-ID>
  node apply.mjs apply   (same options) --confirm <sha256 shown by preview> --output <new-record.json> [--test-command "<your command>"] [--test-timeout <seconds>]
  node apply.mjs status  --report <brief.json> --decisions <validated.json> [--developer-decisions <developer.json>] [--application <record.json> ...] [--project <cap-project>]
preview changes nothing: it shows the exact diff and the token to confirm it. apply changes the project only for a proposal you approved, only
with that token, and only if the files still match; it writes a new-file-only record. The test command is yours: the tool never runs a
command that came from the AI. status derives each item's state from the records and, with --project, from the files.`
const maxOutput = 8000

function approvedProposal({ report, validated, developer, id }) {
  const { brief, rows } = reviewRows(report, validated)
  if (developer?.format !== 'cap-pattern-developer-decisions' || developer.snapshotSha256 !== brief.snapshot.sha256) {
    throw new TypeError('The developer decisions belong to a different scan than the brief')
  }
  const row = rows.find(candidate => candidate.id === id)
  if (!row) throw new TypeError(`Unknown finding ID: ${id}`)
  const approval = developer.decisions?.find(decision => decision.id === id)
  if (approval?.decision !== 'approved') throw new TypeError(`${id} is not approved (developer decision: ${approval?.decision ?? 'none'})`)
  if (!row.ready) throw new TypeError(`${id} has no verified proposal to apply`)
  if (patchSha256(row.proposal.patch) !== approval.patchSha256) {
    throw new TypeError('The approval is for a different patch than the current proposal; review the revised proposal and approve it again')
  }
  return { brief, row, approval, patch: row.proposal.patch }
}

// Re-verifies everything against the live files: nothing from the AI or earlier steps is trusted.
async function currentState(project, { brief, row, patch }) {
  const root = await realpath(project)
  const evidence = await readProjectFile(path.join(root, safeProjectPath(row.finding.evidence.file)))
  if (evidence.sha256 !== row.finding.evidence.sha256) throw new TypeError('The evidence file changed since the scan; rescan before applying')
  const verified = await verifyPatchAgainstProject(root, patch)
  for (const file of verified.files) {
    const expected = row.verifiedPatch.files.find(candidate => candidate.file === file.file)
    if (!expected || expected.baseSha256 !== file.baseSha256) throw new TypeError(`${file.file} changed since the proposal was verified; rescan and review again`)
  }
  return { root, verified, brief }
}

function runTests(command, cwd, seconds) {
  return new Promise(resolve => {
    const started = Date.now()
    let tail = ''
    let timedOut = false
    const done = (exitCode, signal, extra = '') => resolve({
      command, exitCode, signal, timedOut, durationMs: Date.now() - started, ranAt: new Date(started).toISOString(),
      outputTail: `${tail}${extra}`.slice(-maxOutput)
    })
    const child = spawn(command, { cwd, shell: true, windowsHide: true })
    const collect = chunk => { tail = (tail + chunk.toString()).slice(-maxOutput) }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    const timer = setTimeout(() => { timedOut = true; child.kill() }, seconds * 1000)
    child.on('error', error => { clearTimeout(timer); done(null, null, `\n${error.message}`) })
    child.on('close', (exitCode, signal) => { clearTimeout(timer); done(exitCode, signal) })
  })
}

async function writeAll(root, files) {
  const written = []
  try {
    for (const file of files) {
      const target = path.join(root, file.file)
      const temporary = `${target}.cap-ai-11-${process.pid}.tmp`
      await writeFile(temporary, file.afterText, { flag: 'wx' })
      try { await rename(temporary, target) } catch (error) { await unlink(temporary).catch(() => {}); throw error }
      written.push(file)
      if ((await readProjectFile(target)).sha256 !== file.afterSha256) throw new Error('A file did not read back as written')
    }
  } catch (error) {
    for (const file of written) await writeFile(path.join(root, file.file), file.beforeText).catch(() => {})
    throw error
  }
}

function previewText({ row, approval, verified, developer }, patch) {
  const lines = [
    `Preview for ${row.id} (${row.finding.patternId}, ${row.finding.evidence.file}:${row.finding.evidence.line}). NOTHING HAS BEEN CHANGED.`,
    `Severity: ${row.severity ? `${row.severity.level} (AI assessment): ${row.severity.basis}` : 'not assessed'}`,
    `Approved by: ${developer.reviewer ?? 'an unnamed reviewer'} · bound to patch ${approval.patchSha256}`, '',
    'Files that would change:',
    ...verified.files.map(file => `  ${file.file}  ${file.baseSha256.slice(0, 12)}… -> ${file.afterSha256.slice(0, 12)}…  hunks at lines ${file.hunks.map(hunk => hunk.oldStart).join(', ')}`), '',
    'Exact diff that apply would write:', '----------------------------------------', normalizePatch(patch).trimEnd(), '----------------------------------------', '',
    'To apply it, pass the hash of this diff as the confirmation:',
    `  --confirm ${approval.patchSha256}`, 'and choose a new record file with --output; add --test-command "<your test command>" to run your tests afterwards.', ''
  ]
  return lines.join('\n')
}

try {
  const { values, positionals } = parseArgs({
    options: {
      report: { type: 'string' }, decisions: { type: 'string' }, 'developer-decisions': { type: 'string' }, project: { type: 'string' },
      id: { type: 'string' }, confirm: { type: 'string' }, output: { type: 'string' }, 'test-command': { type: 'string' },
      'test-timeout': { type: 'string' }, application: { type: 'string', multiple: true }, help: { type: 'boolean' }
    },
    allowPositionals: true
  })
  const [command] = positionals
  const needsDecisions = ['preview', 'apply'].includes(command)
  if (values.help || !['preview', 'apply', 'status'].includes(command) || positionals.length !== 1 || !values.report || !values.decisions
    || (needsDecisions && (!values['developer-decisions'] || !values.project || !values.id))) {
    console.log(usage)
    process.exitCode = values.help ? 0 : 1
  } else if (command === 'status') {
    const report = await readJsonInput(values.report)
    const validated = await readJsonInput(values.decisions)
    const developer = values['developer-decisions'] ? await readJsonInput(values['developer-decisions']) : undefined
    const { brief, rows } = reviewRows(report, validated)
    if (developer && (developer.format !== 'cap-pattern-developer-decisions' || developer.snapshotSha256 !== brief.snapshot.sha256)) {
      throw new TypeError('The developer decisions belong to a different scan than the brief')
    }
    const applications = []
    for (const file of values.application ?? []) {
      const record = await readJsonInput(file)
      if (record?.format !== 'cap-pattern-application' || record.snapshotSha256 !== brief.snapshot.sha256) throw new TypeError('An application record belongs to a different scan or is not an application record')
      applications.push(record)
    }
    const root = values.project ? await realpath(values.project) : undefined
    const items = []
    for (const row of rows.filter(candidate => ['proposed', 'needs-review'].includes(candidate.section))) {
      const decision = developer?.decisions?.find(candidate => candidate.id === row.id)
      const record = applications.filter(candidate => candidate.findingId === row.id && candidate.patchSha256 === row.verifiedPatch?.patchSha256).at(-1)
      let state
      let note = ''
      if (record) {
        state = { 'test-passed': 'applied, tests passed', 'test-failed': 'applied, tests FAILED', unverified: 'applied, unverified (no tests run)' }[record.result]
        if (root) {
          const drifted = []
          for (const file of record.files) {
            const current = await readProjectFile(path.join(root, safeProjectPath(file.file))).catch(() => undefined)
            if (current?.sha256 !== file.afterSha256) drifted.push(file.file)
          }
          if (drifted.length) { note = `files differ from the recorded result: ${drifted.join(', ')}`; state = `${state}; files changed since` }
        }
      } else if (decision) state = decision.decision === 'approved' ? 'approved, not applied' : decision.decision
      else state = row.ready ? 'awaiting your decision (ready for approval)' : 'awaiting your decision (not ready for approval)'
      items.push({ id: row.id, patternId: row.finding.patternId, file: row.finding.evidence.file, line: row.finding.evidence.line, aiDecision: row.aiDecision, state, ...(note ? { note } : {}) })
    }
    const summary = {}
    for (const item of items) summary[item.state] = (summary[item.state] ?? 0) + 1
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, format: 'cap-pattern-status', snapshotSha256: brief.snapshot.sha256, note: 'Applied and test states come from application records written by apply.mjs, never from approval alone.', summary, items }, null, 2)}\n`)
  } else {
    const report = await readJsonInput(values.report)
    const validated = await readJsonInput(values.decisions)
    const developer = await readJsonInput(values['developer-decisions'])
    const approved = approvedProposal({ report, validated, developer, id: values.id })
    const state = await currentState(values.project, approved)
    if (command === 'preview') {
      process.stdout.write(previewText({ ...approved, verified: state.verified, developer }, approved.patch))
    } else {
      if (values.confirm !== approved.approval.patchSha256) throw new TypeError(`--confirm must be the sha256 of the diff shown by preview (${approved.approval.patchSha256})`)
      if (!values.output) throw new TypeError('apply needs --output <new record file>, so the result is always recorded')
      const seconds = values['test-timeout'] === undefined ? 600 : Number(values['test-timeout'])
      if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) throw new TypeError('--test-timeout must be 1 to 3600 seconds')
      await resolveNewFileTarget(values.output, values.project)
      await writeAll(state.root, state.verified.files)
      const verification = values['test-command'] ? await runTests(values['test-command'], state.root, seconds) : null
      const result = verification ? (verification.exitCode === 0 && !verification.timedOut ? 'test-passed' : 'test-failed') : 'unverified'
      const record = {
        schemaVersion: 1, format: 'cap-pattern-application', useCaseId: state.brief.useCaseId, snapshotSha256: state.brief.snapshot.sha256,
        findingId: values.id, patchSha256: approved.approval.patchSha256, reviewer: developer.reviewer ?? null, appliedAt: new Date().toISOString(),
        state: 'applied', result,
        files: state.verified.files.map(({ file, baseSha256, afterSha256 }) => ({ file, baseSha256, afterSha256 })),
        appliedPatch: normalizePatch(approved.patch), reversePatch: reversePatch(state.verified.files), verification,
        note: result === 'unverified' ? 'Applied, but no tests were run: the change is unverified.' : result === 'test-failed' ? 'Applied and the tests FAILED. The change was not reverted; use reversePatch (git apply -R) to undo it.' : 'Applied and the developer-supplied tests passed.'
      }
      const text = `${JSON.stringify(record, null, 2)}\n`
      try { await writeNewFile(values.output, text, values.project) } catch (error) {
        process.stdout.write(text)
        throw Object.assign(new Error('The change was applied but the record could not be saved; it is printed above'), { code: error.code })
      }
      process.stdout.write(text)
      if (result === 'test-failed') process.exitCode = 2
    }
  }
} catch (error) {
  const detail = error instanceof TypeError || /applied but the record/.test(error.message) ? ` ${error.message}.` : ''
  console.error(`Apply failed (${error.code ?? 'INVALID_INPUT'});${detail} Nothing was changed unless this message says a change was applied.`)
  process.exitCode = 1
}
