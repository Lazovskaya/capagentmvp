import assert from 'node:assert/strict'
import test from 'node:test'
import { checkProposalPatches } from './proposals.mjs'
import { reconcileDecisions } from './review.mjs'
import { checks, originalLine, patchFor, reviewedProject, solution } from './workflow-fixtures.mjs'

// The wording of a real run that claimed "verified" while it listed the null/undefined behavior as uncertain.
const contradictoryEvidence = 'Input is the order action parameter ref, optional. Behavior for quoted, null and omitted input is compared in compatibility and regressions; null/omitted behavior is listed as uncertain.'
const contradictoryUncertainty = 'No installed @sap/cds, so how the string where is parsed and how undefined/null bind in the tagged template are not verified.'
const regressions = solution(patchFor()).proposal.regressions
const equivalentCases = () => Object.fromEntries(['null', 'undefined', 'empty-string', 'quoted'].map(name => [name, { outcome: 'equivalent', evidence: `Both forms treat ${name} input the same way (shown by the model constraint).` }]))

/** Validates the fixture project's query proposal with the given input-contract check and optional overrides. */
async function validate(context, { contract, uncertainty, proposal, extra = [] }) {
  const project = await reviewedProject(context)
  const entry = {
    id: project.ids.query, decision: 'proposed', reason: 'Bind the value.', ...solution(patchFor()),
    checks: { ...checks, 'input-contract': contract }, ...(uncertainty ? { uncertainty } : {}), ...(proposal ? { proposal: { ...solution(patchFor()).proposal, ...proposal } } : {})
  }
  const submission = { snapshotSha256: project.brief.snapshot.sha256, decisions: [entry, ...extra(project)] }
  const validated = reconcileDecisions(project.report, submission, { patchChecks: await checkProposalPatches(project.root, project.report, submission) })
  return { ...project, validated, result: validated.decisions.find(candidate => candidate.id === project.ids.query) }
}
const asExtra = () => []

// Uncertain input behavior never holds a diff back: it becomes explicit assumptions and an "equivalence not proven" mark.
test('a proposal that claims verification while listing unresolved null/undefined semantics still gets its diff, marked not proven', async context => {
  const { result } = await validate(context, {
    contract: { status: 'verified', evidence: contradictoryEvidence, cases: equivalentCases() }, uncertainty: [contradictoryUncertainty], extra: asExtra
  })
  assert.equal(result.decision, 'proposed')
  assert.deepEqual(result.blockers, [])
  assert.ok(result.verifiedPatch?.patchSha256, 'the diff is verified to apply and is shown to the developer')
  assert.equal(result.equivalence.proven, false)
  assert.match(result.equivalence.reasons.join('\n'), /input-contract evidence says the behavior is unresolved \("uncertain"\)/)
  assert.match(result.equivalence.reasons.join('\n'), /Stated uncertainty: No installed @sap\/cds/)
  assert.equal(result.checks['input-contract'].status, 'unverified', 'the tool does not let a "verified" claim stand when it is contradicted')
})

test('an unverified case or an unverified check still yields a proposal, with the reason recorded', async context => {
  const cases = equivalentCases()
  cases.null = { outcome: 'unverified', evidence: 'How a bound null behaves was not run against the adapter.' }
  const unverifiedCase = await validate(context, { contract: { status: 'verified', evidence: 'Compared in the model and the diff.', cases }, uncertainty: ['Null binding was not run.'], extra: asExtra })
  assert.equal(unverifiedCase.result.decision, 'proposed')
  assert.match(unverifiedCase.result.equivalence.reasons.join('\n'), /The null case is unverified: How a bound null behaves was not run/)
  for (const contract of [
    { status: 'unverified', evidence: 'Null binding not established.' },
    { status: 'unverified', evidence: 'Null binding not established.', cases: { ...equivalentCases(), undefined: { outcome: 'unverified', evidence: 'Not run.' } } },
    { status: 'verified', evidence: 'Compared all cases.' }
  ]) {
    const { result } = await validate(context, { contract, extra: asExtra })
    assert.equal(result.decision, 'proposed', JSON.stringify(contract))
    assert.ok(result.verifiedPatch)
    assert.equal(result.equivalence.proven, false)
  }
})

test('a missing input-contract check does not block the diff either', async context => {
  const project = await reviewedProject(context)
  const { 'input-contract': omitted, ...withoutContract } = checks
  const submission = { snapshotSha256: project.brief.snapshot.sha256, decisions: [{ id: project.ids.query, decision: 'proposed', reason: 'Bind the value.', ...solution(patchFor()), checks: withoutContract }] }
  const validated = reconcileDecisions(project.report, submission, { patchChecks: await checkProposalPatches(project.root, project.report, submission) })
  const result = validated.decisions.find(entry => entry.id === project.ids.query)
  assert.equal(result.decision, 'proposed')
  assert.deepEqual(result.equivalence, { proven: false, reasons: ['The input-contract check was not assessed'] })
})

test('not proven without any written assumption is not a gate either: the tool states the reasons itself', async context => {
  const { result } = await validate(context, { contract: { status: 'unverified', evidence: 'Null binding not established.' }, uncertainty: [], extra: asExtra })
  assert.equal(result.decision, 'proposed')
  assert.deepEqual(result.blockers, [])
  assert.deepEqual(result.equivalence.reasons, ['input-contract is unverified: Null binding not established.'])
})

test('a case without an outcome is not proven, and a verified claim is never trusted for it', async context => {
  const { 'empty-string': omitted, quoted, ...partial } = equivalentCases()
  const { result } = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases: partial }, uncertainty: ['Two cases were not compared.'], extra: asExtra })
  assert.equal(result.decision, 'proposed')
  assert.match(result.equivalence.reasons.join('\n'), /No outcome given for: empty-string, quoted/)
})

test('a listed regression is shown and accepted by approving, but it never proves equivalence', async context => {
  const cases = equivalentCases()
  cases.null = { outcome: 'regression', evidence: 'A bound null is a real null; concatenation produced the text null.', listedAs: regressions[0] }
  const listed = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, extra: asExtra })
  assert.equal(listed.result.decision, 'proposed')
  assert.equal(listed.result.equivalence.proven, false, 'a known behavior change is the opposite of proven equivalence')
  assert.deepEqual(listed.result.equivalence.reasons, [`The null behavior changes (listed as a regression, accepted by approving): ${regressions[0]}`])
  assert.equal(listed.result.checks['input-contract'].status, 'verified', 'the cases were assessed, so the check keeps its status')
  cases.null.listedAs = 'a regression nobody wrote down'
  const unlisted = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, uncertainty: ['The null regression was not written into the proposal.'], extra: asExtra })
  assert.equal(unlisted.result.decision, 'proposed')
  assert.equal(unlisted.result.equivalence.proven, false)
  assert.match(unlisted.result.equivalence.reasons.join('\n'), /null behavior change is not listed as a proposal regression/)
  assert.equal(unlisted.result.checks['input-contract'].status, 'unverified')
})

test('all cases shown equivalent proves equivalence', async context => {
  const { result } = await validate(context, { contract: { status: 'verified', evidence: 'Each case compared in the model constraint and the diff.', cases: equivalentCases() }, extra: asExtra })
  assert.equal(result.decision, 'proposed')
  assert.deepEqual(result.blockers, [])
  assert.deepEqual(result.equivalence, { proven: true, reasons: [] })
})

test('unresolved wording inside a case that claims equivalence is recorded as not proven', async context => {
  const cases = equivalentCases()
  cases.undefined = { outcome: 'equivalent', evidence: 'Probably the same; the adapter behavior is unknown.' }
  const { result } = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, uncertainty: ['Adapter behavior for undefined is unknown.'], extra: asExtra })
  assert.equal(result.decision, 'proposed')
  assert.match(result.equivalence.reasons.join('\n'), /the undefined case evidence says the behavior is unresolved \("unknown"\)/)
})

test('unrelated uncertainty does not affect equivalence, and resolved null wording is not a contradiction', async context => {
  const { result } = await validate(context, {
    contract: { status: 'verified', evidence: 'Each case compared in the model constraint and the diff.', cases: equivalentCases() },
    uncertainty: ['The installed @sap/cds version was not checked.', 'A null input is rejected by the @mandatory constraint before the handler runs.'], extra: asExtra
  })
  assert.equal(result.decision, 'proposed')
  assert.equal(result.equivalence.proven, true)
})

test('malformed input-contract cases are still rejected as invalid input', async context => {
  const project = await reviewedProject(context)
  const submit = contract => reconcileDecisions(project.report, {
    snapshotSha256: project.brief.snapshot.sha256,
    decisions: [{ id: project.ids.query, decision: 'proposed', reason: 'x', checks: { ...checks, 'input-contract': contract } }]
  })
  assert.throws(() => submit({ status: 'verified', evidence: 'x', cases: { zero: { outcome: 'equivalent', evidence: 'x' } } }), /Unknown input-contract case: zero/)
  assert.throws(() => submit({ status: 'verified', evidence: 'x', cases: { null: { outcome: 'maybe', evidence: 'x' } } }), /needs an outcome/)
  assert.throws(() => submit({ status: 'verified', evidence: 'x', cases: { null: { outcome: 'equivalent', evidence: 'x', listedAs: 'y' } } }), /listedAs applies only to a regression/)
  assert.throws(() => submit({ status: 'verified', evidence: 'x', cases: [] }), /cases must be an object/)
  assert.throws(() => reconcileDecisions(project.report, {
    snapshotSha256: project.brief.snapshot.sha256,
    decisions: [{ id: project.ids.query, decision: 'proposed', reason: 'x', checks: { ...checks, 'source-current': { ...checks['source-current'], cases: {} } } }]
  }), /supports only status and evidence/)
})

test('a covered finding with an unlisted behavior change stays proposed and is marked not proven', async context => {
  const project = await reviewedProject(context)
  const cover = async listedAs => {
    const cases = equivalentCases()
    cases.null = { outcome: 'regression', evidence: 'Bound null is real null.', listedAs }
    const submission = {
      snapshotSha256: project.brief.snapshot.sha256,
      decisions: [
        { id: project.ids.query, decision: 'proposed', reason: 'Bind the value.', ...solution(patchFor()), checks },
        { id: project.ids.validation, decision: 'proposed', reason: 'Same function.', addressedBy: project.ids.query, checks: { ...checks, 'input-contract': { status: 'verified', evidence: 'Compared.', cases } } }
      ]
    }
    const validated = reconcileDecisions(project.report, submission, { patchChecks: await checkProposalPatches(project.root, project.report, submission) })
    assert.equal(validated.decisions.find(entry => entry.id === project.ids.query).decision, 'proposed')
    return validated.decisions.find(entry => entry.id === project.ids.validation)
  }
  const unlisted = await cover('not in the primary proposal')
  assert.equal(unlisted.decision, 'proposed')
  assert.match(unlisted.equivalence.reasons.join('\n'), new RegExp(`null behavior change is not listed in the regressions of the proposal in ${project.ids.query}`))
  assert.equal((await cover(regressions[0])).decision, 'proposed')
})

// What stays enforced: the removed gate was about equivalence, not about the diff, the regressions or the source.
test('an uncertain proposal is still held when the diff does not apply, the regressions are missing, or an unrelated mandatory check is open', async context => {
  const uncertain = { contract: { status: 'unverified', evidence: 'Null binding not established.' }, uncertainty: ['Null binding was not run.'], extra: asExtra }
  const wrongLine = patchFor().replace(`-${originalLine}`, '-SELECT.from(Items).where(\'code=\' + somethingElse)')
  const fabricated = await validate(context, { ...uncertain, proposal: { patch: wrongLine } })
  assert.equal(fabricated.result.decision, 'needs-review')
  assert.match(fabricated.result.blockers.join('\n'), /Patch does not apply to the current source/)
  assert.equal(fabricated.result.verifiedPatch, undefined)
  const noRegressions = await validate(context, { ...uncertain, proposal: { regressions: [] } })
  assert.equal(noRegressions.result.decision, 'needs-review')
  assert.ok(noRegressions.result.blockers.includes('Proposal needs potential regressions'))
  const project = await reviewedProject(context)
  const submission = { snapshotSha256: project.brief.snapshot.sha256, decisions: [{ id: project.ids.query, decision: 'proposed', reason: 'Bind the value.', ...solution(patchFor()), checks: { ...checks, 'authorization-path': { status: 'unverified', evidence: 'Not checked.' }, 'input-contract': uncertain.contract } }] }
  const validated = reconcileDecisions(project.report, submission, { patchChecks: await checkProposalPatches(project.root, project.report, submission) })
  assert.ok(validated.decisions.find(entry => entry.id === project.ids.query).blockers.includes('Unresolved evidence check: authorization-path'), 'unrelated mandatory checks are not weakened')
})

test('the policy text and the brief say uncertainty is metadata, not a blocker', async context => {
  const { brief } = await reviewedProject(context)
  const description = brief.reviewPolicy.queryChecks.find(check => check.id === 'input-contract').description
  assert.match(description, /never blocks a proposal/)
  assert.doesNotMatch(description, /Strict:/)
  assert.ok(brief.reviewRules.some(rule => rule.includes('Do not ask the developer questions to produce a proposal')))
  assert.ok(!brief.reviewRules.some(rule => rule.includes('input-contract is strict')))
})
