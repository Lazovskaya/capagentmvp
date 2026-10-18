import { parseArgs } from 'node:util'
import { normalizePatch } from './patch.mjs'
import { applyApproved, combinedDiff, decideItem, itemStates, loadSession, pendingApprovals, renderItem, reviewLoop, reviseSession, startSession } from './session-core.mjs'
import { readJsonInput } from './scan.mjs'

const usage = `Usage:
  node session.mjs start  --report <brief.json> --decisions <validated.json> --project <cap-project> --session <new-folder> [--mode auto|worktree|copy]
  node session.mjs review --session <folder> [--reviewer <name>] [--redo]
  node session.mjs show   --session <folder> [--id <finding-ID>] [--all]
  node session.mjs decide --session <folder> --id <finding-ID> --decision approve|reject|needs-changes|defer [--notes <text>] [--reviewer <name>]
  node session.mjs status --session <folder> [--json]
  node session.mjs apply  --session <folder> [--id <finding-ID>] [--confirm <diff sha256>|all] [--test-command "<your command>"] [--test-timeout <seconds>]
  node session.mjs diff   --session <folder> [--approved]
  node session.mjs revise --session <folder> --decisions <revised-validated.json>
A review session is an isolated place to review code proposals one by one. start makes a git worktree on a new branch (or, without git,
a copy) next to the folder and never touches your working branch or files. review shows each proposal as a code diff and asks you to
approve, reject, request changes, defer, or go to the next one. Nothing is applied by deciding. apply (without --confirm it only shows the diffs)
changes the isolated workspace only, for approved proposals whose diff hash you confirm, and runs only a test command you give. Nothing is
committed or pushed. Findings the AI judged not-applicable or no-proposal are kept for traceability and never enter the queue.`

try {
  const { values, positionals } = parseArgs({
    options: {
      report: { type: 'string' }, decisions: { type: 'string' }, project: { type: 'string' }, session: { type: 'string' }, mode: { type: 'string' },
      id: { type: 'string' }, decision: { type: 'string' }, notes: { type: 'string' }, reviewer: { type: 'string' }, confirm: { type: 'string' },
      'test-command': { type: 'string' }, 'test-timeout': { type: 'string' }, all: { type: 'boolean' }, approved: { type: 'boolean' },
      redo: { type: 'boolean' }, json: { type: 'boolean' }, help: { type: 'boolean' }
    },
    allowPositionals: true
  })
  const [command] = positionals
  const known = ['start', 'review', 'show', 'decide', 'status', 'apply', 'diff', 'revise']
  const needs = { start: ['report', 'decisions', 'project', 'session'], revise: ['session', 'decisions'], decide: ['session', 'id', 'decision'] }
  if (values.help || !known.includes(command) || positionals.length !== 1 || (needs[command] ?? ['session']).some(name => !values[name])) {
    console.log(usage)
    process.exitCode = values.help ? 0 : 1
  } else if (command === 'start') {
    const session = await startSession({
      report: await readJsonInput(values.report), validated: await readJsonInput(values.decisions), project: values.project,
      session: values.session, mode: values.mode, reviewer: values.reviewer
    })
    const { groups, meta } = session
    const lines = [
      `Review session created: ${session.dir}`,
      `Isolated workspace (${meta.mode}): ${meta.workspaceProject}`,
      ...(meta.git ? [`Review branch ${meta.git.reviewBranch} from ${meta.git.originalBranch} at ${meta.git.originalHead.slice(0, 12)}. Your branch and working files were not changed.`,
        ...(meta.git.unrelatedChangeCount ? [`Note: ${meta.git.unrelatedChangeCount} uncommitted change(s) exist in your working tree. They are not in the review workspace and stay untouched.`] : [])]
        : ['No git repository: the workspace is a copy without node_modules or .git. Your project was not changed.']),
      `Proposals ready for your review: ${groups.actionable.length}`,
      `Held (no verified proposal; you can reject, defer, or request changes): ${groups.unresolved.length}`,
      `Kept for traceability only: ${groups.covered.length} covered by another proposal, ${groups.noProposal.length} no-proposal, ${groups.notApplicable.length} not-applicable`,
      '', `Next: node session.mjs review --session "${session.dir}"`, ''
    ]
    process.stdout.write(lines.join('\n'))
  } else {
    const session = await loadSession(values.session)
    if (command === 'review') {
      if (!session.queue.length) throw new TypeError('Nothing to review in this session')
      const color = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
      process.stdin.setEncoding('utf8')
      const summary = await reviewLoop(session, { input: process.stdin, output: process.stdout, color, reviewer: values.reviewer, redo: values.redo })
      process.stdout.write(`\nThis run: ${Object.entries(summary).map(([name, count]) => `${count} ${name}`).join(', ')}.\nNext: node session.mjs status --session "${session.dir}"; to apply approved proposals to the isolated workspace: node session.mjs apply --session "${session.dir}"\n`)
    } else if (command === 'show') {
      const color = false
      const items = values.id ? session.queue.filter(item => item.row.id === values.id) : session.queue
      if (values.id && !items.length) throw new TypeError(`${values.id} is not in the review queue`)
      for (const [index, item] of items.entries()) process.stdout.write(`${renderItem(session, item, values.id ? session.queue.indexOf(item) : index, session.queue.length, { color })}\n`)
      if (values.all) {
        process.stdout.write('Kept for traceability (not actionable):\n')
        for (const [label, list] of [['covered by another proposal', session.groups.covered], ['no-proposal', session.groups.noProposal], ['not-applicable', session.groups.notApplicable], ['not reviewed', session.groups.unreviewed]]) {
          for (const { row } of list) process.stdout.write(`  ${row.id}  ${row.finding.evidence.file}:${row.finding.evidence.line}  ${label}${row.addressedBy ? ` (${row.addressedBy})` : ''}: ${row.summary ?? row.reason}\n`)
        }
      }
    } else if (command === 'decide') {
      const entry = await decideItem(session, values.id, values.decision, values.notes ?? '', values.reviewer)
      process.stdout.write(`Recorded ${entry.decision} for ${entry.id}. Nothing was applied.\n`)
    } else if (command === 'status') {
      const states = await itemStates(session)
      if (values.json) {
        process.stdout.write(`${JSON.stringify({ schemaVersion: 1, format: 'cap-pattern-session-status', mode: session.meta.mode, workspace: session.meta.workspaceProject, items: states, traceability: { covered: session.groups.covered.length, noProposal: session.groups.noProposal.length, notApplicable: session.groups.notApplicable.length } }, null, 2)}\n`)
      } else {
        for (const item of states) process.stdout.write(`${item.state.padEnd(34)} ${item.file}:${item.line}  ${item.id}${item.addresses.length ? ` (+${item.addresses.length} covered)` : ''}\n`)
        process.stdout.write(`Traceability only: ${session.groups.covered.length} covered, ${session.groups.noProposal.length} no-proposal, ${session.groups.notApplicable.length} not-applicable.\n`)
      }
    } else if (command === 'apply') {
      const pending = (await pendingApprovals(session)).filter(({ row }) => !values.id || row.id === values.id)
      if (values.confirm === undefined) {
        if (!pending.length) process.stdout.write('No approved proposals are waiting to be applied.\n')
        for (const { row, approval } of pending) {
          process.stdout.write(`NOT APPLIED. Exact diff for ${row.id} (${row.finding.evidence.file}), approved by ${session.developer.reviewer ?? 'an unnamed reviewer'}:\n----------------------------------------\n${normalizePatch(row.proposal.patch).trimEnd()}\n----------------------------------------\nTo apply it to the isolated workspace: --confirm ${approval.patchSha256}\n\n`)
        }
        if (pending.length > 1) process.stdout.write('To apply every approved proposal listed above after reading them: --confirm all\n')
      } else {
        const seconds = values['test-timeout'] === undefined ? undefined : Number(values['test-timeout'])
        const results = await applyApproved(session, { ids: values.id ? [values.id] : undefined, confirm: values.confirm, testCommand: values['test-command'], testTimeout: seconds })
        for (const result of results) {
          process.stdout.write(result.applied
            ? `${result.id}: applied to the isolated workspace, ${{ 'test-passed': 'tests passed', 'test-failed': 'tests FAILED (the change stays applied; see the record)', unverified: 'unverified (no tests run)' }[result.result]}. Record: ${result.record}\n${result.verification?.exitCode ? result.verification.outputTail : ''}`
            : `${result.id}: NOT applied. ${result.error}\n`)
        }
        if (results.some(result => !result.applied)) process.exitCode = 1
        else if (results.some(result => result.result === 'test-failed')) process.exitCode = 2
        process.stdout.write(`\nReview everything together: node session.mjs diff --session "${session.dir}"${session.meta.git ? `, or in git: git -C "${session.meta.workspace}" diff` : ''}\nThe workspace is not committed. Transfer it yourself once you are satisfied.\n`)
      }
    } else if (command === 'diff') {
      const text = await combinedDiff(session, { includeApproved: values.approved })
      process.stdout.write(text || 'Nothing applied yet. Use --approved to include approved proposals that are not applied.\n')
    } else {
      const result = await reviseSession(session, await readJsonInput(values.decisions))
      process.stdout.write(`Revised proposals: ${result.revised.length ? result.revised.join(', ') : 'none changed'}. They need a new decision; earlier approvals of changed diffs no longer count.\n${result.droppedFromQueue.length ? `No longer proposals: ${result.droppedFromQueue.join(', ')}\n` : ''}`)
    }
  }
} catch (error) {
  const detail = error instanceof TypeError ? ` ${error.message}.` : ''
  console.error(`Session failed (${error.code ?? 'INVALID_INPUT'});${detail} Nothing was applied unless a message above says so.`)
  process.exitCode = 1
}
