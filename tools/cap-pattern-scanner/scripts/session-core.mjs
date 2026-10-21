import { execFile, spawn } from 'node:child_process'
import { cp, lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { acceptedRegressions, decisionEntry, isDecidable, reviewRows } from './developer-review.mjs'
import { hunkRange, hunksOverlap, normalizePatch, parsePatch, readProjectFile, safeProjectPath, sha256, verifyPatchAgainstProject } from './patch.mjs'
import { readJsonInput, resolveNewFileTarget } from './scan.mjs'
import { appendEvent, checkConsistency, currentSchemaVersion, decisionsFrom, readLog, wasPresented, wasPreviewed, withCommandLock } from './session-state.mjs'

const applyScript = fileURLToPath(new URL('./apply.mjs', import.meta.url))
const sessionFormat = 'cap-pattern-review-session'
const maxTestOutput = 8000

function runTests(command, cwd, seconds) {
  return new Promise(resolve => {
    const started = Date.now()
    let tail = ''
    let timedOut = false
    const done = (exitCode, signal, extra = '') => resolve({
      command, exitCode, signal, timedOut, durationMs: Date.now() - started, ranAt: new Date(started).toISOString(),
      outputTail: `${tail}${extra}`.slice(-maxTestOutput)
    })
    const child = spawn(command, { cwd, shell: true, windowsHide: true })
    const collect = chunk => { tail = (tail + chunk.toString()).slice(-maxTestOutput) }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    const timer = setTimeout(() => { timedOut = true; child.kill() }, seconds * 1000)
    child.on('error', error => { clearTimeout(timer); done(null, null, `\n${error.message}`) })
    child.on('close', (exitCode, signal) => { clearTimeout(timer); done(exitCode, signal) })
  })
}
const choices = { approve: 'approved', reject: 'rejected', 'needs-changes': 'needs-changes', defer: 'deferred' }
const copySkipped = new Set(['node_modules', '.git'])
const maxGitBytes = 8 * 1024 * 1024

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, { maxBuffer: maxGitBytes, windowsHide: true, ...options }, (error, stdout, stderr) => {
    if (error) reject(Object.assign(error, { stderr: String(stderr) }))
    else resolve(stdout)
  })
})
export const git = (cwd, args, options) => run('git', ['-C', cwd, ...args], options)
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
      // Proposals may share a file when they change different lines; they conflict only where a hunk reads or changes a line the other does.
      let conflict
      for (const file of row.verifiedPatch.files) {
        for (const other of claimed.get(file.file) ?? []) {
          const mine = file.hunks.find(hunk => other.hunks.some(theirs => hunksOverlap(hunk, theirs)))
          if (mine) { conflict = `Overlaps the proposal ${other.id} in ${file.file} (lines ${hunkRange(mine)[0] + 1}-${Math.max(hunkRange(mine)[1], hunkRange(mine)[0] + 1)}). They change the same lines, so they cannot both be applied: combine them into one proposal (addressedBy), or revise one of them. Nothing is merged silently.`; break }
        }
        if (conflict) break
      }
      if (conflict) groups.unresolved.push({ row, conflict })
      else {
        for (const file of row.verifiedPatch.files) claimed.set(file.file, [...(claimed.get(file.file) ?? []), { id: row.id, hunks: file.hunks }])
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
  const applicationPaths = []
  const applicationDir = path.join(root, 'applications')
  for (const name of (await readdir(applicationDir).catch(() => [])).sort()) {
    if (name.endsWith('.json')) {
      applications.push(await readJsonInput(path.join(applicationDir, name)))
      applicationPaths.push(path.join(applicationDir, name))
    }
  }
  const groups = classify(rows)
  const queue = [...groups.actionable, ...groups.unresolved.filter(item => isDecidable(item.row))]
  return { dir: root, meta, report, validated, developer, brief, rows, groups, queue, applications, applicationPaths, workspaceProject: meta.workspaceProject }
}

export const applicationFor = (session, row) => session.applications.filter(record => record.findingId === row.id && record.patchSha256 === row.verifiedPatch?.patchSha256).at(-1)

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
    if (conflict) state = `held: ${conflict.split('.')[0]}`
    else if (record) state = { 'test-passed': 'applied, tests passed', 'test-failed': 'applied, tests FAILED', unverified: 'applied, unverified (no tests run)' }[record.result]
    else if (!row.ready) state = decision ? `${decision.decision} (no proposal yet)` : `held: ${conflict ? 'conflicts with another proposal' : 'no verified proposal'}`
    else if (decision?.decision === 'approved' && decision.patchSha256 !== row.verifiedPatch.patchSha256) state = 'approval void: the proposal changed, decide again'
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

export async function dirtyPaths(top) {
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
export async function startSession({ report, validated, project, session: sessionArgument, mode = 'auto', reviewer, branch: requestedBranch }) {
  if (!['auto', 'worktree', 'copy'].includes(mode)) fail('--mode must be auto, worktree, or copy')
  if (requestedBranch !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(requestedBranch)) fail('--branch must be a plain branch name such as feature/my-review (letters, digits, . _ / -)')
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
  const meta = { format: sessionFormat, schemaVersion: currentSchemaVersion, useCaseId: brief.useCaseId, snapshotSha256: brief.snapshot.sha256, project: root, createdAt: new Date().toISOString() }
  const workspace = path.join(dir, 'workspace')
  const created = { dir: false, worktree: false, branch: null }
  // Removes only what this call created, so a refused or failed start leaves no folder, worktree, or branch behind.
  const cleanup = async () => {
    if (created.worktree) await git(info.top, ['worktree', 'remove', '--force', workspace]).catch(() => {})
    if (created.branch) await git(info.top, ['branch', '-D', created.branch]).catch(() => {})
    if (created.dir) await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
  const makeCopy = async () => {
    await mkdir(dir, { mode: 0o700 })
    created.dir = true
    await cp(root, workspace, {
      recursive: true, errorOnExist: true, force: false,
      filter: async source => !copySkipped.has(path.basename(source)) && !(await lstat(source)).isSymbolicLink()
    })
    for (const target of targets) {
      if ((await readProjectFile(path.join(workspace, ...target.split('/')))).sha256 !== bases.get(target)) fail(`${target} did not copy as reviewed`)
    }
    Object.assign(meta, { mode: 'copy', workspace, workspaceProject: workspace })
  }
  const makeWorktree = async () => {
    const relative = posix(path.relative(info.top, root))
    const before = await dirtyPaths(info.top)
    const dirtyTargets = targets.filter(target => before.includes(posix(path.posix.join(relative, target))))
    if (dirtyTargets.length) fail(`Uncommitted changes in files the proposals change: ${dirtyTargets.join(', ')}. Commit or stash them first; nothing was created`)
    const branch = requestedBranch ?? `cap-ai-11/review-${brief.snapshot.sha256.slice(0, 8)}-${meta.createdAt.replace(/\D/g, '').slice(0, 14)}`
    await git(info.top, ['check-ref-format', '--branch', branch]).catch(() => fail(`${branch} is not a valid git branch name`))
    if ((await git(info.top, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).catch(() => '')).trim()) fail(`The branch ${branch} already exists; choose another --branch name. Nothing was created`)
    await mkdir(dir, { mode: 0o700 })
    created.dir = true
    await git(info.top, ['worktree', 'add', '-b', branch, workspace, 'HEAD'])
    created.worktree = true
    created.branch = branch
    const workspaceProject = path.join(workspace, ...relative.split('/').filter(Boolean))
    // The worktree is checked out from the last commit (with the repository's own line-ending rules): it must equal what was reviewed.
    for (const target of targets) {
      const checkedOut = await readProjectFile(path.join(workspaceProject, ...target.split('/'))).catch(() => undefined)
      if (checkedOut?.sha256 !== bases.get(target)) {
        throw Object.assign(new TypeError(`${target} in the last commit does not match the reviewed file (untracked, or a line-ending or filter difference)`), { code: 'WORKTREE_MISMATCH' })
      }
    }
    const after = await dirtyPaths(info.top)
    if ((await git(info.top, ['rev-parse', 'HEAD'])).trim() !== info.head || (await git(info.top, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim() !== info.branch || JSON.stringify(after) !== JSON.stringify(before)) {
      fail('The original working state changed while creating the review worktree; inspect the repository before continuing')
    }
    Object.assign(meta, {
      mode: 'worktree', workspace, workspaceProject,
      git: { top: info.top, originalBranch: info.branch, originalHead: info.head, reviewBranch: branch, reviewBaseCommit: info.head, unrelatedChanges: before.slice(0, 200), unrelatedChangeCount: before.length }
    })
  }
  try {
    if (info) {
      try { await makeWorktree() } catch (error) {
        if (error.code !== 'WORKTREE_MISMATCH' || mode !== 'auto') throw error
        await cleanup()
        Object.assign(created, { dir: false, worktree: false, branch: null })
        await makeCopy()
        meta.fallback = `No review branch: ${error.message}. An isolated copy is used instead.`
      }
    } else await makeCopy()
    await writeSessionFile(dir, 'brief.json', report)
    await writeSessionFile(dir, 'validated.json', validated)
    await writeSessionFile(dir, 'developer-decisions.json', developerFile(brief, reviewer, [], [...groups.actionable, ...groups.unresolved.filter(item => isDecidable(item.row))].map(({ row }) => row.id)))
    await mkdir(path.join(dir, 'applications'), { mode: 0o700 })
    await writeSessionFile(dir, 'revision-requests.json', [])
    await writeSessionFile(dir, 'session.json', meta)
    const session = await loadSession(dir)
    session.meta.proposalFiles = await writeProposalFiles(session)
    await writeSessionFile(dir, 'session.json', session.meta)
    await appendEvent(dir, 'session-started', { snapshotSha256: brief.snapshot.sha256, validatedSha256: sha256(await readFile(path.join(dir, 'validated.json'), 'utf8')), proposals: session.groups.actionable.map(({ row }) => ({ id: row.id, patchSha256: row.verifiedPatch.patchSha256 })), workspace: session.meta.workspace, workspaceProject: session.meta.workspaceProject, project: session.meta.project, mode: session.meta.mode, git: session.meta.git ?? null })
    return session
  } catch (error) {
    await cleanup()
    throw error
  }
}

/**
 * Every command that changes state or vouches for it starts here: the event log must be an intact chain and the files that
 * mirror state (decisions, application records, validated proposals) must agree with it.
 */
export async function assertTrusted(session) {
  if ((session.meta.schemaVersion ?? 1) < currentSchemaVersion) fail('This session was created by an older version of the tool and has no event log, so it cannot be trusted for decisions, apply, or commit; start a new session')
  const { events, error } = await readLog(session.dir)
  if (error) fail(`The session event log is not intact: ${error}. The session cannot vouch for its own state; nothing was changed`)
  const started = events.find(event => event.type === 'session-started')
  if (started?.data.workspace !== undefined) {
    const { workspace, workspaceProject, project, mode } = started.data
    if (workspace !== session.meta.workspace || workspaceProject !== session.meta.workspaceProject || project !== session.meta.project || mode !== session.meta.mode) {
      fail('The session workspace or project paths in session.json do not match the event log; session.json was modified outside the tool. Nothing was changed')
    }
    // P2.6: verify the git block in session.json matches what was recorded at session start
    if (started.data.git !== undefined) {
      const logGit = started.data.git
      const metaGit = session.meta.git ?? null
      if (logGit !== null && (!metaGit || logGit.top !== metaGit.top || logGit.reviewBranch !== metaGit.reviewBranch || logGit.reviewBaseCommit !== metaGit.reviewBaseCommit || logGit.originalBranch !== metaGit.originalBranch)) {
        fail('The session git configuration in session.json does not match the event log; session.json was modified outside the tool. Nothing was changed')
      }
      if (logGit === null && metaGit !== null) {
        fail('The session git configuration in session.json does not match the event log; session.json was modified outside the tool. Nothing was changed')
      }
    }
  }
  // P2.6: verify session.json committed data against the event log
  const committedEvent = [...events].reverse().find(e => e.type === 'committed')
  if (committedEvent) {
    if (!session.meta.committed || session.meta.committed.sha !== committedEvent.data.sha || session.meta.committed.recordCount !== committedEvent.data.recordCount) {
      fail('The committed data in session.json does not match the event log; session.json was modified outside the tool. Nothing was changed')
    }
  } else if (session.meta.committed) {
    fail('session.json claims the session is committed but the event log has no committed event; session.json was modified outside the tool. Nothing was changed')
  }
  // P1.1: refuse to proceed if there is an unresolved intent (interrupted apply or commit)
  const orphanedIntent = events.find(e => {
    if (e.type === 'apply-intent') {
      return !events.some(o => o.seq > e.seq && (
        (o.type === 'applied' && o.data.id === e.data.id && o.data.patchSha256 === e.data.patchSha256) ||
        (o.type === 'recovery-recorded' && o.data.intentSeq === e.seq)
      ))
    }
    if (e.type === 'commit-intent') {
      return !events.some(o => o.seq > e.seq && (
        o.type === 'committed' ||
        o.type === 'commit-aborted' ||
        (o.type === 'recovery-recorded' && o.data.intentSeq === e.seq)
      ))
    }
    return false
  })
  if (orphanedIntent) fail(`The session has an interrupted ${orphanedIntent.type === 'apply-intent' ? 'apply' : 'commit'} operation (event ${orphanedIntent.seq}). Run: session.mjs recover --session "${session.dir}" to resolve it before continuing`)
  const developer = await readJsonInput(path.join(session.dir, 'developer-decisions.json'))
  const applicationDir = path.join(session.dir, 'applications')
  const applicationFiles = []
  for (const name of (await readdir(applicationDir).catch(() => [])).sort()) if (name.endsWith('.json')) applicationFiles.push({ name, text: await readFile(path.join(applicationDir, name), 'utf8') })
  const problem = checkConsistency({ events, file: developer, validatedText: await readFile(path.join(session.dir, 'validated.json'), 'utf8'), applicationFiles })
  if (problem) fail(`The session state is not trustworthy: ${problem}. Nothing was changed`)
  return events
}

/**
 * Records that the exact diffs were emitted to the developer by the review interface (show, review). It is an audit
 * trail required before an approval can be recorded; it proves the diff was output, not that anyone read it.
 */
export async function recordPresented(session, items, via) {
  if ((session.meta.schemaVersion ?? 1) < currentSchemaVersion) return
  for (const { row } of items) if (row.ready) await appendEvent(session.dir, 'presented', { id: row.id, patchSha256: row.verifiedPatch.patchSha256, via })
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
export async function decideItem(session, id, choice, notes = '', reviewer, { diff, via = 'cli' } = {}) {
  if (!Object.hasOwn(choices, choice)) fail(`Decision must be one of: ${Object.keys(choices).join(', ')}`)
  return withCommandLock(session.dir, async () => {
  const events = await assertTrusted(session)
  const item = session.queue.find(candidate => candidate.row.id === id)
  if (!item) {
    const covered = session.rows.find(row => row.id === id)
    fail(covered?.covered ? `${id} is addressed by the proposal in ${covered.addressedBy}; decide there` : `${id} is not in the review queue (the AI judged it ${covered?.aiDecision ?? 'unknown'}): it is kept for traceability only`)
  }
  const { row } = item
  if (row.ready && applicationFor(session, row)) fail(`${id} was already applied; its decision can no longer change`)
  if (choice === 'approve') {
    if (!row.ready || item.conflict) fail(`${id} cannot be approved: ${item.conflict ?? 'the AI has no verified proposal for it'}`)
    const drifted = await driftOf(session, row)
    if (drifted.length) fail(`${id} is stale: ${drifted.join(', ')} changed since the proposal was verified; rescan and review again`)
    // An approval is for one exact diff that the review interface has shown: the hash printed with the diff must come back.
    if (!wasPresented(events, id, row.verifiedPatch.patchSha256)) fail(`${id} cannot be approved before its diff was shown by the review interface (session.mjs show --id ${id}); nothing was recorded`)
    if (diff !== row.verifiedPatch.patchSha256) fail(`Approving ${id} needs --diff ${row.verifiedPatch.patchSha256}, the hash printed with the diff that was shown; nothing was recorded`)
  }
  if ((choice === 'reject' || choice === 'needs-changes') && !notes.trim()) fail(`${id}: ${choice === 'reject' ? 'a rejection' : 'a change request'} needs a reason`)
  const entry = { ...decisionEntry(row, choices[choice], notes.trim()), decidedAt: new Date().toISOString() }
  await appendEvent(session.dir, 'decided', { id, decision: entry.decision, patchSha256: entry.patchSha256 ?? row.verifiedPatch?.patchSha256 ?? null, via })
  // Re-read decisions from disk inside the lock so a concurrent decide that ran first is not lost
  const currentDecisions = (await readJsonInput(path.join(session.dir, 'developer-decisions.json'))).decisions
  await saveDecisions(session, [...currentDecisions.filter(decision => decision.id !== id), entry], reviewer)
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
  }) // withCommandLock
}

function runApply(session, row, approval, output) {
  return new Promise(resolve => {
    // Tests are run in session-core after the subprocess exits (P1.1): no --test-command passed here
    const args = [applyScript, 'apply', '--session', session.dir, '--report', path.join(session.dir, 'brief.json'), '--decisions', path.join(session.dir, 'validated.json'),
      '--developer-decisions', path.join(session.dir, 'developer-decisions.json'), '--project', session.workspaceProject, '--id', row.id,
      '--confirm', approval.patchSha256, '--output', output, ...session.applicationPaths.flatMap(file => ['--earlier', file])]
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
    if (approval && approval.patchSha256 === row.verifiedPatch.patchSha256 && !applicationFor(session, row)) pending.push({ row, approval })
  }
  return pending
}

/**
 * A review workspace is trusted only while it is still the worktree the session created: on the review branch, at the
 * commit the session recorded (its start, or its own last commit), with nothing pre-staged.
 */
async function assertReviewWorkspace(session) {
  if (session.meta.mode !== 'worktree') return
  const cwd = session.meta.workspace
  const branch = (await git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => '')).trim()
  if (branch !== session.meta.git.reviewBranch) fail(`The review workspace is on "${branch || 'an unknown ref'}", not on the review branch ${session.meta.git.reviewBranch}; switch it back or start a new session. Nothing was changed`)
  const head = (await git(cwd, ['rev-parse', 'HEAD']).catch(() => '')).trim()
  const expected = session.meta.committed?.sha ?? session.meta.git.reviewBaseCommit
  if (head !== expected) fail(`The review branch moved since the session recorded it (expected ${expected.slice(0, 12)}, found ${head.slice(0, 12) || 'none'}); the session cannot vouch for it. Nothing was changed`)
}

/** The token that authorises applying exactly this set of approved diffs: a separate step from approving them. */
const applyToken = (pending, testCommand, testTimeout) => {
  const base = pending.map(({ row, approval }) => `${row.id}:${approval.patchSha256}`).sort().join('\n')
  const cmd = testCommand !== undefined && testCommand !== null ? `\ntestCommand=${testCommand}` : ''
  const timeout = testTimeout !== undefined && testTimeout !== null ? `\ntestTimeout=${testTimeout}` : ''
  return sha256(`apply\n${base}${cmd}${timeout}`)
}

/** Shows the exact diffs that applying would write and records that the preview was emitted. Changes nothing. */
export async function previewApply(session, { ids, testCommand, testTimeout } = {}) {
  await assertTrusted(session)
  const pending = (await pendingApprovals(session)).filter(({ row }) => !ids?.length || ids.includes(row.id))
  for (const id of ids ?? []) if (!pending.some(({ row }) => row.id === id)) fail(`${id} is not approved and waiting to be applied`)
  if (!pending.length) return { pending, confirm: null, diffs: [], combined: '', testCommand: testCommand ?? null, testTimeout: testTimeout ?? null }
  const confirm = applyToken(pending, testCommand, testTimeout)
  await appendEvent(session.dir, 'apply-previewed', { token: confirm, ids: pending.map(({ row, approval }) => ({ id: row.id, patchSha256: approval.patchSha256 })), testCommand: testCommand ?? null, testTimeout: testTimeout ?? null })
  const diffs = pending.map(({ row, approval }) => ({ id: row.id, file: row.finding.evidence.file, patchSha256: approval.patchSha256, diff: normalizePatch(row.proposal.patch) }))
  return { pending, confirm, diffs, combined: diffs.map(item => item.diff).join(''), testCommand: testCommand ?? null, testTimeout: testTimeout ?? null }
}

/**
 * Applies approved proposals into the isolated workspace only, one at a time, with the developer's own test command.
 * Approval is not permission to apply: --confirm must be the token of the apply preview that listed exactly these approved
 * diffs AND the exact test command and timeout. Changing any bound value requires a new preview.
 */
export async function applyApproved(session, { ids, confirm, testCommand, testTimeout }) {
  if (confirm === undefined) fail('applying needs --confirm <hash printed by the apply preview>')
  const events = await assertTrusted(session)
  const pending = (await pendingApprovals(session)).filter(({ row }) => !ids?.length || ids.includes(row.id))
  for (const id of ids ?? []) if (!pending.some(({ row }) => row.id === id)) fail(`${id} is not approved and waiting to be applied`)
  await assertReviewWorkspace(session)
  if (!pending.length) return []
  const token = applyToken(pending, testCommand, testTimeout)
  if (confirm !== token) fail(`--confirm must be the sha256 shown by the apply preview of these approved diffs (${token}); the approvals changed, the preview was for something else, or the test command or timeout differs from what was previewed`)
  if (!wasPreviewed(events, 'apply', token)) fail('The apply preview was never shown for these diffs: run apply without --confirm first, show the diffs, then confirm')
  return applyPending(session, pending, { testCommand, testTimeout })
}

async function applyPending(session, pending, { testCommand, testTimeout }) {
  await assertReviewWorkspace(session)
  // Everything is re-verified, in order and in memory, before the first file is written, so one stale or conflicting proposal
  // cannot leave a partial result. Independent proposals on the same file are checked on top of each other.
  const earlier = new Map()
  const texts = new Map()
  const lastAfter = new Map()
  const verifiedPerRow = new Map()
  for (const record of session.applications) {
    for (const entry of parsePatch(record.appliedPatch)) earlier.set(entry.file, [...(earlier.get(entry.file) ?? []), ...entry.hunks])
    for (const file of record.files) lastAfter.set(file.file, file.afterSha256)
  }
  for (const { row } of pending) {
    const drifted = await driftOf(session, row)
    if (drifted.length) fail(`${row.id} is stale: ${drifted.join(', ')} changed in the original project after review; the approval is no longer valid. Nothing was applied`)
    const verified = await verifyPatchAgainstProject(session.workspaceProject, row.proposal.patch, { earlier, texts }).catch(error => fail(`${row.id} no longer applies to the review workspace: ${error.message}. Nothing was applied`))
    verifiedPerRow.set(row.id, verified)
    for (const file of verified.files) {
      const reviewed = row.verifiedPatch.files.find(target => target.file === file.file)?.baseSha256
      const expected = texts.has(file.file) ? undefined : lastAfter.get(file.file) ?? reviewed
      if (expected !== undefined && file.baseSha256 !== expected) fail(`${file.file} in the review workspace differs from the reviewed file; nothing was applied`)
      texts.set(file.file, file.afterText)
    }
    for (const entry of parsePatch(row.proposal.patch)) earlier.set(entry.file, [...(earlier.get(entry.file) ?? []), ...entry.hunks])
  }
  const results = []
  for (const { row, approval } of pending) {
    const drifted = await driftOf(session, row)
    if (drifted.length) fail(`${row.id} is stale: ${drifted.join(', ')} changed in the original project after review; the approval is no longer valid`)
    // Write-ahead intent: enriched with per-file hashes so interrupted applies are detectable via workspace inspection
    const output = path.join(session.dir, 'applications', `${String(session.applications.length + 1).padStart(2, '0')}-${numberedName(0, row.id).slice(3)}-${approval.patchSha256.slice(0, 8)}.json`)
    const intentFiles = (verifiedPerRow.get(row.id)?.files ?? []).map(({ file, baseSha256, afterSha256 }) => ({ file, baseSha256, afterSha256 }))
    await appendEvent(session.dir, 'apply-intent', { id: row.id, patchSha256: approval.patchSha256, output: path.basename(output), files: intentFiles })
    const outcome = await runApply(session, row, approval, output)
    if (outcome.code !== 0) { results.push({ id: row.id, applied: false, error: outcome.stderr }); break }
    const recordText = await readFile(outcome.output, 'utf8')
    const record = JSON.parse(recordText)
    session.applications.push(record)
    session.applicationPaths.push(outcome.output)
    await appendEvent(session.dir, 'applied', { id: row.id, patchSha256: approval.patchSha256, record: path.basename(outcome.output), recordSha256: sha256(recordText), result: record.result })
    // P1.1: run tests in session-core (not in the apply subprocess), then update the record with results
    let finalResult = record.result
    let finalVerification = record.verification
    if (testCommand) {
      const seconds = testTimeout ?? 600
      const verification = await runTests(testCommand, session.workspaceProject, seconds)
      const testResult = verification.exitCode === 0 && !verification.timedOut ? 'test-passed' : 'test-failed'
      const updatedRecord = { ...record, result: testResult, verification }
      const updatedText = `${JSON.stringify(updatedRecord, null, 2)}\n`
      await writeFile(outcome.output, updatedText, { mode: 0o600 })
      session.applications[session.applications.length - 1] = updatedRecord
      await appendEvent(session.dir, 'tested', { id: row.id, record: path.basename(outcome.output), recordSha256: sha256(updatedText), result: testResult })
      finalResult = testResult
      finalVerification = verification
      if (testResult === 'test-failed') {
        results.push({ id: row.id, applied: true, result: finalResult, verification: finalVerification, record: outcome.output })
        break
      }
    }
    results.push({ id: row.id, applied: true, result: finalResult, verification: finalVerification, record: outcome.output })
  }
  // One file with everything applied so far, so the developer can open it without any git command.
  if (results.some(result => result.applied)) await writeSessionFile(session.dir, 'applied.diff', await combinedDiff(session))
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
  await assertTrusted(session)
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
  await appendEvent(session.dir, 'revised', { voided: [...reset], validatedSha256: sha256(await readFile(path.join(session.dir, 'validated.json'), 'utf8')), proposals: newGroups.actionable.map(({ row }) => ({ id: row.id, patchSha256: row.verifiedPatch.patchSha256 })) })
  const kept = fresh.developer.decisions.filter(decision => !reset.has(decision.id))
  await saveDecisions(fresh, kept)
  const next = await loadSession(session.dir)
  next.meta.revision = (next.meta.revision ?? 0) + 1
  next.meta.proposalFiles = await writeProposalFiles(next)
  await writeSessionFile(next.dir, 'session.json', next.meta)
  return { session: next, revised: changed, droppedFromQueue: dropped }
}

/**
 * Commits the applied changes on the review branch only (git worktree sessions). It never touches the original branch,
 * pushes, or includes any file other than those recorded as applied. The caller must confirm the hash of the combined diff.
 */
export async function commitSession(session, { message, confirm, acceptFailingTests = false } = {}) {
  if (session.meta.mode !== 'worktree') fail('There is no review branch in a copy session; use the diff and move the change yourself')
  const events = await assertTrusted(session)
  if (!session.applications.length) fail('Nothing has been applied in this session yet')
  // Tests can fail because of the environment (services, credentials, dependencies) and not the change: that is the developer's call.
  const testsFailed = session.applications.some(record => record.result === 'test-failed')
  if (testsFailed && !acceptFailingTests) fail('An applied proposal has failing tests, or the tests could not run in this environment. Committing anyway is your decision: read the test output, and if you judge the failure environmental or acceptable run commit again with --accept-failing-tests. Nothing was committed')
  const pending = session.applications.slice(session.meta.committed?.recordCount ?? 0)
  if (!pending.length) fail(`The applied changes were already committed (${session.meta.committed.sha.slice(0, 12)})`)
  await assertReviewWorkspace(session)
  const workspace = session.meta.workspace
  const relative = posix(path.relative(workspace, session.workspaceProject))
  // What the tool recorded for each file: the content it wrote last. The working file must be exactly that, byte for byte,
  // so a manual edit made after applying (even to a file the session changed) can never ride along in the commit.
  const recorded = new Map()
  for (const record of pending) {
    for (const file of record.files) {
      const key = posix(path.posix.join(relative, file.file))
      if (recorded.has(key) && recorded.get(key) !== file.baseSha256) fail(`The application records for ${key} do not chain (a record starts from content the previous one did not produce)`)
      recorded.set(key, file.afterSha256)
    }
  }
  const files = [...recorded.keys()]
  for (const file of files) {
    const current = await readProjectFile(path.join(workspace, ...file.split('/'))).catch(() => undefined)
    if (current?.sha256 !== recorded.get(file)) fail(`${file} differs from what the session applied (edited after applying, or restored); the tool commits only the content it applied. Nothing was committed`)
  }
  const dirty = await dirtyPaths(workspace)
  const extra = dirty.filter(file => !files.includes(file))
  if (extra.length) fail(`The review workspace has changes that were not applied by the session: ${extra.join(', ')}; remove them first. Nothing was committed`)
  const staged = (await git(workspace, ['diff', '--cached', '--name-only', '-z'])).split('\0').filter(Boolean)
  if (staged.length) fail(`The review workspace already has staged changes (${staged.join(', ')}); unstage them first. Nothing was committed`)
  const diff = pending.map(record => record.appliedPatch).join('')
  const token = sha256(testsFailed ? `${diff}\naccept-failing-tests` : diff)
  const ids = [...new Set(pending.map(record => record.findingId))]
  const unverified = pending.filter(record => record.result === 'unverified').length
  const text = message?.trim() || `CAP-AI-11: apply ${ids.length} reviewed proposal(s)\n\nFindings: ${ids.join(', ')}\nReviewed by: ${session.developer.reviewer ?? 'unnamed reviewer'}\nTests: ${testsFailed ? 'FAILED or could not run; committed at the developer\'s decision' : unverified ? `${unverified} proposal(s) applied without tests` : 'developer-supplied tests passed'}`
  const preview = { branch: session.meta.git.reviewBranch, files, message: text, confirm: token, diff }
  if (confirm === undefined) {
    await appendEvent(session.dir, 'commit-previewed', { token })
    return { committed: false, ...preview }
  }
  if (confirm !== token) fail(`--confirm must be the sha256 of the combined diff shown by the preview (${token})`)
  if (!wasPreviewed(events, 'commit', token)) fail('The commit preview was never shown: run commit without --confirm first, show the diff, then confirm')
  // Write-ahead intent: records the intent before the irreversible git commit so interruption is detectable on the next invocation
  await appendEvent(session.dir, 'commit-intent', { token, files })
  await git(workspace, ['add', '--', ...files])
  const added = (await git(workspace, ['diff', '--cached', '--name-only', '-z'])).split('\0').filter(Boolean).sort()
  if (JSON.stringify(added) !== JSON.stringify([...files].sort())) {
    const resetErr = await git(workspace, ['reset', '-q', '--', ...files]).catch(e => e)
    if (resetErr instanceof Error) fail(`The staged files do not match the applied files. "git reset" also failed (${resetErr.message}); unstage manually: git -C "${workspace}" reset`)
    fail('The staged files do not match the applied files; nothing was committed')
  }
  await git(workspace, ['commit', '-m', text])
  const sha = (await git(workspace, ['rev-parse', 'HEAD'])).trim()
  // P2.4: verify on-disk content still matches what the session applied (detects reformatting hooks)
  for (const file of files) {
    const current = await readProjectFile(path.join(workspace, ...file.split('/'))).catch(() => undefined)
    if (current?.sha256 !== recorded.get(file)) {
      await appendEvent(session.dir, 'commit-aborted', { sha, reason: 'hook-reformatted', file })
      const resetErr = await git(workspace, ['reset', '--soft', 'HEAD~1']).catch(e => e)
      const resetNote = resetErr instanceof Error
        ? ` "git reset --soft HEAD~1" also failed (${resetErr.message}); undo the commit yourself: git -C "${workspace}" reset --soft HEAD~1`
        : ' The commit was undone; nothing was committed'
      fail(`${file} was modified by a pre-commit hook; the tool only commits what it applied.${resetNote}`)
    }
  }
  // P2.4: verify committed file names (detects hooks that added unexpected files)
  const committedFiles = (await git(workspace, ['show', '--name-only', '--format=', sha])).split('\n').filter(Boolean).sort()
  if (JSON.stringify(committedFiles) !== JSON.stringify([...files].sort())) {
    await appendEvent(session.dir, 'commit-aborted', { sha, reason: 'extra-files', expected: [...files].sort(), got: committedFiles })
    const resetErr = await git(workspace, ['reset', '--soft', 'HEAD~1']).catch(e => e)
    const resetNote = resetErr instanceof Error
      ? ` "git reset --soft HEAD~1" also failed (${resetErr.message}); undo the commit yourself: git -C "${workspace}" reset --soft HEAD~1`
      : ' The commit was undone; nothing was committed'
    fail(`The commit included unexpected files (a pre-commit hook may have added them); expected [${[...files].sort().join(', ')}] but got [${committedFiles.join(', ')}].${resetNote}`)
  }
  const fresh = await loadSession(session.dir)
  fresh.meta.committed = { sha, at: new Date().toISOString(), recordCount: fresh.applications.length }
  await writeSessionFile(fresh.dir, 'session.json', fresh.meta)
  await appendEvent(fresh.dir, 'committed', { sha, files, recordCount: fresh.applications.length })
  return { committed: true, sha, ...preview }
}

// Dependency install for the review workspace only. A fixed list of reproducible commands, never a free-form command:
// the developer sees exactly what will run and where, and confirms with a hash.
const installCommands = { 'npm ci': 'package-lock.json', 'npm ci --ignore-scripts': 'package-lock.json', 'pnpm install --frozen-lockfile': 'pnpm-lock.yaml', 'yarn install --frozen-lockfile': 'yarn.lock' }
const installOutputLimit = 4000

function runInstall(command, cwd, seconds) {
  return new Promise(resolve => {
    let tail = ''
    let timedOut = false
    const done = (exitCode, extra = '') => resolve({ exitCode, timedOut, outputTail: `${tail}${extra}`.slice(-installOutputLimit) })
    const child = spawn(command, { cwd, shell: true, windowsHide: true })
    const collect = chunk => { tail = (tail + chunk.toString()).slice(-installOutputLimit) }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    const timer = setTimeout(() => { timedOut = true; child.kill() }, seconds * 1000)
    child.on('error', error => { clearTimeout(timer); done(null, `\n${error.message}`) })
    child.on('close', exitCode => { clearTimeout(timer); done(exitCode) })
  })
}

export async function installDependencies(session, { command, confirm, timeoutSeconds = 900, runner = runInstall } = {}) {
  const lockfile = installCommands[command]
  if (!lockfile) fail(`--command must be exactly one of: ${Object.keys(installCommands).map(name => `"${name}"`).join(', ')}`)
  await assertTrusted(session)
  const project = session.workspaceProject
  if (!(await lstat(path.join(project, 'package.json')).catch(() => null))) fail('The review workspace has no package.json')
  if (await lstat(path.join(project, 'node_modules')).catch(() => null)) fail('node_modules already exists in the review workspace; there is nothing to install')
  if (!(await lstat(path.join(project, lockfile)).catch(() => null))) fail(`${lockfile} is missing in the review workspace, and "${command}" needs it for a reproducible install`)
  if (session.meta.mode === 'worktree') {
    await assertReviewWorkspace(session)
    // An installed node_modules that git does not ignore would show up as an unapplied change and block the commit.
    await git(project, ['check-ignore', '-q', 'node_modules/.cap-ai-11']).catch(() => fail('node_modules is not ignored by git in this project (.gitignore), so installing there would block the commit; nothing was installed'))
  }
  const token = sha256(`${command}\n${project}`)
  const preview = {
    installed: false, command, folder: project, confirm: token,
    willDo: [`Run "${command}" in ${project} (the review workspace, not your project folder)`,
      'It downloads the packages in the lock file from the npm registry your .npmrc configures, with your network access and environment',
      command.includes('--ignore-scripts') ? 'Package install scripts do not run (--ignore-scripts); some packages may need them to work' : 'Package install scripts run, as in a normal install']
  }
  if (confirm === undefined) return preview
  if (confirm !== token) fail(`--confirm must be the sha256 shown by the preview (${token})`)
  const result = await runner(command, project, timeoutSeconds)
  const ok = result.exitCode === 0 && !result.timedOut
  // A failed or interrupted install leaves a partial node_modules that this call created: remove it so the next try starts clean.
  if (!ok) await rm(path.join(project, 'node_modules'), { recursive: true, force: true }).catch(() => {})
  const fresh = await loadSession(session.dir)
  fresh.meta.install = { command, at: new Date().toISOString(), ok, exitCode: result.exitCode, timedOut: result.timedOut }
  await writeSessionFile(fresh.dir, 'session.json', fresh.meta)
  return { ...preview, installed: ok, exitCode: result.exitCode, timedOut: result.timedOut, outputTail: result.outputTail }
}

/**
 * One confirmed run of everything between "approved" and "ready to commit": install dependencies in the review workspace (only
 * if asked and missing), apply every approved diff, run the developer's test command. The plan is shown first and the
 * confirmation hash covers the exact diffs, the install command, the test command, and the folder, so approving one more
 * proposal or changing a command after the preview invalidates it. Nothing is committed or pushed.
 */
export async function runAll(session, { install, testCommand, testTimeout, installTimeout, confirm, runner } = {}) {
  const events = await assertTrusted(session)
  const pending = await pendingApprovals(session)
  if (!pending.length) fail('No approved proposals are waiting to be applied')
  if (install !== undefined && !testCommand) fail('--install is only needed for tests: give --test-command too, or leave --install out')
  await assertReviewWorkspace(session)
  const installed = install !== undefined && Boolean(await lstat(path.join(session.workspaceProject, 'node_modules')).catch(() => null))
  const installPlan = install !== undefined && !installed ? await installDependencies(session, { command: install, runner }) : null
  const plan = {
    ran: false, folder: session.workspaceProject,
    diffs: pending.map(({ row, approval }) => ({ id: row.id, file: row.finding.evidence.file, patchSha256: approval.patchSha256 })),
    install: install === undefined ? null : installed ? `${install} (skipped: node_modules is already there)` : install, testCommand: testCommand ?? null
  }
  plan.confirm = sha256(JSON.stringify({ folder: plan.folder, diffs: plan.diffs.map(diff => diff.patchSha256).sort(), install: install ?? null, testCommand: testCommand ?? null }))
  plan.willDo = [
    ...(installPlan ? installPlan.willDo : []),
    `Apply ${plan.diffs.length} approved diff(s) to the review workspace (never your project folder)`,
    testCommand ? `Run "${testCommand}" there, on your computer with your environment and network, after each diff` : 'Run no tests: the result will be reported as unverified',
    'Commit and push nothing'
  ]
  if (confirm === undefined) {
    await appendEvent(session.dir, 'run-all-previewed', { token: plan.confirm, ids: plan.diffs.map(({ id, patchSha256 }) => ({ id, patchSha256 })) })
    return plan
  }
  if (confirm !== plan.confirm) fail(`--confirm must be the sha256 shown by the preview (${plan.confirm}); the approvals, folder, or commands changed since the preview`)
  if (!wasPreviewed(events, 'run-all', plan.confirm)) fail('The run-all plan was never shown: run it without --confirm first, show the plan, then confirm')
  let installResult = null
  if (installPlan) {
    installResult = await installDependencies(session, { command: install, confirm: installPlan.confirm, timeoutSeconds: installTimeout, runner })
    if (!installResult.installed) return { ...plan, ran: true, stage: 'install', install: installResult, applied: [], tests: 'not run', commitReady: false, next: 'The install failed, so nothing was applied. Show the output, then skip the tests or fix the cause.' }
  }
  const applied = await applyPending(session, pending, { testCommand, testTimeout })
  const failed = applied.filter(result => !result.applied)
  const tests = !testCommand ? 'not run' : applied.some(result => result.result === 'test-failed') ? 'failed' : !failed.length && applied.length === plan.diffs.length && applied.every(result => result.result === 'test-passed') ? 'passed' : 'not completed'
  const commitReady = !failed.length && applied.length === plan.diffs.length && tests !== 'failed'
  return {
    ...plan, ran: true, stage: 'done', install: installResult ?? plan.install, applied, tests, commitReady,
    next: commitReady ? `Review the combined diff and, if you agree, commit it on the review branch (session.mjs commit shows the preview), then push it yourself.`
      : tests === 'failed' ? 'Tests FAILED or could not run. That can be the environment (missing services, credentials, dependencies) and not the change. The changes stay applied. Read the output tail, then you decide: request changes, commit anyway (--accept-failing-tests), or discard.' : 'Not everything was applied; show the messages and stop.'
  }
}

/**
 * A plain answer to "where is the diff and what can I do now", computed from the session state. It only describes: the
 * developer decides, and the tool runs none of the commands it names.
 */
export async function nextSteps(session) {
  const pending = await pendingApprovals(session)
  const applications = session.applications
  const testsFailed = applications.some(record => record.result === 'test-failed')
  const untested = applications.some(record => record.result === 'unverified')
  const committed = Boolean(session.meta.committed) && session.meta.committed.recordCount === applications.length
  const diffFile = path.join(session.dir, 'applied.diff')
  const hasDiffFile = applications.length > 0 && Boolean(await lstat(diffFile).catch(() => null))
  const hand = await handoff(session)
  const command = (name, rest = '') => `session.mjs ${name} --session "${session.dir}"${rest}`
  const where = [
    ['Review session folder', session.dir],
    ['Proposals as patch files (one per proposal)', path.join(session.dir, 'proposals')],
    ['Review workspace (the changed code; not your project folder)', session.workspaceProject],
    ...(hasDiffFile ? [['Everything applied so far, as one diff file', diffFile]] : []),
    ...(hand ? [['Review branch', `${hand.branch} in ${hand.repository} (the same repository as your project)`]] : [])
  ]
  const options = []
  if (committed) {
    options.push('The change is committed on the review branch. Review it with the commands below, then push it when you are satisfied (the tool never pushes).')
    options.push('To discard it instead: remove the workspace folder and delete the review branch (see the notes in RUN-ME).')
  } else if (testsFailed) {
    options.push('Tests failed or could not run. That can be the environment (missing services, credentials, dependencies), not the change: read the test output first.')
    options.push(`Request changes to a proposal, then ${command('revise', ' --decisions <new-validated.json>')}.`)
    if (session.meta.mode === 'worktree') options.push(`Commit anyway if you judge the failure environmental or acceptable: ${command('commit', ' --accept-failing-tests')} (a preview comes first).`)
    options.push('Or discard the session.')
  } else if (applications.length) {
    options.push(`Review the applied change: ${hasDiffFile ? `open ${diffFile}, or ` : ''}${command('diff')}.`)
    options.push(untested ? 'No tests were run for some or all of it. If you have tests, run them in the review workspace folder yourself, or skip them.' : 'Your tests passed. That is evidence, not proof the change is correct.')
    options.push(session.meta.mode === 'worktree' ? `Commit it on the review branch: ${command('commit')} (a preview comes first).` : 'There is no review branch in a copy session: use the diff and move the change yourself.')
  } else if (pending.length) {
    options.push(`${pending.length} approved diff(s) wait to be applied. Run them all: ${command('run-all', ' [--install "<command>"] [--test-command "<command>"]')}, or apply without tests: ${command('apply')}.`)
    options.push('If your project has no tests, or they cannot run in this environment, apply without tests: the result is reported as unverified.')
  } else {
    options.push('Nothing is approved yet. Decide each proposal: approve, reject, request changes, or defer.')
  }
  return { where, options, handoff: hand }
}

export const renderNext = next => [
  'Where things are:', ...next.where.map(([label, value]) => `  ${label}: ${value}`),
  'What you can do now:', ...next.options.map((option, index) => `  ${index + 1}. ${option}`),
  ...(next.handoff && next.handoff.committed ? ['Review and push (you run these):', `  ${next.handoff.review.summary}`, `  ${next.handoff.review.diff}`, `  ${next.handoff.push}`] : [])
].join('\n')

/**
 * Where the finished work is and how the developer reviews and pushes it. The review branch is in the same git
 * repository as the project (the workspace is a second checkout of it), so a normal push from there works.
 * The tool never runs any of these commands.
 */
export async function handoff(session) {
  if (session.meta.mode !== 'worktree') return null
  const { top, reviewBranch, reviewBaseCommit, originalBranch } = session.meta.git
  const remotes = (await git(top, ['remote']).catch(() => '')).split('\n').map(name => name.trim()).filter(Boolean)
  const remote = remotes.includes('origin') ? 'origin' : remotes[0] ?? '<remote>'
  const base = reviewBaseCommit.slice(0, 12)
  const committed = session.meta.committed?.sha ?? null
  return {
    repository: top, sameRepositoryAsProject: true, workspace: session.meta.workspace, branch: reviewBranch, originalBranch, base, committed,
    review: committed
      ? { summary: `git -C "${top}" diff --stat ${base}..${reviewBranch}`, diff: `git -C "${top}" diff ${base}..${reviewBranch}`, log: `git -C "${top}" log --oneline ${base}..${reviewBranch}` }
      : { summary: `git -C "${session.meta.workspace}" diff --stat`, diff: `git -C "${session.meta.workspace}" diff`, log: null },
    push: committed ? `git -C "${top}" push -u ${remote} ${reviewBranch}` : null,
    pushNote: 'Run it yourself when you are satisfied. The tool never pushes or merges. To use your own branch name first: git -C "<repository>" branch -m <old> <new>.'
  }
}

export const renderHandoff = hand => (hand ? [
  `Repository: ${hand.repository} (the same repository as your project; the workspace folder is a second checkout of it)`,
  `Review branch: ${hand.branch}, created from ${hand.originalBranch} at ${hand.base}${hand.committed ? `; committed as ${hand.committed.slice(0, 12)}` : '; not committed yet'}`,
  `Review the change:  ${hand.review.summary}`, ...(hand.review.diff ? [`                    ${hand.review.diff}`] : []),
  ...(hand.push ? [`Push for a PR (you run it): ${hand.push}`, hand.pushNote] : [])
].join('\n') : 'There is no review branch in a copy session; use the diff and move the change yourself.')

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
/**
 * The same proposal as data, for a chat or any other front end. verification states what is and is not established:
 * a verified patch applies cleanly to the reviewed source; it is not applied and its tests have not run.
 */
export function describeItem(session, item, index, total) {
  const { row, conflict } = item
  const files = session.meta.proposalFiles?.[row.id]
  const record = row.ready ? applicationFor(session, row) : undefined
  const decision = session.developer.decisions.find(candidate => candidate.id === row.id)
  return {
    position: { index: index + 1, total }, id: row.id, addresses: row.addresses, file: row.finding.evidence.file, line: row.finding.evidence.line,
    patternId: row.finding.patternId, summary: row.summary ?? firstSentence(row.reason), reason: row.reason, severity: row.severity ?? null,
    actionable: row.ready && !conflict, canApprove: row.ready && !conflict && !record,
    verification: row.ready
      ? { patchVerified: true, patchSha256: row.verifiedPatch.patchSha256, applied: Boolean(record), testsRun: Boolean(record?.verification), testResult: record?.result ?? null,
        meaning: record ? `applied; ${record.result}` : 'the diff applies cleanly to the reviewed source; it is not applied and no tests have run' }
      : { patchVerified: false, applied: false, testsRun: false, testResult: null, meaning: 'no verified proposal' },
    diff: row.ready ? normalizePatch(row.proposal.patch) : null,
    compatibility: row.proposal?.compatibility ?? [], regressions: row.proposal?.regressions ?? [], acceptedRegressions: row.ready ? acceptedRegressions(row) : [],
    equivalence: row.ready && row.equivalence ? row.equivalence : null,
    uncertainty: row.uncertainty ?? [], steps: row.proposal?.verification?.steps ?? [], tests: row.proposal?.verification?.tests ?? [],
    blockers: row.blockers, blocker: row.blocker ?? null, conflict: conflict ?? null, patchFile: files?.patch ?? null,
    decision: decision ? { decision: decision.decision, notes: decision.notes } : null
  }
}

/**
 * Repairs developer-decisions.json when it has drifted from the event log.
 * Only developer-decisions.json is repairable: it is fully derivable from the log.
 * Application records are NOT repairable: the log stores only their SHA256, not content.
 * Always shows a preview first; requires --confirm to change state.
 */
export async function repairSession(session, { confirm } = {}) {
  const { events, error } = await readLog(session.dir)
  if (error) fail(`The session event log is not intact: ${error}. Repair requires an intact log; nothing was changed`)
  const applicationDir = path.join(session.dir, 'applications')
  const applicationFiles = []
  for (const name of (await readdir(applicationDir).catch(() => [])).sort()) {
    if (name.endsWith('.json')) applicationFiles.push({ name, text: await readFile(path.join(applicationDir, name), 'utf8') })
  }
  const loggedApplications = events.filter(e => e.type === 'applied').map(e => e.data)
  const loggedTested = new Map(events.filter(e => e.type === 'tested').map(e => [e.data.record, e.data.recordSha256]))
  const inconsistentRecords = []
  for (const { name, text } of applicationFiles) {
    const appliedEntry = loggedApplications.find(r => r.record === name)
    if (!appliedEntry) { inconsistentRecords.push(name); continue }
    const expectedSha = loggedTested.get(name) ?? appliedEntry.recordSha256
    if (sha256(text) !== expectedSha) inconsistentRecords.push(name)
  }
  for (const record of loggedApplications) {
    if (!applicationFiles.some(({ name }) => name === record.record)) inconsistentRecords.push(`${record.record} (missing)`)
  }
  if (inconsistentRecords.length) fail(`Application record(s) are inconsistent with the event log and cannot be repaired from log data alone: ${inconsistentRecords.join(', ')}. Start a new session or investigate manually`)
  const derived = decisionsFrom(events)
  const current = session.developer.decisions
  const repairs = []
  for (const [id, logged] of derived) {
    const existing = current.find(d => d.id === id)
    if (!existing || existing.decision !== logged.decision || (logged.decision === 'approved' && existing.patchSha256 !== logged.patchSha256)) {
      repairs.push({ id, was: existing ? { decision: existing.decision, patchSha256: existing.patchSha256 ?? null } : null, willBe: logged })
    }
  }
  for (const d of current) {
    if (!derived.has(d.id)) repairs.push({ id: d.id, was: { decision: d.decision, patchSha256: d.patchSha256 ?? null }, willBe: null })
  }
  if (!repairs.length) return { repaired: false, alreadyConsistent: true, message: 'developer-decisions.json already matches the event log' }
  const token = sha256(JSON.stringify({ session: session.dir, repairs }))
  if (confirm === undefined) {
    await appendEvent(session.dir, 'repair-previewed', { token, repairs: repairs.map(r => ({ id: r.id, was: r.was?.decision ?? null, willBe: r.willBe?.decision ?? null })) })
    return { repaired: false, alreadyConsistent: false, confirm: token, repairs }
  }
  if (confirm !== token) fail(`--confirm must be the sha256 shown by the repair preview (${token}); nothing was changed`)
  const newDecisions = []
  for (const [id, logged] of derived) {
    const existing = current.find(d => d.id === id)
    if (existing && existing.decision === logged.decision && (logged.decision !== 'approved' || existing.patchSha256 === logged.patchSha256)) {
      newDecisions.push(existing)
    } else {
      newDecisions.push({ id, decision: logged.decision, ...(logged.patchSha256 ? { patchSha256: logged.patchSha256 } : {}), decidedAt: null, notes: null, _repaired: true })
    }
  }
  await saveDecisions(session, newDecisions)
  await appendEvent(session.dir, 'repaired', { token, repairs: repairs.map(r => ({ id: r.id, was: r.was?.decision ?? null, willBe: r.willBe?.decision ?? null })) })
  return { repaired: true, repairs }
}

/**
 * Detects and recovers from interrupted operations by inspecting orphaned intent events.
 * Does NOT call assertTrusted — it works when the session state is inconsistent.
 * Shows a preview before changing anything. Requires --confirm for recovery.
 * Records every recovery action in the event log. Idempotent: repeated calls skip already-resolved intents.
 */
export async function recoverSession(session, { confirm } = {}) {
  const { events, error } = await readLog(session.dir)
  if (error) fail(`The session event log is not intact: ${error}. The log must be intact for recovery; investigate manually`)
  const orphans = []
  for (const event of events) {
    if (event.type === 'apply-intent') {
      const resolved = events.find(e => e.seq > event.seq && (
        (e.type === 'applied' && e.data.id === event.data.id && e.data.patchSha256 === event.data.patchSha256) ||
        (e.type === 'recovery-recorded' && e.data.intentSeq === event.seq)
      ))
      if (resolved) continue
      const outputPath = path.join(session.dir, 'applications', event.data.output)
      let record = null
      let fileHash = null
      let canRecover = false
      let reason = ''
      try {
        const text = await readFile(outputPath, 'utf8')
        fileHash = sha256(text)
        record = JSON.parse(text)
        if (record.findingId === event.data.id && record.patchSha256 === event.data.patchSha256 && record.state === 'applied') {
          canRecover = true
          reason = `application record ${event.data.output} exists and matches the intent`
        } else {
          reason = `application record ${event.data.output} exists but does not match the intent (findingId or patchSha256 mismatch)`
        }
      } catch {
        // P1.1: check workspace files using the enriched apply-intent file hashes
        if (event.data.files?.length > 0) {
          const checks = await Promise.all(event.data.files.map(async ({ file, afterSha256 }) => {
            const current = await readProjectFile(path.join(session.workspaceProject, ...file.split('/'))).catch(() => null)
            return current?.sha256 === afterSha256
          }))
          if (checks.every(Boolean)) {
            reason = `application record ${event.data.output} does not exist but workspace files match the intent afterSha256; the apply wrote the files but was interrupted before writing the record`
          } else {
            reason = `application record ${event.data.output} does not exist and workspace files do not match the intent; apply likely did not complete`
          }
        } else {
          reason = `application record ${event.data.output} does not exist; cannot determine whether apply completed`
        }
      }
      orphans.push({ type: 'apply', intentSeq: event.seq, id: event.data.id, patchSha256: event.data.patchSha256, outputFile: event.data.output, outputPath, record, fileHash, canRecover, reason })
    }
    if (event.type === 'commit-intent') {
      const resolved = events.find(e => e.seq > event.seq && (
        e.type === 'committed' ||
        (e.type === 'recovery-recorded' && e.data.intentSeq === event.seq)
      ))
      if (resolved) continue
      let commitSha = null
      let canRecover = false
      let reason = ''
      if (session.meta.mode !== 'worktree') {
        reason = 'copy mode sessions have no git commit to check'
      } else {
        try {
          const headSha = (await git(session.meta.workspace, ['rev-parse', 'HEAD'])).trim()
          const base = session.meta.committed?.sha ?? session.meta.git?.reviewBaseCommit
          if (!base || headSha === base) {
            reason = `the workspace HEAD (${headSha.slice(0, 12)}) has not moved past the base commit; the commit likely did not happen`
          } else {
            const intentFiles = [...event.data.files].sort()
            const committedFiles = (await git(session.meta.workspace, ['show', '--name-only', '--format=', headSha])).split('\n').filter(Boolean).sort()
            if (JSON.stringify(committedFiles) !== JSON.stringify(intentFiles)) {
              reason = `HEAD commit (${headSha.slice(0, 12)}) has different files than the intent; cannot confirm it is the session's commit`
            } else {
              commitSha = headSha
              canRecover = true
              reason = `workspace HEAD (${headSha.slice(0, 12)}) moved past the base and contains exactly the intended files`
            }
          }
        } catch {
          reason = 'could not read the workspace git state'
        }
      }
      orphans.push({ type: 'commit', intentSeq: event.seq, commitSha, files: event.data.files, canRecover, reason })
    }
  }
  if (!orphans.length) return { recovered: false, noOrphans: true, message: 'No interrupted operations found in the event log' }
  const recoverableCount = orphans.filter(o => o.canRecover).length
  const ambiguousCount = orphans.length - recoverableCount
  const token = sha256(JSON.stringify({ session: session.dir, orphans: orphans.map(o => ({ type: o.type, seq: o.intentSeq })) }))
  if (confirm === undefined) {
    await appendEvent(session.dir, 'recover-previewed', { token, orphans: orphans.map(o => ({ type: o.type, intentSeq: o.intentSeq, canRecover: o.canRecover, reason: o.reason })) })
    return { recovered: false, noOrphans: false, confirm: token, orphans, recoverableCount, ambiguousCount }
  }
  if (confirm !== token) fail(`--confirm must be the sha256 shown by the recovery preview (${token}); nothing was changed`)
  const actions = []
  for (const orphan of orphans) {
    if (!orphan.canRecover) {
      await appendEvent(session.dir, 'recovery-recorded', { intentSeq: orphan.intentSeq, result: 'ambiguous', reason: orphan.reason })
      actions.push({ type: orphan.type, result: 'ambiguous', reason: orphan.reason })
      continue
    }
    if (orphan.type === 'apply') {
      await appendEvent(session.dir, 'applied', { id: orphan.id, patchSha256: orphan.patchSha256, record: orphan.outputFile, recordSha256: orphan.fileHash, result: orphan.record.result })
      await appendEvent(session.dir, 'recovery-recorded', { intentSeq: orphan.intentSeq, result: 'recovered', action: 'wrote applied event' })
      const fresh = await loadSession(session.dir)
      if (fresh.applications.length) await writeSessionFile(session.dir, 'applied.diff', await combinedDiff(fresh))
      actions.push({ type: 'apply', id: orphan.id, result: 'recovered' })
    } else if (orphan.type === 'commit') {
      await appendEvent(session.dir, 'committed', { sha: orphan.commitSha, files: orphan.files, recordCount: session.applications.length })
      await appendEvent(session.dir, 'recovery-recorded', { intentSeq: orphan.intentSeq, result: 'recovered', action: 'wrote committed event' })
      const fresh = await loadSession(session.dir)
      fresh.meta.committed = { sha: orphan.commitSha, at: new Date().toISOString(), recordCount: fresh.applications.length }
      await writeSessionFile(fresh.dir, 'session.json', fresh.meta)
      actions.push({ type: 'commit', sha: orphan.commitSha, result: 'recovered' })
    }
  }
  return { recovered: true, actions }
}

export function renderItem(session, item, index, total, { color = false } = {}) {
  const { row, conflict } = item
  const { file, line } = row.finding.evidence
  const rule = paint(color, '1', `══ Proposal ${index + 1} of ${total} · ${file} ══`)
  const out = [rule, `Findings: ${[row.id, ...row.addresses].join(', ')}  (${row.finding.patternId}, line ${line})`,
    `Problem: ${row.summary ?? firstSentence(row.reason)}`,
    `Severity: ${row.severity ? `${row.severity.level} (the AI's assessment if the finding is real). ${row.severity.basis}` : 'not assessed'}`]
  if (conflict && row.ready) out.push('', paint(color, '33', `CONFLICT: ${conflict}`), 'It cannot be approved while the conflict stands. You can reject it, defer it, or request changes.')
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
  out.push(`Verification status: diff VERIFIED to apply exactly to the current source (patch ${row.verifiedPatch.patchSha256.slice(0, 12)}…). Verified is not tested: NOT applied, tests NOT run.`,
    `Files: ${row.verifiedPatch.files.map(target => `${target.file} (lines ${target.hunks.map(hunk => `${hunk.oldStart}-${Math.max(hunk.oldStart, hunk.oldStart + hunk.oldCount - 1)}`).join(', ')})`).join('; ')}`,
    '', paint(color, '1', 'Diff (- removed, + added):'), ...diffLines(row.proposal.patch, color), '',
    `Why this fixes it: ${row.reason}`, 'Compatibility (CAP/CDS/runtime):', ...bullets(row.proposal.compatibility, 'none given'),
    'Regression risks:', ...bullets(row.proposal.regressions, 'none given'),
    ...(acceptedRegressions(row).length ? ['Behavior changes you accept by approving (input cases):', ...acceptedRegressions(row).map(item => `  - ${item.case}: ${item.listedAs}`)] : []),
    ...(row.equivalence?.proven === false ? ['Equivalence with the current behavior is NOT proven. Why:', ...bullets(row.equivalence.reasons)] : []),
    'Uncertainty and assumptions:', ...bullets(row.uncertainty, 'none stated'),
    'Verification steps:', ...bullets(row.proposal.verification?.steps, 'none given'),
    'Proposed tests (descriptions only; the tool never runs a command from the AI):', ...bullets(row.proposal.verification?.tests, 'none given'))
  out.push(`Diff hash (approving this exact diff needs --diff ${row.verifiedPatch.patchSha256}): showing the diff is recorded in the session log; approving is not applying.`)
  if (files) {
    out.push('', `Patch file: ${files.patch}`)
    if (files.targets[0]) out.push(`IDE diff:   code --diff "${path.join(files.dir, 'before', ...files.targets[0].split('/'))}" "${path.join(files.dir, 'after', ...files.targets[0].split('/'))}"`)
  }
  return `${out.join('\n')}\n`
}
