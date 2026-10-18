import { execFile, spawn } from 'node:child_process'
import { cp, lstat, mkdir, readFile, readdir, realpath, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { decisionEntry, isDecidable, reviewRows } from './developer-review.mjs'
import { normalizePatch, readProjectFile, safeProjectPath, sha256, verifyPatchAgainstProject } from './patch.mjs'
import { readJsonInput, resolveNewFileTarget } from './scan.mjs'

const applyScript = fileURLToPath(new URL('./apply.mjs', import.meta.url))
const sessionFormat = 'cap-pattern-review-session'
const choices = { approve: 'approved', reject: 'rejected', 'needs-changes': 'needs-changes', defer: 'deferred' }
const copySkipped = new Set(['node_modules', '.git'])
const maxGitBytes = 8 * 1024 * 1024

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, { maxBuffer: maxGitBytes, windowsHide: true, ...options }, (error, stdout, stderr) => {
    if (error) reject(Object.assign(error, { stderr: String(stderr) }))
    else resolve(stdout)
  })
})
const git = (cwd, args, options) => run('git', ['-C', cwd, ...args], options)
const posix = value => value.split(path.sep).join('/')
const fail = message => { throw new TypeError(message) }

async function writeSessionFile(dir, name, value) {
  const target = path.join(dir, name)
  const temporary = `${target}.${process.pid}.tmp`
  await writeFile(temporary, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  await rename(temporary, target)
}

/** Splits the validated rows into what the developer can approve, what is held with a blocker, and what is information only. */
export function classify(rows) {
  const claimed = new Map()
  const groups = { actionable: [], unresolved: [], covered: [], noProposal: [], notApplicable: [], unreviewed: [] }
  for (const row of rows) {
    if (row.covered) groups.covered.push({ row })
    else if (row.section === 'proposed' && row.ready) {
      const clash = row.verifiedPatch.files.find(file => claimed.has(file.file))
      if (clash) groups.unresolved.push({ row, conflict: `Shares ${clash.file} with the proposal in ${claimed.get(clash.file)}. Two proposals must not change the same file: combine them into one proposal (addressedBy) or revise this one after the other is applied.` })
      else {
        for (const file of row.verifiedPatch.files) claimed.set(file.file, row.id)
        groups.actionable.push({ row })
      }
    } else if (row.section === 'proposed' || row.section === 'needs-review') groups.unresolved.push({ row })
    else if (row.section === 'no-proposal') groups.noProposal.push({ row })
    else if (row.section === 'not-applicable') groups.notApplicable.push({ row })
    else groups.unreviewed.push({ row })
  }
  return groups
}

export async function loadSession(dir) {
  const root = path.resolve(dir)
  const meta = await readJsonInput(path.join(root, 'session.json'))
  if (meta?.format !== sessionFormat) fail('Not a CAP-AI-11 review session folder')
  const report = await readJsonInput(path.join(root, 'brief.json'))
  const validated = await readJsonInput(path.join(root, 'validated.json'))
  const developer = await readJsonInput(path.join(root, 'developer-decisions.json'))
  const { brief, rows } = reviewRows(report, validated)
  if (developer.snapshotSha256 !== brief.snapshot.sha256 || meta.snapshotSha256 !== brief.snapshot.sha256) fail('The session files belong to different scans')
  const applications = []
  const applicationDir = path.join(root, 'applications')
  for (const name of (await readdir(applicationDir).catch(() => [])).sort()) {
    if (name.endsWith('.json')) applications.push(await readJsonInput(path.join(applicationDir, name)))
  }
  const groups = classify(rows)
  const queue = [...groups.actionable, ...groups.unresolved.filter(item => isDecidable(item.row))]
  return { dir: root, meta, report, validated, developer, brief, rows, groups, queue, applications, workspaceProject: meta.workspaceProject }
}

const applicationFor = (session, row) => session.applications.filter(record => record.findingId === row.id && record.patchSha256 === row.verifiedPatch?.patchSha256).at(-1)

/** Files of a proposal whose original-project content no longer matches what the proposal was verified against. */
export async function driftOf(session, row) {
  const drifted = []
  for (const target of row.verifiedPatch?.files ?? []) {
    const current = await readProjectFile(path.join(session.meta.project, safeProjectPath(target.file))).catch(() => undefined)
    if (current?.sha256 !== target.baseSha256) drifted.push(target.file)
  }
  return drifted
}

export async function itemStates(session) {
  const states = []
  for (const { row, conflict } of session.queue) {
    const decision = session.developer.decisions.find(candidate => candidate.id === row.id)
    const record = row.ready ? applicationFor(session, row) : undefined
    let state
    if (record) state = { 'test-passed': 'applied, tests passed', 'test-failed': 'applied, tests FAILED', unverified: 'applied, unverified (no tests run)' }[record.result]
    else if (!row.ready) state = decision ? `${decision.decision} (no proposal yet)` : `held: ${conflict ? 'conflicts with another proposal' : 'no verified proposal'}`
    else if (decision?.decision === 'approved') state = 'approved, not applied'
    else state = decision ? decision.decision : 'awaiting your decision'
    const drift = !record && row.ready ? await driftOf(session, row) : []
    if (drift.length) state = `${state}; STALE: ${drift.join(', ')} changed after review`
    states.push({ id: row.id, file: row.finding.evidence.file, line: row.finding.evidence.line, patternId: row.finding.patternId, addresses: row.addresses, state, ...(record ? { result: record.result } : {}) })
  }
  return states
}

function numberedName(index, id) {
  return `${String(index + 1).padStart(2, '0')}-${id.replace(/[^A-Za-z0-9]+/g, '-').slice(-24)}`
}

async function writeProposalFiles(session) {
  const proposals = path.join(session.dir, 'proposals')
  await mkdir(proposals, { recursive: true, mode: 0o700 })
  const files = {}
  for (const [index, { row }] of session.groups.actionable.entries()) {
    const name = numberedName(index, row.id)
    const verified = await verifyPatchAgainstProject(session.workspaceProject, row.proposal.patch)
    const patchFile = path.join(proposals, `${name}.patch`)
    await writeFile(patchFile, normalizePatch(row.proposal.patch), { mode: 0o600 })
    const dir = path.join(proposals, name)
    for (const file of verified.files) {
      for (const [side, text] of [['before', file.beforeText], ['after', file.afterText]]) {
        const target = path.join(dir, side, ...file.file.split('/'))
        await mkdir(path.dirname(target), { recursive: true, mode: 0o700 })
        await writeFile(target, text, { mode: 0o600 })
      }
    }
    files[row.id] = { patch: patchFile, dir, targets: verified.files.map(file => file.file) }
  }
  return files
}

async function gitContext(projectRoot) {
  let top
  try { top = await realpath((await git(projectRoot, ['rev-parse', '--show-toplevel'])).trim()) } catch { return null }
  let head
  try { head = (await git(top, ['rev-parse', 'HEAD'])).trim() } catch { fail('The git repository has no commits yet; use --mode copy for an isolated copy') }
  return { top, head, branch: (await git(top, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim() }
}

async function dirtyPaths(top) {
  const tokens = (await git(top, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])).split('\0')
  const paths = []
  for (let index = 0; index < tokens.length; index += 1) {
    if (!tokens[index]) continue
    paths.push(tokens[index].slice(3))
    if (/[RC]/.test(tokens[index].slice(0, 2))) index += 1
  }
  return paths
}

/**
 * Creates an isolated review session: an isolated workspace (a git worktree on a new branch, or a plain copy), the
 * verified proposals as patch and before/after files, and an empty set of developer decisions. Never switches,
 * commits to, or modifies the original working branch or its files.
 */
export async function startSession({ report, validated, project, session: sessionArgument, mode = 'auto', reviewer }) {
  if (!['auto', 'worktree', 'copy'].includes(mode)) fail('--mode must be auto, worktree, or copy')
  const { brief, rows } = reviewRows(report, validated)
  const groups = classify(rows)
  if (!groups.actionable.length && !groups.unresolved.length) fail('Nothing to review: no proposals and no held findings in these decisions')
  const root = await realpath(project)
  const dir = await resolveNewFileTarget(sessionArgument, root)
  const bases = new Map(groups.actionable.flatMap(({ row }) => row.verifiedPatch.files.map(file => [file.file, file.baseSha256])))
  const targets = [...bases.keys()]
  for (const { row } of groups.actionable) {
    for (const target of row.verifiedPatch.files) {
      const current = await readProjectFile(path.join(root, safeProjectPath(target.file))).catch(() => undefined)
      if (current?.sha256 !== target.baseSha256) fail(`${target.file} changed since the proposal was verified; rescan and review again before starting a session`)
    }
  }
  const info = mode === 'copy' ? null : await gitContext(root)
  if (mode === 'worktree' && !info) fail('The project is not inside a git repository; use --mode copy')
  const meta = { format: sessionFormat, schemaVersion: 1, useCaseId: brief.useCaseId, snapshotSha256: brief.snapshot.sha256, project: root, createdAt: new Date().toISOString() }
  const workspace = path.join(dir, 'workspace')
  if (info) {
    const relative = posix(path.relative(info.top, root))
    const before = await dirtyPaths(info.top)
    const dirtyTargets = targets.filter(target => before.includes(posix(path.posix.join(relative, target))))
    if (dirtyTargets.length) fail(`Uncommitted changes in files the proposals change: ${dirtyTargets.join(', ')}. Commit or stash them first; nothing was created`)
    for (const target of targets) {
      const committed = await git(info.top, ['show', `HEAD:${posix(path.posix.join(relative, target))}`], { encoding: 'buffer' }).catch(() => undefined)
      if (!committed || sha256(committed) !== bases.get(target)) fail(`${target} in the last commit differs from the reviewed file (untracked, or line-ending conversion); use --mode copy`)
    }
    const branch = `cap-ai-11/review-${brief.snapshot.sha256.slice(0, 8)}-${meta.createdAt.replace(/\D/g, '').slice(0, 14)}`
    await mkdir(dir, { mode: 0o700 })
    await git(info.top, ['worktree', 'add', '-b', branch, workspace, 'HEAD'])
    const after = await dirtyPaths(info.top)
    if ((await git(info.top, ['rev-parse', 'HEAD'])).trim() !== info.head || (await git(info.top, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim() !== info.branch || JSON.stringify(after) !== JSON.stringify(before)) {
      fail('The original working state changed while creating the review worktree; inspect the repository before continuing')
    }
    Object.assign(meta, {
      mode: 'worktree', workspace, workspaceProject: path.join(workspace, ...relative.split('/').filter(Boolean)),
      git: { top: info.top, originalBranch: info.branch, originalHead: info.head, reviewBranch: branch, unrelatedChanges: before.slice(0, 200), unrelatedChangeCount: before.length }
    })
  } else {
    await mkdir(dir, { mode: 0o700 })
    await cp(root, workspace, {
      recursive: true, errorOnExist: true, force: false,
      filter: async source => !copySkipped.has(path.basename(source)) && !(await lstat(source)).isSymbolicLink()
    })
    for (const target of targets) {
      if ((await readProjectFile(path.join(workspace, ...target.split('/')))).sha256 !== bases.get(target)) fail(`${target} did not copy as reviewed`)
    }
    Object.assign(meta, { mode: 'copy', workspace, workspaceProject: workspace })
  }
  await writeSessionFile(dir, 'brief.json', report)
  await writeSessionFile(dir, 'validated.json', validated)
  await writeSessionFile(dir, 'developer-decisions.json', developerFile(brief, reviewer, []))
  await mkdir(path.join(dir, 'applications'), { mode: 0o700 })
  await writeSessionFile(dir, 'revision-requests.json', [])
  await writeSessionFile(dir, 'session.json', meta)
  const session = await loadSession(dir)
  session.meta.proposalFiles = await writeProposalFiles(session)
  await writeSessionFile(dir, 'session.json', session.meta)
  return session
}

function developerFile(brief, reviewer, decisions, queueIds = []) {
  const count = name => decisions.filter(decision => decision.decision === name).length
  return {
    schemaVersion: 1, format: 'cap-pattern-developer-decisions', useCaseId: brief.useCaseId, snapshotSha256: brief.snapshot.sha256, reviewer: reviewer ?? null,
    note: 'Recorded as stated by the developer. Approval only accepts a proposal: nothing is applied or verified until the apply step does it and records the result.',
    summary: { reviewable: queueIds.length, approved: count('approved'), rejected: count('rejected'), needsChanges: count('needs-changes'), deferred: count('deferred'), undecided: queueIds.filter(id => !decisions.some(decision => decision.id === id)).length },
    decisions, undecided: queueIds.filter(id => !decisions.some(decision => decision.id === id))
  }
}

async function saveDecisions(session, decisions, reviewer) {
  const queueIds = session.queue.map(({ row }) => row.id)
  const next = developerFile(session.brief, reviewer ?? session.developer.reviewer, decisions, queueIds)
  await writeSessionFile(session.dir, 'developer-decisions.json', next)
  session.developer = next
}

/** Records one independent decision. Approval is refused for held, conflicting, stale, or already applied proposals. */
export async function decideItem(session, id, choice, notes = '', reviewer) {
  if (!Object.hasOwn(choices, choice)) fail(`Decision must be one of: ${Object.keys(choices).join(', ')}`)
  const item = session.queue.find(candidate => candidate.row.id === id)
  if (!item) {
    const covered = session.rows.find(row => row.id === id)
    fail(covered?.covered ? `${id} is addressed by the proposal in ${covered.addressedBy}; decide there` : `${id} is not in the review queue (the AI judged it ${covered?.aiDecision ?? 'unknown'}): it is kept for traceability only`)
  }
  const { row } = item
  if (row.ready && applicationFor(session, row)) fail(`${id} was already applied; its decision can no longer change`)
  if (choice === 'approve') {
    if (!row.ready) fail(`${id} cannot be approved: ${item.conflict ?? 'the AI has no verified proposal for it'}`)
    const drifted = await driftOf(session, row)
    if (drifted.length) fail(`${id} is stale: ${drifted.join(', ')} changed since the proposal was verified; rescan and review again`)
  }
  if ((choice === 'reject' || choice === 'needs-changes') && !notes.trim()) fail(`${id}: ${choice === 'reject' ? 'a rejection' : 'a change request'} needs a reason`)
  const entry = { ...decisionEntry(row, choices[choice], notes.trim()), decidedAt: new Date().toISOString() }
  await saveDecisions(session, [...session.developer.decisions.filter(decision => decision.id !== id), entry], reviewer)
  if (choice === 'needs-changes') {
    const file = path.join(session.dir, 'revision-requests.json')
    const requests = await readJsonInput(file)
    requests.push({
      id, feedback: notes.trim(), requestedAt: entry.decidedAt, previousPatchSha256: row.verifiedPatch?.patchSha256 ?? null,
      addresses: row.addresses, summary: row.summary ?? null, previousPatch: row.proposal?.patch ?? null,
      instructions: 'Revise the proposal for this finding using the feedback, validate it with the project path, then run: session.mjs revise --session <folder> --decisions <new-validated.json>'
    })
    await writeSessionFile(session.dir, 'revision-requests.json', requests)
  }
  return entry
}

function runApply(session, row, approval) {
  const output = path.join(session.dir, 'applications', `${String(session.applications.length + 1).padStart(2, '0')}-${numberedName(0, row.id).slice(3)}-${approval.patchSha256.slice(0, 8)}.json`)
  return new Promise(resolve => {
    const args = [applyScript, 'apply', '--report', path.join(session.dir, 'brief.json'), '--decisions', path.join(session.dir, 'validated.json'),
      '--developer-decisions', path.join(session.dir, 'developer-decisions.json'), '--project', session.workspaceProject, '--id', row.id,
      '--confirm', approval.patchSha256, '--output', output, ...(session.testCommand ? ['--test-command', session.testCommand] : []),
      ...(session.testTimeout ? ['--test-timeout', String(session.testTimeout)] : [])]
    const child = spawn(process.execPath, args, { windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('close', code => resolve({ code, stdout, stderr: stderr.trim(), output }))
  })
}

/** Lists approved, not yet applied proposals with the exact diff each would write. */
export async function pendingApprovals(session) {
  const pending = []
  for (const { row } of session.groups.actionable) {
    const approval = session.developer.decisions.find(decision => decision.id === row.id && decision.decision === 'approved')
    if (approval && !applicationFor(session, row)) pending.push({ row, approval })
  }
  return pending
}

/** Applies approved proposals into the isolated workspace only, one at a time, with the developer's own test command. */
export async function applyApproved(session, { ids, confirm, testCommand, testTimeout }) {
  if (confirm === undefined) fail('applying needs --confirm <diff hash> or --confirm all')
  const pending = (await pendingApprovals(session)).filter(({ row }) => !ids?.length || ids.includes(row.id))
  for (const id of ids ?? []) if (!pending.some(({ row }) => row.id === id)) fail(`${id} is not approved and waiting to be applied`)
  const results = []
  for (const { row, approval } of pending) {
    if (confirm !== 'all' && confirm !== approval.patchSha256) fail(`--confirm must be the sha256 of the diff shown for ${row.id} (${approval.patchSha256})`)
    const drifted = await driftOf(session, row)
    if (drifted.length) fail(`${row.id} is stale: ${drifted.join(', ')} changed in the original project after review; the approval is no longer valid`)
    session.testCommand = testCommand
    session.testTimeout = testTimeout
    const outcome = await runApply(session, row, approval)
    if (outcome.code !== 0 && outcome.code !== 2) { results.push({ id: row.id, applied: false, error: outcome.stderr }); break }
    const record = JSON.parse(outcome.stdout)
    session.applications.push(record)
    results.push({ id: row.id, applied: true, result: record.result, verification: record.verification, record: outcome.output })
    if (outcome.code === 2) break
  }
  return results
}

/** The combined diff of everything applied (or, with approved, also approved but not yet applied) in this session. */
export async function combinedDiff(session, { includeApproved = false } = {}) {
  const parts = session.applications.map(record => record.appliedPatch)
  if (includeApproved) for (const { row } of await pendingApprovals(session)) parts.push(normalizePatch(row.proposal.patch))
  return parts.join('')
}

/**
 * Replaces proposals with revised ones after a change request. The revised validated decisions must belong to the
 * same scan and keep every finding. A proposal whose diff changed loses its earlier decision: it needs a new approval.
 */
export async function reviseSession(session, newValidated) {
  const { rows: newRows } = reviewRows(session.report, newValidated)
  const oldIds = new Set(session.rows.map(row => row.id))
  if (newRows.length !== oldIds.size || newRows.some(row => !oldIds.has(row.id))) fail('The revised decisions must cover the same findings as this session')
  const changed = []
  const newGroups = classify(newRows)
  for (const { row } of newGroups.actionable) {
    const old = session.rows.find(candidate => candidate.id === row.id)
    const sameDiff = old?.ready && old.verifiedPatch.patchSha256 === row.verifiedPatch.patchSha256
    if (old && applicationFor(session, old) && !sameDiff) fail(`${row.id} was already applied; a revised diff cannot replace it in this session`)
    for (const target of row.verifiedPatch.files) {
      const current = await readProjectFile(path.join(session.meta.project, safeProjectPath(target.file))).catch(() => undefined)
      if (current?.sha256 !== target.baseSha256) fail(`${target.file} changed since the revised proposal was verified; rescan and review again`)
      const touched = session.applications.some(record => record.files.some(file => file.file === target.file) && record.findingId !== row.id)
      if (touched) fail(`${row.id} changes ${target.file}, which another applied proposal already changed; start a new session after rescanning`)
    }
    if (!sameDiff) {
      await verifyPatchAgainstProject(session.workspaceProject, row.proposal.patch).catch(error => fail(`The revised diff for ${row.id} does not apply to the review workspace: ${error.message}`))
      changed.push(row.id)
    }
  }
  const oldReady = session.groups.actionable.map(({ row }) => row.id)
  for (const id of oldReady) if (!newGroups.actionable.some(({ row }) => row.id === id) && applicationFor(session, session.rows.find(row => row.id === id))) fail(`${id} was already applied; it cannot disappear from the revision`)
  const dropped = oldReady.filter(id => !newGroups.actionable.some(({ row }) => row.id === id))
  await writeSessionFile(session.dir, 'validated.json', newValidated)
  const fresh = await loadSession(session.dir)
  const reset = new Set([...changed, ...dropped])
  const kept = fresh.developer.decisions.filter(decision => !reset.has(decision.id))
  await saveDecisions(fresh, kept)
  const next = await loadSession(session.dir)
  next.meta.revision = (next.meta.revision ?? 0) + 1
  next.meta.proposalFiles = await writeProposalFiles(next)
  await writeSessionFile(next.dir, 'session.json', next.meta)
  return { session: next, revised: changed, droppedFromQueue: dropped }
}

const paint = (color, code, text) => (color ? `\u001b[${code}m${text}\u001b[0m` : text)
const bullets = (items, empty) => (items?.length ? items.map(item => `  - ${item}`) : [`  - ${empty}`])
const firstSentence = text => (/^(.{20,240}?[.!?])(\s|$)/s.exec(text.trim())?.[1] ?? text.trim().slice(0, 240))

function diffLines(patch, color) {
  return normalizePatch(patch).trimEnd().split('\n').map(line => {
    if (line.startsWith('+++') || line.startsWith('---')) return paint(color, '1', line)
    if (line.startsWith('+')) return paint(color, '32', line)
    if (line.startsWith('-')) return paint(color, '31', line)
    if (line.startsWith('@@')) return paint(color, '36', line)
    return line
  })
}

/** What the developer sees for one queue item: the problem, the code diff first, then the reasoning and the checks. */
export function renderItem(session, item, index, total, { color = false } = {}) {
  const { row, conflict } = item
  const { file, line } = row.finding.evidence
  const rule = paint(color, '1', `══ Proposal ${index + 1} of ${total} · ${file} ══`)
  const out = [rule, `Findings: ${[row.id, ...row.addresses].join(', ')}  (${row.finding.patternId}, line ${line})`,
    `Problem: ${row.summary ?? firstSentence(row.reason)}`,
    `Severity: ${row.severity ? `${row.severity.level} (the AI's assessment if the finding is real). ${row.severity.basis}` : 'not assessed'}`]
  if (!row.ready) {
    out.push('', paint(color, '33', 'NO VERIFIED PROPOSAL: this item cannot be approved.'),
      ...(conflict ? [`  ${conflict}`] : []),
      ...row.blockers.map(blocker => `  - ${blocker}`),
      ...(row.blocker?.missingEvidence ? [`Missing evidence: ${row.blocker.missingEvidence}`] : []),
      ...(row.blocker?.investigated?.length ? ['Already investigated:', ...bullets(row.blocker.investigated)] : []),
      ...(row.blocker?.unblockingCheck ? [`Check that would unblock it: ${row.blocker.unblockingCheck}`] : []),
      '', `Why it was flagged: ${row.reason}`, 'Uncertainty:', ...bullets(row.uncertainty, 'not stated'),
      '', 'You can reject it, defer it, or request changes (your feedback is saved for the AI to revise).')
    return `${out.join('\n')}\n`
  }
  const files = session.meta.proposalFiles?.[row.id]
  out.push(`Verification status: diff VERIFIED to apply exactly to the current source (patch ${row.verifiedPatch.patchSha256.slice(0, 12)}…). NOT applied. Tests NOT run.`,
    `Files: ${row.verifiedPatch.files.map(target => `${target.file} (lines ${target.hunks.map(hunk => `${hunk.oldStart}-${Math.max(hunk.oldStart, hunk.oldStart + hunk.oldCount - 1)}`).join(', ')})`).join('; ')}`,
    '', paint(color, '1', 'Diff (- removed, + added):'), ...diffLines(row.proposal.patch, color), '',
    `Why this fixes it: ${row.reason}`, 'Compatibility (CAP/CDS/runtime):', ...bullets(row.proposal.compatibility, 'none given'),
    'Regression risks:', ...bullets(row.proposal.regressions, 'none given'),
    'Uncertainty and assumptions:', ...bullets(row.uncertainty, 'none stated'),
    'Verification steps:', ...bullets(row.proposal.verification?.steps, 'none given'),
    'Proposed tests (descriptions only; the tool never runs a command from the AI):', ...bullets(row.proposal.verification?.tests, 'none given'))
  if (files) {
    out.push('', `Patch file: ${files.patch}`)
    if (files.targets[0]) out.push(`IDE diff:   code --diff "${path.join(files.dir, 'before', ...files.targets[0].split('/'))}" "${path.join(files.dir, 'after', ...files.targets[0].split('/'))}"`)
  }
  return `${out.join('\n')}\n`
}

/** The interactive sequential review. Reads one answer per line, so it also works with piped input. */
export async function reviewLoop(session, { input, output, color = false, reviewer, redo = false }) {
  const lines = (async function* read() {
    let buffer = ''
    for await (const chunk of input) {
      buffer += chunk
      let at
      while ((at = buffer.indexOf('\n')) >= 0) { yield buffer.slice(0, at).replace(/\r$/, ''); buffer = buffer.slice(at + 1) }
    }
    if (buffer) yield buffer
  })()
  const ask = async question => {
    output.write(question)
    const { value, done } = await lines.next()
    if (done) throw Object.assign(new Error('The review input ended; decisions made so far are saved'), { code: 'INPUT_ENDED' })
    return value.trim()
  }
  let name = reviewer ?? session.developer.reviewer
  if (!name) name = (await ask('Your name (recorded with your decisions): ')) || null
  const total = session.queue.length
  const summary = { approved: 0, rejected: 0, 'needs-changes': 0, deferred: 0, skipped: 0 }
  try {
    for (const [index, item] of session.queue.entries()) {
      const existing = session.developer.decisions.find(decision => decision.id === item.row.id)
      if (existing && !redo) continue
      if (item.row.ready && applicationFor(session, item.row)) continue
      output.write(`\n${renderItem(session, item, index, total, { color })}\n`)
      const options = item.row.ready ? '[a]pprove  [r]eject  [c]hange request  [d]efer  [n]ext  [q]uit' : '[r]eject  [c]hange request  [d]efer  [n]ext  [q]uit'
      for (;;) {
        const answer = (await ask(`${options} > `)).toLowerCase()
        if (answer === 'q') { output.write('Stopped. Decisions made so far are saved.\n'); return summary }
        if (answer === 'n' || answer === '') { summary.skipped += 1; break }
        const choice = { a: 'approve', r: 'reject', c: 'needs-changes', d: 'defer' }[answer]
        if (!choice || (choice === 'approve' && !item.row.ready)) { output.write('Not available here.\n'); continue }
        const notes = choice === 'reject' || choice === 'needs-changes' ? await ask(choice === 'reject' ? 'Reason: ' : 'What should change: ') : await ask('Optional note: ')
        try {
          await decideItem(session, item.row.id, choice, notes, name)
          summary[choices[choice]] += 1
          output.write(`Recorded: ${choices[choice]}. Nothing was applied.\n`)
          break
        } catch (error) {
          if (!(error instanceof TypeError)) throw error
          output.write(`${error.message}\n`)
          if (choice === 'approve') break
        }
      }
    }
  } catch (error) {
    if (error.code !== 'INPUT_ENDED') throw error
    output.write(`${error.message}\n`)
  }
  return summary
}
