const proposalChecks = [
  { id: 'source-current', required: true, description: 'Current source hashes, model/runtime, and call-site evidence match the reviewed snapshot.' },
  { id: 'diff-integrity', required: true, description: 'A non-applied diff is derived from actual source, without HUNK narration, fabricated old lines, or unrelated comments.' },
  { id: 'fixture-expectations', required: true, description: 'Test expectations follow declared fixtures and input contracts, not assumptions that special input returns zero rows.' }
]
const queryChecks = [
  { id: 'input-contract', required: true, description: 'Compare null, undefined, empty string, quoted input, numeric/string types, and rejection/default behavior. Stringified null is not actual null.' },
  { id: 'association-semantics', required: false, description: 'For association filters, establish cardinality, path semantics, generated CQN, and adapter behavior. Nested objects are not presumed equivalent.' },
  { id: 'backend-functions', required: false, description: 'Preserve static backend functions/casts and bind dynamic values with supported tagged templates/CQN expressions. Parameterization does not require removing every backend-specific function.' },
  { id: 'authorization-path', required: true, description: 'Identify application-service versus direct database execution and preserve actual authorization predicates. Value binding does not establish access control.' }
]

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
  let contextOnly = 0
  for (const finding of report.findings) {
    if (finding.assessment === 'context-only') { contextOnly += 1; continue }
    if (finding.assessment !== 'review-candidate' || typeof finding.id !== 'string'
      || typeof finding.patternId !== 'string' || typeof finding.evidence?.file !== 'string'
      || !Number.isInteger(finding.evidence.line) || finding.evidence.line < 1
      || !/^[a-f0-9]{64}$/.test(finding.evidence.sha256 ?? '')) {
      throw new TypeError('Expected classified findings with source fingerprints')
    }
    if (findingIds.has(finding.id)) throw new TypeError('Duplicate finding ID in report')
    findingIds.add(finding.id)
    const guidance = finding.recommendation ?? report.patterns?.find(pattern => pattern.id === finding.patternId)
    if (!guidance || guidance.id !== finding.patternId) throw new TypeError('Missing pattern guidance')
    if (patterns.has(finding.patternId) && JSON.stringify(patterns.get(finding.patternId)) !== JSON.stringify(guidance)) {
      throw new TypeError('Conflicting guidance for the same pattern')
    }
    patterns.set(finding.patternId, guidance)
    findings.push({
      id: finding.id, patternId: finding.patternId, status: 'candidate',
      assessment: 'review-candidate', evidence: { ...finding.evidence }
    })
    const key = JSON.stringify([finding.evidence.file, finding.patternId])
    if (!groups.has(key)) groups.set(key, { file: finding.evidence.file, patternId: finding.patternId, findingIds: [] })
    groups.get(key).findingIds.push(finding.id)
  }
  if (alreadyCompact) contextOnly = report.summary?.contextOnly ?? 0
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
    progress: {
      total: findings.length, reviewed: 0, remaining: findings.length,
      verdict: report.coverage.complete && !findings.length ? 'no-applicable-patterns' : 'needs-review',
      reason: !report.coverage.complete ? 'Coverage is incomplete; absence of candidates cannot establish a clean review.'
        : findings.length ? 'Candidates require contextual review; no proposals are established by scanning.'
        : 'No review-candidate signals in the recorded scope; context-only observations are not defects.'
    },
    reviewPolicy: {
      version: '0.1.0',
      proposalChecks,
      queryChecks,
      checkStatuses: ['verified', 'not-applicable', 'unverified'],
      evidenceRequired: true,
      meaning: 'Validation checks reviewer declarations and bookkeeping, not semantic truth, test execution, or approval. No code is applied.'
    },
    reviewRules: [
      'This JSON is already filtered and grouped. Do not spawn agents or repeatedly read the full report to extract JSON.',
      'Load each pattern guidance once; read surrounding application code by file/group. Account for every finding ID.',
      'Respect the requested sample/group first; do not substitute a different pattern without explaining a blocker.',
      'req.error collects errors; CAP automatically rejects recorded errors after each before/on/after phase. Missing req.reject is not itself a defect.',
      'Production CAP 5xx responses are sanitized by default. Raw error.message alone does not prove client-visible leakage; verify runtime, configuration, adapters, and response evidence.',
      'Do not invent logging APIs, annotations, or runtime behavior. Do not recommend unredacted raw-error logging.',
      'Query rewrites require explicit input-contract, association-semantics, backend-function, and authorization-path checks. Unsupported equivalence remains needs-review.',
      'Produce clean non-applied diffs from actual source. Keep hunk explanations outside patches; do not add HUNK comments to source lines.',
      'Derive test expectations from fixtures. Special-character data may legitimately match a seeded record; do not assume it must return zero rows.',
      'Unreviewed, stale, or uncertain candidates keep the overall verdict needs-review. Use proposals only after at least one supported proposal and no unresolved mandatory checks.',
      'Never execute migration scripts, call live services, install dependencies, edit code, or upload client data during this review.'
    ],
    caveats: report.caveats ?? [],
    patterns: [...patterns.values()],
    groups: [...groups.values()],
    findings
  }
}

export function reconcileDecisions(report, submission) {
  const brief = prepareReview(report)
  if (submission?.snapshotSha256 !== brief.snapshot.sha256 || !Array.isArray(submission.decisions)) {
    throw new TypeError('Decision submission must reference the current snapshotSha256 and a decisions array; stale reviews must be reopened')
  }
  const known = new Map(brief.findings.map(finding => [finding.id, finding]))
  if (known.size !== brief.findings.length) throw new TypeError('Duplicate finding IDs in report')
  const reviewed = new Map()
  for (const entry of submission.decisions) {
    if (!known.has(entry?.id) || reviewed.has(entry.id)) throw new TypeError('Unknown or duplicate decision ID')
    if (!['proposed', 'not-applicable', 'needs-review'].includes(entry.decision)
      || typeof entry.reason !== 'string' || !entry.reason.trim()) {
      throw new TypeError('Each decision requires a supported decision and reason')
    }
    const blockers = []
    if (entry.decision === 'proposed') {
      const checks = known.get(entry.id).patternId === 'CAP-QUERY-001' ? [...proposalChecks, ...queryChecks] : proposalChecks
      for (const check of checks) {
        const evidence = entry.checks?.[check.id]
        if (!evidence || typeof evidence.evidence !== 'string' || !evidence.evidence.trim()
          || !(check.required ? ['verified'] : ['verified', 'not-applicable']).includes(evidence.status)) {
          blockers.push(`Unresolved evidence check: ${check.id}`)
        }
      }
    }
    reviewed.set(entry.id, {
      ...entry, requestedDecision: entry.decision,
      decision: blockers.length ? 'needs-review' : entry.decision, blockers
    })
  }
  const decisions = brief.findings.map(finding => reviewed.get(finding.id) ?? {
    id: finding.id, decision: 'needs-review', reason: 'Not reviewed', reviewed: false, blockers: ['Unreviewed finding']
  })
  const proposed = decisions.filter(entry => entry.decision === 'proposed').length
  const notApplicable = decisions.filter(entry => entry.decision === 'not-applicable').length
  const needsReview = decisions.filter(entry => entry.decision === 'needs-review').length
  return {
    ...brief,
    progress: {
      total: brief.findings.length, reviewed: reviewed.size, remaining: brief.findings.length - reviewed.size,
      proposed, notApplicable, needsReview,
      verdict: !brief.coverage.complete || needsReview ? 'needs-review' : proposed ? 'proposals' : 'no-applicable-patterns',
      reason: 'Computed from unique finding IDs, coverage, and declared evidence checks; not developer acceptance or semantic certification.'
    },
    decisions
  }
}