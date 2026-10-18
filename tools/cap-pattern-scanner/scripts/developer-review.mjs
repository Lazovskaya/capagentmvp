import { prepareReview } from './review.mjs'
import { readReviewContext } from './scan.mjs'

const reviewable = new Set(['proposed', 'needs-review'])
const order = { proposed: 0, 'needs-review': 1, 'no-proposal': 2, 'not-applicable': 3, unreviewed: 4 }
const titles = {
  proposed: 'AI proposes a change',
  'needs-review': 'Held by the AI: not ready for approval',
  'no-proposal': 'Investigated, no code change proposed (no decision needed)',
  'not-applicable': 'AI judged not applicable (no decision needed)',
  unreviewed: 'Not reviewed by the AI (no decision possible)'
}
const choices = [
  ['approve', 'approved'], ['reject', 'rejected'], ['needs-changes', 'needs-changes'], ['defer', 'deferred']
]

/** Joins a scan brief with the validated AI decisions of the same snapshot. */
export function reviewRows(report, validated) {
  const brief = prepareReview(report)
  if (validated?.format !== 'cap-pattern-review' || !Array.isArray(validated.decisions)) {
    throw new TypeError('Expected the validated output of --decisions')
  }
  if (validated.snapshot?.sha256 !== brief.snapshot.sha256) {
    throw new TypeError('The validated decisions belong to a different snapshot than the brief; rescan and review again')
  }
  const findings = new Map(brief.findings.map(finding => [finding.id, finding]))
  const rows = validated.decisions.filter(decision => findings.has(decision.id)).map(decision => {
    const section = decision.reviewed === false ? 'unreviewed' : decision.decision
    return {
      id: decision.id, finding: findings.get(decision.id), aiDecision: decision.decision, section,
      summary: decision.summary, blocker: decision.blocker, addressedBy: decision.addressedBy, addresses: decision.addresses ?? [],
      requestedDecision: decision.requestedDecision, blockers: decision.blockers ?? [], reason: decision.reason ?? '',
      checks: decision.checks ?? {}, severity: decision.severity, uncertainty: decision.uncertainty,
      proposal: decision.proposal, verifiedPatch: decision.verifiedPatch,
      // Ready for approval only when the AI proposed it AND the tool verified the patch against the source.
      ready: section === 'proposed' && Boolean(decision.verifiedPatch && decision.proposal?.patch),
      // A finding covered by another finding's proposal is decided together with that proposal, not on its own.
      covered: section === 'proposed' && Boolean(decision.addressedBy)
    }
  })
  return { brief, rows: rows.sort((a, b) => order[a.section] - order[b.section]
    || a.finding.evidence.file.localeCompare(b.finding.evidence.file) || a.finding.evidence.line - b.finding.evidence.line) }
}

/** Whether the developer can decide this row on its own (covered findings follow their proposal). */
export const isDecidable = row => reviewable.has(row.section) && !row.covered

/** Hash-checked source excerpts for the reviewable items (fails if the source changed since the scan). */
export async function loadSheetExcerpts(project, report, rows) {
  const ids = rows.filter(isDecidable).map(row => row.id)
  const excerpts = new Map()
  for (let index = 0; index < ids.length; index += 3) {
    const { excerpts: batch } = await readReviewContext(project, report, ids.slice(index, index + 3))
    for (const excerpt of batch) excerpts.set(excerpt.findingId, excerpt)
  }
  return excerpts
}

const fence = text => '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(match => match[0].length + 1)))
const list = (items, empty) => (items?.length ? items.map(item => `- ${item}`) : [`- ${empty}`])

function formatExcerpt(excerpt, line) {
  const rows = excerpt.text.split('\n').map(text => /^(\d+): ?(.*)$/.exec(text)).filter(Boolean).map(match => ({ number: Number(match[1]), code: match[2] }))
  const shown = excerpt.enclosing?.widened ? rows : rows.filter(row => row.number >= line - 6 && row.number <= line + 10)
  return shown.map(row => `${String(row.number).padStart(4)}${row.number === line ? ' >' : '  '} ${row.code}`).join('\n')
}

function renderItem(row, excerpt, out) {
  const { file, line, sha256 } = row.finding.evidence
  out.push(`### ${file}:${line} · ${row.finding.patternId}`, `<!-- id: ${row.id} -->`)
  out.push(`Finding ${row.id} · source \`${sha256.slice(0, 12)}…\` · AI decision \`${row.aiDecision}\` · **${row.ready ? 'ready for approval' : 'not ready for approval'}**`)
  out.push(row.severity ? `Severity: **${row.severity.level}** (the AI's assessment of impact if the finding is real, not a scanner result). Basis: ${row.severity.basis}`
    : 'Severity: not assessed.')
  if (row.requestedDecision && row.requestedDecision !== row.aiDecision) {
    out.push('', `Not ready because the validator downgraded it from \`${row.requestedDecision}\`:`, ...row.blockers.map(blocker => `- ${blocker}`))
  }
  if (excerpt) out.push('', 'Source evidence (current code):', '```js', formatExcerpt(excerpt, line), '```')
  const reasonFence = fence(row.reason)
  out.push('', 'Problem and why a change is warranted:', `${reasonFence}text`, row.reason, reasonFence)
  if (row.proposal?.patch) {
    const patchFence = fence(row.proposal.patch)
    out.push('', 'Proposed solution (unified diff, not applied):', `${patchFence}diff`, row.proposal.patch.replace(/\s+$/, ''), patchFence)
    if (row.verifiedPatch) {
      out.push('', `Verified against the current source: the diff applies exactly (patch \`${row.verifiedPatch.patchSha256.slice(0, 12)}…\`). Targets:`,
        ...row.verifiedPatch.files.map(target => `- \`${target.file}\` lines ${target.hunks.map(hunk => `${hunk.oldStart}-${Math.max(hunk.oldStart, hunk.oldStart + hunk.oldCount - 1)}`).join(', ')} (file \`${target.baseSha256.slice(0, 12)}…\`)`))
    } else out.push('', '**The diff was not verified against the project source.**')
    out.push('', 'CAP/runtime compatibility:', ...list(row.proposal.compatibility, 'none given'),
      '', 'Potential regressions:', ...list(row.proposal.regressions, 'none given'),
      ...(acceptedRegressions(row).length ? ['', 'Behavior changes you accept by approving (input cases):', ...acceptedRegressions(row).map(item => `- ${item.case}: ${item.listedAs}`)] : []),
      '', 'Verification steps:', ...list(row.proposal.verification?.steps, 'none given'),
      '', 'Proposed tests (descriptions only; the tool never runs a command from the AI):', ...list(row.proposal.verification?.tests, 'none given'))
  } else if (row.covered) out.push('', `Addressed by the proposal in ${row.addressedBy}: decide there. This finding has no separate decision.`)
  else out.push('', 'No concrete solution has been formulated for this finding.')
  if (row.addresses.length) out.push('', `This proposal also addresses: ${row.addresses.join(', ')}`)
  if (row.blocker) {
    out.push('', 'Blocker and what was investigated:', ...(row.blocker.missingEvidence ? [`- Missing: ${row.blocker.missingEvidence}`] : []),
      ...(row.blocker.investigated ?? []).map(item => `- Investigated: ${item}`), ...(row.blocker.unblockingCheck ? [`- Check that would unblock it: ${row.blocker.unblockingCheck}`] : []))
  }
  out.push('', 'Uncertainty and missing evidence:', ...list(row.uncertainty, row.uncertainty ? 'none stated' : 'not stated by the AI'))
  const checks = Object.entries(row.checks)
  if (checks.length) out.push('', '| Evidence check | Status | Evidence |', '|---|---|---|', ...checks.map(([id, check]) => `| ${id} | ${check.status} | ${String(check.evidence).replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 280)} |`))
  if (isDecidable(row)) {
    out.push('', '**Your decision** (tick at most one; nothing is applied by deciding):',
      row.ready ? '- [ ] approve: accept this proposal (applying is a separate step)' : '- [ ] approve: unavailable, there is no verified proposal',
      '- [ ] reject: decline it (a reason is required)', '- [ ] needs-changes: request a revised proposal (say what to change)', '- [ ] defer: decide later',
      '', 'Reason or notes:', '')
  } else out.push('')
}

/** Markdown the developer ticks. The hidden id comments are what record reads back. */
export function renderReviewSheet({ brief, rows, excerpts = new Map() }) {
  const count = (pattern, section) => rows.filter(row => row.finding.patternId === pattern && row.section === section).length
  const patterns = [...new Set(rows.map(row => row.finding.patternId))].sort()
  const out = [
    '# CAP-AI-11 proposal review', '',
    'Each item is an **AI proposal for a developer to judge**. Neither this sheet nor deciding on it changes any code. Applying an approved proposal is a separate, explicit step (`apply.mjs`) that shows the exact diff first.',
    'Detected is not the same as confirmed: a candidate is a place that matched a pattern. The validator checks that evidence text is present, not that it is true. The excerpts are your source: keep this sheet inside your environment.', '',
    '**How to decide.** Tick one box per item: **approve** (accept the proposal, only when it is ready), **reject** (with a reason), **needs-changes** (say what to revise), or **defer**.', 'Leave an item untouched if you have not looked at it. Save the file and run `sheet.mjs record`.', '',
    `Snapshot \`${brief.snapshot.sha256.slice(0, 12)}…\` · ${rows.length} candidates · ${rows.filter(row => row.ready).length} ready for approval`, '',
    '| Pattern | AI proposes | Held by the AI | No proposal | Not applicable |', '|---|---|---|---|---|',
    ...patterns.map(pattern => `| ${pattern} | ${count(pattern, 'proposed')} | ${count(pattern, 'needs-review')} | ${count(pattern, 'no-proposal')} | ${count(pattern, 'not-applicable')} |`), ''
  ]
  let section = null
  for (const row of rows) {
    if (row.section !== section) { section = row.section; out.push(`## ${titles[section]}`, '') }
    renderItem(row, excerpts.get(row.id), out)
  }
  return `${out.join('\n')}\n`
}

const checkbox = (body, label) => {
  const match = new RegExp(`^[ \\t]*[-*][ \\t]*\\[([ xX])\\][ \\t]*${label}(?![\\w-])`, 'm').exec(body)
  return match ? match[1].toLowerCase() === 'x' : null
}

/** Reads the ticks back from an edited sheet (tolerates CRLF and a BOM). */
export function parseReviewSheet(markdown) {
  const parts = markdown.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/<!-- id: (\S+) -->/)
  const blocks = new Map()
  for (let index = 1; index < parts.length; index += 2) {
    const id = parts[index]
    if (blocks.has(id)) throw new TypeError(`The sheet lists ${id} more than once`)
    const body = parts[index + 1]
    const lines = body.split('\n')
    const start = lines.findIndex(line => /^Reason or notes:/.test(line))
    let notes = ''
    if (start >= 0) {
      const collected = [lines[start].replace(/^Reason or notes:/, '').trim()]
      for (let next = start + 1; next < lines.length && lines[next].trim() && !/^(#|<!--|\*\*)/.test(lines[next]); next += 1) collected.push(lines[next].trim())
      notes = collected.filter(Boolean).join(' ')
    }
    blocks.set(id, { ticks: choices.filter(([label]) => checkbox(body, label)).map(([, decision]) => decision), notes })
  }
  return blocks
}

/** The input cases whose behavior changes the developer accepts by approving (listed in the proposal's regressions). */
export const acceptedRegressions = row => Object.entries(row.checks['input-contract']?.cases ?? {})
  .filter(([, entry]) => entry.outcome === 'regression').map(([name, entry]) => ({ case: name, listedAs: entry.listedAs }))

/** One developer decision, bound for an approval to the exact verified diff (a revised proposal needs a new approval). */
export function decisionEntry(row, decision, notes) {
  const { file, line, sha256 } = row.finding.evidence
  return {
    id: row.id, patternId: row.finding.patternId, file, line, evidenceSha256: sha256, aiDecision: row.aiDecision, decision, notes,
    ...(decision === 'approved' ? { ...(row.addresses.length ? { addresses: row.addresses } : {}), ...(acceptedRegressions(row).length ? { acceptedRegressions: acceptedRegressions(row) } : {}), patchSha256: row.verifiedPatch.patchSha256, targets: row.verifiedPatch.files.map(target => ({ file: target.file, baseSha256: target.baseSha256 })) } : {})
  }
}

/** Turns a ticked sheet into the developer-decisions record. Never applies or verifies a change. */
export function recordDeveloperDecisions({ report, validated, sheet, reviewer }) {
  const { brief, rows } = reviewRows(report, validated)
  const byId = new Map(rows.map(row => [row.id, row]))
  const blocks = parseReviewSheet(sheet)
  for (const id of blocks.keys()) if (!byId.has(id)) throw new TypeError(`The sheet has an item that is not in this review: ${id}`)
  const decisions = []
  const undecided = []
  let reviewableCount = 0
  for (const row of rows) {
    const ticks = blocks.get(row.id)?.ticks ?? []
    const notes = blocks.get(row.id)?.notes ?? ''
    if (!isDecidable(row)) {
      if (ticks.length) throw new TypeError(`${row.id} cannot take a developer decision: the AI judged it ${row.aiDecision}${row.section === 'unreviewed' ? ' (not reviewed)' : ''}`)
      continue
    }
    reviewableCount += 1
    if (ticks.length > 1) throw new TypeError(`${row.id} has more than one decision ticked (${ticks.join(', ')})`)
    if (!ticks.length) { undecided.push(row.id); continue }
    const [decision] = ticks
    if (decision === 'approved' && !row.ready) throw new TypeError(`${row.id} cannot be approved: the AI has no verified proposal for it`)
    if ((decision === 'rejected' || decision === 'needs-changes') && !notes.trim()) {
      throw new TypeError(`${row.id} is ${decision === 'rejected' ? 'rejected' : 'sent back'} without a reason; write one after "Reason or notes:"`)
    }
    decisions.push(decisionEntry(row, decision, notes))
  }
  const count = name => decisions.filter(decision => decision.decision === name).length
  return {
    schemaVersion: 1, format: 'cap-pattern-developer-decisions', useCaseId: brief.useCaseId,
    snapshotSha256: brief.snapshot.sha256, reviewer: reviewer ?? null,
    note: 'Recorded as stated by the developer. Approval only accepts a proposal: nothing is applied or verified until apply.mjs does it and records the result.',
    summary: { reviewable: reviewableCount, approved: count('approved'), rejected: count('rejected'), needsChanges: count('needs-changes'), deferred: count('deferred'), undecided: undecided.length },
    decisions, undecided
  }
}
