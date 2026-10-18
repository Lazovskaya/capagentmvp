import assert from 'node:assert/strict'
import test from 'node:test'
import { checkProposalPatches } from './proposals.mjs'
import { reconcileDecisions } from './review.mjs'
import { checks, patchFor, reviewedProject, solution } from './workflow-fixtures.mjs'

// The wording of the real run that was reported "verified" while it listed the null/undefined behavior as unverified.
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

test('a proposal that claims verification while listing unresolved null/undefined semantics stays needs-review', async context => {
  const { result } = await validate(context, {
    contract: { status: 'verified', evidence: contradictoryEvidence, cases: equivalentCases() }, uncertainty: [contradictoryUncertainty], extra: asExtra
  })
  assert.equal(result.requestedDecision, 'proposed')
  assert.equal(result.decision, 'needs-review')
  assert.equal(result.verifiedPatch?.patchSha256 !== undefined, true, 'the diff itself still applies: only the claim is rejected')
  const text = result.blockers.join('\n')
  assert.match(text, /input-contract evidence says the behavior is unresolved \("uncertain"\) while input-contract is verified/)
  assert.match(text, /uncertainty lists unresolved null\/undefined\/empty-string semantics \("No installed @sap\/cds[^"]*"\) while input-contract is verified/)
})

test('documented uncertainty does not rescue an unverified case: a case marked unverified cannot sit under a verified check', async context => {
  const cases = equivalentCases()
  cases.null = { outcome: 'unverified', evidence: 'How a bound null behaves was not run against the adapter.' }
  const { result } = await validate(context, { contract: { status: 'verified', evidence: 'Compared in the model and the diff.', cases }, uncertainty: ['Null binding is documented in regressions.'], extra: asExtra })
  assert.equal(result.decision, 'needs-review')
  assert.match(result.blockers.join('\n'), /claimed verified while the null case\(s\) are unverified: unresolved semantics keep the proposal at needs-review/)
})

test('an honest unverified input-contract stays needs-review, with or without cases', async context => {
  for (const contract of [
    { status: 'unverified', evidence: 'Null binding not established.' },
    { status: 'unverified', evidence: 'Null binding not established.', cases: { ...equivalentCases(), undefined: { outcome: 'unverified', evidence: 'Not run.' } } }
  ]) {
    const { result } = await validate(context, { contract, extra: asExtra })
    assert.equal(result.decision, 'needs-review')
    assert.ok(result.blockers.includes('Unresolved evidence check: input-contract'))
  }
})

test('a verified input-contract needs an outcome for each of null, undefined, empty-string, and quoted', async context => {
  const none = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.' }, extra: asExtra })
  assert.equal(none.result.decision, 'needs-review')
  assert.match(none.result.blockers.join('\n'), /verified without cases/)
  const { 'empty-string': omitted, quoted, ...partial } = equivalentCases()
  const some = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases: partial }, extra: asExtra })
  assert.match(some.result.blockers.join('\n'), /cases are missing: empty-string, quoted/)
})

test('a behavior change is accepted only when it is listed as a proposal regression', async context => {
  const cases = equivalentCases()
  cases.null = { outcome: 'regression', evidence: 'A bound null is a real null; concatenation produced the text null.', listedAs: regressions[0] }
  const listed = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, extra: asExtra })
  assert.equal(listed.result.decision, 'proposed')
  assert.deepEqual(listed.result.blockers, [])
  cases.null.listedAs = 'a regression nobody wrote down'
  const unlisted = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, extra: asExtra })
  assert.equal(unlisted.result.decision, 'needs-review')
  assert.match(unlisted.result.blockers.join('\n'), /null behavior change is not listed as a proposal regression/)
  delete cases.null.listedAs
  const unnamed = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, extra: asExtra })
  assert.match(unnamed.result.blockers.join('\n'), /null behavior change is not listed/)
})

test('all cases shown equivalent is the only way to verify without listing a regression', async context => {
  const { result } = await validate(context, { contract: { status: 'verified', evidence: 'Each case compared in the model constraint and the diff.', cases: equivalentCases() }, extra: asExtra })
  assert.equal(result.decision, 'proposed')
  assert.deepEqual(result.blockers, [])
  assert.ok(result.verifiedPatch)
})

test('unresolved wording inside a case that claims equivalence is a contradiction too', async context => {
  const cases = equivalentCases()
  cases.undefined = { outcome: 'equivalent', evidence: 'Probably the same; the adapter behavior is unknown.' }
  const { result } = await validate(context, { contract: { status: 'verified', evidence: 'Compared all cases.', cases }, extra: asExtra })
  assert.equal(result.decision, 'needs-review')
  assert.match(result.blockers.join('\n'), /the undefined case evidence says the behavior is unresolved \("unknown"\)/)
})

test('unrelated uncertainty does not block, and resolved null wording is not a contradiction', async context => {
  const { result } = await validate(context, {
    contract: { status: 'verified', evidence: 'Each case compared in the model constraint and the diff.', cases: equivalentCases() },
    uncertainty: ['The installed @sap/cds version was not checked.', 'A null input is rejected by the @mandatory constraint before the handler runs.'], extra: asExtra
  })
  assert.equal(result.decision, 'proposed')
})

test('malformed input-contract cases are rejected as invalid input', async context => {
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

test('a covered finding must have its behavior changes listed by the proposal that covers it', async context => {
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
  assert.equal(unlisted.decision, 'needs-review')
  assert.match(unlisted.blockers.join('\n'), new RegExp(`null behavior change is not listed in the regressions of the proposal in ${project.ids.query}`))
  assert.equal((await cover(regressions[0])).decision, 'proposed')
})

test('the policy text and the brief state the strict rule', async context => {
  const { brief } = await reviewedProject(context)
  const description = brief.reviewPolicy.queryChecks.find(check => check.id === 'input-contract').description
  assert.equal(brief.reviewPolicy.version, '0.2.0')
  assert.match(description, /^Strict: verified only if null, undefined, empty string, and quoted input are each shown equivalent/)
  assert.match(description, /even when documented/)
  assert.ok(brief.reviewRules.some(rule => rule.includes('input-contract is strict')))
})
