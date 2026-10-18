import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { open, readFile, readdir, lstat, realpath, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createMatcher } from './matcher.mjs'
import { prepareReview, reconcileDecisions } from './review.mjs'

const digest = content => createHash('sha256').update(content).digest('hex')
const catalogText = await readFile(new URL('../catalog.json', import.meta.url), 'utf8')
const catalog = JSON.parse(catalogText)
const scannerHash = digest(Buffer.concat(await Promise.all([
  readFile(fileURLToPath(import.meta.url)), readFile(new URL('./matcher.mjs', import.meta.url)),
  readFile(new URL('./review.mjs', import.meta.url))
])))
const excludedDirectories = new Set(['node_modules', 'gen', 'dist', 'coverage', 'target', 'vendor'])
const extensions = new Set(['.cds', '.js', '.cjs', '.mjs', '.ts'])
const maxBytes = 1024 * 1024
const byCodeUnit = (left, right) => (left < right ? -1 : left > right ? 1 : 0)
const limits = Object.freeze({ fileBytes: maxBytes, totalBytes: 32 * maxBytes, sourceFiles: 2000, entries: 10000, findings: 5000, depth: 64, analysisMsPerFile: 1000 })

async function readJsonInput(filename) {
  const absolute = path.resolve(filename)
  const stat = await lstat(absolute)
  if (!stat.isFile() || stat.size > 32 * maxBytes) throw new Error('Input must be a regular JSON file under 32 MiB')
  return JSON.parse((await readFile(absolute, 'utf8')).replace(/^\uFEFF/, ''))
}

// Creates a new owner-only file; never overwrites, follows a final symlink, or writes inside the analyzed project.
async function writeNewFile(target, text, project) {
  const absolute = path.resolve(target)
  const destination = path.join(await realpath(path.dirname(absolute)), path.basename(absolute))
  if (project) {
    const relative = path.relative(await realpath(project), destination)
    if (!relative || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) {
      throw new TypeError('Output must be outside the analyzed project')
    }
  }
  const handle = await open(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
  try {
    await handle.writeFile(text)
  } catch (error) {
    await handle.close()
    await unlink(destination)
    throw error
  }
  await handle.close()
}

export async function readReviewContext(project, report, findingIds) {
  const brief = prepareReview(report)
  if (!Array.isArray(findingIds) || !findingIds.length || findingIds.length > 3
    || new Set(findingIds).size !== findingIds.length) {
    throw new TypeError('Select one to three unique finding IDs for a bounded review batch')
  }
  const selected = findingIds.map(id => {
    const finding = brief.findings.find(candidate => candidate.id === id)
    if (!finding) throw new TypeError('Unknown review-candidate ID')
    return finding
  })
  const root = await realpath(project)
  const manifestPath = path.join(root, 'package.json')
  if (!(await lstat(manifestPath)).isFile()) throw new Error('Expected a regular project manifest')
  if ((await readBounded(manifestPath)).sha256 !== brief.snapshot.manifestSha256) {
    throw new Error('Project manifest changed; rescan before reviewing')
  }
  const sources = new Map()
  const excerpts = []
  for (const finding of selected) {
    const absolute = path.resolve(root, finding.evidence.file)
    const relative = path.relative(root, absolute)
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('Evidence must remain inside the selected project')
    }
    if (!extensions.has(path.extname(absolute)) || relative.split(path.sep).some(part => part.startsWith('.') || excludedDirectories.has(part))) {
      throw new Error('Evidence must be an allowed source path under the scan exclusion policy')
    }
    let cursor = root
    for (const part of relative.split(path.sep)) {
      cursor = path.join(cursor, part)
      if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlinked evidence is not supported')
    }
    if (!(await lstat(absolute)).isFile()) throw new Error('Evidence must be a regular source file')
    if (!sources.has(absolute)) sources.set(absolute, await readBounded(absolute))
    const source = sources.get(absolute)
    if (source.sha256 !== finding.evidence.sha256) throw new Error('Source changed; rescan before reviewing')
    const lines = source.text.split(/\r?\n/)
    if (finding.evidence.line > lines.length) throw new Error('Evidence line is outside the source')
    const startLine = Math.max(1, finding.evidence.line - 10)
    const endLine = Math.min(lines.length, finding.evidence.line + 20)
    const fullExcerpt = lines.slice(startLine - 1, endLine).map((line, index) => `${startLine + index}: ${line}`).join('\n')
    excerpts.push({
      findingId: finding.id, patternId: finding.patternId, file: finding.evidence.file,
      sha256: source.sha256, startLine, endLine,
      truncated: fullExcerpt.length > 8000,
      text: fullExcerpt.slice(0, 8000)
    })
  }
  return {
    schemaVersion: 1, format: 'cap-pattern-context', useCaseId: brief.useCaseId,
    snapshotSha256: brief.snapshot.sha256,
    limits: { findings: 3, linesBefore: 10, linesAfter: 20, charactersPerExcerpt: 8000 },
    caveats: [
      'Customer source is included. Keep this output in the approved customer/AI boundary.',
      'Excerpts are bounded, not complete functions or semantic proof. Expand only a specific unresolved dependency.',
      'This verifies selected file and manifest hashes, not an atomic or whole-project rescan.'
    ],
    excerpts
  }
}

async function readBounded(absolute) {
  const handle = await open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const stat = await handle.stat()
    if (!stat.isFile()) throw Object.assign(new Error('Not a regular file'), { code: 'NOT_REGULAR_FILE' })
    if (stat.size > maxBytes) throw Object.assign(new Error('Input exceeds limit'), { code: 'FILE_LIMIT' })
    const buffer = Buffer.alloc(maxBytes + 1)
    let length = 0
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length)
      if (!bytesRead) break
      length += bytesRead
    }
    if (length > maxBytes) throw Object.assign(new Error('Input exceeds limit'), { code: 'FILE_LIMIT' })
    const content = buffer.subarray(0, length)
    return { text: content.toString('utf8'), bytes: length, sha256: digest(content) }
  } finally {
    await handle.close()
  }
}

export async function scanProject(project, scopes = ['srv', 'db']) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22+ is required')
  if (typeof project !== 'string' || !project.trim()) throw new TypeError('Provide a project path')
  if (!Array.isArray(scopes) || !scopes.length || scopes.some(scope => typeof scope !== 'string' || !scope.trim())) {
    throw new TypeError('Provide at least one non-empty file or directory scope')
  }
  const root = await realpath(project)
  const packagePath = path.join(root, 'package.json')
  const packageStat = await lstat(packagePath)
  if (packageStat.isSymbolicLink()) throw new Error('Symlinked package.json is not supported')
  if (!packageStat.isFile()) throw new Error('package.json must be a regular file')
  const manifestSource = await readBounded(packagePath)
  const manifest = JSON.parse(manifestSource.text)
  const cdsVersion = manifest.dependencies?.['@sap/cds'] ?? manifest.devDependencies?.['@sap/cds']
  if (typeof cdsVersion !== 'string' || !cdsVersion.trim()) throw new Error('Expected a CAP Node.js package with an @sap/cds dependency')
  const report = {
    schemaVersion: 1,
    useCaseId: 'CAP-AI-11',
    scanner: { version: '0.1.0', sha256: scannerHash },
    catalogVersion: catalog.version,
    catalogSha256: digest(catalogText),
    snapshot: { manifestSha256: manifestSource.sha256, sources: [], sha256: '' },
    summary: { reviewCandidates: 0, contextOnly: 0 },
    runtime: { kind: 'nodejs', cdsDeclared: cdsVersion, compatibility: 'unverified' },
    coverage: { scopes: [...scopes], scanned: [], skipped: [], complete: true, limits, bytesRead: 0 },
    caveats: [
      'Heuristic text signals can match comments or strings and miss aliases or multiline expressions.',
      'No project code executed, effective CDS model compiled, or installed CAP version verified.',
      'Only explicit scopes are inspected; no matches does not prove absence of reusable patterns.',
      'Resource limits bound traversal and report size; incomplete scans require narrower scopes. Scan a trusted, quiescent checkout.',
      'Hidden/generated/vendor directories and symlinks are excluded; .gitignore is not interpreted.',
      'Reports include relative paths and line numbers, not source text; still treat reports as client-confidential.'
    ],
    findings: []
  }
  const visited = new Set()
  const matcher = createMatcher(catalog.patterns, limits.analysisMsPerFile)
  const relativePath = absolute => path.relative(root, absolute).split(path.sep).join('/') || '.'
  const skip = (file, reason, incomplete = false) => {
    report.coverage.skipped.push({ path: relativePath(file), reason })
    if (incomplete) report.coverage.complete = false
  }
  async function visit(absolute, depth = 0) {
    if (visited.has(absolute)) return
    if (visited.size >= limits.entries) { skip(absolute, 'entry-limit', true); return }
    visited.add(absolute)
    if (depth > limits.depth) { skip(absolute, 'depth-limit', true); return }
    const relative = relativePath(absolute)
    if (relative !== '.' && relative.split('/').some(part => part.startsWith('.') || excludedDirectories.has(part))) {
      skip(absolute, 'excluded-path', depth === 0)
      return
    }
    let stat
    try { stat = await lstat(absolute) } catch {
      skip(absolute, 'unreadable-or-missing', true)
      return
    }
    if (stat.isSymbolicLink()) { skip(absolute, 'symlink', true); return }
    if (stat.isDirectory()) {
      let entries
      try { entries = await readdir(absolute) } catch {
        skip(absolute, 'unreadable-directory', true)
        return
      }
      for (const entry of entries.sort()) {
        if (visited.size >= limits.entries) { skip(absolute, 'entry-limit', true); break }
        await visit(path.join(absolute, entry), depth + 1)
      }
      return
    }
    if (!stat.isFile() || !extensions.has(path.extname(absolute))) {
      skip(absolute, 'not-source', depth === 0)
      return
    }
    if (stat.size > maxBytes) { skip(absolute, 'over-1MiB', true); return }
    if (report.coverage.scanned.length >= limits.sourceFiles) { skip(absolute, 'source-file-limit', true); return }
    if (report.coverage.bytesRead + stat.size > limits.totalBytes) { skip(absolute, 'total-byte-limit', true); return }
    if (report.findings.length >= limits.findings) { skip(absolute, 'finding-limit', true); return }
    let text
    let bytes
    let sha256
    try { ({ text, bytes, sha256 } = await readBounded(absolute)) } catch (error) {
      skip(absolute, error.code === 'FILE_LIMIT' ? 'over-1MiB' : 'unreadable-source', true)
      return
    }
    if (report.coverage.bytesRead + bytes > limits.totalBytes) { skip(absolute, 'total-byte-limit', true); return }
    report.coverage.bytesRead += bytes
    report.coverage.scanned.push(relative)
    report.snapshot.sources.push({ file: relative, sha256 })
    const result = await matcher.match(text, path.extname(absolute), limits.findings - report.findings.length)
    if (result.reason) { skip(absolute, result.reason, true); return }
    for (const { patternId, line } of result.matches) {
      const pattern = catalog.patterns.find(candidate => candidate.id === patternId)
      const hash = digest(`${pattern.id}:${relative}:${line}:${sha256}`).slice(0, 16)
      const { signals, extensions: patternExtensions, ...recommendation } = pattern
      const assessment = pattern.signalKind === 'context' ? 'context-only' : 'review-candidate'
      report.summary[assessment === 'context-only' ? 'contextOnly' : 'reviewCandidates'] += 1
      report.findings.push({
        id: `CAP-FINDING-${hash}`, patternId: pattern.id,
        status: 'candidate', assessment, evidence: { file: relative, line, sha256 },
        caveats: ['Applicability and compatibility require contextual review.'],
        recommendation
      })
    }
    if (result.truncated) skip(absolute, 'finding-limit', true)
  }
  try {
    for (const scope of [...new Set(scopes)].sort()) {
      const absolute = path.resolve(root, scope)
      const relative = path.relative(root, absolute)
      if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error('Scope must remain within the project root')
      }
      let cursor = root
      let blocked = false
      for (const part of relative.split(path.sep).filter(Boolean)) {
        cursor = path.join(cursor, part)
        try {
          if ((await lstat(cursor)).isSymbolicLink()) {
            skip(cursor, 'symlink', true)
            blocked = true
            break
          }
        } catch { break }
      }
      if (!blocked) await visit(absolute)
    }
  } finally {
    await matcher.close()
  }
  report.coverage.scanned.sort()
  report.coverage.skipped.sort((left, right) => byCodeUnit(left.path, right.path))
  report.findings.sort((left, right) => byCodeUnit(left.evidence.file, right.evidence.file)
    || left.evidence.line - right.evidence.line || byCodeUnit(left.patternId, right.patternId))
  report.snapshot.sources.sort((left, right) => byCodeUnit(left.file, right.file))
  report.snapshot.sha256 = digest(JSON.stringify({
    scanner: report.scanner, catalogSha256: report.catalogSha256,
    manifestSha256: report.snapshot.manifestSha256, sources: report.snapshot.sources,
    scopes: [...new Set(scopes)].sort(), coverage: report.coverage
  }))
  return report
}

if (process.argv[1] && await realpath(process.argv[1]).catch(() => undefined) === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({
      options: { full: { type: 'boolean' }, report: { type: 'string' }, decisions: { type: 'string' }, context: { type: 'string', multiple: true }, output: { type: 'string' }, help: { type: 'boolean' } },
      allowPositionals: true
    })
    const [project, ...scopes] = positionals
    if (values.help || (!project && !values.report)) {
      console.log('Usage: node scan.mjs <CAP-project-root> [scope ...] [--full]\n       node scan.mjs --report <existing-report.json> [--decisions <decision-file.json>] [--output <new-file>]\n       node scan.mjs <CAP-project-root> --report <brief.json> --context <finding-ID> [--context <finding-ID>]\nDefault: compact grouped review JSON, context-only observations counted but omitted. --full retains the complete inventory.\n--context emits hash-checked bounded source excerpts for at most 3 IDs, not a rescan.\n--decisions validates reviewer evidence and progress, not semantic truth or developer acceptance.\n--output <new-file> also saves the exact JSON printed to stdout; it refuses existing files and paths inside the project.\nDefaults: srv db. Writes only to a new --output file; no network. Node.js 22+.\nExit 0: coverage complete within scope/policy; 2: incomplete coverage; 1: invalid input.')
      process.exitCode = values.help ? 0 : 1
    } else {
      if (values.context && (!values.report || !project || scopes.length || values.full || values.decisions)) {
        throw new Error('--context needs a project and saved report, without scopes, --full, or --decisions')
      }
      if (values.report && ((project && !values.context) || values.full)) throw new Error('--report cannot be combined with a project unless --context is used')
      if (values.full && values.decisions) throw new Error('--decisions cannot be combined with --full')
      let report
      if (values.report) {
        report = await readJsonInput(values.report)
      } else {
        report = await scanProject(project, scopes.length ? scopes : undefined)
      }
      const output = values.context ? await readReviewContext(project, report, values.context) : values.full ? report : values.decisions
        ? reconcileDecisions(report, await readJsonInput(values.decisions)) : prepareReview(report)
      const text = JSON.stringify(output, null, 2)
      if (values.output !== undefined) await writeNewFile(values.output, `${text}\n`, project)
      console.log(text)
      if (values.context ? !report.coverage.complete : !output.coverage.complete) process.exitCode = 2
    }
  } catch (error) {
    const detail = error instanceof TypeError ? ` ${error.message}.` : ''
    console.error(`Scan failed (${error.code ?? 'INVALID_INPUT'});${detail} Check arguments, report JSON, project package.json, CAP Node.js dependency, permissions, and scope containment.`)
    process.exitCode = 1
  }
}