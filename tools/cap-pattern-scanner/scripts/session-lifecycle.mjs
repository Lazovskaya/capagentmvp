import { lstat, rm } from 'node:fs/promises'
import path from 'node:path'
import { readProjectFile, sha256 } from './patch.mjs'
import { applicationFor, assertTrusted, dirtyPaths, git } from './session-core.mjs'
import { appendEvent, readLog, wasPreviewed } from './session-state.mjs'
import { readTimings } from './timing.mjs'

const fail = message => { throw new TypeError(message) }
const posix = value => value.split(path.sep).join('/')
const inside = (parent, child) => { const relative = path.relative(parent, child); return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)) }

/**
 * What discarding would remove, what it would lose, and what stops it. Discard removes only what the session created: its
 * review worktree (or copy), its review branch, and its folder. Nothing is forced silently, and the developer's own branch
 * and working tree are never touched.
 *
 * Blockers cannot be overridden: edits the session did not record, a branch or workspace that is not what the session created,
 * a review branch that is also the developer's own branch. Losses (applied but uncommitted changes, a commit that exists only
 * on the review branch, proposals nobody decided) are named in the preview and need --discard-work to acknowledge them.
 */
export async function discardSession(session, { confirm, discardWork = false } = {}) {
  const events = await assertTrusted(session)
  const { meta, dir } = session
  const blockers = []
  const losses = []
  const workspace = meta.workspace
  if (path.resolve(workspace) !== path.join(dir, 'workspace')) blockers.push(`the recorded workspace ${workspace} is not inside the session folder`)
  if (inside(dir, meta.project) || inside(meta.project, dir)) blockers.push('the session folder and the original project contain each other')
  const exists = Boolean(await lstat(workspace).catch(() => null))
  const uncommitted = session.applications.slice(meta.committed?.recordCount ?? 0)
  const relative = meta.mode === 'worktree' ? posix(path.relative(workspace, session.workspaceProject)) : ''
  const recorded = new Map()
  for (const record of uncommitted) for (const file of record.files) recorded.set(posix(path.posix.join(relative, file.file)), file.afterSha256)
  let dirty = []
  let tip = null
  let removeBranch = null
  let kept = []
  if (meta.mode === 'worktree') {
    const { top, reviewBranch, reviewBaseCommit, originalBranch } = meta.git
    const checkedOut = (await git(top, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => '')).trim()
    if (reviewBranch === originalBranch || reviewBranch === checkedOut) blockers.push(`${reviewBranch} is the branch checked out in your own working tree; it will not be removed`)
    tip = (await git(top, ['rev-parse', '--verify', '--quiet', `refs/heads/${reviewBranch}`]).catch(() => '')).trim() || null
    if (exists) {
      const onBranch = (await git(workspace, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => '')).trim()
      if (onBranch !== reviewBranch) blockers.push(`the review workspace is on "${onBranch || 'an unknown ref'}", not on ${reviewBranch}; work there is not the session's to remove`)
      dirty = await dirtyPaths(workspace).catch(() => [])
      const unrecorded = dirty.filter(file => !recorded.has(file))
      if (unrecorded.length) blockers.push(`the review workspace has changes the session did not apply (${unrecorded.slice(0, 8).join(', ')}); save or remove them yourself first`)
      for (const [file, after] of recorded) {
        if (dirty.includes(file) && (await readProjectFile(path.join(workspace, ...file.split('/'))).catch(() => undefined))?.sha256 !== after) blockers.push(`${file} was edited after the session applied it; save it yourself first`)
      }
      if (dirty.some(file => recorded.has(file))) losses.push(`applied but uncommitted changes in: ${dirty.filter(file => recorded.has(file)).join(', ')}`)
    }
    if (tip) {
      const commits = (await git(top, ['rev-list', `${reviewBaseCommit}..${tip}`])).split('\n').filter(Boolean)
      const ownCommits = new Set(events.filter(event => event.type === 'committed').map(event => event.data.sha))
      if (commits.length && !commits.every(sha => ownCommits.has(sha))) blockers.push(`${reviewBranch} has commits the session did not make (${commits.length}); they are not the session's to delete`)
      else if (commits.length) {
        const elsewhere = (await git(top, ['for-each-ref', '--contains', tip, '--format=%(refname)', 'refs/heads', 'refs/remotes'])).split('\n').filter(ref => ref && ref !== `refs/heads/${reviewBranch}`)
        if (!elsewhere.length) losses.push(`the commit ${tip.slice(0, 12)} exists only on ${reviewBranch} (not pushed, not in another branch)`)
        removeBranch = elsewhere.length ? 'contained' : 'force'
        kept = elsewhere
      } else removeBranch = 'safe'
    }
  } else if (session.applications.length) {
    losses.push('applied changes exist only in the copy (the diff is in applied.diff); a copy has no branch to keep them on')
    // Build the last-written SHA256 for each file across all application records (multiple proposals may change the same file)
    const lastWritten = new Map()
    for (const record of session.applications) for (const file of record.files) lastWritten.set(file.file, file.afterSha256)
    for (const [filePath, afterSha256] of lastWritten) {
      const current = await readProjectFile(path.join(workspace, ...filePath.split('/'))).catch(() => undefined)
      if (current && current.sha256 !== afterSha256) blockers.push(`${filePath} in the copy was edited after the session applied it; save it yourself first`)
    }
  }
  const undecided = session.queue.filter(({ row }) => !session.developer.decisions.some(decision => decision.id === row.id) && !(row.ready && applicationFor(session, row)))
  if (undecided.length) losses.push(`${undecided.length} proposal(s) have no decision yet; they would have to be generated and reviewed again`)
  const willRemove = [
    ...(exists ? [`the review ${meta.mode === 'worktree' ? 'worktree' : 'copy'}: ${workspace}`] : []),
    ...(meta.mode === 'worktree' && tip ? [`the review branch ${meta.git.reviewBranch} in ${meta.git.top} (${removeBranch === 'force' ? 'deleted with its own commit, as you confirm' : removeBranch === 'contained' ? `its commit stays reachable from ${kept.map(ref => ref.replace(/^refs\/(heads|remotes)\//, '')).join(', ')}` : 'only if git itself considers it merged or empty'})`] : []),
    `the session folder: ${dir}`
  ]
  const token = sha256(JSON.stringify({ dir, workspace, branch: meta.git?.reviewBranch ?? null, tip, dirty: [...dirty].sort(), losses, blockers, applications: session.applications.length }))
  const preview = {
    discarded: false, confirm: token, blockers, losses, willRemove, needsDiscardWork: losses.length > 0,
    keeps: ['your own branch and working tree', ...(meta.mode === 'worktree' ? [`every other branch in ${meta.git.top}`] : ['your project folder'])]
  }
  if (confirm === undefined) {
    if (!blockers.length) await appendEvent(dir, 'discard-previewed', { token })
    return preview
  }
  if (blockers.length) fail(`Refusing to discard: ${blockers.join('; ')}. Nothing was removed`)
  if (confirm !== token) fail(`--confirm must be the sha256 shown by the discard preview (${token}); the session changed since the preview`)
  if (!wasPreviewed(events, 'discard', token)) fail('The discard preview was never shown: run discard without --confirm first, then confirm')
  if (losses.length && !discardWork) fail(`Discarding would lose work: ${losses.join('; ')}. Add --discard-work to confirm that you accept this. Nothing was removed`)
  const removed = []
  if (meta.mode === 'worktree') {
    const { top, reviewBranch } = meta.git
    // No silent force: a dirty worktree is removed with --force only here, where every dirty file is a recorded, byte-exact applied file the developer accepted losing.
    if (exists) {
      await git(top, ['worktree', 'remove', ...(dirty.length ? ['--force'] : []), workspace]).catch(error => fail(`git would not remove the review worktree (${String(error.stderr || error.message).split('\n')[0]}); nothing else was removed`))
      removed.push(`worktree ${workspace}`)
    }
    if (tip) {
      await git(top, ['branch', removeBranch === 'safe' ? '-d' : '-D', reviewBranch]).catch(error => fail(`git would not delete ${reviewBranch} (${String(error.stderr || error.message).split('\n')[0]}); the worktree was removed, the branch and session folder were kept`))
      removed.push(`branch ${reviewBranch}`)
    }
  }
  await rm(dir, { recursive: true })
  removed.push(`session folder ${dir}`)
  return { ...preview, discarded: true, removed }
}

const findingsOf = row => 1 + row.addresses.length

/** The session's counts and statuses, computed from the session record only. Approved is not applied, and applied is not tested. */
export async function sessionSummary(session) {
  let trust = null
  try { await assertTrusted(session) } catch (error) { trust = error.message }
  const { events } = await readLog(session.dir)
  const conflicts = new Map(session.groups.unresolved.filter(item => item.conflict).map(item => [item.row.id, item.conflict]))
  const proposals = session.rows.filter(row => row.ready && !row.covered).map(row => {
    const decision = session.developer.decisions.find(candidate => candidate.id === row.id)
    const record = applicationFor(session, row)
    const current = decision?.decision === 'approved' && decision.patchSha256 === row.verifiedPatch.patchSha256
    const status = record ? 'applied' : conflicts.has(row.id) ? 'held-conflict' : current ? 'approved' : decision?.decision === 'rejected' ? 'rejected' : decision?.decision === 'deferred' ? 'deferred' : decision?.decision === 'needs-changes' ? 'changes-requested' : 'pending'
    return { id: row.id, file: row.finding.evidence.file, line: row.finding.evidence.line, findings: [row.id, ...row.addresses], status, tests: record?.result ?? null }
  })
  const count = (status, rows = proposals) => rows.filter(proposal => proposal.status === status).length
  const findingCount = list => list.reduce((sum, proposal) => sum + proposal.findings.length, 0)
  const applied = proposals.filter(proposal => proposal.status === 'applied')
  const withProposal = session.rows.filter(row => row.covered || (row.ready && row.section === 'proposed')).length
  const without = { needsReview: 0, noProposal: session.groups.noProposal.length, notApplicable: session.groups.notApplicable.length, notReviewed: session.groups.unreviewed.length }
  without.needsReview = session.rows.length - withProposal - without.noProposal - without.notApplicable - without.notReviewed
  const approvedVia = {}
  const latest = new Map()
  for (const { type, data } of events) if (type === 'decided') latest.set(data.id, data); else if (type === 'revised') for (const id of data.voided) latest.delete(id)
  for (const data of latest.values()) if (data.decision === 'approved') approvedVia[data.via ?? 'unknown'] = (approvedVia[data.via ?? 'unknown'] ?? 0) + 1
  const timings = await readTimings(path.join(session.dir, 'timings.jsonl'))
  const committed = session.meta.committed && session.meta.committed.recordCount === session.applications.length ? session.meta.committed : null
  return {
    schemaVersion: 1, format: 'cap-pattern-session-summary', trustworthy: trust === null, ...(trust ? { warning: trust } : {}), events: events.length,
    findings: { scanned: session.rows.length, withProposal, withoutProposal: session.rows.length - withProposal, without,
      coveredByApprovedProposals: findingCount(proposals.filter(proposal => ['approved', 'applied'].includes(proposal.status))), coveredByAppliedProposals: findingCount(applied),
      coveredByAppliedProposalsWithPassingTests: findingCount(applied.filter(proposal => proposal.tests === 'test-passed')) },
    proposals: { total: proposals.length, pending: count('pending'), approvedNotApplied: count('approved'), applied: applied.length, rejected: count('rejected'), deferred: count('deferred'), changesRequested: count('changes-requested'), heldByConflict: count('held-conflict'), items: proposals },
    tests: { passed: applied.filter(proposal => proposal.tests === 'test-passed').length, failed: applied.filter(proposal => proposal.tests === 'test-failed').length, notRun: applied.filter(proposal => proposal.tests === 'unverified').length },
    commit: committed ? { committed: true, sha: committed.sha, branch: session.meta.git?.reviewBranch ?? null } : { committed: false, sha: null, appliedNotCommitted: session.applications.length - (session.meta.committed?.recordCount ?? 0) },
    approvals: { via: approvedVia, note: 'terminal means a person answered an interactive TTY prompt; piped means the review loop ran with non-TTY stdin (automated or scripted); cli means the decide command was called (by a person or by an AI on their behalf)' },
    toolTime: { calls: timings.calls, seconds: Math.round(timings.totalMs / 100) / 10, outputKiB: Math.round(timings.stdoutBytes / 102.4) / 10, commands: timings.commands, note: 'Time spent inside this tool\'s commands. Model turns and model tool calls are not visible to the tool, so the rest of a run is not measured here.' },
    reading: 'Approved is not applied, applied is not tested, and passing tests are evidence, not proof the change is correct. No finding is reported as fixed.'
  }
}

export function renderSummary(summary) {
  const { findings, proposals, tests, commit } = summary
  return [
    'Session summary (computed by the tool from the session record; the AI writes none of these numbers)',
    ...(summary.trustworthy ? [] : [`WARNING: the session state is not trustworthy (${summary.warning}). These counts come from files that may have been edited and must not be relied on.`]),
    `Findings scanned: ${findings.scanned}`,
    `  with a verified proposal: ${findings.withProposal}`,
    `  without a proposal: ${findings.withoutProposal} (needs review ${findings.without.needsReview}, no proposal ${findings.without.noProposal}, not applicable ${findings.without.notApplicable}, not reviewed ${findings.without.notReviewed})`,
    `Proposals: ${proposals.total} (pending ${proposals.pending}, approved not applied ${proposals.approvedNotApplied}, applied ${proposals.applied}, rejected ${proposals.rejected}, deferred ${proposals.deferred}, changes requested ${proposals.changesRequested}, held by conflict ${proposals.heldByConflict})`,
    `Findings covered by approved proposals: ${findings.coveredByApprovedProposals}; by applied proposals: ${findings.coveredByAppliedProposals}; by applied proposals whose tests passed: ${findings.coveredByAppliedProposalsWithPassingTests}`,
    `Tests on applied proposals: passed ${tests.passed}, failed ${tests.failed}, not run ${tests.notRun}`,
    `Commit: ${commit.committed ? `${commit.sha.slice(0, 12)} on ${commit.branch}` : `not committed${commit.appliedNotCommitted ? ` (${commit.appliedNotCommitted} applied proposal(s) are not committed)` : ''}`}`,
    ...proposals.items.map(item => `  ${item.status.padEnd(18)} ${item.file}:${item.line}  ${item.id}${item.findings.length > 1 ? ` (+${item.findings.length - 1} covered)` : ''}${item.tests ? `  [${item.tests}]` : ''}`),
    `Approvals recorded through: ${Object.entries(summary.approvals.via).map(([name, count]) => `${name} ${count}`).join(', ') || 'none'} (terminal = interactive TTY; piped = non-TTY/automated input; cli = the decide command was called)`,
    `Tool time: ${summary.toolTime.calls} command(s), ${summary.toolTime.seconds} s, ${summary.toolTime.outputKiB} KiB of output (model time is not measured by the tool)`,
    summary.reading
  ].join('\n')
}
