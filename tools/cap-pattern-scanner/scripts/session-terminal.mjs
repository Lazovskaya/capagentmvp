import { applicationFor, decideItem, recordPresented, renderItem } from './session-core.mjs'

const decisionNames = { approve: 'approved', reject: 'rejected', 'needs-changes': 'needs-changes', defer: 'deferred' }

/**
 * The optional terminal front end of a review session: one question per proposal, one answer per line (so it also
 * works with piped input). All decisions go through decideItem; the chat dialog does not use this file but drives
 * the same session commands from the skill.
 */
export async function reviewLoop(session, { input, output, color = false, reviewer, redo = false, isTTY = false }) {
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
      const via = isTTY ? 'terminal' : 'piped'
      await recordPresented(session, [item], via)
      const options = item.row.ready && !item.conflict ? '[a]pprove  [r]eject  [c]hange request  [d]efer  [n]ext  [q]uit' : '[r]eject  [c]hange request  [d]efer  [n]ext  [q]uit'
      for (;;) {
        const answer = (await ask(`${options} > `)).toLowerCase()
        if (answer === 'q') { output.write('Stopped. Decisions made so far are saved.\n'); return summary }
        if (answer === 'n' || answer === '') { summary.skipped += 1; break }
        const choice = { a: 'approve', r: 'reject', c: 'needs-changes', d: 'defer' }[answer]
        if (!choice || (choice === 'approve' && (!item.row.ready || item.conflict))) { output.write('Not available here.\n'); continue }
        const notes = choice === 'reject' || choice === 'needs-changes' ? await ask(choice === 'reject' ? 'Reason: ' : 'What should change: ') : await ask('Optional note: ')
        try {
          await decideItem(session, item.row.id, choice, notes, name, { diff: item.row.verifiedPatch?.patchSha256, via })
          summary[decisionNames[choice]] += 1
          output.write(`Recorded: ${decisionNames[choice]}. Nothing was applied.\n`)
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
