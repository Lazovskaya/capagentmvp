import path from 'node:path'
import { parseArgs } from 'node:util'
import { normalizePatch } from './patch.mjs'
import { applyApproved, combinedDiff, commitSession, decideItem, describeItem, handoff, installDependencies, itemStates, loadSession, nextSteps, previewApply, recoverSession, recordPresented, renderNext, renderItem, repairSession, reviseSession, runAll, startSession } from './session-core.mjs'
import { discardSession, renderSummary, sessionSummary } from './session-lifecycle.mjs'
import { reviewLoop } from './session-terminal.mjs'
import { readJsonInput } from './scan.mjs'
import { startTiming } from './timing.mjs'

const usage = `Usage:
  node session.mjs start  --report <brief.json> --decisions <validated.json> --project <cap-project> --session <new-folder> [--mode auto|worktree|copy] [--branch <name>]
  node session.mjs review --session <folder> [--reviewer <name>] [--redo]
  node session.mjs show   --session <folder> [--id <finding-ID>] [--all] [--json]
  node session.mjs decide --session <folder> --id <finding-ID> --decision approve|reject|needs-changes|defer [--diff <diff sha256 printed by show>] [--notes <text>] [--reviewer <name>]
  node session.mjs status --session <folder> [--json]
  node session.mjs apply  --session <folder> [--id <finding-ID>] [--confirm <sha256 printed by the apply preview>] [--test-command "<your command>"] [--test-timeout <seconds>]
  node session.mjs install --session <folder> --command "npm ci|npm ci --ignore-scripts|pnpm install --frozen-lockfile|yarn install --frozen-lockfile" [--confirm <sha256>] [--install-timeout <seconds>]
  node session.mjs run-all --session <folder> [--install "<install command>"] [--test-command "<your command>"] [--confirm <sha256>] [--install-timeout <s>] [--test-timeout <s>]
  node session.mjs diff   --session <folder> [--approved]
  node session.mjs revise --session <folder> --decisions <revised-validated.json>
  node session.mjs summary --session <folder> [--json]
  node session.mjs discard --session <folder> [--confirm <sha256>] [--discard-work]
  node session.mjs commit --session <folder> [--message <text>] [--confirm <combined diff sha256>] [--accept-failing-tests]
  node session.mjs recover --session <folder> [--confirm <sha256 shown by recover preview>]
  node session.mjs repair  --session <folder> [--confirm <sha256 shown by repair preview>]
A review session is an isolated place to review code proposals one by one. start makes a git worktree on a new branch (or, without git,
a copy) next to the folder and never touches your working branch or files. review shows each proposal as a code diff and asks you to
approve, reject, request changes, defer, or go to the next one. Nothing is applied by deciding. apply (without --confirm it only shows the diffs)
changes the isolated workspace only, for approved proposals whose diff hash you confirm, and runs only a test command you give. Nothing is
committed or pushed. commit (git sessions only) shows the combined diff and, with --confirm, commits exactly the applied files on the review branch (never your branch, never pushed). Findings the AI judged not-applicable or no-proposal are kept for traceability and never enter the queue.`

const timing = startTiming()
let invoked
try {
  const { values, positionals } = parseArgs({
    options: {
      report: { type: 'string' }, decisions: { type: 'string' }, project: { type: 'string' }, session: { type: 'string' }, mode: { type: 'string' },
      id: { type: 'string' }, decision: { type: 'string' }, notes: { type: 'string' }, reviewer: { type: 'string' }, confirm: { type: 'string' },
      message: { type: 'string' }, diff: { type: 'string' }, branch: { type: 'string' }, command: { type: 'string' }, install: { type: 'string' }, 'install-timeout': { type: 'string' }, 'test-command': { type: 'string' }, 'test-timeout': { type: 'string' }, all: { type: 'boolean' }, approved: { type: 'boolean' },
      redo: { type: 'boolean' }, 'accept-failing-tests': { type: 'boolean' }, 'discard-work': { type: 'boolean' }, json: { type: 'boolean' }, help: { type: 'boolean' }
    },
    allowPositionals: true
  })
  const [command] = positionals
  invoked = { command, session: values.session }
  const reject = message => { throw new TypeError(message) }
  if (values.mode !== undefined && !['auto', 'worktree', 'copy'].includes(values.mode)) reject(`--mode must be auto, worktree, or copy (got "${values.mode}")`)
  if (values.decision !== undefined && !['approve', 'reject', 'needs-changes', 'defer'].includes(values.decision)) reject(`--decision must be approve, reject, needs-changes, or defer (got "${values.decision}")`)
  if (values['test-timeout'] !== undefined && !(/^\d+$/.test(values['test-timeout']) && Number(values['test-timeout']) >= 1 && Number(values['test-timeout']) <= 3600)) reject('--test-timeout must be a whole number of seconds from 1 to 3600')
  if (values['install-timeout'] !== undefined && !(/^\d+$/.test(values['install-timeout']) && Number(values['install-timeout']) >= 1 && Number(values['install-timeout']) <= 3600)) reject('--install-timeout must be a whole number of seconds from 1 to 3600')
  if (values.id !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(values.id)) reject('--id must be a finding ID such as CAP-FINDING-0123456789abcdef')
  if (values.confirm !== undefined && !/^[a-f0-9]{64}$/.test(values.confirm)) reject('--confirm must be the 64-character sha256 shown by the preview')
  if (values.diff !== undefined && !/^[a-f0-9]{64}$/.test(values.diff)) reject('--diff must be the 64-character sha256 printed with the diff by show')
  const known = ['start', 'review', 'show', 'decide', 'status', 'apply', 'install', 'run-all', 'diff', 'revise', 'commit', 'summary', 'discard', 'recover', 'repair']
  const needs = { start: ['report', 'decisions', 'project', 'session'], revise: ['session', 'decisions'], install: ['session', 'command'], decide: ['session', 'id', 'decision'] }
  if (values.help || !known.includes(command) || positionals.length !== 1 || (needs[command] ?? ['session']).some(name => !values[name])) {
    console.log(usage)
    process.exitCode = values.help ? 0 : 1
  } else if (command === 'start') {
    const session = await startSession({
      report: await readJsonInput(values.report), validated: await readJsonInput(values.decisions), project: values.project,
      session: values.session, mode: values.mode, reviewer: values.reviewer, branch: values.branch
    })
    const { groups, meta } = session
    const lines = [
      `Review session created: ${session.dir}`,
      `Isolated workspace (${meta.mode}): ${meta.workspaceProject}`,
      ...(meta.git ? [`Review branch ${meta.git.reviewBranch} from ${meta.git.originalBranch} at ${meta.git.originalHead.slice(0, 12)}. Your branch and working files were not changed.`,
        ...(meta.git.unrelatedChangeCount ? [`Note: ${meta.git.unrelatedChangeCount} uncommitted change(s) exist in your working tree. They are not in the review workspace and stay untouched.`] : [])]
        : [meta.fallback ?? 'No git repository: the workspace is a copy without node_modules or .git. Your project was not changed.', 'There is no review branch, so a commit step is not available; use the diff and move the change yourself.']),
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
      const summary = await reviewLoop(session, { input: process.stdin, output: process.stdout, color, reviewer: values.reviewer, redo: values.redo, isTTY: Boolean(process.stdin.isTTY) })
      process.stdout.write(`\nThis run: ${Object.entries(summary).map(([name, count]) => `${count} ${name}`).join(', ')}.\nNext: node session.mjs status --session "${session.dir}"; to apply approved proposals to the isolated workspace: node session.mjs apply --session "${session.dir}"\n`)
    } else if (command === 'show' && values.json) {
      const items = values.id ? session.queue.filter(item => item.row.id === values.id) : session.queue
      if (values.id && !items.length) throw new TypeError(`${values.id} is not in the review queue`)
      const ids = list => list.map(({ row }) => row.id)
      // Only a single proposal shown with --id counts as presented; the unfiltered queue is an index without diffs.
      if (values.id) await recordPresented(session, items, 'show-json')
      process.stdout.write(`${JSON.stringify({
        schemaVersion: 1, format: 'cap-pattern-session-queue', mode: session.meta.mode, workspace: session.meta.workspaceProject, reviewBranch: session.meta.git?.reviewBranch ?? null,
        reviewer: session.developer.reviewer,
        ...(values.id ? {} : { note: 'This is the queue without diffs. Show one proposal with its diff using --id <finding-ID>; only that records the diff as shown, and approving needs it.' }),
        items: items.map(item => ({ ...describeItem(session, item, session.queue.indexOf(item), session.queue.length), ...(values.id ? {} : { diff: null, diffOmitted: true }) })),
        traceability: { covered: ids(session.groups.covered), noProposal: ids(session.groups.noProposal), notApplicable: ids(session.groups.notApplicable), unreviewed: ids(session.groups.unreviewed) }
      }, null, 2)}\n`)
    } else if (command === 'show') {
      const color = false
      const items = values.id ? session.queue.filter(item => item.row.id === values.id) : session.queue
      if (values.id && !items.length) throw new TypeError(`${values.id} is not in the review queue`)
      if (values.id) {
        process.stdout.write(`${renderItem(session, items[0], session.queue.indexOf(items[0]), session.queue.length, { color })}\n`)
        await recordPresented(session, items, 'show')
      } else {
        process.stdout.write(`${items.length} proposal(s) in the review queue (no diffs here; show one with its diff using --id <finding-ID>, which is what approving needs):\n`)
        for (const [index, item] of items.entries()) process.stdout.write(`  ${index + 1}. ${item.row.id}  ${item.row.finding.evidence.file}:${item.row.finding.evidence.line}  ${item.row.ready && !item.conflict ? 'proposal' : item.conflict ? 'held: conflict' : 'held: no verified proposal'}\n`)
      }
      if (values.all) {
        process.stdout.write('Kept for traceability (not actionable):\n')
        for (const [label, list] of [['covered by another proposal', session.groups.covered], ['no-proposal', session.groups.noProposal], ['not-applicable', session.groups.notApplicable], ['not reviewed', session.groups.unreviewed]]) {
          for (const { row } of list) process.stdout.write(`  ${row.id}  ${row.finding.evidence.file}:${row.finding.evidence.line}  ${label}${row.addressedBy ? ` (${row.addressedBy})` : ''}: ${row.summary ?? row.reason}\n`)
        }
      }
    } else if (command === 'decide') {
      const entry = await decideItem(session, values.id, values.decision, values.notes ?? '', values.reviewer, { diff: values.diff })
      process.stdout.write(`Recorded ${entry.decision} for ${entry.id}. Nothing was applied.\n`)
    } else if (command === 'status') {
      const states = await itemStates(session)
      if (values.json) {
        process.stdout.write(`${JSON.stringify({ schemaVersion: 1, format: 'cap-pattern-session-status', mode: session.meta.mode, workspace: session.meta.workspaceProject, items: states, traceability: { covered: session.groups.covered.length, noProposal: session.groups.noProposal.length, notApplicable: session.groups.notApplicable.length }, handoff: await handoff(session), dependencies: session.meta.install ?? null, next: await nextSteps(session) }, null, 2)}\n`)
      } else {
        for (const item of states) process.stdout.write(`${item.state.padEnd(34)} ${item.file}:${item.line}  ${item.id}${item.addresses.length ? ` (+${item.addresses.length} covered)` : ''}\n`)
        process.stdout.write(`Traceability only: ${session.groups.covered.length} covered, ${session.groups.noProposal.length} no-proposal, ${session.groups.notApplicable.length} not-applicable.\n\n${renderNext(await nextSteps(session))}\n`)
      }
    } else if (command === 'apply') {
      const seconds = values['test-timeout'] === undefined ? undefined : Number(values['test-timeout'])
      if (values.confirm === undefined) {
        const preview = await previewApply(session, { ids: values.id ? [values.id] : undefined, testCommand: values['test-command'], testTimeout: seconds })
        if (!preview.pending.length) process.stdout.write('No approved proposals are waiting to be applied.\n')
        for (const item of preview.diffs) {
          process.stdout.write(`NOT APPLIED. Exact diff for ${item.id} (${item.file}):\n----------------------------------------\n${item.diff.trimEnd()}\n----------------------------------------\n`)
        }
        if (preview.confirm) process.stdout.write(`\nApproving a proposal does not apply it. To apply the ${preview.diffs.length} diff(s) above to the isolated workspace: --confirm ${preview.confirm}${preview.testCommand ? ` --test-command "${preview.testCommand}"` : ''}${preview.testTimeout !== null ? ` --test-timeout ${preview.testTimeout}` : ''}\n`)
      } else {
        const results = await applyApproved(session, { ids: values.id ? [values.id] : undefined, confirm: values.confirm, testCommand: values['test-command'], testTimeout: seconds })
        for (const result of results) {
          process.stdout.write(result.applied
            ? `${result.id}: applied to the isolated workspace, ${{ 'test-passed': 'tests passed', 'test-failed': 'tests FAILED (the change stays applied; see the record)', unverified: 'unverified (no tests run)' }[result.result]}. Record: ${result.record}\n${result.verification?.exitCode ? result.verification.outputTail : ''}`
            : `${result.id}: NOT applied. ${result.error}\n`)
        }
        if (results.some(result => !result.applied)) process.exitCode = 1
        else if (results.some(result => result.result === 'test-failed')) process.exitCode = 2
        process.stdout.write(`\n${renderNext(await nextSteps(await loadSession(values.session)))}\n`)
      }
    } else if (command === 'install') {
      const result = await installDependencies(session, { command: values.command, confirm: values.confirm, timeoutSeconds: values['install-timeout'] === undefined ? undefined : Number(values['install-timeout']) })
      if (values.confirm === undefined) process.stdout.write(`NOT INSTALLED. This would:\n${result.willDo.map(line => `- ${line}`).join('\n')}\nTo install: --confirm ${result.confirm}\n`)
      else if (result.installed) process.stdout.write(`Installed in the review workspace: ${result.folder}\n`)
      else {
        process.stdout.write(`Install FAILED${result.timedOut ? ' (timed out)' : ` (exit ${result.exitCode})`}; the partial node_modules was removed.\n${result.outputTail}\n`)
        process.exitCode = 1
      }
    } else if (command === 'run-all') {
      const result = await runAll(session, {
        install: values.install, testCommand: values['test-command'], confirm: values.confirm,
        installTimeout: values['install-timeout'] === undefined ? undefined : Number(values['install-timeout']),
        testTimeout: values['test-timeout'] === undefined ? undefined : Number(values['test-timeout'])
      })
      if (!result.ran) {
        process.stdout.write(`NOT RUN. This would:\n${result.willDo.map(line => `- ${line}`).join('\n')}\nDiffs: ${result.diffs.map(diff => `${diff.file} (${diff.id})`).join(', ')}\nTo run it all: --confirm ${result.confirm}\n`)
      } else {
        const lines = [
          result.stage === 'install' ? `Install FAILED${result.install.timedOut ? ' (timed out)' : ` (exit ${result.install.exitCode})`}; the partial node_modules was removed.\n${result.install.outputTail}` : `Install: ${typeof result.install === 'string' ? result.install : result.install?.installed ? 'done' : 'not requested'}`,
          ...result.applied.map(item => `${item.id}: ${item.applied ? `applied; ${{ 'test-passed': 'tests passed', 'test-failed': 'tests FAILED', unverified: 'no tests run' }[item.result]}` : `NOT applied. ${item.error}`}${item.verification?.exitCode ? `\n${item.verification.outputTail}` : ''}`),
          `Tests: ${result.tests}`, `Ready to commit: ${result.commitReady ? 'yes' : 'no'}`, result.next
        ]
        process.stdout.write(`${lines.join('\n')}\n\n${renderNext(await nextSteps(await loadSession(values.session)))}\n`)
        if (result.stage === 'install' || result.applied.some(item => !item.applied)) process.exitCode = 1
        else if (result.tests === 'failed') process.exitCode = 2
      }
    } else if (command === 'summary') {
      const summary = await sessionSummary(session)
      process.stdout.write(values.json ? `${JSON.stringify(summary, null, 2)}\n` : `${renderSummary(summary)}\n`)
    } else if (command === 'discard') {
      const result = await discardSession(session, { confirm: values.confirm, discardWork: values['discard-work'] })
      if (result.discarded) process.stdout.write(`Discarded. Removed:\n${result.removed.map(line => `- ${line}`).join('\n')}\nYour own branch and working tree were not touched.\n`)
      else {
        process.stdout.write(`NOT DISCARDED. This would remove:\n${result.willRemove.map(line => `- ${line}`).join('\n')}\nIt keeps: ${result.keeps.join('; ')}.\n`)
        if (result.blockers.length) process.stdout.write(`REFUSED, it cannot go ahead until you resolve:\n${result.blockers.map(line => `- ${line}`).join('\n')}\n`)
        else {
          if (result.losses.length) process.stdout.write(`It would LOSE:\n${result.losses.map(line => `- ${line}`).join('\n')}\n`)
          process.stdout.write(`To discard: --confirm ${result.confirm}${result.needsDiscardWork ? ' --discard-work' : ''}\n`)
        }
      }
    } else if (command === 'recover') {
      const result = await recoverSession(session, { confirm: values.confirm })
      if (result.noOrphans) process.stdout.write(`${result.message}\n`)
      else if (result.recovered) {
        const lines = result.actions.map(a => a.result === 'recovered'
          ? (a.type === 'apply' ? `  recovered: apply intent for ${a.id}` : `  recovered: commit intent → ${a.sha?.slice(0, 12)}`)
          : `  ambiguous: ${a.type} intent — manual investigation needed: ${a.reason}`)
        process.stdout.write(`Recovery complete:\n${lines.join('\n')}\n`)
      } else {
        const lines = result.orphans.map(o => `  ${o.canRecover ? 'RECOVERABLE' : 'AMBIGUOUS'}  ${o.type} intent (seq ${o.intentSeq}): ${o.reason}`)
        process.stdout.write(`NOT RECOVERED. Found ${result.orphans.length} interrupted operation(s):\n${lines.join('\n')}\n`)
        if (result.recoverableCount) process.stdout.write(`To recover the ${result.recoverableCount} recoverable operation(s): --confirm ${result.confirm}\n`)
        else process.stdout.write(`None can be recovered automatically. Investigate or discard the session.\n`)
      }
    } else if (command === 'repair') {
      const result = await repairSession(session, { confirm: values.confirm })
      if (result.alreadyConsistent) process.stdout.write(`${result.message}\n`)
      else if (result.repaired) {
        process.stdout.write(`Repaired developer-decisions.json. Changes:\n${result.repairs.map(r => `  ${r.id}: ${r.was?.decision ?? '(absent)'} → ${r.willBe?.decision ?? '(removed)'}`).join('\n')}\n`)
      } else {
        process.stdout.write(`NOT REPAIRED. This would rewrite developer-decisions.json:\n${result.repairs.map(r => `  ${r.id}: ${r.was?.decision ?? '(absent)'} → ${r.willBe?.decision ?? '(removed)'}`).join('\n')}\nTo repair: --confirm ${result.confirm}\n`)
      }
    } else if (command === 'diff') {
      const text = await combinedDiff(session, { includeApproved: values.approved })
      process.stdout.write(text || 'Nothing applied yet. Use --approved to include approved proposals that are not applied.\n')
    } else if (command === 'commit') {
      const result = await commitSession(session, { message: values.message, confirm: values.confirm, acceptFailingTests: values['accept-failing-tests'] })
      if (result.committed) process.stdout.write(`Committed ${result.sha.slice(0, 12)} on review branch ${result.branch} (${result.files.join(', ')}). Your branch was not changed and nothing was pushed.\n\n${renderNext(await nextSteps(await loadSession(values.session)))}\n`)
      else process.stdout.write(`NOT COMMITTED. This would commit on review branch ${result.branch}:\nFiles: ${result.files.join(', ')}\nMessage:\n${result.message}\n\n${result.diff}\nTo commit exactly this: --confirm ${result.confirm}\n`)
    } else {
      const result = await reviseSession(session, await readJsonInput(values.decisions))
      process.stdout.write(`Revised proposals: ${result.revised.length ? result.revised.join(', ') : 'none changed'}. They need a new decision; earlier approvals of changed diffs no longer count.\n${result.droppedFromQueue.length ? `No longer proposals: ${result.droppedFromQueue.join(', ')}\n` : ''}`)
    }
  }
} catch (error) {
  const firstLine = text => String(text ?? '').split('\n')[0].trim()
  const detail = error instanceof TypeError ? ` ${error.message}.`
    : typeof error.code === 'number' ? ` git failed: ${firstLine(error.stderr) || firstLine(error.message)}.`
    : ['ENOENT', 'EEXIST', 'EACCES', 'EPERM', 'ENOTDIR'].includes(error.code) ? ` ${error.code}: ${firstLine(error.message)}.` : ''
  console.error(`Session failed (${typeof error.code === 'number' ? 'GIT_ERROR' : error.code ?? 'INVALID_INPUT'});${detail} Nothing was applied unless a message above says so.`)
  process.exitCode = 1
} finally {
  if (invoked?.session) await timing.finish(path.join(path.resolve(invoked.session), 'timings.jsonl'), { tool: 'session', command: invoked.command })
}
