import { parsePatch } from './patch.mjs'

const proposalChecks = [
  { id: 'source-current', required: true, description: 'Current source hashes, model/runtime, and call-site evidence match the reviewed snapshot.' },
  { id: 'diff-integrity', required: true, description: 'A non-applied diff is derived from actual source, without HUNK narration, fabricated old lines, or unrelated comments.' },
  { id: 'fixture-expectations', required: true, description: 'Test expectations follow declared fixtures and input contracts, not assumptions that special input returns zero rows.' }
]
const queryChecks = [
  { id: 'input-contract', required: true, description: 'Assess null, undefined, empty string, and quoted input (checks.input-contract.cases, each equivalent, regression, or unverified, with evidence). This never blocks a proposal: uncertain behavior is recorded as assumptions and regressions, and the tool marks equivalence as not proven unless every case is shown equivalent or listed as a regression. Give status verified only for what you actually verified; a regression names the exact proposal.regressions entry it is listed as. Stringified null is not actual null.' },
  { id: 'association-semantics', required: false, description: 'For association filters, establish cardinality, path semantics, generated CQN, and adapter behavior. Nested objects are not presumed equivalent.' },
  { id: 'backend-functions', required: false, description: 'Preserve static backend functions/casts and bind dynamic values with supported tagged templates/CQN expressions. Parameterization does not require removing every backend-specific function.' },
  { id: 'authorization-path', required: true, description: 'Identify application-service versus direct database execution and preserve actual authorization predicates. Value binding does not establish access control.' }
]

const maxObservations = 100
const submissionKeys = new Set(['snapshotSha256', 'decisions', 'previous'])
const entryKeys = new Set(['id', 'decision', 'reason', 'summary', 'checks', 'severity', 'proposal', 'uncertainty', 'blocker', 'addressedBy'])
const decisionValues = ['proposed', 'not-applicable', 'needs-review', 'no-proposal']
const blockerKeys = new Set(['missingEvidence', 'investigated', 'unblockingCheck'])
const severityLevels = ['info', 'low', 'medium', 'high']
const proposalKeys = new Set(['patch', 'compatibility', 'regressions', 'verification'])
// Echoed from a previous reconciled output so it can be resubmitted; always recomputed, never trusted.
const derivedEntryKeys = new Set(['requestedDecision', 'blockers', 'reviewed', 'verifiedPatch', 'addresses', 'equivalence'])
const checkIds = new Set([...proposalChecks, ...queryChecks].map(check => check.id))

const inputCaseKeys = ['null', 'undefined', 'empty-string', 'quoted']
const inputCaseOutcomes = ['equivalent', 'regression', 'unverified']
// Wording that leaves behavior unresolved, and wording about null-like inputs: a "verified" input contract may not contain both.
const unresolvedWording = /\b(unverified|not (?:yet )?verified|unknown|unproven|unconfirmed|uncertain|unclear|not established|(?:cannot|can't|could not|couldn't) (?:be )?(?:confirm|verif)\w*)\b/i
const nullishWording = /\b(null|undefined|empty(?:[- ]string)?|omitted|blank)\b/i

function normalizeCases(cases) {
  if (!cases || typeof cases !== 'object' || Array.isArray(cases)) throw new TypeError('input-contract cases must be an object keyed by input case')
  const normalized = {}
  for (const [key, entry] of Object.entries(cases)) {
    if (![...inputCaseKeys, 'type'].includes(key)) throw new TypeError(`Unknown input-contract case: ${key}`)
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).some(field => !['outcome', 'evidence', 'listedAs'].includes(field))
      || !inputCaseOutcomes.includes(entry.outcome) || typeof entry.evidence !== 'string' || !entry.evidence.trim()) {
      throw new TypeError(`Input-contract case ${key} needs an outcome (${inputCaseOutcomes.join(', ')}) and evidence`)
    }
    if (entry.listedAs !== undefined && (entry.outcome !== 'regression' || typeof entry.listedAs !== 'string' || !entry.listedAs.trim())) {
      throw new TypeError(`Input-contract case ${key}: listedAs applies only to a regression and must name a proposal regression`)
    }
    normalized[key] = { outcome: entry.outcome, evidence: entry.evidence.trim(), ...(entry.listedAs ? { listedAs: entry.listedAs.trim() } : {}) }
  }
  return normalized
}

// Uncertain behavior is proposal metadata, not a gate. This never blocks a diff: it lists why equivalence with the
// current behavior is not proven, so the reviewer sees the assumptions and a "verified" claim stays honest.
// A listed regression is a known behavior change, so it is never equivalence: it is shown, and approving accepts it.
// `incomplete` is true when the claim itself is unsupported (unverified, missing, or contradicted), not for listed regressions.
function equivalenceAssessment(check, { regressions, uncertainty }) {
  const reasons = []
  let incomplete = false
  const flag = reason => { reasons.push(reason); incomplete = true }
  if (!check) return { proven: false, incomplete: true, reasons: ['The input-contract check was not assessed'] }
  if (check.status !== 'verified') flag(`input-contract is ${check.status}: ${check.evidence}`)
  const cases = check.cases
  if (!cases) {
    if (check.status === 'verified') flag('No per-case outcomes (null, undefined, empty-string, quoted) were given')
  } else {
    const missing = inputCaseKeys.filter(key => !cases[key])
    if (missing.length) flag(`No outcome given for: ${missing.join(', ')}`)
    for (const [key, entry] of Object.entries(cases)) {
      if (entry.outcome === 'unverified') flag(`The ${key} case is unverified: ${entry.evidence}`)
      if (entry.outcome === 'regression') {
        const listed = !regressions || regressions.includes(entry.listedAs ?? '')
        reasons.push(listed ? `The ${key} behavior changes (listed as a regression, accepted by approving): ${entry.listedAs}`
          : `The ${key} behavior change is not listed as a proposal regression (listedAs must equal one regressions entry)`)
        if (!listed) incomplete = true
      }
    }
    const claims = [['input-contract evidence', check.evidence], ...Object.entries(cases).filter(([, entry]) => entry.outcome !== 'unverified').map(([key, entry]) => [`the ${key} case evidence`, entry.evidence])]
    for (const [where, text] of claims) {
      const match = unresolvedWording.exec(text)
      if (match && check.status === 'verified') flag(`${where} says the behavior is unresolved ("${match[0]}")`)
    }
  }
  for (const item of uncertainty ?? []) {
    if (nullishWording.test(item) && unresolvedWording.test(item)) flag(`Stated uncertainty: ${item.slice(0, 160)}`)
  }
  return { proven: reasons.length === 0, incomplete, reasons }
}

// Checks that guard the diff and the source stay blocking. The others describe behavior the AI could not establish.
const blockingChecks = new Set(['source-current', 'diff-integrity', 'authorization-path'])

function normalizeChecks(checks) {
  if (checks === undefined) return undefined
  if (checks === null || typeof checks !== 'object' || Array.isArray(checks)) throw new TypeError('Decision checks must be an object keyed by check ID')
  const normalized = {}
  for (const [id, check] of Object.entries(checks)) {
    if (!checkIds.has(id)) throw new TypeError(`Unknown decision check ID: ${id}`)
    if (check === null || typeof check !== 'object' || Array.isArray(check)
      || Object.keys(check).some(key => key !== 'status' && key !== 'evidence' && !(key === 'cases' && id === 'input-contract'))) {
      throw new TypeError(`Decision check ${id} supports only status and evidence${id === 'input-contract' ? ' (and cases)' : ''}`)
    }
    normalized[id] = { status: check.status, evidence: check.evidence, ...(check.cases === undefined ? {} : { cases: normalizeCases(check.cases) }) }
  }
  return normalized
}

function rememberGuidance(patterns, patternId, guidance) {
  if (!guidance || guidance.id !== patternId) throw new TypeError('Missing pattern guidance')
  if (patterns.has(patternId) && JSON.stringify(patterns.get(patternId)) !== JSON.stringify(guidance)) {
    throw new TypeError('Conflicting guidance for the same pattern')
  }
  patterns.set(patternId, guidance)
}

const sourceHash = /^[a-f0-9]{64}$/

function strings(value, label) {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) throw new TypeError(`${label} must be a list of non-empty strings`)
  return value.map(item => item.trim())
}

function normalizeSeverity(severity) {
  if (severity === undefined) return undefined
  if (!severity || typeof severity !== 'object' || Array.isArray(severity) || Object.keys(severity).some(key => key !== 'level' && key !== 'basis')) {
    throw new TypeError('severity supports only level and basis')
  }
  if (!severityLevels.includes(severity.level) || typeof severity.basis !== 'string' || !severity.basis.trim()) {
    throw new TypeError(`severity needs a level (${severityLevels.join(', ')}) and a basis`)
  }
  return { level: severity.level, basis: severity.basis.trim() }
}

function normalizeProposal(proposal) {
  if (proposal === undefined) return undefined
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) throw new TypeError('proposal must be an object')
  const unsupported = Object.keys(proposal).find(key => !proposalKeys.has(key))
  if (unsupported) throw new TypeError(`Unsupported proposal field: ${unsupported}`)
  if (proposal.patch !== undefined && (typeof proposal.patch !== 'string' || !proposal.patch.trim())) throw new TypeError('proposal.patch must be a unified diff string')
  let verification
  if (proposal.verification !== undefined) {
    const { verification: given } = proposal
    if (!given || typeof given !== 'object' || Array.isArray(given) || Object.keys(given).some(key => key !== 'steps' && key !== 'tests')) {
      throw new TypeError('proposal.verification supports only steps and tests')
    }
    verification = { steps: strings(given.steps, 'proposal.verification.steps'), tests: strings(given.tests, 'proposal.verification.tests') }
  }
  return {
    patch: proposal.patch, compatibility: strings(proposal.compatibility, 'proposal.compatibility'),
    regressions: strings(proposal.regressions, 'proposal.regressions'), verification
  }
}

function normalizeBlocker(blocker) {
  if (blocker === undefined) return undefined
  if (!blocker || typeof blocker !== 'object' || Array.isArray(blocker) || Object.keys(blocker).some(key => !blockerKeys.has(key))) {
    throw new TypeError('blocker supports only missingEvidence, investigated, and unblockingCheck')
  }
  for (const key of ['missingEvidence', 'unblockingCheck']) {
    if (blocker[key] !== undefined && (typeof blocker[key] !== 'string' || !blocker[key].trim())) throw new TypeError(`blocker.${key} must be a non-empty string`)
  }
  return {
    ...(blocker.missingEvidence ? { missingEvidence: blocker.missingEvidence.trim() } : {}),
    ...(blocker.investigated ? { investigated: strings(blocker.investigated, 'blocker.investigated') } : {}),
    ...(blocker.unblockingCheck ? { unblockingCheck: blocker.unblockingCheck.trim() } : {})
  }
}

// needs-review means a proposal may be possible: it must say what is missing, what was already investigated,
// and which check would unblock it. no-proposal means the investigation is done and no code change is proposed.
function unresolvedBlockers(decision, blocker) {
  const missing = []
  if (decision === 'needs-review') {
    if (!blocker?.missingEvidence) missing.push('what evidence is missing')
    if (!blocker?.investigated?.length) missing.push('what was already investigated')
    if (!blocker?.unblockingCheck) missing.push('which specific check would unblock a proposal')
    return missing.length ? [`No specific blocker stated: say ${missing.join(', ')} (blocker)`] : []
  }
  return blocker?.investigated?.length ? [] : ['A no-proposal decision must list what was investigated (blocker.investigated)']
}

// A proposal is ready for approval only with a severity, an uncertainty list, a complete structured
// solution, and a patch that applies exactly to the project's current source.
function proposalBlockers({ severity, proposal, uncertainty }, patchCheck, checked) {
  const blockers = []
  if (!severity) blockers.push('Missing severity (level and basis)')
  if (!proposal) blockers.push('Missing proposal (unified diff, compatibility, regressions, verification)')
  else {
    if (!proposal.patch) blockers.push('Proposal needs a unified diff')
    if (!proposal.compatibility?.length) blockers.push('Proposal needs CAP/runtime compatibility considerations')
    if (!proposal.regressions?.length) blockers.push('Proposal needs potential regressions')
    if (!proposal.verification?.steps?.length) blockers.push('Proposal needs verification steps')
    if (!proposal.verification?.tests?.length) blockers.push('Proposal needs proposed tests')
    if (proposal.patch) {
      let parsed = true
      try { parsePatch(proposal.patch) } catch (error) { parsed = false; blockers.push(`Patch is not a valid unified diff: ${error.message}`) }
      if (parsed && !checked) blockers.push('Patch not checked against the project (run --decisions with the project path)')
      else if (parsed && !patchCheck?.ok) blockers.push(`Patch does not apply to the current source: ${patchCheck?.error ?? 'not checked'}`)
    }
  }
  return blockers
}

export function prepareReview(report) {
  if (report?.schemaVersion !== 1 || !Array.isArray(report.findings)
    || typeof report.coverage?.complete !== 'boolean' || !report.snapshot?.sha256) {
    throw new TypeError('Expected a fingerprinted CAP scan report with coverage and findings')
  }
  const alreadyCompact = report.format === 'cap-pattern-review'
  const patterns = new Map()
  const groups = new Map()
  const findings = []
  const findingIds = new Set()
  const observationGroups = new Map()
  let contextOnly = 0
  let observationCount = 0
  const observe = (patternId, file, sha256, id, line) => {
    if (observationCount >= maxObservations) return
    observationCount += 1
    const key = JSON.stringify([patternId, file])
    if (!observationGroups.has(key)) observationGroups.set(key, { patternId, file, sha256, items: [] })
    observationGroups.get(key).items.push({ id, line })
  }
  for (const finding of report.findings) {
    if (finding.assessment === 'context-only') {
      contextOnly += 1
      if (typeof finding.id !== 'string' || typeof finding.patternId !== 'string' || typeof finding.evidence?.file !== 'string'
        || !Number.isInteger(finding.evidence.line) || finding.evidence.line < 1 || !sourceHash.test(finding.evidence.sha256 ?? '')) {
        throw new TypeError('Expected classified observations with source fingerprints')
      }
      rememberGuidance(patterns, finding.patternId, finding.recommendation ?? report.patterns?.find(pattern => pattern.id === finding.patternId))
      observe(finding.patternId, finding.evidence.file, finding.evidence.sha256, finding.id, finding.evidence.line)
      continue
    }
    if (finding.assessment !== 'review-candidate' || typeof finding.id !== 'string'
      || typeof finding.patternId !== 'string' || typeof finding.evidence?.file !== 'string'
      || !Number.isInteger(finding.evidence.line) || finding.evidence.line < 1
      || !/^[a-f0-9]{64}$/.test(finding.evidence.sha256 ?? '')) {
      throw new TypeError('Expected classified findings with source fingerprints')
    }
    if (findingIds.has(finding.id)) throw new TypeError('Duplicate finding ID in report')
    findingIds.add(finding.id)
    rememberGuidance(patterns, finding.patternId, finding.recommendation ?? report.patterns?.find(pattern => pattern.id === finding.patternId))
    findings.push({
      id: finding.id, patternId: finding.patternId, status: 'candidate',
      assessment: 'review-candidate', evidence: { ...finding.evidence }
    })
    const key = JSON.stringify([finding.evidence.file, finding.patternId])
    if (!groups.has(key)) groups.set(key, { file: finding.evidence.file, patternId: finding.patternId, findingIds: [] })
    groups.get(key).findingIds.push(finding.id)
  }
  if (alreadyCompact) {
    contextOnly = report.summary?.contextOnly ?? 0
    if (!Number.isInteger(contextOnly) || contextOnly < 0) throw new TypeError('Expected a non-negative integer summary.contextOnly')
    for (const group of report.observations ?? []) {
      if (typeof group?.patternId !== 'string' || typeof group.file !== 'string' || !sourceHash.test(group.sha256 ?? '') || !Array.isArray(group.items)) {
        throw new TypeError('Expected observation groups with source fingerprints')
      }
      for (const item of group.items) {
        if (typeof item?.id !== 'string' || !Number.isInteger(item.line) || item.line < 1) throw new TypeError('Expected observation items with an ID and line')
      }
      if (group.items.length) rememberGuidance(patterns, group.patternId, report.patterns?.find(pattern => pattern.id === group.patternId))
      for (const item of group.items) observe(group.patternId, group.file, group.sha256, item.id, item.line)
    }
  }
  const observationIds = new Set(findingIds)
  for (const group of observationGroups.values()) {
    for (const item of group.items) {
      if (observationIds.has(item.id)) throw new TypeError('Duplicate finding ID in report')
      observationIds.add(item.id)
    }
  }
  return {
    schemaVersion: 1,
    format: 'cap-pattern-review',
    useCaseId: report.useCaseId,
    scanner: report.scanner,
    catalogVersion: report.catalogVersion,
    catalogSha256: report.catalogSha256,
    snapshot: { sha256: report.snapshot.sha256, manifestSha256: report.snapshot.manifestSha256 },
    runtime: report.runtime,
    coverage: {
      scopes: report.coverage.scopes,
      complete: report.coverage.complete,
      scannedCount: alreadyCompact ? report.coverage.scannedCount : report.coverage.scanned?.length ?? 0,
      skipped: report.coverage.skipped ?? [],
      limits: report.coverage.limits
    },
    summary: { reviewCandidates: findings.length, contextOnly },
    observations: [...observationGroups.values()],
    observationsOmitted: contextOnly - observationCount,
    progress: {
      total: findings.length, reviewed: 0, remaining: findings.length,
      verdict: report.coverage.complete && !findings.length ? 'no-applicable-patterns' : 'needs-review',
      reason: !report.coverage.complete ? 'Coverage is incomplete; absence of candidates cannot establish a clean review.'
        : findings.length ? 'Candidates require contextual review; no proposals are established by scanning.'
        : 'No review-candidate signals in the recorded scope; context-only observations are not defects.'
    },
    reviewPolicy: {
      version: '0.2.0',
      proposalChecks,
      queryChecks,
      checkStatuses: ['verified', 'not-applicable', 'unverified'],
      evidenceRequired: true,
      meaning: 'Validation checks reviewer declarations and bookkeeping, not semantic truth, test execution, or approval. No code is applied.'
    },
    reviewRules: [
      'This JSON is already filtered and grouped. Do not spawn agents or repeatedly read the full report to extract JSON.',
      'Load each pattern guidance once; read surrounding application code by file/group. Account for every finding ID.',
      'A proposed decision needs severity {level, basis} (your impact assessment if the finding is real, not a scanner result), an uncertainty list, and proposal {patch, compatibility, regressions, verification: {steps, tests}}. The patch is a unified diff of existing files copied from the actual source; the tool checks it applies exactly, and a diff that does not apply stays needs-review. Describe tests only; never include a command for the tool to run.',
      'Try to produce a concrete diff for every applicable finding. Read the CDS model, tests, and dependencies you are allowed to inspect before declaring a proposal impossible. Findings in the same function or query chain belong in one coherent diff: put the diff and severity on one finding and mark the others proposed with addressedBy set to that finding ID (same file; each still needs its own evidence checks). Two separate proposals must not change the same file.',
      'A proposed entry may add a one-sentence summary. needs-review means a proposal may be possible: give blocker {missingEvidence, investigated, unblockingCheck} naming exactly what is missing, what you already investigated, and the check that would unblock it. no-proposal means you investigated and propose no code change: give blocker.investigated. Never label an unverified proposal as verified.',
      'Respect the requested sample/group first; do not substitute a different pattern without explaining a blocker.',
      'observations are context-only signals, not candidates: no decision is needed and they do not count in progress. Read one with --context only when its pattern guidance makes it relevant (for example a direct HTTP call or a manual transaction), and report anything it reveals under the output contract observations, never as a decision. observationsOmitted counts signals not listed.',
      'req.error collects errors; CAP automatically rejects recorded errors after each before/on/after phase. Missing req.reject is not itself a defect.',
      'Production CAP 5xx responses are sanitized by default. Raw error.message alone does not prove client-visible leakage; verify runtime, configuration, adapters, and response evidence.',
      'Do not invent logging APIs, annotations, or runtime behavior. Do not recommend unredacted raw-error logging.',
      'Query rewrites require explicit input-contract, association-semantics, backend-function, and authorization-path checks. Unproven input behavior does not hold a proposal back: still write the diff, give input-contract cases for null, undefined, empty-string, and quoted (equivalent, regression listed in proposal.regressions, or unverified), list the assumptions in uncertainty and the behavior changes in regressions, and never claim equivalence you did not verify. The tool marks equivalence as not proven and the reviewer sees it. Do not ask the developer questions to produce a proposal.',
      'Produce clean non-applied diffs from actual source. Keep hunk explanations outside patches; do not add HUNK comments to source lines.',
      'Derive test expectations from fixtures. Special-character data may legitimately match a seeded record; do not assume it must return zero rows.',
      'Unreviewed or stale candidates keep the overall verdict needs-review. Use proposals only after at least one supported proposal and no unresolved mandatory checks other than documented input-behavior uncertainty.',
      'Never execute migration scripts, call live services, install dependencies, edit code, or upload client data during this review.'
    ],
    caveats: report.caveats ?? [],
    patterns: [...patterns.values()],
    groups: [...groups.values()],
    findings
  }
}

function assertNoDroppedDecisions(brief, submission) {
  const previous = submission.previous
  if (previous?.format !== 'cap-pattern-review' || !Array.isArray(previous.decisions)
    || previous.snapshot?.sha256 !== brief.snapshot.sha256) {
    throw new TypeError('Previous review must be reconciled output for the current snapshot; stale reviews must be reopened')
  }
  const submitted = new Set(submission.decisions.map(entry => entry?.id))
  const dropped = previous.decisions.filter(entry => entry?.reviewed !== false && !submitted.has(entry?.id))
  if (dropped.length) {
    throw new TypeError(`Submission drops previously decided IDs: ${dropped.map(entry => entry.id).join(', ')}`)
  }
}

export function reconcileDecisions(report, submission, { patchChecks } = {}) {
  const brief = prepareReview(report)
  if (submission?.snapshotSha256 !== brief.snapshot.sha256 || !Array.isArray(submission.decisions)) {
    throw new TypeError('Decision submission must reference the current snapshotSha256 and a decisions array; stale reviews must be reopened')
  }
  const unsupportedKey = Object.keys(submission).find(key => !submissionKeys.has(key))
  if (unsupportedKey) throw new TypeError(`Unsupported decision submission field: ${unsupportedKey}; statuses and counts are computed`)
  const known = new Map(brief.findings.map(finding => [finding.id, finding]))
  if (known.size !== brief.findings.length) throw new TypeError('Duplicate finding IDs in report')
  if (submission.previous !== undefined) assertNoDroppedDecisions(brief, submission)
  const reviewed = new Map()
  for (const entry of submission.decisions) {
    if (!known.has(entry?.id) || reviewed.has(entry.id)) throw new TypeError('Unknown or duplicate decision ID')
    const unsupportedEntryKey = Object.keys(entry).find(key => !entryKeys.has(key) && !derivedEntryKeys.has(key))
    if (unsupportedEntryKey) throw new TypeError(`Unsupported decision field: ${unsupportedEntryKey}; statuses and counts are computed`)
    if (entry.reviewed === false) throw new TypeError('Unreviewed placeholder entries must not be resubmitted; omit them or review the ID')
    const checks = normalizeChecks(entry.checks)
    const severity = normalizeSeverity(entry.severity)
    const proposal = normalizeProposal(entry.proposal)
    const uncertainty = strings(entry.uncertainty, 'uncertainty')
    const blocker = normalizeBlocker(entry.blocker)
    if (entry.summary !== undefined && (typeof entry.summary !== 'string' || !entry.summary.trim() || entry.summary.length > 300)) throw new TypeError('summary must be one short sentence (at most 300 characters)')
    if (entry.addressedBy !== undefined && (typeof entry.addressedBy !== 'string' || entry.decision !== 'proposed' || proposal)) {
      throw new TypeError('addressedBy names the finding whose proposal covers this one; the entry must be proposed and carry no proposal of its own')
    }
    if (!decisionValues.includes(entry.decision)
      || typeof entry.reason !== 'string' || !entry.reason.trim()) {
      throw new TypeError('Each decision requires a supported decision and reason')
    }
    const blockers = []
    let equivalence
    if (entry.decision === 'needs-review' || entry.decision === 'no-proposal') {
      blockers.push(...unresolvedBlockers(entry.decision, blocker))
    }
    if (entry.decision === 'proposed') {
      const required = known.get(entry.id).patternId === 'CAP-QUERY-001' ? [...proposalChecks, ...queryChecks] : proposalChecks
      const notes = []
      for (const check of required.filter(item => item.id !== 'input-contract')) {
        const evidence = checks?.[check.id]
        const settled = evidence && typeof evidence.evidence === 'string' && evidence.evidence.trim()
          && (check.required ? ['verified'] : ['verified', 'not-applicable']).includes(evidence.status)
        if (settled) continue
        if (blockingChecks.has(check.id)) blockers.push(`Unresolved evidence check: ${check.id}`)
        else notes.push(`${check.id} is not verified${evidence?.evidence ? `: ${String(evidence.evidence).trim()}` : ' (no evidence given)'}`)
      }
      const assessed = known.get(entry.id).patternId === 'CAP-QUERY-001'
        ? equivalenceAssessment(checks?.['input-contract'], { regressions: entry.addressedBy === undefined ? proposal?.regressions : undefined, uncertainty })
        : { proven: true, incomplete: false, reasons: [] }
      equivalence = { proven: assessed.proven && !notes.length, reasons: [...assessed.reasons, ...notes] }
      if (assessed.incomplete && checks?.['input-contract']?.status === 'verified') checks['input-contract'] = { ...checks['input-contract'], status: 'unverified' }
      if (entry.addressedBy === undefined) blockers.push(...proposalBlockers({ severity, proposal, uncertainty }, patchChecks?.get(entry.id), patchChecks !== undefined))
    }
    const patchCheck = patchChecks?.get(entry.id)
    reviewed.set(entry.id, {
      id: entry.id, requestedDecision: entry.decision,
      decision: blockers.length ? 'needs-review' : entry.decision,
      reason: entry.reason, ...(entry.summary ? { summary: entry.summary.trim() } : {}), ...(checks ? { checks } : {}),
      ...(blocker ? { blocker } : {}), ...(entry.addressedBy ? { addressedBy: entry.addressedBy } : {}),
      ...(severity ? { severity } : {}), ...(uncertainty ? { uncertainty } : {}), ...(proposal ? { proposal } : {}), ...(equivalence ? { equivalence } : {}),
      ...(patchCheck?.ok ? { verifiedPatch: { patchSha256: patchCheck.patchSha256, files: patchCheck.files } } : {}),
      reviewed: true, blockers
    })
  }
  // A finding addressed by another finding's proposal is proposed only if that proposal is itself verified and
  // changes the file the covered finding points at. The coverage claim (same function or query chain) is the AI's.
  const findingsById = new Map(brief.findings.map(finding => [finding.id, finding]))
  for (const entry of reviewed.values()) {
    if (!entry.addressedBy || entry.decision !== 'proposed') continue
    const primary = reviewed.get(entry.addressedBy)
    const file = findingsById.get(entry.id).evidence.file
    const problems = []
    if (!primary || entry.addressedBy === entry.id) problems.push(`addressedBy ${entry.addressedBy} is not another reviewed finding`)
    else if (primary.addressedBy) problems.push(`${entry.addressedBy} is itself covered by another proposal; name the proposal that carries the diff`)
    else if (primary.decision !== 'proposed' || !primary.verifiedPatch) problems.push(`The proposal in ${entry.addressedBy} is not verified, so it cannot cover this finding`)
    else if (!primary.verifiedPatch.files.some(target => target.file === file)) problems.push(`The proposal in ${entry.addressedBy} does not change ${file}`)
    else {
      for (const [key, contractCase] of Object.entries(entry.checks?.['input-contract']?.cases ?? {})) {
        if (contractCase.outcome === 'regression' && !primary.proposal.regressions?.includes(contractCase.listedAs ?? '')) {
          entry.equivalence = { proven: false, reasons: [...(entry.equivalence?.reasons ?? []), `The ${key} behavior change is not listed in the regressions of the proposal in ${entry.addressedBy}`] }
        }
      }
    }
    if (problems.length) { entry.blockers.push(...problems); entry.decision = 'needs-review' }
  }
  for (const entry of reviewed.values()) {
    if (!entry.addressedBy) continue
    const primary = reviewed.get(entry.addressedBy)
    if (primary && entry.decision === 'proposed') primary.addresses = [...(primary.addresses ?? []), entry.id]
  }
  const decisions = brief.findings.map(finding => reviewed.get(finding.id) ?? {
    id: finding.id, decision: 'needs-review', reason: 'Not reviewed', reviewed: false, blockers: ['Unreviewed finding']
  })
  const proposed = decisions.filter(entry => entry.decision === 'proposed').length
  const notApplicable = decisions.filter(entry => entry.decision === 'not-applicable').length
  const noProposal = decisions.filter(entry => entry.decision === 'no-proposal').length
  const needsReview = decisions.filter(entry => entry.decision === 'needs-review').length
  return {
    ...brief,
    progress: {
      total: brief.findings.length, reviewed: reviewed.size, remaining: brief.findings.length - reviewed.size,
      proposed, notApplicable, noProposal, needsReview,
      verdict: !brief.coverage.complete || needsReview ? 'needs-review' : proposed ? 'proposals' : 'no-applicable-patterns',
      reason: 'Computed from unique finding IDs, coverage, declared evidence checks, and patch checks; not developer acceptance or semantic certification.'
    },
    decisions
  }
}
