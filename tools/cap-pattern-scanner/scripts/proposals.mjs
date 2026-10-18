import { realpath } from 'node:fs/promises'
import path from 'node:path'
import { readProjectFile, safeProjectPath, verifyPatchAgainstProject } from './patch.mjs'
import { prepareReview } from './review.mjs'

/**
 * Checks each submitted proposal's patch against the project's current files. Returns a Map of
 * finding ID to `{ ok: true, patchSha256, files }` or `{ ok: false, error }`. Writes nothing.
 */
export async function checkProposalPatches(project, report, submission) {
  const brief = prepareReview(report)
  const findings = new Map(brief.findings.map(finding => [finding.id, finding]))
  const root = await realpath(project)
  const results = new Map()
  for (const entry of Array.isArray(submission?.decisions) ? submission.decisions : []) {
    const finding = findings.get(entry?.id)
    if (entry?.decision !== 'proposed' || !finding || typeof entry.proposal?.patch !== 'string') continue
    try {
      const evidence = await readProjectFile(path.join(root, safeProjectPath(finding.evidence.file)))
      if (evidence.sha256 !== finding.evidence.sha256) throw new TypeError('The evidence file changed since the scan; rescan before proposing a change')
      const verified = await verifyPatchAgainstProject(root, entry.proposal.patch)
      results.set(entry.id, { ok: true, patchSha256: verified.patchSha256, files: verified.files.map(({ beforeText, afterText, ...file }) => file) })
    } catch (error) {
      results.set(entry.id, { ok: false, error: error instanceof TypeError ? error.message : 'The patch could not be checked against the project' })
    }
  }
  return results
}
